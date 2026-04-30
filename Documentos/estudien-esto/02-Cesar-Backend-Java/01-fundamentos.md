# 01. Fundamentos que debes dominar

Antes de tocar codigo, esto es lo que debes responder con tus propias palabras.

---

## 1. ¿Que es Spring Boot?

**Spring Boot es el framework de Java mas popular para construir APIs REST.** Te permite crear una aplicacion empresarial con servidor embebido, configuracion automatica y minimo XML.

### Por que lo usamos
- Es **el estandar de facto** en empresas de Latinoamerica para backends.
- Trae **servidor Tomcat embebido**: solo corres `java -jar app.jar` y ya esta listo.
- **Auto-configuracion**: detecta dependencias en el classpath y configura todo automaticamente.
- **Spring Data, Security, Validation**: ecosistema maduro y bien documentado.

### Como se ve un controlador en Spring Boot
```java
@RestController
@RequestMapping("/api/pacientes")
public class PacienteControlador {
    private final PacienteServicio pacienteServicio;

    @PostMapping
    public ResponseEntity<?> crear(@Valid @RequestBody PacientePeticion peticion) {
        Paciente p = pacienteServicio.crear(peticion);
        return ResponseEntity.status(HttpStatus.CREATED).body(p);
    }
}
```

Eso es todo. La validacion `@Valid`, el binding del JSON, la respuesta HTTP — todo lo maneja Spring por nosotros.

---

## 2. ¿Que es Spring Data JPA?

**Spring Data JPA es la libreria que te permite trabajar con la base de datos sin escribir SQL** (o con minimo SQL). Genera repositorios automaticamente solo con declarar interfaces.

### Como se ve
```java
@Entity
@Table(name = "Pacientes")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class Paciente {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long idPaciente;

    @Column(nullable = false, length = 100)
    private String nombreDelPaciente;

    @Column(nullable = false, length = 20, unique = true)
    private String numeroDocumentoIdentidad;
    // ...
}

public interface PacienteRepositorio extends JpaRepository<Paciente, Long> {
    Optional<Paciente> findByNumeroDocumentoIdentidad(String numero);
    List<Paciente> findByIdClinicaAndEstaPacienteActivoTrue(Long idClinica);
}
```

**Solo declaras las interfaces.** Spring genera la implementacion en runtime con SQL apropiado para MySQL.

---

## 3. ¿Que es Spring Security y por que es importante?

**Spring Security maneja autenticacion, autorizacion y proteccion contra ataques comunes** (CSRF, XSS, etc.). Es uno de los frameworks de seguridad mas robustos del mercado.

### Lo que implementamos
- **JWT** (JSON Web Token) para autenticacion stateless.
- **BCryptPasswordEncoder** para hashear contrasenas (cumplimiento de la rubrica).
- **CORS** para que el frontend Angular pueda llamar al backend.
- **`@PreAuthorize`** para control de acceso por rol en endpoints sensibles.

### Configuracion en SecurityConfig.java
```java
@Configuration
@EnableMethodSecurity(prePostEnabled = true)
public class SecurityConfig {

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        return http
            .cors(cors -> cors.configurationSource(corsSource))
            .csrf(csrf -> csrf.disable())  // No usamos sesiones
            .sessionManagement(s -> s.sessionCreationPolicy(STATELESS))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/autenticacion/**").permitAll()
                .requestMatchers("/api/clinicas/registrar").permitAll()
                .anyRequest().authenticated()
            )
            .addFilterBefore(jwtFiltro, UsernamePasswordAuthenticationFilter.class)
            .build();
    }
}
```

---

## 4. ¿Que es JWT (JSON Web Token)?

**JWT es un token firmado** que contiene informacion del usuario (sub, rol, idClinica, etc.) y se envia en el header `Authorization: Bearer ...` en cada peticion.

### Estructura del JWT
```
eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiJhZG1pbkBtZWRzY3JpYmUucGUi...firma
└─── Header ───┘ └────────── Payload ──────────────────┘ └Firma┘
```

3 partes separadas por puntos. El payload contiene los claims (datos del usuario), la firma garantiza que nadie modifico el token.

### Por que JWT y no sesiones tradicionales
- **Stateless**: el servidor no necesita guardar nada. Cualquier instancia puede validar el token.
- **Escalable**: si tienes 10 servidores Spring Boot, todos pueden validar JWT sin compartir estado.
- **Cross-domain**: el frontend Angular puede estar en otro dominio sin problemas.

### Como se firma
Usamos el algoritmo **HS512** (HMAC SHA-512) con un secret guardado en `.env`:

```java
String token = Jwts.builder()
    .subject(correo)
    .claim("idUsuario", id)
    .claim("idClinica", idClinica)
    .claim("rol", rol)
    .issuedAt(new Date())
    .expiration(new Date(now + 86400000))  // 24 horas
    .signWith(claveSecreta, Jwts.SIG.HS512)
    .compact();
```

