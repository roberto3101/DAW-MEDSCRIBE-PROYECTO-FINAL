# MedScribe AI — Proyecto Final DAW I (Cibertec)

Proyecto final del curso **Desarrollo de Aplicaciones Web I (4694)**, ciclo 5. Portado desde el proyecto MedScribe piloto original (C#/SQLServer/React) al stack requerido por el curso.

## Arquitectura

- **Frontend Angular 17** (standalone components) en puerto `:3000` — carpeta `cliente-web/`
- **Gateway Java Spring Boot 3** en puerto `:5000` — carpeta `gateway-java/`
- **Servicio IA** (Python/FastAPI) en puerto `:8000` — carpeta `servicio-ia/`
- **MySQL** — base de datos `MedScribeDB`

El frontend Angular hace peticiones directas a `http://localhost:5000/api` (ver `cliente-web/src/environments/environment.development.ts`). El gateway Java valida tokens JWT, aplica la logica de negocio con Spring Data JPA + Hibernate sobre MySQL, y delega tareas de IA al servicio Python.

## Tecnologias del curso aplicadas

Las siguientes tecnologias estan implementadas segun el manual y el PDF de especificaciones del curso:

- **Java Persistence API (JPA) + Hibernate** — todas las entidades en `gateway-java/src/main/java/pe/medscribe/gateway/modelos/` usan anotaciones `@Entity`, `@Table`, `@ManyToOne`, `@Enumerated`, etc.
- **Spring Boot 3** — autoconfiguracion, starters, DevTools opcional.
- **Spring Data JPA** — repositorios con `JpaRepository` y derived queries (p.ej. `findByCorreoElectronico`).
- **Spring Web MVC** — controladores REST con `@RestController`, `@RequestMapping`, `@GetMapping`, `@PostMapping`, `@PutMapping`, `@DeleteMapping`.
- **Spring Security + BCryptPasswordEncoder** — autenticacion stateless con JWT, password hashing con BCrypt (requisito explicito del PDF del curso).
- **Lombok** — `@Data`, `@Builder`, `@NoArgsConstructor`, `@AllArgsConstructor` en entidades y DTOs.
- **Angular 17 standalone** — componentes sin NgModules, routing con lazy `loadComponent`, `HttpClient` con interceptor funcional para JWT.
- **TypeScript** — modelos tipados para todas las entidades del backend.

## Prerequisitos

1. **Java 17+** con Maven en PATH — para el gateway Spring Boot
2. **Node.js 18+** — para el frontend Angular
3. **Python 3.9+** con `uvicorn` — para el servicio IA
4. **MySQL 8.0+** corriendo en `localhost:3306`

## Base de datos

### Crear la BD

Ejecutar el script de migracion completa:

```bash
mysql -u root -p < base-datos/migraciones/MedScribeDB_MigracionCompleta_MySQL.sql
```

El script crea la BD `MedScribeDB`, todas las tablas (13 tablas) y los datos semilla (3 planes, 1 clinica, 3 roles, 2 usuarios con contrasenas BCrypt, etc.).

### Configurar conexion

Editar `gateway-java/src/main/resources/application.properties`:

```properties
spring.datasource.url=jdbc:mysql://localhost:3306/MedScribeDB?useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true&characterEncoding=UTF-8
spring.datasource.username=root
spring.datasource.password=MedScribe2026!
```

Reemplazar `MedScribe2026!` con la contrasena real del usuario MySQL.

### Credenciales por defecto

| Rol           | Email                  | Password      |
|---------------|------------------------|---------------|
| Administrador | admin@medscribe.pe     | Admin2026!    |
| Medico        | jroberto@medscribe.pe  | Medico2026!   |

Las contrasenas estan hasheadas con BCrypt (cost=10) en la columna `ContrasenaHasheada`.

## Levantar el proyecto

### Opcion 1: Script automatico

```
iniciar.bat
```

Levanta los 3 servicios en paralelo, corre health checks y muestra el estado. La primera vez puede tardar mas porque `npm install` se ejecuta si `node_modules` no existe, y Maven descarga dependencias.

### Opcion 2: Manual (3 terminales)

```bash
# Terminal 1 - Servicio IA
cd servicio-ia
uvicorn principal:app --host 0.0.0.0 --port 8000 --reload

# Terminal 2 - Gateway Java
cd gateway-java
mvn spring-boot:run

# Terminal 3 - Frontend Angular
cd cliente-web
npm install   # solo la primera vez
npm start     # corre en puerto 3000
```

## Problemas comunes

### "Cannot connect to MySQL"
- Verificar que el servicio MySQL esta corriendo (`services.msc` → MySQL80)
- Verificar usuario/password en `application.properties`
- Verificar que la BD `MedScribeDB` existe (`SHOW DATABASES;`)

### "Port 5000 already in use"
- El `iniciar.bat` mata procesos previos, pero si se invoca manualmente ejecutar:
  `for /f "tokens=5" %p in ('netstat -ano ^| find ":5000" ^| find "LISTENING"') do taskkill /PID %p /F`

### "Maven no encontrado"
- Instalar Maven y agregar `mvn` al PATH, o usar Maven Wrapper `mvnw.cmd` si se agrega al proyecto.

### Gateway dice "Table 'xxx' doesn't exist"
- `application.properties` tiene `spring.jpa.hibernate.ddl-auto=update` — Hibernate crea tablas faltantes en el primer arranque. Si igual falla, ejecutar el script SQL de migracion.

### Angular: "Cannot find module '@angular/...'"
- `cd cliente-web && npm install`

### Frontend: login devuelve 401
- Verificar que la BD tiene los usuarios seed con hashes BCrypt. El script MySQL incluye estas filas.
- Probar el endpoint directamente: `POST http://localhost:5000/api/autenticacion/iniciar-sesion` con body `{"correo":"admin@medscribe.pe","contrasena":"Admin2026!"}`

## Estructura de archivos clave

```
iniciar.bat                                          # Levanta todo
gateway-java/
  pom.xml                                            # Maven + Spring Boot 3.3.5
  run-gateway.cmd                                    # mvn spring-boot:run
  src/main/resources/application.properties          # Config DB + JWT + CORS
  src/main/java/pe/medscribe/gateway/
    GatewayApplication.java                          # Main class
    config/SecurityConfig.java                       # Spring Security + BCrypt + JWT
    config/JwtUtil.java                              # Generar/validar JWT
    seguridad/JwtFiltro.java                         # Filtro de autenticacion
    seguridad/DetallesUsuarioServicio.java           # UserDetailsService
    modelos/                                         # Entidades JPA (15)
    repositorios/                                    # Spring Data JPA (14)
    controladores/                                   # REST controllers (7)
    servicios/                                       # Logica de negocio
    dto/                                             # Request/response DTOs
    excepciones/ManejadorExcepcionesGlobal.java      # @RestControllerAdvice
cliente-web/
  package.json                                       # Angular 17
  angular.json                                       # Puerto 3000
  src/environments/environment.development.ts        # apiUrl -> http://localhost:5000/api
  src/app/
    app.config.ts                                    # providers (router, HttpClient, interceptor)
    app.routes.ts                                    # Lazy-loaded routes
    interceptores/auth.interceptor.ts                # Inyecta Bearer token
    guards/auth.guard.ts                             # Protege rutas
    servicios/                                       # HTTP services (login + CRUD)
    paginas/                                         # Login, dashboard, pacientes, consultas, documentos
servicio-ia/
  principal.py                                       # FastAPI (sin cambios del original)
base-datos/migraciones/
  MedScribeDB_MigracionCompleta_MySQL.sql            # Script completo MySQL
```

## Endpoints REST principales

Todos bajo `http://localhost:5000/api`:

| Metodo | Ruta                                    | Publico? |
|--------|-----------------------------------------|----------|
| POST   | `/autenticacion/iniciar-sesion`         | Si       |
| POST   | `/autenticacion/registro`               | Si       |
| GET    | `/pacientes`                            | No (JWT) |
| GET    | `/pacientes/{id}`                       | No       |
| GET    | `/pacientes/documento/{numero}`         | No       |
| POST   | `/pacientes`                            | No       |
| PUT    | `/pacientes/{id}`                       | No       |
| DELETE | `/pacientes/{id}`                       | No       |
| GET    | `/consultas/medico/{id}`                | No       |
| POST   | `/consultas`                            | No       |
| PUT    | `/consultas/{id}`                       | No       |
| DELETE | `/consultas/{id}`                       | No       |
| GET    | `/documentos/medico/{id}`               | No       |
| POST   | `/documentos`                           | No       |
| ...    | (clinicas, roles, usuarios-clinica)     | No       |

Endpoints protegidos requieren header `Authorization: Bearer <token>`, obtenido del login.

## Cumplimiento con rubrica del curso

- [x] Servicio web REST de login con BCryptPasswordEncoder — `AutenticacionControlador.iniciarSesion`
- [x] Password cifrada en BD (columna `ContrasenaHasheada` con hash BCrypt)
- [x] Servicios REST con GET, POST, PUT, DELETE — 7 controladores, ~28 endpoints
- [x] Frontend Angular que consume todos los servicios REST — componentes en `cliente-web/src/app/paginas/`
- [x] Persistencia en BD — Spring Data JPA + Hibernate + MySQL

## Diferencias con el proyecto MedScribe piloto original

El proyecto original (en `C:\Larosa\MEDSCRIBE-DSW1-PILOTO-main`) tenia:
- Gateway en **C# .NET 9** → **reemplazado por Java Spring Boot 3**
- Frontend en **React + Vite + Three.js** → **reemplazado por Angular 17 standalone**
- BD en **SQL Server** con Row-Level Security y ~30 stored procedures → **MySQL** con logica movida al servicio Java
- Passwords en texto plano en BD → **hasheados con BCrypt**

El servicio-ia (Python/FastAPI) y la estructura de tablas se mantienen identicos en concepto.
