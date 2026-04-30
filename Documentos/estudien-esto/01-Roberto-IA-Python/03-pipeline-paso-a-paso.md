# 03. Pipeline paso a paso

> El flujo completo de un audio del medico hasta el PDF firmado, con codigo real.

## Vision general

```
Audio (WebM, 30 segundos)
        │
        ▼
[1] Transcripcion (Cascade Whisper)
        │
        ▼ "El paciente de 30 anos presenta dolor abdominal..."
[2] Clasificacion de intencion
        │
        ▼ {especialidad: "general", entidades: {...}}
[3] Cargar contexto medico
        │
        ▼ Markdown con guias clinicas + plantilla SOAP
[4] LLM genera nota (Cascade LLM)
        │
        ▼ "## S - Subjetivo\nEl paciente, de 30 anos..."
[5] Inyectar datos del paciente
        │
        ▼ Nota con bloque "## Datos del Paciente" al inicio
[6] Persistir consulta en BD (via gateway Java)
        │
        ▼ idConsulta = 42, estado = "Borrador"
[7] (Opcional) Usuario solicita PDF
        │
        ▼ Llama a /api/ia/generar-pdf
[8] Generador PDF construye documento
        │
        ▼ PDF de 1-2 paginas con logo, secciones SOAP, firma
[9] Usuario descarga el PDF
```

## Paso 1: Transcripcion (Cascade Whisper)

**Archivo:** `app/servicios/servicio_whisper.py`

```python
async def transcribir_audio_con_whisper(contenido_audio, nombre_archivo):
    errores = []

    # Intento 1: Groq (rapido, pero a veces bloqueado)
    try:
        texto = await _llamar_groq(contenido_audio, nombre_archivo)
        if texto.strip():
            return texto
    except Exception as e:
        errores.append(f"Groq: {e}")

    # Intento 2: HuggingFace (gratis, a veces 404)
    try:
        texto = await _llamar_huggingface(contenido_audio, nombre_archivo)
        if texto.strip():
            return texto
    except Exception as e:
        errores.append(f"HuggingFace: {e}")

    # Intento 3: Mistral Voxtral (consistente)
    try:
        texto = await _llamar_mistral(contenido_audio, nombre_archivo)
        if texto.strip():
            return texto
    except Exception as e:
        errores.append(f"Mistral: {e}")

    # Ultimo recurso: Deepgram
    try:
        return await _llamar_deepgram(contenido_audio, nombre_archivo)
    except Exception as e:
        errores.append(f"Deepgram: {e}")

    raise HTTPException(502, "Todos fallaron: " + " | ".join(errores))
```

**Tiempo tipico:** 1-3 segundos.
**Costo:** $0.00 a $0.02 USD por minuto.

## Paso 2: Clasificacion de intencion

**Archivo:** `app/servicios/clasificador_intenciones.py`

Detecta patrones en el texto para enriquecer el prompt del LLM:

```python
def clasificar(transcripcion, especialidad_sugerida):
    texto_min = transcripcion.lower()
    entidades = {
        "sintomas": [],
        "diagnostico": [],
        "medicamento": [],
    }

    # Sintomas frecuentes
    sintomas_keywords = ["dolor", "fiebre", "tos", "nauseas", "vomito", "mareo", ...]
    for s in sintomas_keywords:
        if s in texto_min:
            entidades["sintomas"].append(s)

    # Medicamentos (busca patrones "X miligramos cada Y horas")
    if re.search(r"\d+\s*(mg|miligramos)", texto_min):
        entidades["medicamento"].append("dosis_detectada")

    return {
        "especialidad": especialidad_sugerida,
        "entidades": entidades,
        "tiene_sintomas": len(entidades["sintomas"]) > 0,
        "tiene_diagnostico": False,  # se actualiza con regex mas complejas
        "tiene_tratamiento": "indica" in texto_min,
        "tiene_medicamento": len(entidades["medicamento"]) > 0,
    }
```

**Tiempo:** < 100 milisegundos (es regex puro, no IA).

## Paso 3: Cargar contexto medico

**Archivo:** `app/contexto/especialidades/{especialidad}.md`

```python
def cargar_contexto_de_especialidad(especialidad):
    nombre_archivo = f"app/contexto/especialidades/{especialidad}.md"
    if not os.path.exists(nombre_archivo):
        nombre_archivo = "app/contexto/especialidades/general.md"

    with open(nombre_archivo, "r", encoding="utf-8") as f:
        return f.read()
```

Esto le da al LLM una "guia" de la especialidad: sintomas comunes, diagnosticos frecuentes con CIE-10, plantilla SOAP. Esto **reduce las alucinaciones** del modelo.

## Paso 4: LLM genera la nota (Cascade LLM)

**Archivo:** `app/servicios/servicio_claude.py`

