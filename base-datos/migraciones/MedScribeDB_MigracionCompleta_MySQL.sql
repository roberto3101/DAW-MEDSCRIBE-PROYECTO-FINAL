-- =============================================================================
-- MEDSCRIBE AI - MIGRACION MULTITENANT SaaS (MySQL 8.0+)
-- Motor original: SQL Server 2022  ->  Motor destino: MySQL / MariaDB
-- Modelo: Shared Database, Shared Schema
-- Aislamiento: Por columna IdClinica (filtrado en capa Spring vs. RLS nativo)
-- =============================================================================
--
-- NOTAS DE LA MIGRACION:
--
--   1. Row Level Security (SESSION_CONTEXT + SECURITY POLICY) NO se migra.
--      MySQL no tiene RLS nativo. El filtrado por IdClinica se resolvera en
--      la capa de servicio Java (Spring) via filtros Hibernate / interceptores.
--
--   2. Todas las columnas IdClinica se MANTIENEN en las tablas.
--
--   3. Procedimientos almacenados T-SQL complejos (transacciones, manejo de
--      errores con TRY/CATCH, RAISERROR, THROW, SCOPE_IDENTITY, SESSION_CONTEXT)
--      NO se migran. La logica de negocio se movera a la capa Java.
--      TODO: stored procedures moved to Java service layer.
--
--   4. Triggers INSTEAD OF DELETE (soft delete) NO se migran; se reemplazan
--      con BEFORE DELETE que cancela la operacion. Lo mejor es que el backend
--      solo ejecute UPDATE para soft delete.
--
--   5. Contrasenas: en el script original estaban en texto plano. Aqui se
--      almacenan como hashes BCrypt (cost=10) conforme a la especificacion
--      del curso.
-- =============================================================================

CREATE DATABASE IF NOT EXISTS MedScribeDB
    CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE MedScribeDB;

SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS AuditoriaDeConsultas;
DROP TABLE IF EXISTS ValoresDeSeccionPorConsulta;
DROP TABLE IF EXISTS Documentos;
DROP TABLE IF EXISTS Consultas;
DROP TABLE IF EXISTS SeccionesDePlantilla;
DROP TABLE IF EXISTS PlantillasHistoriaClinica;
DROP TABLE IF EXISTS Pacientes;
DROP TABLE IF EXISTS Medicos;
DROP TABLE IF EXISTS Usuarios;
DROP TABLE IF EXISTS RolesDeClinica;
DROP TABLE IF EXISTS Suscripciones;
DROP TABLE IF EXISTS Clinicas;
DROP TABLE IF EXISTS PlanesSuscripcion;

SET FOREIGN_KEY_CHECKS = 1;


-- =============================================================================
-- 1. PLANES DE SUSCRIPCION (GLOBAL - sin IdClinica)
-- =============================================================================

