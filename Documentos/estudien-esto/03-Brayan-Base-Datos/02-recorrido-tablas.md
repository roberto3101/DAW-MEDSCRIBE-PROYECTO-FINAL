# 02. Recorrido por las 14 tablas

> Cada tabla con su proposito, columnas clave y entidad JPA correspondiente.

## Vision general

```
14 tablas en total:

Multi-tenant principal (5)
  ├─ Clinicas
  ├─ Usuarios
  ├─ Medicos
  ├─ Pacientes
  └─ RolesDeClinica

Operacionales (4)
  ├─ Consultas
  ├─ Documentos
  ├─ AuditoriaDeConsultas
  └─ UsuariosDeClinica

Plantillas y suscripcion (5)
  ├─ PlantillasHistoriaClinica
  ├─ SeccionesDePlantilla
  ├─ ValoresDeSeccionPorConsulta
  ├─ PlanesSuscripcion
  └─ Suscripciones
```

---

## Tabla 1: `Clinicas`

**Proposito:** raiz del multi-tenant. Cada clinica es un tenant independiente.

| Columna | Tipo | Constraint |
|---|---|---|
| IdClinica | BIGINT | PK, AUTO_INCREMENT |
| RazonSocial | VARCHAR(200) | NOT NULL |
| RucDeLaClinica | VARCHAR(11) | NOT NULL, UNIQUE |
| NombreComercial | VARCHAR(200) | NOT NULL |
| CorreoDeContacto | VARCHAR(150) | |
| SlugPublico | VARCHAR(100) | UNIQUE |
| ColorPrimario | VARCHAR(7) | DEFAULT '#1a56db' |
| EstaClinicaActiva | BOOLEAN | DEFAULT TRUE |
| FechaRegistroEnSistema | DATETIME | DEFAULT NOW() |

**Entidad JPA:** `pe.medscribe.gateway.modelos.Clinica.java`

---

## Tabla 2: `Usuarios`

**Proposito:** usuarios del sistema (medicos, administradores). Cada uno pertenece a una clinica.

| Columna | Tipo | Constraint |
|---|---|---|
| IdUsuario | BIGINT | PK, AUTO_INCREMENT |
| IdClinica | BIGINT | FK → Clinicas |
| IdRol | BIGINT | FK → RolesDeClinica (nullable, asignado despues) |
| NombreCompleto | VARCHAR(100) | NOT NULL |
| CorreoElectronico | VARCHAR(150) | NOT NULL, UNIQUE |
| ContrasenaHasheada | VARCHAR(255) | NOT NULL — hash BCrypt |
| RolDelSistema | ENUM('Administrador','Medico','Recepcionista') | NOT NULL |
| EstaCuentaActiva | BOOLEAN | DEFAULT TRUE |
| UltimoAcceso | DATETIME | |
| FechaRegistroEnSistema | DATETIME | DEFAULT NOW() |

**Entidad JPA:** `Usuario.java`

**Lo importante:** `ContrasenaHasheada` guarda solo el **hash BCrypt**, nunca la contrasena en texto plano. Cumple la rubrica del curso.

---

## Tabla 3: `Medicos`

**Proposito:** datos profesionales especificos de los medicos (colegiatura, especialidad).

| Columna | Tipo | Constraint |
|---|---|---|
| IdMedico | BIGINT | PK |
| IdUsuarioVinculado | BIGINT | FK → Usuarios, UNIQUE (1:1) |
| IdClinica | BIGINT | FK → Clinicas |
| NombreDelMedico | VARCHAR(100) | NOT NULL |
| ApellidoDelMedico | VARCHAR(100) | NOT NULL |
| EspecialidadMedica | VARCHAR(100) | NOT NULL |
| NumeroColegiaturaDelPeru | VARCHAR(20) | NOT NULL, UNIQUE |
| EstaMedicoActivo | BOOLEAN | DEFAULT TRUE |

**Entidad JPA:** `Medico.java`

**Por que separar de Usuarios:** un Usuario puede ser Administrador sin ser Medico. Solo los Usuarios con rol Medico tienen una fila en Medicos.

---

## Tabla 4: `Pacientes`