---

## 5. ¿Que es BCrypt y por que la rubrica lo exige?

**BCryptPasswordEncoder es un algoritmo de hash de contrasenas disenado para ser computacionalmente lento.** Esto dificulta los ataques de fuerza bruta.

### Comparacion con SHA-256 (MAL)
| | SHA-256 | BCrypt |
|---|---|---|
| Velocidad | Microsegundos | Cientos de milisegundos |
| Resistencia a fuerza bruta | Baja (millones de hashes/seg) | Alta (decenas de hashes/seg) |
| Salt | Manual | Automatico, integrado en el hash |
| Recomendado para contrasenas | NO | SI |

### Como lo usamos

```java
// Al registrar usuario
String hash = passwordEncoder.encode("Admin2026!");
// Ejemplo de hash: $2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy

// Al hacer login
boolean coincide = passwordEncoder.matches("Admin2026!", hashGuardadoEnBD);
```

**La contrasena en texto plano nunca se guarda en BD.** Si alguien roba la BD, no puede recuperar las contrasenas porque BCrypt es one-way (no se puede revertir).

---

## 6. ¿Que es Lombok?

**Lombok es una libreria que genera codigo Java automaticamente via anotaciones.** Reduce el boilerplate (getters, setters, constructores, builders, etc.).

### Sin Lombok (50 lineas)
```java
public class Paciente {
    private Long idPaciente;
    private String nombre;
    // ...

    public Long getIdPaciente() { return idPaciente; }
    public void setIdPaciente(Long id) { this.idPaciente = id; }
    public String getNombre() { return nombre; }
    public void setNombre(String n) { this.nombre = n; }
    // ... 40 lineas mas de getters/setters
}
```

### Con Lombok (5 lineas)
```java
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class Paciente {
    private Long idPaciente;
    private String nombre;
    // ...
}
```

`@Data` genera getters, setters, `equals`, `hashCode`, `toString`.
`@Builder` genera el patron Builder: `Paciente.builder().nombre("Juan").build()`.

---

## 7. Patron en capas

Implementamos el patron clasico de Spring:

```
@RestController  →  @Service  →  @Repository  →  @Entity  →  MySQL
   (HTTP)         (Logica)      (JPA)          (Modelo)    (BD)
```

Cada capa tiene una responsabilidad **unica**:

- **Controlador**: recibe HTTP, valida, delega a servicio. **No tiene logica de negocio**.
- **Servicio**: implementa logica de negocio. Maneja transacciones (`@Transactional`).
- **Repositorio**: acceso a datos via JPA.
- **Entidad**: modelo persistente.

**Beneficio:** facil de testear, facil de mantener, facil de cambiar una capa sin tocar las demas.

---

## 8. Multi-tenant

MedScribe es **multi-tenant**: una sola instancia sirve a multiples clinicas con datos aislados. Cada clinica solo ve sus propios pacientes, consultas, etc.

### Como lo implementamos
Cuando el usuario hace login, el JWT incluye el `idClinica`. En cada peticion, el `JwtFiltro` lo extrae y lo pone en el `SecurityContext`. Luego el `UsuarioAutenticadoProveedor` lo recupera para filtrar:

```java
@Service
public class PacienteServicio {

    @Autowired
    private UsuarioAutenticadoProveedor usuarioProveedor;

    public List<Paciente> listarTodosLosActivos() {
        Long idClinica = usuarioProveedor.obtenerIdClinicaActual();
        return pacienteRepositorio.findByIdClinicaAndEstaPacienteActivoTrue(idClinica);
    }
}
```

**El usuario fisicamente NO PUEDE ver pacientes de otra clinica** porque la query siempre filtra por su `idClinica`.

---

## Glosario rapido

| Termino | Definicion |
|---|---|
| Spring Boot | Framework Java para APIs REST con auto-configuracion. |
| Spring Data JPA | Repositorios autogenerados sobre Hibernate. |
| Spring Security | Modulo de autenticacion y autorizacion. |
| JWT | Token firmado con info del usuario (stateless). |
| BCrypt | Algoritmo de hash de contrasenas, lento a proposito. |
| Lombok | Anotaciones para generar boilerplate (getters, builder). |
| `@RestController` | Indica que la clase maneja peticiones HTTP. |
| `@Service` | Indica que la clase contiene logica de negocio. |
| `@Repository` | Interfaz de acceso a datos. |
| `@Entity` | Clase que se mapea a una tabla. |
| `@Transactional` | Asegura que el metodo se ejecute en una transaccion. |
| DTO | Data Transfer Object, modelo para transferir datos entre capas. |
| Multi-tenant | Una instancia, multiples clientes con datos aislados. |
