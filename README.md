# MedScribe AI — Proyecto Final DAW I (Cibertec)

Sistema de Documentacion Medica Automatizada con Inteligencia Artificial.
Proyecto final del curso **Desarrollo de Aplicaciones Web I (0265/4694)**, ciclo 5.

Version Java/Angular/MySQL del proyecto original (ver [CLAUDE.md](CLAUDE.md) para arquitectura y diferencias con el piloto).

## Tecnologias

| Componente | Tecnologia |
|---|---|
| Backend Gateway | **Java 17 + Spring Boot 3** (Spring Web MVC, Spring Data JPA, Spring Security, Lombok) |
| Servicio IA | Python 3.12 + FastAPI |
| Frontend | **Angular 17** (standalone components + TypeScript) |
| Base de datos | **MySQL 8** |
| Auth | **BCryptPasswordEncoder + JWT** (jjwt 0.12) |
| Transcripcion | Whisper (Groq API, fallback HuggingFace, Mistral, Deepgram) |
| Estructuracion | LLM (Groq API - Llama 3.3) |
| Diarizacion | Deepgram Nova-3 |
| Documentos | ReportLab (PDF) + python-docx (Word) con firmas digitales embebidas |

## Inicio rapido (recomendado: Docker)

### Requisito unico

[Docker Desktop](https://www.docker.com/products/docker-desktop/) instalado y corriendo (la ballenita en la bandeja del sistema).

No necesitas Java, Node, Python ni MySQL instalados localmente. Docker se encarga.

### Pasos

```cmd
git clone https://github.com/roberto3101/DAW-MEDSCRIBE-PROYECTO-FINAL.git
cd DAW-MEDSCRIBE-PROYECTO-FINAL
copy .env.example .env
notepad .env
```

Edita `.env` y completa al menos las API keys (Deepgram, Groq, etc.). El resto del archivo ya viene con valores sensatos por defecto.

```cmd
npm run dev
```

Eso levanta los 4 contenedores. Primera vez tarda ~5 min (descarga imagenes y compila Java/Angular). Reinicios siguientes: ~30 segundos.

Abre http://localhost:3000 y entra con:

- **admin@medscribe.pe** / **Admin2026!**
- **jroberto@medscribe.pe** / **Medico2026!**

### Scripts npm disponibles (en raiz)

| Comando | Que hace |
|---|---|
| `npm run dev` | Levanta todo en foreground (ves los logs) |
| `npm run up` | Igual pero detached (libera la consola) |
| `npm run down` | Apaga todo |
| `npm run logs` | Logs en vivo de los 4 contenedores |
| `npm run restart` | Apaga y vuelve a levantar |
| `npm run clean` | Apaga + borra volumen MySQL (resetea BD) |
| `npm run rebuild` | Re-construye imagenes desde cero (sin cache) |

### Puertos expuestos al host

| Puerto | Servicio | URL |
|---|---|---|
| **3000** | Frontend Angular (nginx + SPA) | http://localhost:3000 |
| **5000** | Gateway Java (Spring Boot) | http://localhost:5000/api |
| **8000** | Servicio IA (FastAPI) | http://localhost:8000 — Swagger en `/docs` |
| **3307** | MySQL | `mysql://root:MedScribe2026!@localhost:3307/MedScribeDB` |

## Estructura del proyecto

```
.
├── docker-compose.yml             Levanta los 4 servicios
├── package.json                   Scripts npm (envoltorio sobre docker compose)
├── .env.example                   Plantilla de variables de entorno (copiar a .env)
├── gateway-java/                  Spring Boot 3 + JPA + Security
├── cliente-web/                   Angular 17 standalone
├── servicio-ia/                   FastAPI
│   └── datos/                     (volumen persistente: logos, firmas, documentos generados)
├── base-datos/migraciones/        Script SQL inicial (auto-importado al primer arranque)
└── postman/                       Coleccion Postman para probar endpoints
```

## Configurar firmas y datos de la clinica

1. Entra a la app, login.
2. Ve a **Configuracion** en el menu.
3. Sube el logo, dibuja/sube la firma del medico y la firma de la clinica.
4. Llena nombre, RUC, direccion, telefono, etc.
5. Guarda.

Los datos se persisten en `servicio-ia/datos/config_documentos.json` y los archivos en `servicio-ia/datos/logos/`. Esto sobrevive a reinicios de contenedor (bind mount).

Al generar PDF o Word desde una consulta, las firmas aparecen embebidas como imagenes.

## Persistencia de la pagina "Nueva Consulta"

Si recargas la pestana (F5) durante una consulta, se restauran:

- Paciente seleccionado
- Texto de busqueda
- Tipo de documento, especialidad
- Transcripcion y nota clinica
- Toggle e info de diarizacion

Si recargas durante una grabacion activa o procesamiento, vuelve a `esperando` (no es posible recuperar el audio en RAM), pero la nota generada y datos del paciente persisten.

El estado se limpia automaticamente al hacer click en "Grabar de nuevo" o "Nueva grabacion".

## Inicio sin Docker (modo manual, no recomendado)

Si por alguna razon no puedes usar Docker, ver [CLAUDE.md](CLAUDE.md) para el modo manual con Java + Node + Python + MySQL nativos.

## Solucion a problemas comunes

### "Cannot bind mount" o "port already in use"

Antes de `npm run dev`, libera los puertos:

```cmd
for /f "tokens=5" %p in ('netstat -ano ^| find ":3000" ^| find "LISTENING"') do taskkill /PID %p /F
for /f "tokens=5" %p in ('netstat -ano ^| find ":5000" ^| find "LISTENING"') do taskkill /PID %p /F
for /f "tokens=5" %p in ('netstat -ano ^| find ":8000" ^| find "LISTENING"') do taskkill /PID %p /F
for /f "tokens=5" %p in ('netstat -ano ^| find ":3307" ^| find "LISTENING"') do taskkill /PID %p /F
```

### MySQL no arranca / datos corruptos

```cmd
npm run clean
npm run dev
```

Eso borra el volumen y vuelve a importar el SQL inicial.

### Firmas no aparecen en PDF/Word

Verificar que en **Configuracion** de la app subiste las firmas y guardaste. El JSON queda en `servicio-ia/datos/config_documentos.json`.

## Requisitos del curso cumplidos

Segun el PDF `PR 2026 05 Desarrollo de Aplicaciones Web I`:

- Servicio web REST de login con usuario/password en BD y **password cifrado con BCryptPasswordEncoder** — `POST /api/autenticacion/iniciar-sesion`
- Servicios REST con **GET, POST, PUT, DELETE** — 7 controladores, 28+ endpoints
- Frontend en **Angular** que consume todos los servicios REST
- Persistencia en BD con Spring Data JPA + Hibernate + MySQL

Ver [CLAUDE.md](CLAUDE.md) para detalles completos.
