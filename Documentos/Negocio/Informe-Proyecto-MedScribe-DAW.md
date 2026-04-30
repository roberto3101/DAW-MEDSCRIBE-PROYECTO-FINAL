# Informe del Proyecto Final — MedScribe AI

**Curso:** Desarrollo de Aplicaciones Web I (4694)
**Ciclo:** Quinto
**Profesor:** _(completar nombre del profesor)_
**Aula / Semestre:** _(completar)_

---

## Coordinador del grupo

- **Jose Roberto La Rosa Ledezma** — Codigo: i202333980

## Integrantes

| Codigo | Nombre completo | Rol en el proyecto |
|---|---|---|
| i202333980 | Jose Roberto La Rosa Ledezma | Servicio de Inteligencia Artificial (Python + FastAPI) |
| i202315442 | Cesar Augusto Tovar Rondan | Backend (Java + Spring Boot + Spring Security) |
| i202335854 | Brayan Emanuel Pedro Gil Lipe | Base de datos (MySQL 8.0 + JPA) |
| i201916515 | Antony Lucas Murillo Aramburu | Frontend (Angular 17) |

---

## 5.1. Resumen

**MedScribe AI** es una plataforma web empresarial que automatiza la documentacion clinica de los medicos peruanos. El medico graba la consulta por voz desde el navegador y, en menos de 30 segundos, recibe una nota clinica estructurada (SOAP, Historia Clinica o Receta) con codigos CIE-10 y datos del paciente, lista para revisar, aprobar y descargar como PDF o Word.

El sistema esta construido como una aplicacion web multi-capa que respeta el stack solicitado por el curso:

- **Backend principal:** Java 17 + Spring Boot 3.3 + Spring Data JPA + Spring Security + Lombok.
- **Frontend:** Angular 17 (componentes standalone, signals, lazy loading).
- **Base de datos:** MySQL 8.0 con cifrado de contrasenas BCrypt.
- **Servicio auxiliar de IA:** Python 3.12 + FastAPI con un cascade de proveedores (Groq, Mistral, HuggingFace, Deepgram) para garantizar disponibilidad de transcripcion y generacion de notas clinicas.
- **Despliegue:** Docker Compose con cuatro servicios (`mysql`, `gateway-java`, `servicio-ia`, `cliente-web`).

El sistema implementa **autenticacion JWT con BCrypt**, **CRUD completo** sobre Pacientes, Consultas, Documentos, Roles y Usuarios, y **multi-tenant** para que una clinica vea solo sus propios datos. El frontend Angular consume todos los endpoints REST mediante `HttpClient` con interceptor de autenticacion.

## 5.2. Introduccion

El medico peruano dedica entre **dos y cuatro horas diarias** a redactar historias clinicas, recetas y notas SOAP. Esta carga administrativa reduce el tiempo disponible para la atencion del paciente, incrementa el burnout profesional y, segun datos del Colegio Medico del Peru, es una de las tres principales causas de insatisfaccion laboral en el sector salud.

**MedScribe AI** propone una solucion concreta: usar inteligencia artificial para que el medico hable libremente con su paciente y, al terminar la consulta, reciba la documentacion clinica ya estructurada y lista para firmar.

El presente proyecto demuestra la viabilidad tecnica de esta idea desarrollando una aplicacion web empresarial completa, con backend en Java Spring Boot, frontend en Angular y un servicio de IA en Python. El diagnostico inicial, los objetivos planteados y la justificacion se desarrollan en las secciones siguientes.

## 5.3. Diagnostico (Analisis SEPTE)

Se realizo un analisis SEPTE del contexto sanitario peruano enfocado en el problema de la documentacion clinica.

### Variable Social

Segun el Ministerio de Salud (MINSA, 2024), Peru cuenta con aproximadamente **80,000 medicos colegiados activos** que atienden en promedio **20-30 pacientes por dia**. Cada consulta requiere entre 5 y 15 minutos de documentacion posterior, lo que equivale a **2-4 horas diarias** dedicadas a tareas administrativas. Un estudio del Colegio Medico del Peru (2023) reporta que el 68% de los medicos consultados senala la documentacion como una de las principales causas de fatiga profesional.

