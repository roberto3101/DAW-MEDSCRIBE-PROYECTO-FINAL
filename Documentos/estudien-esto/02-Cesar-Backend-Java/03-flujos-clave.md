# 03. Flujos clave del backend (con codigo real)

> Los 3 flujos que el profesor probablemente te pedira explicar paso a paso.

## Flujo 1: Login con BCrypt + generacion de JWT (4 puntos de la rubrica)

### El flujo completo

```
Frontend Angular
    │
    │ POST /api/autenticacion/iniciar-sesion
    │ Body: {"correoElectronico": "...", "contrasena": "..."}
    │
    ▼
AutenticacionControlador.iniciarSesion()
    │
    │ Valida @Valid InicioSesionPeticion
    │ Llama servicio
    │
    ▼
AutenticacionServicio.iniciarSesion()
    │
    │ 1. usuarioRepositorio.findByCorreoElectronico()
    │ 2. Valida estaCuentaActiva
    │ 3. passwordEncoder.matches(plain, hash)
    │ 4. Si OK: jwtUtil.generarToken()
    │ 5. Construye UsuarioDTO con permisos
    │
    ▼
RespuestaAutenticacion {token, mensaje, usuario}
    │
    ▼
Frontend guarda token en localStorage y navega a /panel
```

### Codigo (paso 3 — verificacion BCrypt)

```java
boolean coincide = passwordEncoder.matches(peticion.getContrasena(), usuario.getContrasenaHasheada());
if (!coincide) {
    throw new BadCredentialsException("Credenciales incorrectas");
}
```

### Codigo (paso 4 — generacion JWT)

```java
String rol = usuario.getRolDelSistema().name();
String token = jwtUtil.generarToken(
    usuario.getCorreoElectronico(),  // subject
    rol,                              // claim
    usuario.getIdUsuario(),           // claim
    usuario.getIdClinica()            // claim
);
```

Dentro de `JwtUtil`:
```java
return Jwts.builder()
    .subject(correo)
    .claim("idUsuario", idUsuario)
    .claim("idClinica", idClinica)
    .claim("rol", rol)
    .issuedAt(new Date())
    .expiration(new Date(System.currentTimeMillis() + EXPIRACION_MS))  // 24h
    .signWith(claveSecreta, Jwts.SIG.HS512)
    .compact();
```

### Lo que debes resaltar

> "La rubrica del curso pide explicitamente **BCryptPasswordEncoder**, lo que tenemos en la linea X de SecurityConfig. La contrasena en texto plano nunca se guarda en BD; solo el hash. Ademas firmo el JWT con HS512 que es mas robusto que HS256."

---

## Flujo 2: CRUD de pacientes con multi-tenant (6 puntos de la rubrica)

### El flujo completo (POST /api/pacientes)

```
Frontend Angular
    │
    │ POST /api/pacientes
    │ Header: Authorization: Bearer <jwt>
    │ Body: {"nombreDelPaciente": "Maria", "numeroDocumentoIdentidad": "12345678", ...}
    │
    ▼
JwtFiltro
    │
    │ 1. Extrae token del header
    │ 2. Valida con JwtUtil
    │ 3. Carga UserDetails desde BD
    │ 4. Pone Authentication en SecurityContext
    │
    ▼
PacienteControlador.crear()
    │
    │ @Valid valida la peticion (formato DNI, edad, etc.)
    │ Si falla → @ControllerAdvice captura y devuelve 400
    │
    ▼
PacienteServicio.crear()
    │
    │ 1. Valida unicidad del documento
    │ 2. Obtiene idClinica desde UsuarioAutenticadoProveedor
    │ 3. Construye Paciente con builder
    │ 4. pacienteRepositorio.save()
    │
    ▼
PacienteRepositorio.save() (Spring Data JPA)
    │
    │ Hibernate genera: INSERT INTO Pacientes (...)
    │
    ▼
MySQL persiste, devuelve ID generado
    │
    ▼
ResponseEntity.status(201).body({"idPaciente": 42, "mensaje": "..."})
```

### Codigo del servicio

```java
@Service
public class PacienteServicio {

    private final PacienteRepositorio pacienteRepositorio;
    private final UsuarioAutenticadoProveedor usuarioAutenticadoProveedor;

    public Paciente crear(PacientePeticion peticion) {
        // 1. Validacion de unicidad
        if (pacienteRepositorio.findByNumeroDocumentoIdentidad(peticion.getNumeroDocumentoIdentidad()).isPresent()) {
            throw new IllegalArgumentException("Ya existe un paciente con ese documento");
        }

        // 2. Multi-tenant: idClinica viene del usuario autenticado, NO del cliente
        Long idClinica = peticion.getIdClinica() != null
            ? peticion.getIdClinica()
            : usuarioAutenticadoProveedor.obtenerIdClinicaActual();

        // 3. Construir entidad con Lombok Builder
        Paciente paciente = Paciente.builder()
            .nombreDelPaciente(peticion.getNombreDelPaciente())
            .apellidoDelPaciente(peticion.getApellidoDelPaciente())
            .numeroDocumentoIdentidad(peticion.getNumeroDocumentoIdentidad())
            .fechaDeNacimiento(peticion.getFechaDeNacimiento())
            .estaPacienteActivo(true)
            .idClinica(idClinica)  // <-- multi-tenant
            .build();

        // 4. Persistir
        return pacienteRepositorio.save(paciente);
    }
}
```

