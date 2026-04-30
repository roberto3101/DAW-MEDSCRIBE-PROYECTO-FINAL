# Guia de estudio — Cesar Augusto Tovar Rondan

**Codigo:** i202315442
**Tema:** Backend en Java con Spring Boot 3.3 + Spring Security + JPA
**Carpeta del codigo:** `gateway-java/`

---

## Tu mision en la presentacion

Vas a explicar el **gateway**: la puerta de entrada de TODO el sistema. Cualquier peticion del frontend Angular pasa primero por tu codigo en Java antes de llegar a la base de datos o al servicio IA. Aqui vive la **autenticacion JWT**, el **cifrado de contrasenas con BCrypt**, las **validaciones**, y la **persistencia con JPA**.

Tu parte es la mas importante para la rubrica del curso DAW (Spring Data + Lombok + Spring MVC + Spring Security).

## Tu tiempo en la sustentacion

Aproximadamente **6 minutos** dentro de los 20 totales. Hablas despues de Antony (frontend) y antes de Brayan (BD). Tu parte es la mas larga porque cubre la mayor cantidad de puntos de la rubrica.

## Orden de lectura

| Archivo | Que aprenderas | Tiempo |
|---|---|---|
| `01-fundamentos.md` | Java, Spring Boot, JPA, JWT, BCrypt, Lombok, en lenguaje simple | 20 min |
| `02-recorrido-codigo.md` | Cada archivo del backend explicado, donde encontrarlo | 15 min |
| `03-flujos-clave.md` | Login, crear paciente, multi-tenant: paso a paso con codigo real | 20 min |
| `04-preguntas-y-respuestas.md` | Lo que el profesor puede preguntarte y como responder | 15 min |
| `05-guion-presentacion.md` | Tu guion minuto a minuto | 10 min |

## Tu mensaje principal

> "El gateway en Java con Spring Boot 3.3 implementa los **35+ endpoints REST** del sistema. Use **Spring Security con JWT firmado en HS512** y **BCryptPasswordEncoder** para cumplir con el requisito del curso. La persistencia es con **Spring Data JPA** sobre MySQL, y use **Lombok** para reducir el boilerplate. Cada peticion pasa por un filtro JWT que valida el token y popula el contexto de seguridad antes de llegar al controlador."

## Tu archivo clave en la demo

- **`gateway-java/src/main/java/pe/medscribe/gateway/config/SecurityConfig.java`** — define la cadena de filtros, el password encoder y las rutas publicas/protegidas.
- **`gateway-java/src/main/java/pe/medscribe/gateway/servicios/AutenticacionServicio.java`** — login + cascade de generacion de JWT con permisos.

## Lo que el profesor querra ver (rubrica DAW)

1. **Servicio web Rest de login** con BCryptPasswordEncoder ✅ (`POST /api/autenticacion/iniciar-sesion`).
2. **CRUD completo (GET/POST/PUT/DELETE)** sobre BD ✅ (Pacientes, Consultas, Documentos, Roles, Usuarios).
3. **Persistencia en BD** ✅ (Spring Data JPA + MySQL).
4. **Buenas practicas** ✅ (capas, DTOs, validacion `@Valid`, manejador global de excepciones, multi-tenant).
5. **Patrones de diseno** ✅ (Repository, Service, DI con `@Autowired`, Builder con Lombok).

## Lo que NO debes hacer

- No expliques en detalle la IA (eso es de Roberto).
- No expliques las tablas SQL (eso es de Brayan).
- No te enfoques en CSS o componentes Angular (eso es de Antony).
- No leas codigo en pantalla. Senala el archivo y di que hace.

## Demo recomendada (2 minutos)

1. Abre Postman o `http://localhost:5000/swagger-ui.html` (si lo configuras).
2. Ejecuta `POST /api/autenticacion/iniciar-sesion` con admin@medscribe.pe / Admin2026!
3. Muestra el JWT recibido (3 partes separadas por puntos).
4. Copia el token y haz `GET /api/pacientes` con header `Authorization: Bearer {token}`.
5. Muestra el resultado.
6. Si te alcanza tiempo, decodifica el JWT en https://jwt.io y muestra el payload.