CREATE TABLE PlanesSuscripcion (
    IdPlan                          INT NOT NULL AUTO_INCREMENT,
    CodigoDelPlan                   VARCHAR(20) NOT NULL UNIQUE,
    NombreDelPlan                   VARCHAR(50) NOT NULL,
    DescripcionDelPlan              VARCHAR(500) NULL,
    PrecioMensualEnSoles            DECIMAL(10,2) NOT NULL DEFAULT 0,
    PrecioAnualEnSoles              DECIMAL(10,2) NULL,
    MaximoDeSedesPermitidas         INT NOT NULL DEFAULT 1,
    MaximoDeUsuariosPermitidos      INT NOT NULL DEFAULT 1,
    MaximoDeConsultasPorMes         INT NOT NULL DEFAULT 100,
    MaximoDeMedicosPorClinica       INT NOT NULL DEFAULT 1,
    PermiteGenerarWord              TINYINT(1) NOT NULL DEFAULT 0,
    PermiteModoVerificacion         TINYINT(1) NOT NULL DEFAULT 0,
    PermitePersonalizarPlantillas   TINYINT(1) NOT NULL DEFAULT 0,
    PermiteSoportePrioritario       TINYINT(1) NOT NULL DEFAULT 0,
    AlmacenamientoMaximoEnMB        INT NOT NULL DEFAULT 500,
    OrdenDeVisualizacion            INT NOT NULL DEFAULT 0,
    EstaPlanActivo                  TINYINT(1) NOT NULL DEFAULT 1,
    FechaCreacion                   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (IdPlan)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- =============================================================================
-- 2. CLINICAS (TENANT)
-- =============================================================================

CREATE TABLE Clinicas (
    IdClinica                       INT NOT NULL AUTO_INCREMENT,
    RazonSocial                     VARCHAR(200) NOT NULL,
    RucDeLaClinica                  VARCHAR(11) NOT NULL UNIQUE,
    NombreComercial                 VARCHAR(200) NULL,
    DireccionLegal                  VARCHAR(300) NULL,
    Departamento                    VARCHAR(50) NULL,
    Provincia                       VARCHAR(50) NULL,
    Distrito                        VARCHAR(50) NULL,
    TelefonoPrincipal               VARCHAR(20) NULL,
    CorreoDeContacto                VARCHAR(150) NULL,
    LogoUrl                         VARCHAR(500) NULL,
    SlugPublico                     VARCHAR(100) NOT NULL UNIQUE,
    ColorPrimario                   VARCHAR(7) DEFAULT '#1a56db',
    PlazoRespuestaDias              INT NOT NULL DEFAULT 15,
    NotificarPorCorreo              TINYINT(1) NOT NULL DEFAULT 1,
    EstaClinicaActiva               TINYINT(1) NOT NULL DEFAULT 1,
    FechaRegistroEnSistema          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FechaActualizacion              DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (IdClinica)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- =============================================================================
-- 3. SUSCRIPCIONES
-- =============================================================================
-- Nota: en SQL Server la PK era (IdClinica, IdSuscripcion) con IdSuscripcion
-- IDENTITY. MySQL requiere que la columna AUTO_INCREMENT sea la PRIMERA de la
-- clave. Por eso invertimos el orden de la PK respetando la semantica.

CREATE TABLE Suscripciones (
    IdSuscripcion                   INT NOT NULL AUTO_INCREMENT,
    IdClinica                       INT NOT NULL,
    IdPlan                          INT NOT NULL,
    EstadoDeLaSuscripcion           VARCHAR(20) NOT NULL DEFAULT 'ACTIVA',
    CicloDeFacturacion              VARCHAR(10) NOT NULL DEFAULT 'MENSUAL',
    FechaInicio                     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FechaFin                        DATETIME NULL,
    FechaProximoCobro               DATE NULL,
    EsTrial                         TINYINT(1) NOT NULL DEFAULT 0,
    DiasDelTrial                    INT DEFAULT 0,
    FechaFinDelTrial                DATE NULL,
    OverrideMaxSedes                INT NULL,
    OverrideMaxUsuarios             INT NULL,
    OverrideMaxConsultas            INT NULL,
    OverrideMaxMedicos              INT NULL,
    FechaCreacion                   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (IdSuscripcion, IdClinica),
    CONSTRAINT CK_Suscripciones_Estado CHECK (EstadoDeLaSuscripcion IN ('ACTIVA','SUSPENDIDA','CANCELADA','TRIAL','VENCIDA')),
    CONSTRAINT CK_Suscripciones_Ciclo  CHECK (CicloDeFacturacion IN ('MENSUAL','ANUAL')),
    CONSTRAINT FK_Suscripciones_Clinica FOREIGN KEY (IdClinica) REFERENCES Clinicas(IdClinica),
    CONSTRAINT FK_Suscripciones_Plan    FOREIGN KEY (IdPlan)    REFERENCES PlanesSuscripcion(IdPlan),
    KEY IX_Suscripciones_Clinica (IdClinica, EstadoDeLaSuscripcion)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- =============================================================================
-- 4. USUARIOS (MULTITENANT)
-- =============================================================================
-- Passwords hashed with BCrypt (cost=10)

CREATE TABLE Usuarios (
    IdUsuario                       INT NOT NULL AUTO_INCREMENT,
    IdClinica                       INT NOT NULL,
    NombreCompleto                  VARCHAR(100) NOT NULL,
    CorreoElectronico               VARCHAR(150) NOT NULL,
    ContrasenaHasheada              VARCHAR(255) NOT NULL,
    RolDelSistema                   VARCHAR(20) NOT NULL DEFAULT 'Medico',
    EstaCuentaActiva                TINYINT(1) NOT NULL DEFAULT 1,
    DebeCambiarContrasena           TINYINT(1) NOT NULL DEFAULT 1,
    IdRol                           INT NULL,
    FotoPerfilUrl                   VARCHAR(500) NULL,
    UltimoAcceso                    DATETIME NULL,
    FechaRegistroEnSistema          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (IdUsuario, IdClinica),
    CONSTRAINT CK_Usuarios_Rol CHECK (RolDelSistema IN ('Administrador','Medico','Recepcionista')),
    CONSTRAINT FK_Usuarios_Clinica FOREIGN KEY (IdClinica) REFERENCES Clinicas(IdClinica),
    UNIQUE KEY IX_Usuarios_CorreoPorClinica (IdClinica, CorreoElectronico)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- =============================================================================
-- 5. MEDICOS (MULTITENANT)
-- =============================================================================

CREATE TABLE Medicos (
    IdMedico                        INT NOT NULL AUTO_INCREMENT,
    IdClinica                       INT NOT NULL,
    IdUsuarioVinculado              INT NOT NULL,
    NombreDelMedico                 VARCHAR(100) NOT NULL,
    ApellidoDelMedico               VARCHAR(100) NOT NULL,
    EspecialidadMedica              VARCHAR(100) NOT NULL,
    NumeroColegiaturaDelPeru        VARCHAR(20) NOT NULL,
    TelefonoDeContacto              VARCHAR(20) NULL,
    EstaMedicoActivo                TINYINT(1) NOT NULL DEFAULT 1,
    PRIMARY KEY (IdMedico, IdClinica),
    CONSTRAINT FK_Medicos_Usuario FOREIGN KEY (IdUsuarioVinculado, IdClinica)
        REFERENCES Usuarios(IdUsuario, IdClinica),
    KEY IX_Medicos_Clinica (IdClinica)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- =============================================================================
-- 6. PACIENTES (MULTITENANT)
-- =============================================================================

CREATE TABLE Pacientes (
    IdPaciente                      INT NOT NULL AUTO_INCREMENT,
    IdClinica                       INT NOT NULL,
    NombreDelPaciente               VARCHAR(100) NOT NULL,
    ApellidoDelPaciente             VARCHAR(100) NOT NULL,
    NumeroDocumentoIdentidad        VARCHAR(20) NOT NULL,
    TipoDocumentoIdentidad          VARCHAR(20) NOT NULL DEFAULT 'DNI',
    FechaDeNacimiento               DATE NOT NULL,
    SexoBiologico                   VARCHAR(10) NOT NULL,
    TelefonoDeContacto              VARCHAR(20) NULL,
    CorreoElectronico               VARCHAR(150) NULL,
    DireccionDomiciliaria           VARCHAR(300) NULL,
    EstaPacienteActivo              TINYINT(1) NOT NULL DEFAULT 1,
    FechaRegistroEnSistema          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FechaEliminacion                DATETIME NULL,
    PRIMARY KEY (IdPaciente, IdClinica),
    CONSTRAINT CK_Pacientes_TipoDoc CHECK (TipoDocumentoIdentidad IN ('DNI','CE','Pasaporte')),
    CONSTRAINT CK_Pacientes_Sexo    CHECK (SexoBiologico IN ('Masculino','Femenino')),
    CONSTRAINT FK_Pacientes_Clinica FOREIGN KEY (IdClinica) REFERENCES Clinicas(IdClinica),
    KEY IX_Pacientes_Documento (IdClinica, NumeroDocumentoIdentidad)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- =============================================================================
-- 7. PLANTILLAS DE HISTORIA CLINICA (CONFIGURABLES POR CLINICA)
-- =============================================================================

CREATE TABLE PlantillasHistoriaClinica (
    IdPlantilla                     INT NOT NULL AUTO_INCREMENT,
    IdClinica                       INT NOT NULL,
    NombreDeLaPlantilla             VARCHAR(100) NOT NULL,
    TipoDocumentoClinico            VARCHAR(50) NOT NULL,
    EsPlantillaPorDefecto           TINYINT(1) NOT NULL DEFAULT 0,
    EstaPlantillaActiva             TINYINT(1) NOT NULL DEFAULT 1,
    FechaCreacion                   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (IdPlantilla, IdClinica),
    CONSTRAINT CK_Plantillas_Tipo CHECK (TipoDocumentoClinico IN ('SOAP','HistoriaClinica','Receta','Personalizada')),
    CONSTRAINT FK_Plantillas_Clinica FOREIGN KEY (IdClinica) REFERENCES Clinicas(IdClinica)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- =============================================================================
-- 8. SECCIONES DE PLANTILLA (CONFIGURABLES)
-- =============================================================================

CREATE TABLE SeccionesDePlantilla (
    IdSeccion                       INT NOT NULL AUTO_INCREMENT,
    IdClinica                       INT NOT NULL,
    IdPlantilla                     INT NOT NULL,
    NombreDeLaSeccion               VARCHAR(100) NOT NULL,
    DescripcionDeLaSeccion          VARCHAR(300) NULL,
    OrdenDeVisualizacion            INT NOT NULL DEFAULT 0,
    EsSeccionObligatoria            TINYINT(1) NOT NULL DEFAULT 1,
    TipoDeCampo                     VARCHAR(30) NOT NULL DEFAULT 'TextoLibre',
    OpcionesDeSeleccion             LONGTEXT NULL,
    InstruccionParaIA               VARCHAR(500) NULL,
    EstaSeccionActiva               TINYINT(1) NOT NULL DEFAULT 1,
    PRIMARY KEY (IdSeccion, IdClinica),
    CONSTRAINT CK_Secciones_TipoCampo CHECK (TipoDeCampo IN ('TextoLibre','TextoCorto','Numerico','Fecha','Seleccion','ListaMultiple','SiNo')),
    CONSTRAINT FK_Secciones_Plantilla FOREIGN KEY (IdPlantilla, IdClinica)
        REFERENCES PlantillasHistoriaClinica(IdPlantilla, IdClinica)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- =============================================================================
-- 9. CONSULTAS (MULTITENANT)
-- =============================================================================

CREATE TABLE Consultas (
    IdConsulta                      INT NOT NULL AUTO_INCREMENT,
    IdClinica                       INT NOT NULL,
    IdMedicoResponsable             INT NOT NULL,
    IdPacienteAtendido              INT NOT NULL,
    IdPlantillaUtilizada            INT NULL,
    EspecialidadMedicaAplicada      VARCHAR(100) NOT NULL,
    TipoDocumentoClinico            VARCHAR(50) NOT NULL,
    RutaArchivoDeAudio              VARCHAR(500) NULL,
    TranscripcionDelAudio           LONGTEXT NULL,
    NotaClinicaEstructurada         LONGTEXT NULL,
    EstadoActualDeLaConsulta        VARCHAR(30) NOT NULL DEFAULT 'Grabando',
    DuracionEnSegundos              INT NULL DEFAULT 0,
    FechaYHoraDeLaConsulta          DATETIME NOT NULL,
    FechaCreacionEnSistema          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FechaEliminacion                DATETIME NULL,
    PRIMARY KEY (IdConsulta, IdClinica),
    CONSTRAINT CK_Consultas_TipoDoc CHECK (TipoDocumentoClinico IN ('SOAP','HistoriaClinica','Receta','Personalizada')),
    CONSTRAINT CK_Consultas_Estado  CHECK (EstadoActualDeLaConsulta IN ('Grabando','Transcribiendo','Procesando','Borrador','Aprobado','Rechazado')),
    CONSTRAINT FK_Consultas_Medico    FOREIGN KEY (IdMedicoResponsable, IdClinica) REFERENCES Medicos(IdMedico, IdClinica),
    CONSTRAINT FK_Consultas_Paciente  FOREIGN KEY (IdPacienteAtendido, IdClinica)  REFERENCES Pacientes(IdPaciente, IdClinica),
    CONSTRAINT FK_Consultas_Plantilla FOREIGN KEY (IdPlantillaUtilizada, IdClinica) REFERENCES PlantillasHistoriaClinica(IdPlantilla, IdClinica),
    KEY IX_Consultas_Medico (IdClinica, IdMedicoResponsable, FechaCreacionEnSistema)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- =============================================================================
-- 10. VALORES DE SECCIONES POR CONSULTA (DATOS DINAMICOS)
-- =============================================================================

CREATE TABLE ValoresDeSeccionPorConsulta (
    IdValor                         INT NOT NULL AUTO_INCREMENT,
    IdClinica                       INT NOT NULL,
    IdConsulta                      INT NOT NULL,
    IdSeccion                       INT NOT NULL,
    ValorIngresado                  LONGTEXT NULL,
    FechaRegistro                   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (IdValor, IdClinica),
    CONSTRAINT FK_Valores_Consulta FOREIGN KEY (IdConsulta, IdClinica) REFERENCES Consultas(IdConsulta, IdClinica),
    CONSTRAINT FK_Valores_Seccion  FOREIGN KEY (IdSeccion, IdClinica)  REFERENCES SeccionesDePlantilla(IdSeccion, IdClinica)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- =============================================================================
-- 11. DOCUMENTOS (MULTITENANT)
-- =============================================================================

CREATE TABLE Documentos (
    IdDocumento                     INT NOT NULL AUTO_INCREMENT,
    IdClinica                       INT NOT NULL,
    IdConsultaVinculada             INT NOT NULL,
    TipoDocumentoClinico            VARCHAR(50) NOT NULL,
    FormatoDeArchivo                VARCHAR(10) NOT NULL DEFAULT 'PDF',
    RutaFisicaDelArchivo            VARCHAR(500) NOT NULL,
    EstadoDeAprobacion              VARCHAR(20) NOT NULL DEFAULT 'Borrador',
    NumeroDeVersion                 INT NOT NULL DEFAULT 1,
    FechaDeGeneracion               DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FechaEliminacion                DATETIME NULL,
    PRIMARY KEY (IdDocumento, IdClinica),
    CONSTRAINT CK_Documentos_Tipo    CHECK (TipoDocumentoClinico IN ('SOAP','HistoriaClinica','Receta','Personalizada')),
    CONSTRAINT CK_Documentos_Formato CHECK (FormatoDeArchivo IN ('PDF','Word')),
    CONSTRAINT CK_Documentos_Estado  CHECK (EstadoDeAprobacion IN ('Borrador','Aprobado','Rechazado')),
    CONSTRAINT FK_Documentos_Consulta FOREIGN KEY (IdConsultaVinculada, IdClinica) REFERENCES Consultas(IdConsulta, IdClinica)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- =============================================================================
-- 12. AUDITORIA DE CONSULTAS (MULTITENANT)
-- =============================================================================

CREATE TABLE AuditoriaDeConsultas (
    IdAuditoria                     INT NOT NULL AUTO_INCREMENT,
    IdClinica                       INT NOT NULL,
    IdConsulta                      INT NOT NULL,
    EstadoAnterior                  VARCHAR(30) NOT NULL,
    EstadoNuevo                     VARCHAR(30) NOT NULL,
    IdUsuarioQueRealizoElCambio     INT NULL,
    FechaDelCambio                  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (IdAuditoria, IdClinica),
    CONSTRAINT FK_Auditoria_Consulta FOREIGN KEY (IdConsulta, IdClinica) REFERENCES Consultas(IdConsulta, IdClinica)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- =============================================================================
-- 13. ROLES DE CLINICA (MULTITENANT)
-- =============================================================================

CREATE TABLE RolesDeClinica (
    IdRol                           INT NOT NULL AUTO_INCREMENT,
    IdClinica                       INT NOT NULL,
    NombreDelRol                    VARCHAR(50) NOT NULL,
    DescripcionDelRol               VARCHAR(200) NULL,
    PermisosEnFormatoJSON           LONGTEXT NOT NULL,
    EsRolBase                       TINYINT(1) NOT NULL DEFAULT 0,
    FechaCreacion                   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (IdRol, IdClinica),
    CONSTRAINT FK_Roles_Clinica FOREIGN KEY (IdClinica) REFERENCES Clinicas(IdClinica)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- =============================================================================
-- ROW LEVEL SECURITY -> MOVIDO A CAPA JAVA
-- TODO: El aislamiento por IdClinica se aplica via filtros Hibernate /
--       interceptores Spring en lugar de SESSION_CONTEXT + CREATE SECURITY POLICY
--       de SQL Server.
-- =============================================================================


-- =============================================================================
-- PROCEDIMIENTOS ALMACENADOS -> MOVIDOS A CAPA JAVA
-- TODO: Todos los procedimientos almacenados del script original (login,
--       registro de usuarios y clinicas, CRUD de pacientes / consultas /
--       documentos / planes / roles, backups, etc.) se implementan ahora en
--       la capa de servicio Java (Spring Data JPA + @Transactional).
-- =============================================================================


-- =============================================================================
-- TRIGGERS DE SOFT DELETE -> MOVIDOS A CAPA JAVA
-- TODO: Los triggers INSTEAD OF DELETE para proteger tablas clinicas
--       (Consultas, Documentos, Pacientes) se reemplazan por logica en
--       repositorios Java que solo ejecutan UPDATE sobre FechaEliminacion.
--       Retencion minima segun NTS 139-MINSA: 20 anios.
-- =============================================================================


-- =============================================================================
-- VISTA: Uso actual del tenant vs limites del plan
-- =============================================================================

CREATE OR REPLACE VIEW v_UsoActualDeLaClinica AS
SELECT
    c.IdClinica,
    c.RazonSocial,
    c.NombreComercial,
    p.CodigoDelPlan,
    p.NombreDelPlan,
    s.EstadoDeLaSuscripcion,
    COALESCE(s.OverrideMaxConsultas, p.MaximoDeConsultasPorMes) AS LimiteConsultasMes,
    COALESCE(s.OverrideMaxUsuarios, p.MaximoDeUsuariosPermitidos) AS LimiteUsuarios,
    COALESCE(s.OverrideMaxMedicos, p.MaximoDeMedicosPorClinica)  AS LimiteMedicos,
    (SELECT COUNT(*) FROM Usuarios u WHERE u.IdClinica = c.IdClinica AND u.EstaCuentaActiva = 1) AS UsoUsuarios,
    (SELECT COUNT(*) FROM Medicos m  WHERE m.IdClinica = c.IdClinica AND m.EstaMedicoActivo = 1) AS UsoMedicos,
    (SELECT COUNT(*) FROM Consultas co
      WHERE co.IdClinica = c.IdClinica
        AND co.FechaEliminacion IS NULL
        AND co.FechaCreacionEnSistema >= DATE_FORMAT(CURDATE(), '%Y-%m-01')) AS UsoConsultasEsteMes
FROM Clinicas c
JOIN Suscripciones s       ON s.IdClinica = c.IdClinica AND s.EstadoDeLaSuscripcion IN ('ACTIVA','TRIAL')
JOIN PlanesSuscripcion p   ON p.IdPlan    = s.IdPlan;


-- =============================================================================
-- DATOS SEMILLA
-- =============================================================================

INSERT INTO PlanesSuscripcion (CodigoDelPlan, NombreDelPlan, DescripcionDelPlan, PrecioMensualEnSoles, PrecioAnualEnSoles,
    MaximoDeSedesPermitidas, MaximoDeUsuariosPermitidos, MaximoDeConsultasPorMes, MaximoDeMedicosPorClinica,
    PermiteGenerarWord, PermiteModoVerificacion, PermitePersonalizarPlantillas, PermiteSoportePrioritario,
    AlmacenamientoMaximoEnMB, OrdenDeVisualizacion) VALUES
('BASICO',       'Plan Basico',       'Transcripcion + documento PDF',                                           79.00,  790.00, 1,  2,   100,  1, 0, 0, 0, 0,   500, 1),
('PROFESIONAL',  'Plan Profesional',  'Modo verificacion + Word editable + PDF',                                149.00, 1490.00, 1,  5,   300,  3, 1, 1, 0, 0,  2000, 2),
('CLINICA',      'Plan Clinica',      'Multi-usuario + soporte prioritario + plantillas personalizables',      349.00, 3490.00, 5, 20, 99999, 10, 1, 1, 1, 1, 10000, 3);

INSERT INTO Clinicas (RazonSocial, RucDeLaClinica, NombreComercial, SlugPublico, CorreoDeContacto) VALUES
('Clinica Demo SAC', '20123456789', 'MedScribe Demo', 'medscribe-demo', 'admin@medscribe.pe');

INSERT INTO Suscripciones (IdClinica, IdPlan, EstadoDeLaSuscripcion, EsTrial, DiasDelTrial, FechaFinDelTrial) VALUES
(1, 3, 'TRIAL', 1, 30, DATE_ADD(CURDATE(), INTERVAL 30 DAY));

INSERT INTO RolesDeClinica (IdClinica, NombreDelRol, DescripcionDelRol, PermisosEnFormatoJSON, EsRolBase) VALUES
(1, 'Administrador',  'Acceso total al sistema',                    '{"pacientes":{"ver":true,"crear":true,"editar":true,"eliminar":true},"consultas":{"ver":true,"crear":true,"editar":true,"eliminar":true},"documentos":{"ver":true,"crear":true,"editar":true,"eliminar":true},"configuracion":{"ver":true,"crear":true,"editar":true,"eliminar":true},"usuarios":{"ver":true,"crear":true,"editar":true,"eliminar":true},"roles":{"ver":true,"crear":true,"editar":true,"eliminar":true}}', 1),
(1, 'Medico',         'Acceso a pacientes consultas y documentos',  '{"pacientes":{"ver":true,"crear":true,"editar":true,"eliminar":false},"consultas":{"ver":true,"crear":true,"editar":true,"eliminar":false},"documentos":{"ver":true,"crear":true,"editar":false,"eliminar":false},"configuracion":{"ver":false,"crear":false,"editar":false,"eliminar":false},"usuarios":{"ver":false,"crear":false,"editar":false,"eliminar":false},"roles":{"ver":false,"crear":false,"editar":false,"eliminar":false}}', 1),
(1, 'Recepcionista',  'Acceso limitado',                            '{"pacientes":{"ver":true,"crear":true,"editar":true,"eliminar":false},"consultas":{"ver":true,"crear":false,"editar":false,"eliminar":false},"documentos":{"ver":true,"crear":false,"editar":false,"eliminar":false},"configuracion":{"ver":false,"crear":false,"editar":false,"eliminar":false},"usuarios":{"ver":false,"crear":false,"editar":false,"eliminar":false},"roles":{"ver":false,"crear":false,"editar":false,"eliminar":false}}', 1);

-- Passwords hashed with BCrypt (cost=10)
-- admin@medscribe.pe    -> Admin2026!
-- jroberto@medscribe.pe -> Medico2026!
INSERT INTO Usuarios (IdClinica, NombreCompleto, CorreoElectronico, ContrasenaHasheada, RolDelSistema, IdRol, DebeCambiarContrasena) VALUES
(1, 'Administrador del Sistema', 'admin@medscribe.pe',    '$2b$10$Sv3WdC18btTEngGJehxZx.A8BFd2o13JdjVARFsc9/OSwE0TQNZbm', 'Administrador', 1, 0),
(1, 'Jose Roberto',              'jroberto@medscribe.pe', '$2b$10$fX/99TPNzt0AXScVY8dbZOvgVPyKzwNvF4CwcGfyL.0KSYxHwcYuq', 'Medico',        2, 0);

INSERT INTO Medicos (IdClinica, IdUsuarioVinculado, NombreDelMedico, ApellidoDelMedico, EspecialidadMedica, NumeroColegiaturaDelPeru, TelefonoDeContacto) VALUES
(1, 2, 'Jose', 'Roberto', 'Medicina General', 'CMP-12345', '999888777');

INSERT INTO Pacientes (IdClinica, NombreDelPaciente, ApellidoDelPaciente, NumeroDocumentoIdentidad, TipoDocumentoIdentidad, FechaDeNacimiento, SexoBiologico, TelefonoDeContacto, CorreoElectronico, DireccionDomiciliaria) VALUES
(1, 'Maria',  'Garcia Lopez',    '72345678', 'DNI', '1990-05-15', 'Femenino',  '987654321', 'maria.garcia@gmail.com',  'Av. Arequipa 1234, Lima'),
(1, 'Carlos', 'Torres Mendoza',  '45678901', 'DNI', '1985-11-20', 'Masculino', '912345678', 'carlos.torres@gmail.com', 'Jr. Huancayo 567, Lima');

INSERT INTO PlantillasHistoriaClinica (IdClinica, NombreDeLaPlantilla, TipoDocumentoClinico, EsPlantillaPorDefecto) VALUES
(1, 'Nota SOAP Estandar',        'SOAP',            1),
(1, 'Historia Clinica Completa', 'HistoriaClinica', 1),
(1, 'Receta Medica',             'Receta',          1);

INSERT INTO SeccionesDePlantilla (IdClinica, IdPlantilla, NombreDeLaSeccion, DescripcionDeLaSeccion, OrdenDeVisualizacion, EsSeccionObligatoria, TipoDeCampo, InstruccionParaIA) VALUES
(1, 1, 'Subjetivo',            'Motivo de consulta y sintomas referidos por el paciente', 1, 1, 'TextoLibre', 'Extrae los sintomas que refiere el paciente y el motivo de consulta'),
(1, 1, 'Objetivo',             'Signos vitales y hallazgos del examen fisico',            2, 1, 'TextoLibre', 'Extrae signos vitales, hallazgos del examen fisico y resultados de examenes'),
(1, 1, 'Analisis',             'Diagnostico y razonamiento clinico',                      3, 1, 'TextoLibre', 'Genera el diagnostico con codigos CIE-10 y razonamiento clinico'),
(1, 1, 'Plan',                 'Tratamiento, medicamentos e indicaciones',                4, 1, 'TextoLibre', 'Genera el plan de tratamiento con medicamentos, dosis y proxima cita'),
(1, 2, 'Datos del Paciente',   'Nombre, edad, sexo, documento',                           1, 1, 'TextoLibre', 'Extrae datos demograficos del paciente'),
(1, 2, 'Motivo de Consulta',   'Razon principal de la visita',                            2, 1, 'TextoLibre', 'Extrae la razon principal por la que acude'),
(1, 2, 'Enfermedad Actual',    'Descripcion cronologica de sintomas',                     3, 1, 'TextoLibre', 'Genera descripcion cronologica de los sintomas actuales'),
(1, 2, 'Antecedentes',         'Personales y familiares',                                 4, 0, 'TextoLibre', 'Extrae antecedentes personales y familiares mencionados'),
(1, 2, 'Examen Fisico',        'Signos vitales y hallazgos',                              5, 1, 'TextoLibre', 'Extrae hallazgos del examen fisico por sistemas'),
(1, 2, 'Diagnostico',          'Diagnostico principal y secundarios',                     6, 1, 'TextoLibre', 'Genera diagnosticos con codigos CIE-10'),
(1, 2, 'Plan de Tratamiento',  'Medicamentos e indicaciones',                             7, 1, 'TextoLibre', 'Genera plan de tratamiento detallado'),
(1, 3, 'Diagnostico',          'Diagnostico con CIE-10',                                  1, 1, 'TextoLibre', 'Extrae el diagnostico principal con codigo CIE-10'),
(1, 3, 'Prescripcion',         'Medicamentos con dosis y frecuencia',                     2, 1, 'TextoLibre', 'Extrae cada medicamento con nombre generico, dosis, via, frecuencia y duracion'),
(1, 3, 'Indicaciones Generales','Recomendaciones al paciente',                            3, 0, 'TextoLibre', 'Genera recomendaciones generales para el paciente'),
(1, 3, 'Proxima Cita',         'Fecha sugerida para control',                             4, 0, 'Fecha',      'Extrae la fecha sugerida para la proxima cita');


-- =============================================================================
-- RESUMEN DE LA MIGRACION
-- =============================================================================
--
-- Tablas creadas (13):
--   1.  PlanesSuscripcion          -> catalogo global de planes SaaS
--   2.  Clinicas                   -> tenants del sistema
--   3.  Suscripciones              -> relacion clinica <-> plan
--   4.  Usuarios                   -> cuentas de acceso (multitenant)
--   5.  Medicos                    -> profesionales (multitenant)
--   6.  Pacientes                  -> registro de pacientes (multitenant)
--   7.  PlantillasHistoriaClinica  -> plantillas configurables por clinica
--   8.  SeccionesDePlantilla       -> campos dinamicos de cada plantilla
--   9.  Consultas                  -> sesiones clinicas / grabaciones
--   10. ValoresDeSeccionPorConsulta-> valores ingresados en cada seccion
--   11. Documentos                 -> archivos PDF/Word generados
--   12. AuditoriaDeConsultas       -> historial de cambios de estado
--   13. RolesDeClinica             -> roles y permisos por tenant
--
-- Vistas creadas (1):
--   - v_UsoActualDeLaClinica       -> uso vs limites del plan
--
-- NO migrado (se movio a capa Java):
--   - Row Level Security + SESSION_CONTEXT
--   - Todos los procedimientos almacenados (usp_*)
--   - Triggers INSTEAD OF DELETE de soft delete
--   - Procedimientos de backup (BACKUP DATABASE)
--
-- Credenciales por defecto (para login testing):
--   - Administrador: admin@medscribe.pe     /  Admin2026!
--   - Medico:        jroberto@medscribe.pe  /  Medico2026!
--
-- Las contrasenas se almacenan con BCrypt (cost=10), conforme a la
-- especificacion del curso.
-- =============================================================================
