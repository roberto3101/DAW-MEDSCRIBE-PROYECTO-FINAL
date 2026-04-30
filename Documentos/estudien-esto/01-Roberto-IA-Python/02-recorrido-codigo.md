# 02. Recorrido por el codigo

> Aqui te explico cada archivo importante de `servicio-ia/`. Si te preguntan "donde esta esto", esta lista es tu mapa.

## Estructura general

```
servicio-ia/
├── Dockerfile                # python:3.12-slim + uvicorn
├── requirements.txt          # FastAPI 0.115, openai 1.60+, httpx, etc.
├── principal.py              # FastAPI app, registra routers, CORS
└── app/
    ├── rutas/                # Endpoints (controllers)
    ├── servicios/            # Logica de IA y generacion
    ├── esquemas/             # Pydantic models
    ├── validadores/          # Validacion de archivos
    ├── contexto/             # Markdown con guias por especialidad
    └── indicaciones/         # Prompts del sistema para el LLM
```

## Archivos clave

### `principal.py`

Es el punto de entrada. Lo que hace:

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="MedScribe AI")

# CORS para que el frontend pueda llamar al servicio IA directamente
app.add_middleware(CORSMiddleware, allow_origins=["http://localhost:3000"])

# Registrar los 6 routers
app.include_router(rutas_transcripcion.router, prefix="/api/ia")
app.include_router(rutas_procesamiento.router, prefix="/api/ia")
app.include_router(rutas_generacion.router, prefix="/api/ia")
# ... etc
```

### `app/rutas/rutas_transcripcion.py`

El endpoint principal `/api/ia/transcribir`:

```python
@router.post("/transcribir")
async def transcribir_archivo_de_audio(
    archivo: UploadFile = File(...),
    diarizar: bool = Query(default=False),
    motor_diarizacion: str = Query(default="pyannote"),
):
    contenido = await archivo.read()
    validar_archivo_de_audio_completo(contenido, archivo.filename)

    if not diarizar:
        # Cascade Whisper
        return {"transcripcion": await transcribir_audio_con_whisper(contenido, archivo.filename)}

    # Diarizacion con fallback automatico
    if motor_diarizacion == "deepgram":
        return await transcribir_y_diarizar_con_deepgram(contenido, ext)

    try:
        return await transcribir_y_diarizar_con_pyannote(contenido, ext)
    except Exception:
        # Fallback automatico a Deepgram
        return await transcribir_y_diarizar_con_deepgram(contenido, ext)
```

**Lo importante**: si Pyannote falla (ej: numpy no instalado), automaticamente cae a Deepgram sin que el usuario se entere.

### `app/servicios/servicio_whisper.py` (TU ARCHIVO ESTRELLA)

El cascade Whisper. **Es el codigo mas importante de tu parte**.

```python
def _proveedores_whisper():
    return [
        ("Groq", os.getenv("AI_API_KEY"), os.getenv("AI_BASE_URL"), "whisper-large-v3"),
        ("HuggingFace", os.getenv("AI_EXTRA_5_API_KEY"), os.getenv("AI_EXTRA_5_BASE_URL"), "openai/whisper-large-v3"),
        ("Mistral", os.getenv("AI_EXTRA_2_API_KEY"), os.getenv("AI_EXTRA_2_BASE_URL"), "voxtral-mini-latest"),
    ]

async def transcribir_audio_con_whisper(contenido_audio, nombre_archivo):
    errores = []
    for nombre, key, url, modelo in _proveedores_whisper():
        if not key:
            errores.append(f"{nombre}: sin API key")
            continue
        try:
            texto = await _transcribir_con_openai_compat(contenido_audio, nombre_archivo, key, url, modelo)
            if texto and texto.strip():
                logger.info(f"[WHISPER] {nombre} OK ({len(texto)} caracteres)")
                return texto
        except Exception as error:
            errores.append(f"{nombre}: {str(error)[:200]}")

    # Ultimo recurso: Deepgram
    try:
        return await _transcribir_con_deepgram(contenido_audio, nombre_archivo)
    except Exception as error:
        errores.append(f"Deepgram: {error}")

    raise HTTPException(502, detail="Todos fallaron: " + " | ".join(errores))
