# 01. Fundamentos que debes dominar

Antes de tocar codigo, esto es lo que debes poder responder con tus propias palabras.

---

## 1. ¿Que es FastAPI?

**FastAPI es un framework web para Python**, equivalente a Spring Boot en Java pero mas ligero. Sirve para crear APIs REST.

### Por que lo elegimos
- Es **rapido** (compite en performance con Node.js y Go).
- Soporta **async/await** nativo (puede manejar muchas peticiones en paralelo).
- **Documentacion automatica**: genera Swagger UI sin escribir nada en `/docs`.
- Usa **Pydantic** para validar inputs y generar contratos.
- Tiene **excelente integracion** con el ecosistema de IA de Python.

### Como se ve en codigo
```python
from fastapi import FastAPI, UploadFile

app = FastAPI()

@app.post("/api/ia/transcribir")
async def transcribir(archivo: UploadFile):
    contenido = await archivo.read()
    return {"transcripcion": "hola mundo"}
```

Eso es todo. No hay XML, no hay configuracion compleja.

---

## 2. ¿Que es Whisper?

**Whisper es un modelo de inteligencia artificial creado por OpenAI** que convierte voz en texto. Es **open source y gratis**.

### Caracteristicas
- Soporta **mas de 90 idiomas** (espanol incluido con excelente calidad).
- Funciona con audio ruidoso.
- Robusto frente a acentos.
- Dos formas de usarlo:
  - **Local**: descargas el modelo y corre en tu maquina (lento sin GPU).
  - **API en la nube**: lo llamas como servicio (rapido, casi gratis).

### Por que usamos Groq Whisper (y otros)
**Groq es una empresa que sirve Whisper como API ultra rapido** (menos de 1 segundo para audios cortos). Es lo mismo que Whisper de OpenAI pero corriendo en hardware especializado.

En produccion descubrimos que Groq **bloquea ciertas IPs** (incluso `console.groq.com` devuelve 403 desde Peru). Por eso implementamos un **cascade de 4 proveedores** que se ejecutan en orden hasta que uno responda.

### Como se llama desde codigo
```python
respuesta = cliente.audio.transcriptions.create(
    file=archivo_audio,
    model="whisper-large-v3",
    language="es"
)
texto = respuesta  # str con la transcripcion
```

---

## 3. ¿Que es la diarizacion?

**Diarizar = identificar quien habla en cada momento del audio.**

Whisper te da el texto, pero no te dice quien lo dijo. La diarizacion separa el audio en segmentos por orador.

### Sin diarizacion
```
"Buenos dias doctor me duele la cabeza desde ayer..."
```

### Con diarizacion
```
[Medico]:    "Buenos dias, ¿que le trae por aqui?"
[Paciente]:  "Doctor, me duele la cabeza desde ayer."
[Medico]:    "¿En que parte de la cabeza?"
```

### Dos opciones implementadas

| Motor | Donde corre | Velocidad | Privacidad |
|---|---|---|---|
| **Pyannote** | Local en el contenedor | Lenta (10-30s) | Total (audio no sale) |
| **Deepgram** | API en la nube | Rapida (1-3s) | Audio sale a Deepgram |

El usuario elige por toggle en el frontend. Si Pyannote falla por dependencias faltantes, el sistema cae automaticamente a Deepgram.

---

## 4. ¿Que es un LLM (Large Language Model)?

**LLM = modelo de lenguaje grande.** Es una IA entrenada con MILLONES de textos para entender y generar lenguaje natural.

Ejemplos famosos: GPT-4 (OpenAI), Claude (Anthropic), **Llama 3.3** (Meta), **Mistral** (Mistral AI).

### Que puede hacer
- Resumir texto.
- Reformular.
- Estructurar informacion (caso nuestro: convertir un texto crudo a SOAP).
- Responder preguntas.
- Generar texto nuevo.

### Que NO puede hacer
- No tiene conocimiento actualizado (su entrenamiento tiene fecha de corte).
- No conoce las plantillas especificas de tu clinica.
- Puede "alucinar" datos si le faltan.

### Por que usamos Llama 3.3 / Mistral / etc
- Son **open source** (no estamos atados a OpenAI).
- Son **gratis o casi gratis** via Groq, HuggingFace, Mistral, etc.
- Compiten en calidad con GPT-4.

