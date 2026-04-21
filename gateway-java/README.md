# MedScribe Gateway (Java Spring Boot)

Migracion del gateway MedScribe desde .NET 9 a Spring Boot 3.3 + Java 17 + Maven.

## Prerequisitos

- Java 17 (JDK)
- Maven 3.9+
- MySQL 8.x con la base `MedScribeDB` ya creada

## Configuracion

Editar `src/main/resources/application.properties` si la URL, usuario o password
de MySQL son diferentes.

Variables clave:

- `server.port=5000` (coincide con el gateway .NET original)
- `medscribe.jwt.secret` (cambiar en produccion)
- `medscribe.servicio-ia.url=http://localhost:8000`

## Ejecutar

```
mvn spring-boot:run
```

o en Windows:

```
run-gateway.cmd
```

La API queda en `http://localhost:5000`.

## Endpoints principales

| Metodo | Ruta                                       | Auth      |
|--------|--------------------------------------------|-----------|
| POST   | /api/autenticacion/iniciar-sesion          | Publica   |
| POST   | /api/autenticacion/registro                | Publica   |
| POST   | /api/clinicas/registrar                    | Publica   |
| GET    | /api/clinicas                              | Admin     |
| GET    | /api/pacientes                             | JWT       |
| POST   | /api/pacientes                             | JWT       |
| PUT    | /api/pacientes/{id}                        | JWT       |
| DELETE | /api/pacientes/{id}                        | JWT       |
| GET    | /api/pacientes/documento/{numero}          | JWT       |
| GET    | /api/consultas/medico/{id}                 | JWT       |
| POST   | /api/consultas                             | JWT       |
| POST   | /api/consultas/registrar                   | JWT       |
| PUT    | /api/consultas/{id}                        | JWT       |
| PUT    | /api/consultas/{id}/aprobar                | JWT       |
| PUT    | /api/consultas/{id}/rechazar               | JWT       |
| DELETE | /api/consultas/{id}                        | JWT       |
| GET    | /api/documentos/medico/{id}                | JWT       |
| GET    | /api/documentos/consulta/{id}              | JWT       |
| GET    | /api/documentos/{id}/descargar             | JWT       |
| PUT    | /api/documentos/{id}/aprobar               | JWT       |
| GET    | /api/roles                                 | JWT       |
| POST   | /api/roles                                 | Admin     |
| PUT    | /api/roles/{id}                            | Admin     |
| DELETE | /api/roles/{id}                            | Admin     |
| GET    | /api/usuarios-clinica                      | JWT       |
| POST   | /api/usuarios-clinica                      | Admin     |
| PUT    | /api/usuarios-clinica/{id}/cambiar-rol     | Admin     |
| GET    | /api/usuarios-clinica/{id}/permisos        | JWT       |
| PUT    | /api/usuarios-clinica/{id}/permisos        | Admin     |

## Cambios respecto a .NET

- **BD**: SQL Server reemplazado por MySQL 8 (JDBC URL, dialect de Hibernate).
- **Passwords**: ahora se guardan con BCrypt (era texto plano en el .NET original).
- **JWT**: se incluye token Bearer para las peticiones protegidas (en .NET no habia JWT).
- **Row Level Security**: la seguridad multitenant por session_context de SQL Server
  no se replica; las consultas reciben `idClinica` explicito cuando aplica.
- **Stored procedures**: reemplazados por JPA/Hibernate.
