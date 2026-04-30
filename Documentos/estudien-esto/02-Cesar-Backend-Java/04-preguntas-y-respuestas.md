# 04. Preguntas y respuestas para defender tu parte

---

## Bloque Spring + Java

### P1: ¿Por que Spring Boot y no otro framework Java?

**R:** Porque es **el estandar de facto** para APIs REST en Java empresarial y porque la rubrica del curso lo pide explicitamente. Trae todo configurado: servidor Tomcat embebido, auto-configuracion, ecosistema completo de modulos (Data, Security, Validation, Actuator). Alternativas como Quarkus o Micronaut son mas modernas, pero Spring tiene mucha mas adopcion y documentacion en espanol.

### P2: ¿Que diferencia hay entre `@Controller` y `@RestController`?

**R:** `@Controller` se usa para devolver vistas (HTML con templating). `@RestController` es la combinacion de `@Controller + @ResponseBody` y se usa para APIs REST: devuelve directamente JSON o XML serializando los objetos. En MedScribe uso `@RestController` en los 7 controladores porque el frontend Angular consume JSON.

### P3: ¿Por que usas Lombok? ¿No es magia oscura?

**R:** **Reduce boilerplate y mejora legibilidad.** Una entidad con 12 campos sin Lombok serian 200 lineas de getters/setters/constructores; con Lombok son 15 lineas mas claras. Sobre la "magia": Lombok es un annotation processor estandar de Java, lo usa medio mundo (incluyendo proyectos como Spring oficial). Compila a Java normal, no hay nada oculto en runtime.

---

## Bloque Spring Data JPA

### P4: ¿Por que JPA y no JDBC directo?

**R:** **Productividad.** Con JPA escribo `findByCorreoElectronico("admin@x.com")` y Spring Data genera el SQL apropiado. Si fuera JDBC tendria que escribir el SELECT, manejar el ResultSet, mapear a objeto, manejar excepciones, cerrar el Statement, etc. JPA me ahorra ~60% de codigo. Y para querys complejas, sigo pudiendo usar `@Query` con JPQL o SQL nativo.

### P5: ¿Que pasa si necesitas una query compleja?

**R:** JPA soporta tres niveles segun complejidad: (1) **Query methods**: `findByCorreoAndEstaActivoTrue()` — Spring genera el SQL. (2) **`@Query` con JPQL**: query orientada a objetos. (3) **`@Query(nativeQuery = true)`**: SQL nativo de MySQL si necesito features especificas. En MedScribe el 95% de las querys son query methods porque cubren las necesidades.

### P6: ¿Que es `@Transactional` y cuando lo usas?

**R:** Marca un metodo para que se ejecute en una **transaccion de BD**. Si algo falla en el medio, **Spring revierte automaticamente** todos los cambios. Lo uso en operaciones que modifican multiples entidades, como `aprobarConsultaYDocumentos()` que actualiza la consulta y todos sus documentos asociados — si falla a la mitad, no quiero que la consulta quede aprobada pero los documentos no.

### P7: ¿Por que `@Lob` en algunas columnas?

**R:** `@Lob` indica que el campo es Large Object — texto muy largo o binario. Lo uso en `notaClinicaEstructurada` y `transcripcionDelAudio` porque pueden tener varias paginas de texto. Sin `@Lob`, Hibernate las mapearia a VARCHAR(255) por defecto y se truncarian. **De hecho tuvimos un bug exactamente por eso**: tuvimos que hacer `ALTER TABLE` para convertir a `LONGTEXT`.

---

## Bloque Spring Security + JWT

### P8: ¿Por que JWT y no sesiones HTTP tradicionales?

**R:** **Stateless.** El servidor no necesita guardar nada de la sesion. Cualquier instancia del backend puede validar el token. Esto es crucial para escalabilidad horizontal: si tengo 5 servidores Spring Boot detras de un load balancer, no necesito sesiones compartidas (Redis, sticky sessions, etc.). Tambien es cross-domain friendly: el frontend en otro dominio puede usar el JWT sin problemas de CORS.

### P9: ¿No es inseguro guardar el JWT en localStorage?

**R:** **Tiene tradeoffs.** localStorage es vulnerable a XSS, pero las cookies httpOnly tienen su propia complejidad (CSRF, configuracion cross-domain). En MedScribe uso localStorage porque el riesgo XSS lo mitigo con: (1) Angular escapa todo HTML por defecto, (2) no inyecto contenido del usuario sin sanitizar. Para una version production-ready evaluariamos cookies httpOnly + CSRF tokens.

### P10: ¿Como manejas el refresh del token?

**R:** **Por simplicidad, en esta version no implementamos refresh tokens.** El JWT expira en 24 horas; si caduca, el usuario debe volver a hacer login. Para una v2 implementariamos: access token corto (15 min) + refresh token largo (30 dias) en cookie httpOnly.

### P11: ¿Que es BCrypt y por que es importante?

**R:** **BCrypt es un algoritmo de hash de contrasenas disenado para ser lento.** A diferencia de SHA-256 que ejecuta millones de hashes por segundo, BCrypt limita a decenas o cientos. Esto hace impractico el ataque de fuerza bruta: probar 1 millon de contrasenas tomaria horas o dias. Ademas integra el "salt" automaticamente, asi cada hash es unico aunque la contrasena sea la misma.

