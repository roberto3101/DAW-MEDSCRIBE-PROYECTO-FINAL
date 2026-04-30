# Arbol del backend `gateway-java/`

```
gateway-java/
├── Dockerfile                       # Multi-stage: maven build + temurin jre
├── pom.xml                          # Spring Boot 3.3.5 + dependencias
└── src/
    ├── main/
    │   ├── java/pe/medscribe/gateway/
    │   │   ├── GatewayApplication.java       # @SpringBootApplication, main()
    │   │   ├── config/
    │   │   │   ├── CorsConfig.java           # CORS para localhost:3000 / 4200
    │   │   │   ├── JwtUtil.java              # Genera y valida JWT (HS512)
    │   │   │   └── SecurityConfig.java       # FilterChain, BCryptEncoder, AuthManager
    │   │   ├── controladores/                # 7 controladores REST
    │   │   │   ├── AutenticacionControlador.java
    │   │   │   ├── ClinicaControlador.java
    │   │   │   ├── ConsultaControlador.java
    │   │   │   ├── DocumentoControlador.java
    │   │   │   ├── PacienteControlador.java
    │   │   │   ├── RolControlador.java
    │   │   │   └── UsuarioDeClinicaControlador.java
    │   │   ├── dto/                          # 14 DTOs
    │   │   │   ├── CambiarContrasenaPeticion.java
    │   │   │   ├── CambiarRolPeticion.java
    │   │   │   ├── ConsultaPeticion.java
    │   │   │   ├── CrearUsuarioEnClinicaPeticion.java
    │   │   │   ├── DocumentoPeticion.java
    │   │   │   ├── InicioSesionPeticion.java
    │   │   │   ├── PacientePeticion.java
    │   │   │   ├── PermisosPersonalizadosPeticion.java
    │   │   │   ├── RegistrarClinicaPeticion.java
    │   │   │   ├── RegistrarConsultaPeticion.java
    │   │   │   ├── RegistroUsuarioPeticion.java
    │   │   │   ├── RespuestaAutenticacion.java
    │   │   │   ├── RolPeticion.java
    │   │   │   └── UsuarioDTO.java
    │   │   ├── excepciones/
    │   │   │   └── ManejadorExcepcionesGlobal.java   # @ControllerAdvice global
    │   │   ├── modelos/                      # 14 entidades JPA
    │   │   │   ├── AuditoriaDeConsulta.java
    │   │   │   ├── Clinica.java
    │   │   │   ├── Consulta.java
    │   │   │   ├── Documento.java
    │   │   │   ├── Medico.java
    │   │   │   ├── Paciente.java
    │   │   │   ├── PlanSuscripcion.java
    │   │   │   ├── PlantillaHistoriaClinica.java
    │   │   │   ├── RolDeClinica.java
    │   │   │   ├── RolSistema.java                   # Enum
    │   │   │   ├── SeccionDePlantilla.java
    │   │   │   ├── Suscripcion.java
    │   │   │   ├── Usuario.java
    │   │   │   ├── UsuarioDeClinica.java
    │   │   │   └── ValorDeSeccionPorConsulta.java
    │   │   ├── repositorios/                 # 14 interfaces JpaRepository
    │   │   │   ├── AuditoriaDeConsultaRepositorio.java
    │   │   │   ├── ClinicaRepositorio.java
    │   │   │   ├── ConsultaRepositorio.java
    │   │   │   ├── DocumentoRepositorio.java
    │   │   │   ├── MedicoRepositorio.java
    │   │   │   ├── PacienteRepositorio.java
    │   │   │   ├── PlanSuscripcionRepositorio.java
    │   │   │   ├── PlantillaHistoriaClinicaRepositorio.java
    │   │   │   ├── RolDeClinicaRepositorio.java
    │   │   │   ├── SeccionDePlantillaRepositorio.java
    │   │   │   ├── SuscripcionRepositorio.java
    │   │   │   ├── UsuarioDeClinicaRepositorio.java
    │   │   │   ├── UsuarioRepositorio.java
    │   │   │   └── ValorDeSeccionPorConsultaRepositorio.java
    │   │   ├── seguridad/
    │   │   │   ├── DetallesUsuarioServicio.java     # UserDetailsService
    │   │   │   └── JwtFiltro.java                   # OncePerRequestFilter
    │   │   └── servicios/                     # 9 servicios @Service
    │   │       ├── AutenticacionServicio.java
    │   │       ├── ClienteServicioIA.java
    │   │       ├── ClinicaServicio.java
    │   │       ├── ConsultaServicio.java
    │   │       ├── DocumentoServicio.java
    │   │       ├── PacienteServicio.java
    │   │       ├── RolServicio.java
    │   │       ├── UsuarioAutenticadoProveedor.java # Multi-tenant helper
    │   │       └── UsuarioDeClinicaServicio.java
    │   └── resources/
    │       ├── application.properties        # Puerto 5000, MySQL, JPA, JWT
    │       └── application-dev.properties
    └── target/                                # Generado por Maven (ignorado en git)
        └── gateway-java-1.0.0.jar
```

## Estadisticas

| Categoria | Cantidad |
|---|---|
| Controladores | 7 |
| Endpoints REST | 35+ |
| Entidades JPA | 14 |
| Repositorios | 14 |
| Servicios | 9 |
| DTOs | 14 |
| Lineas de codigo Java | ~3,000 |

## Archivos clave

- **`SecurityConfig.java`** — define que rutas son publicas (`/api/autenticacion/**`, `/api/clinicas/registrar`) y cuales requieren JWT.
- **`JwtFiltro.java`** — intercepta cada peticion, extrae el token, valida y popula el `SecurityContext`.
- **`AutenticacionServicio.java`** — implementa el cascade de generacion de JWT con permisos por rol.
- **`UsuarioAutenticadoProveedor.java`** — helper crucial para multi-tenant: obtiene el `idClinica` desde el JWT del usuario actual.