**Oportunidad de mejora identificada:** liberar al medico de la carga manual de documentacion para que pueda dedicar mas tiempo a la atencion directa del paciente.

### Variable Tecnologica

La tecnologia de transcripcion automatica (speech-to-text) y los modelos de lenguaje grande (LLM) han alcanzado en los ultimos dos anos una precision suficiente para uso clinico:

- **Whisper Large v3** (OpenAI, 2023) alcanza un Word Error Rate (WER) inferior al 5% en espanol medico.
- **Llama 3.3 70B** (Meta, 2024) y **Mistral Voxtral** (2025) son modelos open source disponibles de forma gratuita o muy economica via APIs como Groq, Mistral, HuggingFace y Deepgram.

**Oportunidad de mejora identificada:** la madurez tecnologica permite construir hoy un sistema medico de transcripcion automatica que hace tres anos seria invialble por costo o calidad.

### Variable Economica

El costo de procesamiento de IA ha caido drasticamente. Las pruebas realizadas para este proyecto demuestran que:

- Una transcripcion de **10 minutos** con Deepgram cuesta aproximadamente **$0.043 USD** (cuatro centavos de dolar).
- La generacion de la nota clinica con un LLM open source (Mistral, Llama 3.3) cuesta menos de **$0.002 USD** por consulta.

**Oportunidad de mejora identificada:** una clinica con 10 medicos que atienden 25 pacientes diarios puede automatizar toda su documentacion por menos de **$30 USD mensuales** en costos de IA, una fraccion del salario de un asistente medico humano.

### Variable Politica

La Norma Tecnica de Salud para la Gestion de la Historia Clinica (RM N° 214-2018/MINSA) **permite el uso de medios digitales** para la elaboracion, conservacion y custodia de las historias clinicas, siempre que se garantice la integridad, autenticidad e inalterabilidad del documento. La Ley N° 29733 (Proteccion de Datos Personales) regula el tratamiento de datos de salud y exige medidas de seguridad robustas, como el cifrado de contrasenas y el control de accesos por rol.

**Oportunidad de mejora identificada:** el marco legal vigente no solo permite, sino que incentiva la digitalizacion de la documentacion clinica, siempre que se cumplan estandares de seguridad como los implementados en MedScribe (BCrypt, JWT, RBAC).

---

**Conclusion del diagnostico:** existen condiciones sociales (sobrecarga del medico), tecnologicas (madurez de IA), economicas (costo accesible) y politicas (marco legal habilitante) que justifican el desarrollo de una plataforma como MedScribe AI.

> **Fuentes consultadas:**
> 1. MINSA (2024). _Recursos Humanos en Salud — Cifras 2024_. https://www.minsa.gob.pe/
> 2. Colegio Medico del Peru (2023). _Encuesta nacional sobre condiciones de trabajo medico_.
> 3. OpenAI (2023). _Whisper Large v3 — Technical Report_. https://openai.com/research/whisper
> 4. RM N° 214-2018/MINSA. _Norma Tecnica de Salud para la Gestion de la Historia Clinica_.
> 5. Ley N° 29733. _Ley de Proteccion de Datos Personales_.

## 5.4. Objetivos (criterios SMART)

### OBJ 1
**Construir una aplicacion web empresarial multi-capa basada en Java Spring Boot y Angular 17, que implemente autenticacion JWT con BCryptPasswordEncoder, CRUD completo (GET/POST/PUT/DELETE) sobre al menos cinco entidades de negocio (Pacientes, Consultas, Documentos, Roles, Usuarios), y persistencia en MySQL via Spring Data JPA, alcanzando el 100% de las funcionalidades solicitadas en la rubrica del curso, listo para sustentacion en la sesion 13.**

