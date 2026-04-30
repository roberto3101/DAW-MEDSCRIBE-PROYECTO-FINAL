# Arbol del microservicio `servicio-ia/`

```
servicio-ia/
├── Dockerfile                      # python:3.12-slim + uvicorn
├── requirements.txt                # FastAPI 0.115, OpenAI 1.60+, httpx, etc.
├── principal.py                    # FastAPI app + registro de routers + CORS
└── app/
    ├── __init__.py
    ├── versiones.py                # Constantes de version
    ├── rutas/                      # Routers FastAPI
    │   ├── __init__.py
    │   ├── rutas_transcripcion.py        # POST /api/ia/transcribir
    │   ├── rutas_procesamiento.py        # POST /api/ia/procesar
    │   ├── rutas_generacion.py           # POST /api/ia/generar-pdf|word
    │   ├── rutas_documentos_guardados.py # GET /api/ia/documentos/listar|descargar
    │   └── rutas_configuracion.py        # GET|POST /api/ia/configuracion/*
    ├── servicios/                  # Logica de IA y generacion
    │   ├── __init__.py
    │   ├── servicio_whisper.py            # Cascade Whisper (Groq → HF → Mistral → Deepgram)
    │   ├── servicio_claude.py             # Cascade LLM (8 proveedores)
    │   ├── diarizador_voces.py            # Pyannote local (requiere numpy)
    │   ├── diarizador_deepgram.py         # Deepgram Nova-3 con diarizacion
    │   ├── clasificador_intenciones.py    # Detecta especialidad y entidades
    │   ├── pipeline_nota_clinica.py       # Orquesta transcripcion → clasificacion → LLM
    │   ├── generador_pdf.py               # ReportLab con 4 formatos
    │   ├── generador_word.py              # python-docx con 4 formatos
    │   ├── configuracion_documentos.py    # Lee/guarda config_documentos.json
    │   ├── formatos_documento.py          # Definicion de los 4 formatos
    │   └── servicio_rag.py                # (Opcional) RAG con Qdrant
    ├── esquemas/                   # Pydantic models
    │   ├── consulta.py
    │   └── documento.py
    ├── validadores/
    │   ├── validador_audio.py             # Tamano y formato del archivo
    │   └── validador_consulta.py
    ├── contexto/
    │   └── especialidades/                # Markdown con guias clinicas
    │       ├── general.md
    │       ├── cardiologia.md
    │       ├── pediatria.md
    │       ├── ginecologia.md
    │       ├── traumatologia.md
    │       └── dermatologia.md
    └── indicaciones/                # Prompts de sistema para el LLM
        ├── base_sistema.md
        ├── nota_soap.md
        ├── historia_clinica.md
        ├── receta.md
        └── verificacion.md
```

## Endpoints expuestos

| Metodo | Path | Que hace |
|---|---|---|
| GET | `/` | Health check |
| POST | `/api/ia/transcribir` | Transcribe audio (cascade Whisper) |
| POST | `/api/ia/transcribir?diarizar=true&motor_diarizacion=deepgram` | Transcribe con separacion de voces |
| POST | `/api/ia/procesar` | Genera nota clinica desde transcripcion (cascade LLM) |
| POST | `/api/ia/generar-pdf` | Genera PDF desde nota |
| POST | `/api/ia/generar-word` | Genera DOCX desde nota |
| GET | `/api/ia/documentos/listar` | Lista documentos guardados |
| GET | `/api/ia/documentos/descargar/{nombre}` | Descarga documento |
| GET | `/api/ia/configuracion/obtener` | Obtiene configuracion actual |
| POST | `/api/ia/configuracion/guardar` | Guarda configuracion |
| GET | `/api/ia/configuracion/formatos` | Lista 4 formatos disponibles |
| GET | `/api/ia/configuracion/preview-formato/{codigo}?tipo_documento=SOAP` | Preview HTML/PDF del formato |
| POST | `/api/ia/configuracion/subir-logo` | Sube logo PNG/JPG/SVG |

## Estadisticas

| Categoria | Cantidad |
|---|---|
| Lineas de codigo Python | ~1,800 |
| Routers | 6 |
| Servicios IA | 11 |
| Proveedores en cascade Whisper | 4 (Groq, HF, Mistral, Deepgram) |
| Proveedores en cascade LLM | 8 |
| Formatos de documento | 4 (Clasico MINSA, Moderno Medico, Clinico Elegante, Compacto Funcional) |

## Archivos clave

- **`servicio_whisper.py`** — el cascade que sobrevive a Groq bloqueado por red.
- **`servicio_claude.py`** — el cascade LLM con 8 proveedores.
- **`pipeline_nota_clinica.py`** — orquesta el flujo completo.