```python
def _proveedores_llm():
    return [
        ("Groq", os.getenv("AI_API_KEY"), "https://api.groq.com/openai/v1", "llama-3.3-70b-versatile"),
        ("SambaNova", os.getenv("AI_FALLBACK_API_KEY"), "...", "Meta-Llama-3.3-70B-Instruct"),
        ("Cerebras", ..., "llama3.1-8b"),
        ("NVIDIA", ..., "meta/llama-4-maverick-17b-128e-instruct"),
        ("HuggingFace", ..., "meta-llama/Llama-3.3-70B-Instruct"),
        ("Mistral", ..., "mistral-small-latest"),
        ("LLM7", ..., "meta-llama/Llama-3.3-70B-Instruct"),
        ("GitHub", ..., "gpt-4o-mini"),
    ]

async def generar_nota_clinica_con_claude(transcripcion, contexto, tipo_documento, clasificacion):
    mensaje_sistema = f"""Eres un asistente medico especializado en documentacion clinica peruana.
    CONTEXTO: {contexto}
    CLASIFICACION DETECTADA: {clasificacion}
    INSTRUCCIONES:
    - Genera el documento en formato {tipo_documento}
    - Usa terminologia medica profesional en espanol
    - Incluye codigos CIE-10 cuando sea posible
    - Marca ambigüedades en NOTAS DE VERIFICACION
    """

    for nombre, key, url, modelo in _proveedores_llm():
        if not key:
            continue
        try:
            respuesta = openai.OpenAI(api_key=key, base_url=url).chat.completions.create(
                model=modelo,
                messages=[
                    {"role": "system", "content": mensaje_sistema},
                    {"role": "user", "content": f"Transcripcion:\n\n{transcripcion}"}
                ],
                max_tokens=4096,
            )
            contenido = respuesta.choices[0].message.content
            if contenido.strip():
                return contenido
        except Exception as e:
            log(f"[LLM] {nombre} fallo: {e}")
            continue

    raise HTTPException(502, "Todos los LLMs fallaron")
```

**Tiempo tipico:** 3-15 segundos segun el LLM.
**Salida:** texto markdown con secciones `## S`, `## O`, `## A`, `## P`, `## NOTAS DE VERIFICACION`.

## Paso 5: Inyectar datos del paciente

**Archivo:** `cliente-web/src/app/paginas/nueva-consulta/...` (en frontend)

Una vez que el LLM devuelve la nota, **el frontend** le agrega un bloque al inicio con los datos del paciente:

```typescript
private inyectarDatosPaciente(nota: string): string {
  const paciente = this.pacienteEncontrado();
  if (!paciente) return nota;

  const lineas = [
    `- Nombre: ${paciente.nombreDelPaciente} ${paciente.apellidoDelPaciente}`,
    `- Documento: ${paciente.tipoDocumentoIdentidad} ${paciente.numeroDocumentoIdentidad}`,
    `- Sexo: ${paciente.sexoBiologico}`,
    `- Fecha de nacimiento: ${paciente.fechaDeNacimiento} (${this.calcularEdad(...)} anos)`,
    // ... etc
  ];

  return `## Datos del Paciente\n${lineas.join('\n')}\n\n${nota}`;
}
```

## Paso 6: Persistir consulta en BD

El frontend llama al **gateway Java** para guardar:

```typescript
this.consultaService.registrarConsulta({
  idMedicoResponsable: usuario.idUsuario,
  idPacienteAtendido: paciente.idPaciente,
  especialidad: this.especialidad,
  tipoDocumento: this.tipoDocumento,
  transcripcion: textoTranscrito,
  notaClinica: notaEnriquecida
});
```

El gateway Java valida el JWT, asigna `idClinica` desde el usuario autenticado y persiste la consulta en estado `Borrador`.

## Paso 7-8: Generacion de PDF/Word

**Archivo:** `app/servicios/generador_pdf.py`

Cuando el usuario presiona "Descargar PDF":

```python
def generar_pdf(nota_clinica, tipo_documento, paciente, formato="moderno_medico"):
    # 1. Cargar configuracion (logo, firma, datos clinica)
    config = cargar_config()

    # 2. Crear documento ReportLab
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4)
    estilos = obtener_estilos_segun_formato(formato)

    # 3. Construir elementos visuales
    elementos = []

    # Encabezado con logo
    if config["logo_path"]:
        elementos.append(Image(config["logo_path"], width=80, height=80))
    elementos.append(Paragraph(config["nombre_clinica"], estilos["titulo"]))

    # Bloque "Datos del Paciente"
    elementos.append(construir_tabla_paciente(paciente, estilos))

    # Secciones SOAP (parsear el markdown de la nota)
    for seccion in parsear_secciones_markdown(nota_clinica):
        elementos.append(Paragraph(seccion["titulo"], estilos["seccion"]))
        elementos.append(Paragraph(seccion["contenido"], estilos["parrafo"]))

    # Firma del medico
    if config["firma_medico"]:
        elementos.append(Image(decodificar_base64(config["firma_medico"]), width=120))
    elementos.append(Paragraph(config["nombre_medico"], estilos["firma"]))
    elementos.append(Paragraph(f"CMP: {config['colegiatura']}", estilos["firma"]))

    # 4. Generar
    doc.build(elementos)
    return buffer.getvalue()
```

**Tiempo:** < 1 segundo.

## Tiempo total del pipeline

| Paso | Tiempo tipico |
|---|---|
| 1. Transcripcion | 1-3 seg |
| 2. Clasificacion | < 100 ms |
| 3. Cargar contexto | < 50 ms |
| 4. LLM genera nota | 3-15 seg |
| 5. Inyectar paciente | < 50 ms (frontend) |
| 6. Persistir BD | < 200 ms |
| 7-8. Generar PDF (opcional) | < 1 seg |
| **TOTAL** | **5-20 segundos** |

## Resumen para tu sustentacion

> "El audio entra por `/api/ia/transcribir`, donde un cascade de cuatro proveedores Whisper se asegura de obtener una transcripcion no vacia. Luego pasa al endpoint `/api/ia/procesar` donde se clasifica la intencion, se carga el contexto medico de la especialidad y un cascade de ocho proveedores LLM genera la nota SOAP. Finalmente, el frontend persiste la consulta y opcionalmente solicita la generacion del PDF, que se construye con ReportLab incluyendo logo, firma digital y los cuatro formatos disponibles."
