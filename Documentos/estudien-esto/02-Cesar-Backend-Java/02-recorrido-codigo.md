# 02. Recorrido por el codigo

> Mapa de cada archivo importante de `gateway-java/`. Si te preguntan "donde esta esto", esta es tu guia.

## Estructura

```
gateway-java/src/main/java/pe/medscribe/gateway/
├── GatewayApplication.java       # main() con @SpringBootApplication
├── config/                       # SecurityConfig, JwtUtil, CorsConfig
├── controladores/                # 7 @RestController
├── dto/                          # 14 DTOs
├── modelos/                      # 14 @Entity
├── repositorios/                 # 14 JpaRepository
├── servicios/                    # 9 @Service
├── seguridad/                    # JwtFiltro, DetallesUsuarioServicio
└── excepciones/                  # ManejadorExcepcionesGlobal
```

## Archivos clave

### `GatewayApplication.java`
Punto de entrada. Solo 10 lineas:
```java
@SpringBootApplication
public class GatewayApplication {
    public static void main(String[] args) {
        SpringApplication.run(GatewayApplication.class, args);
    }
}
```

### `config/SecurityConfig.java` (TU ARCHIVO ESTRELLA)
Define toda la cadena de seguridad:
- `BCryptPasswordEncoder` como bean.
- `AuthenticationManager` como bean.
- `SecurityFilterChain`: rutas publicas (`/api/autenticacion/**`, `/api/clinicas/registrar`), todas las demas requieren JWT.
- Agrega `JwtFiltro` antes de `UsernamePasswordAuthenticationFilter`.

### `config/JwtUtil.java`
Genera y valida tokens. Metodos clave:
- `generarToken(correo, rol, idUsuario, idClinica)` → devuelve string JWT.
- `extraerCorreo(token)` → devuelve subject del token.
- `validarToken(token, correoEsperado)` → boolean.

Usa libreria `jjwt 0.12.5`.

### `seguridad/JwtFiltro.java`
Intercepta cada peticion. Lo que hace:
1. Extrae el header `Authorization`.
2. Si empieza con `Bearer `, toma el token.
3. Valida con `JwtUtil.validarToken()`.
4. Carga el `UserDetails` desde BD.
5. Pone el `Authentication` en el `SecurityContext`.

```java
@Override
protected void doFilterInternal(HttpServletRequest req, HttpServletResponse res, FilterChain chain) {
    String token = extraerTokenDeCabecera(req);
    if (StringUtils.hasText(token)) {
        String correo = jwtUtil.extraerCorreo(token);
        UserDetails detalles = detallesUsuarioServicio.loadUserByUsername(correo);
        if (jwtUtil.validarToken(token, detalles.getUsername())) {
            UsernamePasswordAuthenticationToken auth =
                new UsernamePasswordAuthenticationToken(detalles, null, detalles.getAuthorities());
            SecurityContextHolder.getContext().setAuthentication(auth);
        }
    }
    chain.doFilter(req, res);
}
```

### `controladores/AutenticacionControlador.java`
3 endpoints publicos:
- `POST /api/autenticacion/iniciar-sesion` → login con correo+contrasena, devuelve JWT.
- `POST /api/autenticacion/registro` → registra nuevo usuario.
- `POST /api/autenticacion/cambiar-contrasena` → cambia contrasena (con validacion de la actual).

### `controladores/PacienteControlador.java`
CRUD completo (cumple la rubrica de los 4 metodos):
- `GET /api/pacientes` → listar
- `GET /api/pacientes/{id}` → buscar por ID
- `GET /api/pacientes/documento/{numero}` → buscar por DNI
- `POST /api/pacientes` → crear
- `PUT /api/pacientes/{id}` → actualizar
- `DELETE /api/pacientes/{id}` → soft delete

Mismo patron en `ConsultaControlador`, `DocumentoControlador`, `RolControlador`, `UsuarioDeClinicaControlador`, `ClinicaControlador`.

### `servicios/AutenticacionServicio.java`
Logica de login con cascade de generacion de JWT:
1. Busca usuario por correo.
2. Verifica con `passwordEncoder.matches()`.
3. Genera JWT con permisos del rol.
4. Construye `UsuarioDTO` con datos completos del usuario + permisos.
5. Devuelve `RespuestaAutenticacion(token, mensaje, usuario)`.

### `servicios/UsuarioAutenticadoProveedor.java` (CRUCIAL para multi-tenant)
Helper que obtiene el usuario actual desde el SecurityContext:
```java
public Long obtenerIdClinicaActual() {
    return obtenerUsuarioActual().map(Usuario::getIdClinica).orElse(null);
}
```

Lo usan los servicios `Paciente`, `Consulta`, `Rol`, `Documento`, `UsuarioDeClinica` para filtrar por clinica del usuario logueado.

### `modelos/Usuario.java`
Entidad JPA principal:
```java
@Entity @Table(name = "Usuarios")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class Usuario {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long idUsuario;

    @Column(name = "CorreoElectronico", nullable = false, length = 150, unique = true)
    private String correoElectronico;

    @Column(name = "ContrasenaHasheada", nullable = false, length = 255)
    private String contrasenaHasheada;  // Hash BCrypt

    @Enumerated(EnumType.STRING)
    @Column(name = "RolDelSistema", nullable = false, length = 20)
    private RolSistema rolDelSistema;
    // ...
}
```

### `repositorios/UsuarioRepositorio.java`
Spring Data JPA genera la implementacion automaticamente:
```java
@Repository
public interface UsuarioRepositorio extends JpaRepository<Usuario, Long> {
    Optional<Usuario> findByCorreoElectronico(String correo);
    boolean existsByCorreoElectronico(String correo);
    List<Usuario> findByIdClinica(Long idClinica);
}
```

**No hay implementacion**. Spring genera el SQL en runtime.

### `excepciones/ManejadorExcepcionesGlobal.java`
`@ControllerAdvice` que captura excepciones y devuelve respuestas HTTP estructuradas:
```java
@ExceptionHandler(IllegalArgumentException.class)
public ResponseEntity<?> manejarValidacion(IllegalArgumentException ex) {
    return ResponseEntity.badRequest().body(Map.of("mensaje", ex.getMessage()));
}

@ExceptionHandler(BadCredentialsException.class)
public ResponseEntity<?> manejarCredenciales(BadCredentialsException ex) {
    return ResponseEntity.status(401).body(Map.of("mensaje", ex.getMessage()));
}
```

## Como ubicar rapido cualquier cosa

| Buscas... | Ve a... |
|---|---|
| Login | `controladores/AutenticacionControlador.java` |
| Generacion JWT | `config/JwtUtil.java` |
| Validacion JWT por peticion | `seguridad/JwtFiltro.java` |
| Configuracion de seguridad | `config/SecurityConfig.java` |
| BCryptPasswordEncoder | bean en `config/SecurityConfig.java` |
| CRUD Paciente | `controladores/PacienteControlador.java` + `servicios/PacienteServicio.java` |
| Multi-tenant logic | `servicios/UsuarioAutenticadoProveedor.java` |
| Entidades JPA | `modelos/*.java` |
| application.properties | `src/main/resources/application.properties` |