**Proposito:** registro de pacientes de cada clinica.

| Columna | Tipo | Constraint |
|---|---|---|
| IdPaciente | BIGINT | PK |
| IdClinica | BIGINT | FK, NOT NULL — multi-tenant |
| NombreDelPaciente | VARCHAR(100) | NOT NULL |
| ApellidoDelPaciente | VARCHAR(100) | NOT NULL |
| NumeroDocumentoIdentidad | VARCHAR(20) | NOT NULL, UNIQUE |
| TipoDocumentoIdentidad | VARCHAR(20) | NOT NULL — DNI/CE/Pasaporte |
| FechaDeNacimiento | DATE | NOT NULL |
| SexoBiologico | VARCHAR(20) | NOT NULL |
| TelefonoDeContacto | VARCHAR(20) | |
| CorreoElectronico | VARCHAR(150) | |
| DireccionDomiciliaria | VARCHAR(300) | |
| EstaPacienteActivo | BOOLEAN | DEFAULT TRUE — soft delete |
| FechaRegistroEnSistema | DATETIME | DEFAULT NOW() |
| FechaEliminacion | DATETIME | NULL |

**Entidad JPA:** `Paciente.java`

**Lo importante:** soft delete via `EstaPacienteActivo`. Por compliance medico, los pacientes nunca se borran fisicamente.

---

## Tabla 5: `RolesDeClinica`

**Proposito:** roles configurables por clinica con sus permisos JSON.

| Columna | Tipo | Constraint |
|---|---|---|
| IdRol | BIGINT | PK |
| IdClinica | BIGINT | FK NOT NULL |
| NombreDelRol | VARCHAR(50) | NOT NULL |
| DescripcionDelRol | VARCHAR(200) | |
| PermisosEnFormatoJSON | LONGTEXT | NOT NULL |
| EsRolBase | BOOLEAN | DEFAULT FALSE |

**Ejemplo de PermisosEnFormatoJSON:**
```json
{
  "pacientes": {"ver": true, "crear": true, "editar": true, "eliminar": false},
  "consultas": {"ver": true, "crear": true, "editar": false, "eliminar": false},
  "documentos": {"ver": true, "crear": false, "editar": false, "eliminar": false}
}
```

**Entidad JPA:** `RolDeClinica.java`

---

## Tabla 6: `Consultas`

**Proposito:** registro de cada consulta medica con transcripcion y nota.

| Columna | Tipo | Constraint |
|---|---|---|
| IdConsulta | BIGINT | PK |
| IdClinica | BIGINT | FK NOT NULL |
| IdMedicoResponsable | BIGINT | FK → Medicos |
| IdPacienteAtendido | BIGINT | FK → Pacientes |
| EspecialidadMedicaAplicada | VARCHAR(100) | NOT NULL |
| TipoDocumentoClinico | VARCHAR(50) | NOT NULL — SOAP/HistoriaClinica/Receta |
| TranscripcionDelAudio | LONGTEXT | NULL |
| NotaClinicaEstructurada | LONGTEXT | NULL |
| EstadoActualDeLaConsulta | VARCHAR(30) | DEFAULT 'Borrador' |
| DuracionEnSegundos | INT | DEFAULT 0 |
| FechaYHoraDeLaConsulta | DATETIME | NOT NULL |
| FechaCreacionEnSistema | DATETIME | DEFAULT NOW() |
| FechaEliminacion | DATETIME | NULL |

**Entidad JPA:** `Consulta.java`

**Lo importante:** `TranscripcionDelAudio` y `NotaClinicaEstructurada` son **LONGTEXT** porque pueden tener varias paginas. Inicialmente Hibernate las creo como TEXT (65 KB) y tuvimos un bug; lo solucionamos con ALTER TABLE.

---

## Tabla 7: `Documentos`

**Proposito:** documentos PDF/Word generados a partir de las consultas.