---

## 5. ¿Que es el cascade de proveedores?

Es el **aporte tecnico mas importante** de mi parte.

### El problema
Cualquier proveedor de IA puede fallar:
- Se cae el servicio.
- Bloquea tu IP por anti-abuse.
- Tu API key expira.
- Te quedas sin cuota gratuita.

### La solucion
**Llamar a varios proveedores en orden hasta que uno responda con exito.**

```python
def transcribir(audio):
    proveedores = [
        ("Groq", os.getenv("AI_API_KEY"), "https://api.groq.com/openai/v1", "whisper-large-v3"),
        ("HuggingFace", os.getenv("AI_EXTRA_5_API_KEY"), "https://router.huggingface.co/v1", "openai/whisper-large-v3"),
        ("Mistral", os.getenv("AI_EXTRA_2_API_KEY"), "https://api.mistral.ai/v1", "voxtral-mini-latest"),
    ]

    for nombre, key, url, modelo in proveedores:
        if not key:
            continue
        try:
            texto = llamar(audio, key, url, modelo)
            if texto.strip():
                return texto
        except Exception as e:
            log(f"{nombre} fallo: {e}")
            continue

    # Ultimo recurso: Deepgram
    return deepgram_transcribir(audio)
```

### Resultado real en produccion
- **Groq:** falla con 403 (red bloqueada)
- **HuggingFace:** falla con 404 (endpoint no soporta Whisper en ese path)
- **Mistral:** **funciona** y devuelve la transcripcion
- El usuario nunca se entero de que Groq y HF fallaron.

---

## 6. ¿Por que usamos Pydantic?

**Pydantic es la libreria de validacion de Python**, equivalente a Bean Validation de Java.

### Como se usa
```python
from pydantic import BaseModel, Field

class PeticionProcesamiento(BaseModel):
    transcripcion: str = Field(min_length=10, max_length=50000)
    especialidad: str = Field(default="", max_length=100)
    tipo_documento: str = Field(default="SOAP", min_length=2, max_length=50)
```

Cuando una peticion llega, FastAPI **automaticamente** valida que cumpla estas reglas. Si no, devuelve `HTTP 422` con detalle del error sin que escribamos nada extra.

---

## 7. ¿Por que separamos el servicio IA del backend principal?

Podriamos haber puesto toda la logica IA dentro del gateway Java. Pero la separacion en microservicios tiene ventajas:

| Ventaja | Por que importa |
|---|---|
| **Cada lenguaje en lo suyo** | Java es excelente para reglas de negocio; Python tiene el mejor ecosistema de IA. |
| **Escalado independiente** | Si la IA es lenta, escalamos solo ese servicio. |
| **Tecnologias frescas** | Podemos cambiar el motor de IA sin tocar el gateway. |
| **Aislamiento de fallos** | Si Python crashea, el resto del sistema sigue funcionando. |
| **Codigo mas pequeno** | Cada servicio tiene una responsabilidad clara. |

---

## 8. ¿Por que generamos PDFs y Words desde Python?

Porque Python tiene las **mejores librerias** para esto:
- **ReportLab** — genera PDFs con layout complejo (tablas, imagenes, firmas).
- **python-docx** — genera DOCX nativos (no es HTML convertido).

Ambas son gratis, robustas, y maduras (10+ anos en produccion).

Java tambien tiene opciones (iText, Apache POI), pero implican licencias o mas complejidad.

---

## Glosario rapido

| Termino | Definicion en una linea |
|---|---|
| FastAPI | Framework Python para crear APIs REST con doc automatica. |
| Whisper | Modelo de OpenAI que transcribe voz a texto. |
| LLM | Large Language Model, IA que genera lenguaje (Llama, GPT, Mistral). |
| Diarizacion | Identificar quien habla en cada segmento de un audio. |
| Cascade | Llamar varios proveedores en orden hasta que uno responda. |
| Pydantic | Libreria de validacion de datos en Python. |
| Pipeline | Secuencia de pasos: transcripcion → clasificacion → LLM → PDF. |
| RAG | Retrieval Augmented Generation: dar contexto al LLM para que no invente. |
| Uvicorn | Servidor ASGI que ejecuta FastAPI en produccion. |