- **Especifico:** se delimita stack (Java + Angular + MySQL), patron (REST + JPA), seguridad (JWT + BCrypt) y entidades (5 minimo).
- **Medible:** 100% de cobertura de la rubrica, 5 CRUDs verificables, 4 metodos HTTP por entidad.
- **Alcanzable:** stack maduro con documentacion abundante; equipo de 4 personas con tareas distribuidas.
- **Relevante:** cumple punto a punto la especificacion de la seccion 4 del PDF de proyecto.
- **Tiempo:** entrega final en sesion 13 del ciclo.

### OBJ 2
**Integrar un servicio auxiliar de inteligencia artificial en Python con FastAPI que transcriba audio en menos de 5 segundos y genere una nota clinica estructurada (SOAP, Historia Clinica o Receta) en menos de 25 segundos adicionales, con un cascade de al menos cuatro proveedores de IA (Groq, HuggingFace, Mistral, Deepgram) que garantice disponibilidad superior al 99% incluso si uno o varios proveedores fallan.**

- **Especifico:** servicio Python + FastAPI con endpoint `/api/ia/transcribir` y `/api/ia/procesar`.
- **Medible:** SLA de 5s transcripcion + 25s LLM = 30s total; redundancia con 4 proveedores.
- **Alcanzable:** existen multiples APIs gratuitas o de bajo costo con tier de evaluacion.
- **Relevante:** habilita la propuesta de valor diferencial del producto.
- **Tiempo:** integrado y funcional al momento de la sustentacion.

## 5.5. Justificacion del Proyecto

### Aporte e impacto

MedScribe AI ofrece un beneficio cuantificable y comprobable:

- **Reduccion del 80% en tiempo de documentacion clinica:** lo que antes tomaba 10-15 minutos por paciente, ahora toma menos de 30 segundos.
- **Mayor calidad documental:** las notas siguen estrictamente la estructura SOAP estandar y validan ortografia y terminologia medica.
- **Reduccion de errores:** las transcripciones automaticas reducen omisiones tipicas de la redaccion apresurada.
- **Cumplimiento normativo facilitado:** los documentos generados cumplen con la estructura requerida por la NTS del MINSA.

### Beneficiarios directos

- **Medicos generales y especialistas:** principal usuario del sistema, recupera 2-4 horas diarias de su tiempo profesional.
- **Pacientes:** reciben mayor atencion personalizada porque el medico ya no esta escribiendo mientras conversa.
- **Personal administrativo de clinicas pequenas y medianas:** dejan de transcribir manualmente las consultas grabadas.
- **El equipo de desarrollo:** cuatro estudiantes de Cibertec que adquieren experiencia practica con Spring Boot, Angular, MySQL e integracion de IA.

### Beneficiarios indirectos

- **Sistema de salud peruano:** mejora la calidad de las historias clinicas digitales en clinicas privadas y consultorios.
- **Companias de seguros:** acceden a documentacion mas completa y precisa para procesar reembolsos.
- **Auditorias medicas y MINSA:** disponen de registros mas estructurados y completos.
- **Familiares y cuidadores del paciente:** comprenden mejor la indicacion medica al tener documentos claros y bien estructurados.

## 5.6. Definicion y alcance

### Funcionamiento general

El usuario (medico) ingresa al frontend Angular en `http://localhost:3000`, se autentica con correo y contrasena (validados con BCrypt), y accede a un panel de control desde donde puede:

1. **Gestionar pacientes** (CRUD completo: registrar, listar, buscar por DNI, editar, desactivar).
2. **Iniciar una nueva consulta**, seleccionar un paciente y grabar la conversacion.
3. **Procesar el audio con IA**: el frontend envia el audio al servicio FastAPI que lo transcribe (cascade Groq/Mistral/HuggingFace/Deepgram) y genera la nota clinica (cascade de 8 LLMs).
4. **Revisar y editar** la nota generada antes de aprobarla.
5. **Descargar** el documento final como PDF o Word.
6. **Administrar** roles, usuarios y configuracion de la clinica (solo si tiene rol Administrador).

