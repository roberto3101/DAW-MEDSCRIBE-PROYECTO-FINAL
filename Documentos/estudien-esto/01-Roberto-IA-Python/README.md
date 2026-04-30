# Guia de estudio — Jose Roberto La Rosa Ledezma

**Codigo:** i202333980
**Tema:** Servicio de Inteligencia Artificial en Python con FastAPI
**Carpeta del codigo:** `servicio-ia/`

---

## Tu mision en la presentacion

Vas a explicar el **cerebro del sistema**: como un audio crudo del medico se convierte en una nota clinica estructurada (SOAP, Historia Clinica o Receta) en menos de 30 segundos. Tu parte es la mas "wow" de la demo.

## Tu tiempo en la sustentacion

Aproximadamente **5 minutos** dentro de los 20 totales del equipo. Hablas despues de Brayan (base de datos) y antes del cierre, o segun acuerden con el coordinador.

## Orden de lectura (sigue la numeracion)

| Archivo | Que aprenderas | Tiempo |
|---|---|---|
| `01-fundamentos.md` | FastAPI, Whisper, LLM, cascade, Pydantic, multiproveedor | 15 min |
| `02-recorrido-codigo.md` | Tour por cada archivo de `servicio-ia/`, donde mirar | 15 min |
| `03-pipeline-paso-a-paso.md` | El flujo completo audio → PDF, con codigo real | 20 min |
| `04-preguntas-y-respuestas.md` | Lo que el profesor puede preguntarte y como responder | 15 min |
| `05-guion-presentacion.md` | Tu guion minuto a minuto | 10 min |

**Tiempo total de estudio: ~75 minutos** (mas practica del guion).

## Tu mensaje principal (memoriza esto)

> "El servicio IA en Python con FastAPI convierte un audio del medico en una nota clinica estructurada en menos de 30 segundos. Use un cascade de cuatro proveedores de transcripcion (Groq, HuggingFace, Mistral, Deepgram) y ocho proveedores de LLM, lo que garantiza que el sistema sigue funcionando incluso si uno o varios proveedores fallan."

Si solo dices esa frase, ya tienes la idea principal. El resto es desarrollo.

## Tu archivo clave en la demo

Si tienes que abrir un solo archivo en la demo, abre:

- **`servicio-ia/app/servicios/servicio_whisper.py`** — el cascade Whisper.
  - Aqui se ve la logica de fallback que es el aporte tecnico mas interesante de tu parte.

## Lo que el profesor querra ver

1. Que sepas que pasa en cada paso del pipeline.
2. Que conozcas la diferencia entre **transcripcion** (audio a texto) y **diarizacion** (separar oradores).
3. Que entiendas que es un **LLM** y que **NO es magia** (es un modelo entrenado con texto).
4. Que sepas explicar por que usamos **un cascade de proveedores** (alta disponibilidad).
5. Que puedas mostrar el endpoint funcionando en `/docs` (Swagger autogenerado por FastAPI).

## Lo que NO debes hacer

- No te metas en detalles del backend Java (eso es de Cesar).
- No expliques las tablas SQL (eso es de Brayan).
- No te enfoques en estilos CSS (eso es de Antony).
- No leas codigo en pantalla durante la exposicion. Senala el archivo y di que hace.
- No prometas precision del 100%. La IA puede fallar; por eso hay un cascade.

## Demo recomendada (2 minutos)

1. Abre `http://localhost:8000/docs` y muestra los endpoints de tu servicio.
2. Cambia a `http://localhost:3000/consultas/nueva`.
3. Selecciona paciente, graba audio breve.
4. Muestra como aparece la transcripcion y la nota SOAP.
5. Si te alcanza el tiempo, abre `docker logs medscribe-servicio-ia` y muestra los logs `[WHISPER]` y `[LLM]` con el cascade en accion.
