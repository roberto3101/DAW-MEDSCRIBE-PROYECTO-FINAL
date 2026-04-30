# Estructura del Proyecto MedScribe AI

## Vision general del repositorio

```
DAW-MEDSCRIBE-PROYECTO-FINAL/
├── cliente-web/              # Frontend Angular 17
├── gateway-java/             # Backend Spring Boot 3.3
├── servicio-ia/              # Microservicio Python FastAPI
├── base-datos/               # Scripts SQL de migracion y seeds
├── Documentos/               # Toda la documentacion del proyecto
├── postman/                  # Coleccion de Postman para probar la API
├── docker-compose.yml        # Orquestacion de los 4 servicios
├── .env.example              # Plantilla de variables de entorno
├── .gitignore                # Exclusiones de Git (incluye .env)
├── iniciar.bat               # Script de arranque rapido (Windows)
├── README.md                 # Documentacion principal
└── CLAUDE.md                 # Notas de desarrollo
```

## Arquitectura general

```
┌─────────────────────────────────────────────────────────────┐
│                       Navegador (usuario)                    │
└────────────────────────────┬────────────────────────────────┘
                             │ HTTP
                             ▼
┌─────────────────────────────────────────────────────────────┐
│  cliente-web (Angular 17 + nginx)        Puerto 3000         │
│  - Componentes standalone, signals, lazy loading             │
│  - Interceptor JWT                                           │
└────────────────┬────────────────────┬───────────────────────┘
                 │ /api/...           │ /api/ia/...
                 │ (proxy nginx)      │ (proxy nginx)
                 ▼                    ▼
┌─────────────────────┐    ┌─────────────────────────────────┐
│ gateway-java        │    │ servicio-ia (Python FastAPI)    │
│ Spring Boot 3.3     │    │ Puerto 8000                     │
│ Puerto 5000         │    │ - Cascade Whisper (4 motores)   │
│ - REST + JWT        │    │ - Cascade LLM (8 proveedores)   │
│ - JPA + BCrypt      │    │ - Generador PDF / DOCX          │
└──────────┬──────────┘    └─────────────────────────────────┘
           │ JDBC                     │ HTTPS hacia
           ▼                          │ proveedores externos
┌──────────────────────┐              ▼
│ MySQL 8.0            │     Groq, HuggingFace,
│ Puerto 3307          │     Mistral, Deepgram,
│ Base: MedScribeDB    │     SambaNova, etc.
└──────────────────────┘
```

## Descripcion de cada componente

### cliente-web (Frontend)

- **Stack:** Angular 17, TypeScript 5.4, Tailwind CSS 3.4, Lucide Angular (iconos), RxJS 7.8.
- **Patron:** componentes standalone + signals + lazy loading por ruta.
- **Servicios HTTP:** un servicio por modulo (`paciente.service.ts`, `consulta.service.ts`, etc.) con `HttpClient`.
- **Autenticacion:** interceptor que adjunta `Authorization: Bearer {jwt}` automaticamente.
- **Build:** Vite + Angular CLI; produccion compilada a estaticos servidos por nginx.

### gateway-java (Backend principal)

- **Stack:** Java 17, Spring Boot 3.3.5, Spring Web, Spring Security, Spring Data JPA, Lombok, JJWT 0.12.5, MySQL Connector.
- **Patron:** capas Controlador → Servicio → Repositorio → Entidad.
- **Seguridad:** JWT firmado con HMAC SHA-512, BCryptPasswordEncoder, filtro `OncePerRequestFilter`.
- **Persistencia:** Spring Data JPA con Hibernate; entidades JPA con anotaciones `@Entity`, `@Table`, `@Lob`.
- **Comunicacion con servicio IA:** `HttpClient` a `http://servicio-ia:8000`.

### servicio-ia (Microservicio de IA)

- **Stack:** Python 3.12, FastAPI 0.115, OpenAI SDK 1.60+, httpx, python-docx, reportlab.
- **Patron:** routers FastAPI por dominio (transcripcion, procesamiento, configuracion, documentos).
- **Cascade de proveedores:**
  - **Transcripcion:** Groq → HuggingFace → Mistral → Deepgram.
  - **LLM:** Groq → SambaNova → Cerebras → NVIDIA → HuggingFace → Mistral → LLM7 → GitHub Models.
- **Generacion de documentos:** ReportLab (PDF) + python-docx (Word).

### base-datos (Persistencia)

- **Motor:** MySQL 8.0.
- **Esquema:** 14 tablas, 15+ FK, indices unicos por correo y RUC.
- **Tablas principales:** `Usuarios`, `Clinicas`, `Pacientes`, `Medicos`, `Consultas`, `Documentos`, `RolesDeClinica`, `UsuariosDeClinica`, `Suscripciones`, `PlanesSuscripcion`, `PlantillasHistoriaClinica`, `SeccionesDePlantilla`, `ValoresDeSeccionPorConsulta`, `AuditoriaDeConsultas`.
- **Seeds:** clinica demo `MedScribe Demo`, 3 roles base (Administrador, Medico, Recepcionista), 3 usuarios, 2 pacientes.

## Despliegue (Docker Compose)

| Servicio | Imagen base | Puerto host | Puerto interno | Healthcheck |
|---|---|---|---|---|
| `mysql` | mysql:8.0 | 3307 | 3306 | mysqladmin ping cada 10s |
| `gateway` | eclipse-temurin:17-jre-alpine | 5000 | 5000 | depende de mysql healthy |
| `servicio-ia` | python:3.12-slim | 8000 | 8000 | start de uvicorn |
| `cliente-web` | nginx:alpine | 3000 | 80 | depende de gateway started |

Todos los servicios comparten una red Docker interna (`default`) y la base de datos persiste en el volumen `mysql_data`.

## Convenciones de codigo

- **Nombres en espanol:** todas las clases, metodos, variables y comentarios usan espanol (lenguaje ubicuo del dominio medico peruano). Ejemplos: `Paciente`, `iniciarSesion()`, `obtenerPermisos()`.
- **No emojis en codigo** (solo en HTML de presentacion).
- **Una entidad = una responsabilidad** (Single Responsibility Principle).
- **Validaciones en frontend Y en backend** (defense in depth).

## Estadisticas del proyecto

| Metrica | Valor |
|---|---|
| Lenguajes principales | Java, TypeScript, Python, SQL |
| Total lineas de codigo | ~10,000 LOC (sin contar dependencias) |
| Endpoints REST | 35+ en gateway Java, 14+ en servicio IA |
| Componentes Angular | ~25 (todos standalone) |
| Entidades JPA | 14 |
| Cascades de IA | 2 (uno transcripcion, uno LLM) |
| Servicios Docker | 4 |
| Tiempo de build inicial | ~10 minutos (incluye Maven, npm install, pip) |
| Tiempo de arranque | ~30 segundos despues del primer build |