| Columna | Tipo | Constraint |
|---|---|---|
| IdDocumento | BIGINT | PK |
| IdConsultaVinculada | BIGINT | FK → Consultas |
| IdClinica | BIGINT | FK |
| TipoDocumentoClinico | VARCHAR(50) | |
| FormatoDeArchivo | VARCHAR(10) | — PDF o Word |
| RutaFisicaDelArchivo | VARCHAR(1000) | — ruta en disco |
| EstadoDeAprobacion | VARCHAR(30) | DEFAULT 'Borrador' |
| NumeroDeVersion | INT | DEFAULT 1 |
| FechaDeGeneracion | DATETIME | DEFAULT NOW() |

**Entidad JPA:** `Documento.java`

---

## Tabla 8: `UsuariosDeClinica`

**Proposito:** vincula un Usuario con un RolDeClinica especifico, permite permisos personalizados.

| Columna | Tipo | Constraint |
|---|---|---|
| IdUsuarioClinica | BIGINT | PK |
| IdUsuario | BIGINT | FK → Usuarios |
| IdClinica | BIGINT | FK → Clinicas |
| IdRol | BIGINT | FK → RolesDeClinica |
| PermisosPersonalizadosJSON | LONGTEXT | NULL |
| FechaAsignacion | DATETIME | DEFAULT NOW() |

**Entidad JPA:** `UsuarioDeClinica.java`

**Por que existe:** permite override de permisos por usuario. Si Pedro tiene rol "Medico" pero Admin le quita el permiso `consultas.eliminar`, eso vive en `PermisosPersonalizadosJSON`.

---

## Tabla 9: `AuditoriaDeConsultas`

**Proposito:** log de cambios sobre las consultas (quien edito, aprobo, rechazo).

| Columna | Tipo |
|---|---|
| IdAuditoria | BIGINT PK |
| IdConsulta | BIGINT FK |
| Accion | VARCHAR(50) |
| UsuarioQueActuo | BIGINT FK → Usuarios |
| FechaHora | DATETIME |
| Detalles | TEXT |

**Entidad JPA:** `AuditoriaDeConsulta.java`

---

## Tablas 10-12: `PlantillasHistoriaClinica`, `SeccionesDePlantilla`, `ValoresDeSeccionPorConsulta`

**Proposito:** soporte para plantillas personalizables de notas clinicas (futura feature).

Ejemplo: una plantilla "Pediatria" con secciones "Antecedentes neonatales", "Vacunacion", "Alimentacion", etc. Al crear consulta, los valores de cada seccion se guardan en `ValoresDeSeccionPorConsulta`.

---

## Tablas 13-14: `PlanesSuscripcion`, `Suscripciones`

**Proposito:** soporte para modelo SaaS (planes pagos por clinica).

| PlanesSuscripcion | Ejemplo |
|---|---|
| Free Trial | 30 dias, max 3 usuarios, 50 consultas/mes |
| Profesional | $49/mes, max 10 usuarios, 500 consultas |
| Enterprise | $199/mes, ilimitado |

| Suscripciones |
|---|
| IdSuscripcion, IdClinica, IdPlan, FechaInicio, FechaFin, Estado |

En la entrega actual, todas las clinicas tienen suscripcion `Free Trial`.

---

## Como ubicar todo

| Cosa | Donde |
|---|---|
| Script SQL maestro | `base-datos/migraciones/MedScribeDB_MigracionCompleta_MySQL.sql` |
| Entidades JPA | `gateway-java/src/main/java/pe/medscribe/gateway/modelos/*.java` |
| Repositorios JPA | `gateway-java/src/main/java/pe/medscribe/gateway/repositorios/*.java` |
| Configuracion BD | `gateway-java/src/main/resources/application.properties` |
| Volumen MySQL en Docker | `mysql_data` (named volume) |

## Datos seed cargados al iniciar

| Tabla | Filas seed |
|---|---|
| Clinicas | 1 ("MedScribe Demo", RUC 20123456789) |
| Usuarios | 3 (admin@medscribe.pe, jroberto@medscribe.pe, otro) |
| Medicos | 1 (Dr. Jose Roberto, especialidad Medicina General) |
| Pacientes | 2 (Maria Garcia Lopez, Carlos Torres Mendoza) |
| RolesDeClinica | 3 (Administrador, Medico, Recepcionista) |
| PlanesSuscripcion | 3 (Free Trial, Profesional, Enterprise) |
| Suscripciones | 1 (clinica demo en Free Trial) |
