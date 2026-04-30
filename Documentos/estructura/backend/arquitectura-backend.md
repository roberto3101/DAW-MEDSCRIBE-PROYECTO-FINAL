# Arquitectura del backend MedScribe AI

El backend de MedScribe esta dividido en **dos servicios independientes**:

1. **gateway-java** — el "puerto de entrada" en Java + Spring Boot. Maneja autenticacion, autorizacion, validacion y persistencia.
2. **servicio-ia** — un microservicio en Python + FastAPI que se encarga exclusivamente de la inteligencia artificial (transcripcion, generacion de notas, generacion de PDFs).

Esta separacion **es intencional** porque cada lenguaje brilla en lo suyo:
- Java + Spring es excelente para reglas de negocio, transacciones y seguridad.
- Python tiene el mejor ecosistema de IA (OpenAI SDK, librerias de audio, ReportLab).

## Gateway Java — Patron en capas

```
┌───────────────────────────────────────────────────────┐
│ Cliente (Angular)                                      │
└──────────────────────┬────────────────────────────────┘
                       │ HTTP + JWT
                       ▼
┌───────────────────────────────────────────────────────┐
│ Capa de presentacion (Controladores @RestController)   │
│ - 7 controladores REST                                 │
│ - Validan entrada con @Valid                           │
│ - Invocan a la capa de servicios                       │
└──────────────────────┬────────────────────────────────┘
                       │
                       ▼
┌───────────────────────────────────────────────────────┐
│ Capa de seguridad (Spring Security)                    │
│ - JwtFiltro (OncePerRequestFilter)                     │
│ - JwtUtil (firma/validacion HS512)                     │
│ - DetallesUsuarioServicio (UserDetailsService)         │
│ - BCryptPasswordEncoder                                │
│ - @PreAuthorize en endpoints sensibles                 │
└──────────────────────┬────────────────────────────────┘
                       │
                       ▼
┌───────────────────────────────────────────────────────┐
│ Capa de logica de negocio (@Service)                   │
│ - 8 servicios: Autenticacion, Paciente, Consulta,      │
│   Documento, Rol, UsuarioDeClinica, Clinica, IA        │
│ - Transacciones con @Transactional                     │
│ - UsuarioAutenticadoProveedor para multi-tenant        │
└──────────────────────┬────────────────────────────────┘
                       │
                       ▼
┌───────────────────────────────────────────────────────┐
│ Capa de acceso a datos (Spring Data JPA)               │
│ - 14 repositorios extends JpaRepository                │
│ - Query methods autogenerados (findByCorreo, etc.)     │
│ - Transacciones gestionadas por Spring                 │
└──────────────────────┬────────────────────────────────┘
                       │
                       ▼
┌───────────────────────────────────────────────────────┐
│ Modelo de dominio (14 entidades JPA)                   │
│ - Mapeo @Entity / @Table                               │
│ - Lombok para reducir boilerplate                      │
│ - @Lob para campos largos (notas SOAP)                 │
└──────────────────────┬────────────────────────────────┘
                       │ JDBC
                       ▼
                  MySQL 8.0
```

### Componentes clave del gateway

| Paquete | Responsabilidad |
|---|---|
| `pe.medscribe.gateway.controladores` | Define endpoints REST (`@RestController`, `@RequestMapping`). |
| `pe.medscribe.gateway.servicios` | Logica de negocio (`@Service`). Encapsula transacciones y validaciones complejas. |
| `pe.medscribe.gateway.repositorios` | Interfaces `JpaRepository` para acceso a BD. |
| `pe.medscribe.gateway.modelos` | Entidades JPA (`@Entity`). |
| `pe.medscribe.gateway.dto` | Data Transfer Objects para requests/responses. |
| `pe.medscribe.gateway.config` | `SecurityConfig`, `CorsConfig`, `JwtUtil`. |
| `pe.medscribe.gateway.seguridad` | `JwtFiltro`, `DetallesUsuarioServicio`. |
| `pe.medscribe.gateway.excepciones` | `ManejadorExcepcionesGlobal` (`@ControllerAdvice`). |

### Flujo de una peticion tipica (POST /api/pacientes)

1. **Frontend** envia `POST /api/pacientes` con header `Authorization: Bearer <jwt>`.
2. **JwtFiltro** intercepta, valida el JWT, extrae el correo del usuario y lo coloca en `SecurityContext`.
3. **PacienteControlador.crear()** recibe el body como `PacientePeticion` (validado con `@Valid`).
4. **PacienteServicio.crear()** valida unicidad del documento, obtiene `idClinica` desde el usuario autenticado (multi-tenant) y delega al repositorio.
5. **PacienteRepositorio.save()** persiste via Hibernate.
6. **El controlador** responde 201 con `{idPaciente}`.

## Servicio IA Python — Patron de routers + cascade

```
┌────────────────────────────────────┐
│ Cliente (gateway o frontend directo)│
└─────────────────┬──────────────────┘
                  │ HTTP multipart o JSON
                  ▼
┌────────────────────────────────────┐
│ FastAPI Routers                     │
│ - /api/ia/transcribir               │
│ - /api/ia/procesar                  │
│ - /api/ia/generar-pdf               │
│ - /api/ia/generar-word              │
│ - /api/ia/configuracion/*           │
│ - /api/ia/documentos/*              │
└─────────────────┬──────────────────┘
                  │
                  ▼
┌────────────────────────────────────┐
│ Servicios de IA                     │
│ - servicio_whisper (cascade Whisper)│
│ - servicio_claude (cascade LLM)     │
│ - diarizador_deepgram               │
│ - diarizador_voces (Pyannote)       │
└─────────────────┬──────────────────┘
                  │ HTTP a APIs externas
                  ▼
┌────────────────────────────────────┐
│ Generadores de documento            │
│ - generador_pdf (ReportLab)         │
│ - generador_word (python-docx)      │
└────────────────────────────────────┘
```

### Cascade de proveedores

El cascade es la pieza central que garantiza disponibilidad:

```python
def transcribir(audio):
    for nombre, key, url, modelo in [Groq, HF, Mistral]:
        if not key: continue
        try:
            texto = llamar_proveedor(audio, key, url, modelo)
            if texto.strip(): return texto
        except: continue
    # Ultimo recurso
    return deepgram_transcribe(audio)
```

Esto significa que **incluso si Groq esta caido o bloquea tu IP** (como nos paso en pruebas), el sistema sigue funcionando con Mistral o Deepgram, sin que el usuario se entere.