### P12: ¿Que pasa si alguien roba tu base de datos?

**R:** **Las contrasenas siguen seguras.** En la BD solo tengo el hash BCrypt, no la contrasena en texto plano. El atacante tendria que hacer fuerza bruta, y dado el costo computacional de BCrypt, le tomaria anos descifrar contrasenas medianamente seguras. Por eso BCrypt es estandar en todas las apps modernas.

---

## Bloque arquitectura

### P13: ¿Por que separas en Controlador, Servicio, Repositorio?

**R:** **Separacion de responsabilidades** (Single Responsibility Principle). El controlador maneja HTTP (requests, responses, validacion), el servicio implementa logica de negocio (decisiones, reglas, transacciones), el repositorio maneja persistencia. Si manana cambio de REST a gRPC, solo toco controladores. Si cambio de MySQL a Postgres, solo toco repositorios. Cada capa es testeable independientemente.

### P14: ¿Como manejas multi-tenant para que una clinica no vea los datos de otra?

**R:** **El idClinica viene del JWT, no del cliente.** Cuando el usuario hace login, el JWT incluye su idClinica. En cada peticion, el `JwtFiltro` lo extrae y `UsuarioAutenticadoProveedor` lo expone a los servicios. Los repositorios filtran con queries como `findByIdClinicaAndEstaPacienteActivoTrue(idClinica)`. **El usuario fisicamente no puede consultar pacientes de otra clinica** porque la query siempre incluye su idClinica.

### P15: ¿Como manejas las excepciones?

**R:** Con un `@ControllerAdvice` global llamado `ManejadorExcepcionesGlobal`. Captura `MethodArgumentNotValidException` (validaciones), `BadCredentialsException` (auth fallida), `EntityNotFoundException` (no existe el recurso), `IllegalArgumentException` (validacion de negocio) y un fallback generico para 500. Cada una se traduce a una respuesta HTTP estructurada. **Asi el frontend nunca recibe un stack trace en bruto.**

---

## Bloque CRUD + REST

### P16: ¿Que metodos HTTP implementaste?

**R:** Los 4 que pide la rubrica: **GET, POST, PUT, DELETE**. En `PacienteControlador` por ejemplo: GET para listar y buscar (3 endpoints distintos), POST para crear, PUT para actualizar, DELETE para soft delete. Todo en `/api/pacientes` con paths semanticamente correctos siguiendo REST.

### P17: ¿Por que DELETE hace soft delete y no fisico?

**R:** **Compliance medico.** Una historia clinica no se puede borrar fisicamente porque es evidencia legal. Por eso `DELETE /api/pacientes/{id}` solo marca `estaPacienteActivo = false` y guarda `fechaEliminacion`. El registro se mantiene en BD. Las queries por defecto filtran por `EstaPacienteActivoTrue`. Si en algun momento quisieran auditarlo, los datos siguen ahi.

### P18: ¿Como validas los datos que entran al backend?

**R:** Tres niveles: (1) **`@Valid` + Bean Validation**: anotaciones en DTOs como `@NotBlank`, `@Email`, `@Size(min=8, max=50)`. Spring valida automaticamente. (2) **Validaciones de negocio en servicios**: ej, "el documento ya existe" en `PacienteServicio.crear()`. (3) **Validaciones a nivel BD**: constraints UNIQUE, NOT NULL, CHECK. **Defense in depth**.

---

## Bloque "trampa"

### P19: ¿Por que no usaste Spring Boot 3.4 o 3.5 (mas reciente)?

**R:** Spring Boot 3.3.5 es la version **LTS estable** al momento de iniciar el proyecto. Las versiones 3.4 y 3.5 traen features experimentales y algunos cambios breaking en JPA. Para un proyecto academico priorizamos estabilidad sobre features bleeding-edge.

### P20: ¿Hibernate puede ser lento por el N+1 problem. ¿Como lo evitas?

**R:** Buena pregunta avanzada. En MedScribe no tenemos relaciones lazy criticas en la UI principal, asi que no es un problema. Pero si lo necesitara usaria: (1) `JOIN FETCH` en `@Query`, (2) `@EntityGraph` para cargar relaciones especificas, (3) DTOs proyectados para devolver solo lo necesario.

### P21: ¿Si tu backend cae, que pasa con el frontend?

**R:** El frontend sigue cargando porque es una SPA estatica servida por nginx, pero las llamadas `fetch` a `/api/...` empezarian a dar errores. El interceptor Angular captura `401`/`5xx` y muestra mensajes. En produccion implementariamos: (1) health check (`/actuator/health`), (2) load balancer con multiples instancias, (3) circuit breaker en el frontend para no saturar al backend caido.

### P22: ¿Has escrito tests unitarios?

**R:** **Honestamente, no en esta entrega**. La rubrica del avance (AP1) pedia "pruebas de la capa de acceso a datos" pero la final (SP1) no. Tenemos `pom.xml` con `spring-boot-starter-test` y `spring-security-test`, pero no escribimos tests por el alcance del proyecto. Para production los agregariamos con JUnit 5 + Mockito + Testcontainers.

---

## Si no sabes algo

> "Buena pregunta. La logica especifica esta en el archivo `[X]`. La idea general es `[Y]`. Si quiere podemos abrirlo para verlo en detalle."

Demuestra que sabes donde buscar.