### Arquitectura

```
Navegador (Angular 17) ↔ Gateway (Spring Boot 3.3) ↔ MySQL 8.0
                                  ↕
                         Servicio IA (Python FastAPI)
                                  ↕
                Cascade: Groq → HuggingFace → Mistral → Deepgram
```

### Alcance funcional implementado

| Modulo | Endpoints | Estado |
|---|---|---|
| Autenticacion | POST /iniciar-sesion, POST /registro, POST /cambiar-contrasena | Completo |
| Pacientes | GET, GET/{id}, GET/documento/{dni}, POST, PUT/{id}, DELETE/{id} | Completo (6 endpoints) |
| Consultas | GET/medico/{id}, GET/{id}, POST, POST/registrar, PUT/{id}, DELETE/{id}, PUT/aprobar, PUT/rechazar | Completo (8 endpoints) |
| Documentos | GET/medico/{id}, GET/{id}, GET/consulta/{id}, POST, GET/descargar/{id}, PUT/aprobar | Completo (6 endpoints) |
| Roles | GET, POST, PUT/{id}, DELETE/{id}, PUT/{id}/estado | Completo (5 endpoints) |
| Usuarios de Clinica | GET, POST, PUT/cambiar-rol, GET/permisos, PUT/permisos | Completo (5 endpoints) |
| Clinicas | GET, GET/{id}, POST/registrar | Completo (3 endpoints) |

**Total: 7 controladores Java, 35+ endpoints REST**, todos con autenticacion JWT (excepto login y registro).

### Documentacion entregada

| Carpeta | Contenido |
|---|---|
| `Documentos/Negocio/` | Este informe. |
| `Documentos/Tecnico/` | Estructura del proyecto, ECUs (especificaciones de casos de uso), diagramas UML. |
| `Documentos/Web/` | Informe HTML interactivo para sustentacion. |
| `Documentos/estructura/` | Arboles de carpetas y arquitectura por capa. |
| `Documentos/estudien-esto/` | Guias de estudio personales (5 archivos por integrante). |

## 5.7. Productos y entregables

### Productos desarrollados

1. **Aplicacion web frontend Angular 17** (`cliente-web/`) — 12 paginas, ~25 componentes, lazy loading, signals, autenticacion con interceptor.
2. **Backend REST en Java Spring Boot 3.3** (`gateway-java/`) — 7 controladores, 14 entidades JPA, JWT con HS512, BCrypt, CORS, manejador global de excepciones.
3. **Servicio IA en Python FastAPI** (`servicio-ia/`) — pipeline cascade de transcripcion y generacion de notas clinicas con 4-8 proveedores de IA.
4. **Esquema de base de datos MySQL 8.0** (`base-datos/migraciones/`) — script SQL completo con 14 tablas, 15+ FK, indices, seeds.
5. **Despliegue Docker Compose** (`docker-compose.yml`, 4 Dockerfiles) — un solo comando para levantar todo el stack.

### Entregables

- Codigo fuente completo en GitHub: https://github.com/roberto3101/DAW-MEDSCRIBE-PROYECTO-FINAL
- Informe del proyecto en formato editable: este documento.
- Presentacion: informe HTML interactivo en `Documentos/Web/informe-medscribe-daw.html`.
- Demo funcional: ver seccion `Anexos`.
- Video Demo Reel (3-5 minutos): _(a entregar segun coordinacion con el docente)_.

## 5.8. Conclusiones

1. **El stack Spring Boot + Angular + MySQL es totalmente adecuado** para construir una aplicacion web empresarial multi-capa con seguridad robusta, persistencia confiable y experiencia de usuario moderna. La combinacion de Spring Data JPA con Lombok reduce significativamente el codigo boilerplate y permite enfocarse en la logica de negocio.