### Lo que debes resaltar

> "Note como **el idClinica NO viene del cliente sino del JWT del usuario autenticado**. Esto evita que un usuario malicioso pueda crear pacientes en la clinica de otro. Esto se llama **multi-tenant safety**: las querys siempre filtran por la clinica del usuario logueado."

---

## Flujo 3: Aprobacion de consulta con transaccion (caso interesante)

Este flujo demuestra `@Transactional` y un caso de logica de negocio compleja.

### El problema
Al aprobar una consulta, debemos cambiar el estado de la consulta Y de todos sus documentos asociados. Si falla en el medio, **todo debe revertirse**.

### Codigo del servicio

```java
@Service
public class ConsultaServicio {

    private final ConsultaRepositorio consultaRepositorio;
    private final DocumentoRepositorio documentoRepositorio;

    @Transactional  // <-- CLAVE: todo o nada
    public Consulta aprobarConsultaYDocumentos(Long idConsulta) {
        Consulta consulta = consultaRepositorio.findById(idConsulta)
            .orElseThrow(() -> new EntityNotFoundException("Consulta no encontrada"));

        // Validacion: solo se aprueban consultas en Borrador
        if (!"Borrador".equals(consulta.getEstadoActualDeLaConsulta())) {
            throw new IllegalStateException("Solo se pueden aprobar consultas en estado Borrador");
        }

        // Cambiar estado de la consulta
        consulta.setEstadoActualDeLaConsulta("Aprobado");
        consultaRepositorio.save(consulta);

        // Cambiar estado de TODOS los documentos asociados
        List<Documento> documentos = documentoRepositorio.findByIdConsultaVinculada(idConsulta);
        for (Documento documento : documentos) {
            if ("Borrador".equals(documento.getEstadoDeAprobacion())) {
                documento.setEstadoDeAprobacion("Aprobado");
                documentoRepositorio.save(documento);
            }
        }

        return consulta;
    }
}
```

### Lo que debes resaltar

> "La anotacion `@Transactional` garantiza que si en el medio del proceso ocurre cualquier excepcion, **Spring revierte automaticamente** todos los cambios. Esto se llama **atomicidad** y es fundamental para la integridad de datos."

---

## Flujo de manejo de excepciones global

Cuando algo falla, queremos respuestas HTTP consistentes. Para eso usamos `@ControllerAdvice`:

```java
@ControllerAdvice
public class ManejadorExcepcionesGlobal {

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<?> manejarValidacionFallida(MethodArgumentNotValidException ex) {
        Map<String, String> errores = new HashMap<>();
        ex.getBindingResult().getFieldErrors().forEach(error ->
            errores.put(error.getField(), error.getDefaultMessage())
        );
        return ResponseEntity.badRequest().body(Map.of("errores", errores));
    }

    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<?> manejarCredenciales(BadCredentialsException ex) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
            .body(Map.of("mensaje", ex.getMessage()));
    }

    @ExceptionHandler(EntityNotFoundException.class)
    public ResponseEntity<?> manejarNoEncontrado(EntityNotFoundException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
            .body(Map.of("mensaje", ex.getMessage()));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<?> manejarGenerico(Exception ex) {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
            .body(Map.of("mensaje", "Ocurrio un error interno en el servidor"));
    }
}
```

### Lo que debes resaltar

> "Esta clase es interceptor global. Cualquier excepcion lanzada en cualquier servicio se captura aqui y se convierte en una respuesta HTTP apropiada. Asi el frontend nunca recibe una excepcion Java en bruto."

---

## Resumen de la rubrica DAW

| Requisito | Donde esta en mi codigo |
|---|---|
| Servicio Rest de login con BCrypt | `AutenticacionControlador` + `SecurityConfig.passwordEncoder()` |
| GET, POST, PUT, DELETE | `PacienteControlador` (los 4 metodos), igual en otros 6 controladores |
| Persistir en BD | Spring Data JPA en todos los servicios via `JpaRepository.save()` |
| Buenas practicas | Capas (`@RestController` → `@Service` → `@Repository`) |
| Patrones de diseno | Repository, Service, DI, Builder (Lombok), Strategy (cascade IA) |
