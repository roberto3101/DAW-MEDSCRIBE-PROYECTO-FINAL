# MedScribe AI — Proyecto Final DAW I (Cibertec)

Sistema de Documentacion Medica Automatizada con Inteligencia Artificial.
Proyecto final del curso **Desarrollo de Aplicaciones Web I (0265/4694)**, ciclo 5.

Version Java/Angular/MySQL del proyecto original (ver [CLAUDE.md](CLAUDE.md) para arquitectura y diferencias con el piloto).

## Tecnologias

| Componente | Tecnologia |
|---|---|
| Backend Gateway | **Java 17 + Spring Boot 3** (Spring Web MVC, Spring Data JPA, Spring Security, Lombok) |
| Servicio IA | Python 3.9+ + FastAPI |
| Frontend | **Angular 17** (standalone components + TypeScript) |
| Base de datos | **MySQL 8** |
| Auth | **BCryptPasswordEncoder + JWT** (jjwt 0.12) |
| Transcripcion | Whisper (Groq API) |
| Estructuracion | LLM (Groq API - Llama 3.3) |
| Diarizacion | Pyannote 3.1 + Deepgram Nova-3 |
| Documentos | ReportLab (PDF) + python-docx (Word) |

## Requisitos previos

- [JDK 17+](https://adoptium.net/) con Maven en PATH
- [Node.js 18+](https://nodejs.org/)
- [Python 3.9+](https://www.python.org/downloads/) con `uvicorn`
- [MySQL 8+](https://dev.mysql.com/downloads/installer/) corriendo en `localhost:3306`

## Inicio rapido

### 1. Crear la base de datos

```bash
mysql -u root -p < base-datos/migraciones/MedScribeDB_MigracionCompleta_MySQL.sql
```

Esto crea la BD `MedScribeDB`, 13 tablas y datos semilla (usuarios con passwords BCrypt, planes, clinica demo, etc.).

### 2. Ajustar credenciales MySQL

Editar `gateway-java/src/main/resources/application.properties` si el password de `root` no es `MedScribe2026!`:

```properties
spring.datasource.password=TU_PASSWORD_MYSQL
```

### 3. Instalar dependencias Angular (primera vez)

```bash
cd cliente-web
npm install
cd ..
```

### 4. Levantar todo

```
iniciar.bat
```

Abre http://localhost:3000 y entra con:
- **admin@medscribe.pe** / **Admin2026!**

## Estructura

```
gateway-java/              Spring Boot 3 + JPA + Security (puerto 5000)
cliente-web/               Angular 17 standalone (puerto 3000)
servicio-ia/               FastAPI Python (puerto 8000)
base-datos/migraciones/    Script MySQL completo
iniciar.bat                Levanta los 3 servicios en paralelo
```

## Requisitos del curso cumplidos

Segun el PDF `PR 2026 05 Desarrollo de Aplicaciones Web I`:

- Servicio web REST de login con usuario/password en BD y **password cifrado con BCryptPasswordEncoder** — `POST /api/autenticacion/iniciar-sesion`
- Servicios REST con **GET, POST, PUT, DELETE** — 7 controladores, 28+ endpoints
- Frontend en **Angular** que consume todos los servicios REST
- Persistencia en BD con Spring Data JPA + Hibernate + MySQL

Ver [CLAUDE.md](CLAUDE.md) para detalles completos y troubleshooting.