2. **La integracion con servicios externos de IA es viable y economicamente accesible** para proyectos academicos y emprendimientos tempranos, especialmente cuando se implementa un cascade de proveedores que garantiza disponibilidad incluso ante fallos individuales (en nuestras pruebas, Groq fue bloqueado por red pero Mistral/Deepgram cubrieron sin afectar al usuario final).

3. **La separacion en microservicios** (gateway Java + servicio IA Python) permite que cada componente use el lenguaje y framework mas adecuado para su responsabilidad: Java para reglas de negocio y persistencia, Python para procesamiento de IA aprovechando su ecosistema maduro de librerias cientificas.

## 5.9. Recomendaciones

1. **Implementar Spring Boot Actuator** para monitoreo en produccion (health checks, metricas, logs centralizados con ELK o similar). En esta entrega solo se incluye el endpoint `/actuator/health` basico.

2. **Anadir caching con Redis** entre el gateway y la base de datos para reducir la carga en consultas repetitivas (listar pacientes, listar roles), lo que mejorara la latencia en escenarios de alta concurrencia.

3. **Migrar de polling a WebSockets** para el flujo de procesamiento IA, de manera que el frontend reciba notificaciones push en lugar de consultar el estado cada cierto intervalo. Esto reducira el trafico HTTP y mejorara la experiencia de usuario en consultas largas.

## 5.10. Glosario

| Termino | Definicion |
|---|---|
| **JPA** | Java Persistence API. Especificacion estandar de Java para mapeo objeto-relacional (ORM). Su implementacion mas usada es Hibernate. |
| **JWT** | JSON Web Token. Estandar de token firmado que permite autenticar peticiones HTTP sin sesion en el servidor. |
| **BCrypt** | Algoritmo de hash de contrasenas disenado para ser computacionalmente lento, lo que dificulta ataques de fuerza bruta. |
| **REST** | Representational State Transfer. Estilo arquitectonico para servicios web basado en HTTP, recursos y verbos GET/POST/PUT/DELETE. |
| **Spring Boot** | Framework de Java para crear aplicaciones standalone, con servidor embebido y configuracion automatica. |
| **Spring Data JPA** | Modulo de Spring que facilita la persistencia con JPA mediante repositorios autogenerados. |
| **Spring Security** | Modulo de seguridad de Spring para autenticacion, autorizacion y proteccion contra ataques comunes (CSRF, XSS, etc.). |
| **Lombok** | Libreria Java que genera automaticamente getters, setters, constructores y otros boilerplate via anotaciones. |
| **Angular Standalone Component** | Componente Angular que no necesita declararse en un NgModule, simplifica la estructura del proyecto. |
| **Signal (Angular)** | Mecanismo de gestion de estado reactivo introducido en Angular 16+, alternativa a RxJS para estado simple. |
| **CRUD** | Create, Read, Update, Delete. Las cuatro operaciones basicas sobre datos persistentes. |
| **CORS** | Cross-Origin Resource Sharing. Mecanismo HTTP que permite que un frontend acceda a recursos de un dominio diferente. |
| **Docker Compose** | Herramienta para definir y ejecutar aplicaciones multi-contenedor mediante un archivo YAML. |
| **FastAPI** | Framework web moderno para Python, con tipado fuerte, async y documentacion automatica via OpenAPI. |
| **Whisper** | Modelo de OpenAI para transcripcion automatica de voz a texto, disponible en multiples idiomas. |
| **LLM** | Large Language Model. Modelo de lenguaje entrenado con grandes volumenes de texto (ej: Llama, GPT, Claude). |
| **SOAP (nota clinica)** | Formato estandar de nota medica: Subjetivo, Objetivo, Analisis, Plan. No confundir con el protocolo web SOAP. |
| **CIE-10** | Clasificacion Internacional de Enfermedades, version 10. Codigos universales para diagnosticos medicos. |
| **RBAC** | Role-Based Access Control. Modelo de autorizacion donde los permisos se asignan a roles, y los roles a usuarios. |
| **Multi-tenant** | Arquitectura en la que una sola instancia del software sirve a multiples clientes (clinicas) con datos aislados. |

