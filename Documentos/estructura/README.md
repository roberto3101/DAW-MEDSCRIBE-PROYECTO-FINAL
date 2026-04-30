# Estructura del proyecto MedScribe AI (DAW)

Esta carpeta contiene la estructura detallada del codigo. Util para que cualquier integrante (o el profesor) entienda donde vive cada cosa.

## Contenido

- `backend/`
  - `arquitectura-backend.md` — capas del gateway Java + microservicio Python.
  - `tree-gateway-java.md` — arbol de carpetas del backend Spring Boot.
  - `tree-servicio-ia.md` — arbol de carpetas del servicio FastAPI.
- `frontend/`
  - `arquitectura-frontend.md` — patron Angular 17 con standalone + signals.
  - `tree.md` — arbol de carpetas del frontend Angular.

## Como leerlos

1. Empieza por la **arquitectura** (`arquitectura-backend.md` o `arquitectura-frontend.md`) para entender el patron general.
2. Luego revisa el **tree** correspondiente para ubicar los archivos concretos.
3. Si quieres profundizar en un componente, ve a `Documentos/estudien-esto/{integrante}/02-recorrido-codigo.md`.