```

**Senalalo en la demo**. Es la logica de alta disponibilidad.

### `app/servicios/servicio_claude.py`

El cascade LLM con **8 proveedores**: Groq, SambaNova, Cerebras, NVIDIA, HuggingFace, Mistral, LLM7, GitHub Models.

Misma logica que el cascade Whisper, pero con mas proveedores porque para chat hay mas opciones compatibles con OpenAI.

### `app/servicios/diarizador_deepgram.py`

Llama a la API de Deepgram con `?diarize=true`. Procesa la respuesta JSON, separa por `speaker` y devuelve segmentos:

```python
{
  "transcripcion": "texto completo",
  "diarizacion": {
    "motor": "deepgram",
    "hablantes_detectados": 2,
    "segmentos": [
      {"hablante": "SPEAKER_0", "inicio_segundos": 0.0, "fin_segundos": 3.5, "texto": "..."},
      {"hablante": "SPEAKER_1", "inicio_segundos": 3.6, "fin_segundos": 8.2, "texto": "..."}
    ]
  }
}
```

### `app/servicios/pipeline_nota_clinica.py`

Orquestador. Coordina los pasos:

```python
async def procesar_transcripcion_completa(transcripcion, especialidad, tipo_documento):
    # 1. Clasificar la intencion (especialidad + entidades medicas detectadas)
    clasificacion = clasificar(transcripcion, especialidad)

    # 2. Cargar contexto especifico de la especialidad
    contexto = cargar_contexto_de_especialidad(clasificacion["especialidad"])

    # 3. Llamar al LLM con cascade
    nota = await generar_nota_clinica_con_claude(
        transcripcion, contexto, tipo_documento, clasificacion
    )

    return {"nota_clinica": nota, "clasificacion": clasificacion}
```

### `app/servicios/generador_pdf.py` y `generador_word.py`

Generan documentos profesionales. Ejemplo del PDF:

```python
def generar_pdf(nota_clinica, tipo_documento, paciente, formato="moderno_medico"):
    doc = SimpleDocTemplate(buffer, pagesize=A4)
    estilos = obtener_estilos(formato)

    elementos = [
        Image(logo_path, width=80, height=80),
        Paragraph(f"NOTA CLINICA {tipo_documento}", estilos["titulo"]),
        construir_seccion_paciente(paciente, estilos),
        # ... S, O, A, P
        construir_pie_firma(medico, estilos),
    ]
    doc.build(elementos)
    return buffer.getvalue()
```

Hay 4 formatos disponibles, configurables desde el frontend.

### `app/contexto/especialidades/general.md`

Markdown con guias clinicas. El LLM lo recibe como contexto adicional para no inventar:

```markdown
# Medicina General

## Sintomas comunes a explorar
- Dolor (ubicacion, intensidad, evolucion)
- Fiebre (temperatura medida, duracion)
- ...

## Diagnosticos frecuentes con CIE-10
- J11.1 - Influenza
- A09 - Diarrea
- R51 - Cefalea
- ...

## Plantilla SOAP base
S - Subjetivo: motivo de consulta + sintomatologia + antecedentes
O - Objetivo: signos vitales + examen fisico
A - Analisis: diagnostico + diagnostico diferencial + CIE-10
P - Plan: tratamiento + indicaciones + control
```

### `app/indicaciones/base_sistema.md`

El "system prompt" del LLM. Define quien es el LLM:

```
Eres un asistente medico especializado en documentacion clinica peruana.
Tu rol es estructurar transcripciones de consultas medicas en notas clinicas
profesionales en formato SOAP, Historia Clinica o Receta.

REGLAS:
- Usa terminologia medica formal en espanol.
- Incluye codigos CIE-10 cuando sea posible.
- Marca ambigüedades en "NOTAS DE VERIFICACION".
- Nunca inventes signos vitales ni hallazgos no mencionados.
```

---

## Flujo entre archivos (tipico)

```
1. Frontend envia POST /api/ia/transcribir
        │
        ▼
2. rutas_transcripcion.py → llama a servicio_whisper.transcribir_audio_con_whisper()
        │
        ▼
3. servicio_whisper.py → cascade hasta obtener texto
        │
        ▼
4. Frontend recibe transcripcion, envia POST /api/ia/procesar
        │
        ▼
5. rutas_procesamiento.py → llama a pipeline_nota_clinica.procesar_transcripcion_completa()
        │
        ▼
6. pipeline_nota_clinica.py → clasifica + carga contexto + llama servicio_claude
        │
        ▼
7. servicio_claude.py → cascade LLM hasta obtener nota completa
        │
        ▼
8. Frontend recibe nota SOAP, opcionalmente llama POST /api/ia/generar-pdf
        │
        ▼
9. rutas_generacion.py → llama a generador_pdf.generar_pdf()
        │
        ▼
10. generador_pdf.py → construye PDF con ReportLab y devuelve bytes
```

## Como ubicar rapido cualquier cosa

| ¿Buscas... | Ve a... |
|---|---|
| Endpoint de transcripcion | `app/rutas/rutas_transcripcion.py` |
| Cascade Whisper | `app/servicios/servicio_whisper.py` |
| Cascade LLM | `app/servicios/servicio_claude.py` |
| Diarizacion local | `app/servicios/diarizador_voces.py` |
| Diarizacion cloud | `app/servicios/diarizador_deepgram.py` |
| Generador PDF | `app/servicios/generador_pdf.py` |
| Configuracion de formatos | `app/servicios/configuracion_documentos.py` |
| Validacion de audio | `app/validadores/validador_audio.py` |
| Prompts del LLM | `app/indicaciones/*.md` |
| Contexto medico | `app/contexto/especialidades/*.md` |