## 5.11. Bibliografia

1. **Spring Team (2024).** _Spring Boot Reference Documentation 3.3._ https://docs.spring.io/spring-boot/docs/3.3.x/reference/html/
2. **Spring Team (2024).** _Spring Security Reference._ https://docs.spring.io/spring-security/reference/
3. **Spring Team (2024).** _Spring Data JPA Reference._ https://docs.spring.io/spring-data/jpa/docs/current/reference/html/
4. **Google Angular Team (2024).** _Angular 17 Documentation._ https://angular.dev/
5. **Oracle Corporation (2024).** _MySQL 8.0 Reference Manual._ https://dev.mysql.com/doc/refman/8.0/en/
6. **Tiangolo, S. (2024).** _FastAPI Documentation._ https://fastapi.tiangolo.com/
7. **MINSA (2024).** _Recursos Humanos en Salud — Cifras 2024._ Lima, Peru.
8. **Colegio Medico del Peru (2023).** _Encuesta nacional sobre condiciones de trabajo medico._
9. **Resolucion Ministerial N° 214-2018/MINSA.** _Norma Tecnica de Salud para la Gestion de la Historia Clinica._
10. **Ley N° 29733 (2011).** _Ley de Proteccion de Datos Personales._ Republica del Peru.
11. **OpenAI (2023).** _Whisper: Robust Speech Recognition via Large-Scale Weak Supervision._ https://openai.com/research/whisper
12. **Meta AI (2024).** _Llama 3 Technical Report._
13. **Cabarcas-Alvarez, A. et al. (2022).** _Digitalizacion de historias clinicas en Latinoamerica: revision sistematica._ Revista Cubana de Informatica Medica.
14. **Docker Inc. (2024).** _Docker Compose Documentation._ https://docs.docker.com/compose/

## 5.12. Anexos

### Anexo A — Comandos para ejecutar el proyecto

Requisitos previos: Docker Desktop instalado y corriendo, archivo `.env` con las API keys (ver `.env.example`).

```bash
# Clonar el repositorio
git clone https://github.com/roberto3101/DAW-MEDSCRIBE-PROYECTO-FINAL.git
cd DAW-MEDSCRIBE-PROYECTO-FINAL

# Copiar plantilla de variables de entorno y completar las API keys
cp .env.example .env

# Levantar todos los servicios
docker compose up -d --build

# El sistema estara disponible en:
#   Frontend:    http://localhost:3000
#   Backend API: http://localhost:5000
#   Servicio IA: http://localhost:8000
```

### Anexo B — Credenciales de demostracion

| Rol | Correo | Contrasena |
|---|---|---|
| Administrador | admin@medscribe.pe | Admin2026! |
| Medico | jroberto@medscribe.pe | Medico2026! |

### Anexo C — Repositorio y enlaces

- **Repositorio principal:** https://github.com/roberto3101/DAW-MEDSCRIBE-PROYECTO-FINAL
- **Branch principal:** `main`
- **Documentacion tecnica adicional:** carpeta `Documentos/`

### Anexo D — Distribucion de tareas por integrante

| Integrante | Modulo principal | Carpeta del codigo | Lineas aprox. |
|---|---|---|---|
| Jose Roberto La Rosa Ledezma | Servicio IA (Python + FastAPI) | `servicio-ia/` | 1,800 LOC |
| Cesar Augusto Tovar Rondan | Backend (Java + Spring Boot) | `gateway-java/` | 3,000 LOC |
| Brayan Emanuel Pedro Gil Lipe | Base de datos (MySQL + JPA) | `base-datos/` + entidades JPA en `gateway-java/` | 700 LOC SQL |
| Antony Lucas Murillo Aramburu | Frontend (Angular 17) | `cliente-web/` | 4,500 LOC |
