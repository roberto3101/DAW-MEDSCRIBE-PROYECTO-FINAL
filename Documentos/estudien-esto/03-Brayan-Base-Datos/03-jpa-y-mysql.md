# 03. JPA y MySQL — como se conectan

> Como las anotaciones JPA en Java se traducen a tablas y queries MySQL.

## Mapeo entidad → tabla

### Entidad Java
```java
@Entity
@Table(name = "Pacientes")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Paciente {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "IdPaciente")
    private Long idPaciente;

    @Column(name = "IdClinica", nullable = false)
    private Long idClinica;

    @Column(name = "NombreDelPaciente", nullable = false, length = 100)
    private String nombreDelPaciente;

    @Column(name = "ApellidoDelPaciente", nullable = false, length = 100)
    private String apellidoDelPaciente;

    @Column(name = "NumeroDocumentoIdentidad", nullable = false, length = 20, unique = true)
    private String numeroDocumentoIdentidad;

    @Column(name = "FechaDeNacimiento", nullable = false)
    private LocalDate fechaDeNacimiento;

    @Column(name = "EstaPacienteActivo", nullable = false)
    private Boolean estaPacienteActivo;

    @Column(name = "FechaRegistroEnSistema", nullable = false)
    private LocalDateTime fechaRegistroEnSistema;
    // ...
}
```

### Tabla MySQL generada
```sql
CREATE TABLE Pacientes (
    IdPaciente BIGINT PRIMARY KEY AUTO_INCREMENT,
    IdClinica BIGINT NOT NULL,
    NombreDelPaciente VARCHAR(100) NOT NULL,
    ApellidoDelPaciente VARCHAR(100) NOT NULL,
    NumeroDocumentoIdentidad VARCHAR(20) NOT NULL UNIQUE,
    FechaDeNacimiento DATE NOT NULL,
    EstaPacienteActivo BOOLEAN NOT NULL DEFAULT TRUE,
    FechaRegistroEnSistema DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    -- ... otras columnas
    FOREIGN KEY (IdClinica) REFERENCES Clinicas(IdClinica)
);
```

## Anotaciones JPA usadas en MedScribe

| Anotacion | Para que sirve | Ejemplo |
|---|---|---|
| `@Entity` | Marca la clase como entidad persistente | sobre `class Paciente` |
| `@Table(name = "...")` | Nombre de la tabla en BD | `@Table(name = "Pacientes")` |
| `@Id` | Marca la PK | sobre `idPaciente` |
| `@GeneratedValue(strategy = IDENTITY)` | Auto-increment | con `IDENTITY` MySQL genera el ID |
| `@Column(name=, length=, nullable=, unique=)` | Configuracion de columna | varios casos |
| `@Lob` | Texto grande (LONGTEXT en MySQL) | `transcripcionDelAudio` |
| `@Enumerated(EnumType.STRING)` | Guarda enum como string | `rolDelSistema` |
| `@PrePersist` | Hook antes de insertar | para inicializar `fechaRegistroEnSistema` |

## Generacion de queries via Spring Data JPA

### Query method automatico
```java
public interface PacienteRepositorio extends JpaRepository<Paciente, Long> {
    Optional<Paciente> findByNumeroDocumentoIdentidad(String numero);
}
```

Hibernate genera:
```sql
SELECT * FROM Pacientes WHERE NumeroDocumentoIdentidad = ?;
```

### Query method con multiples condiciones
```java
List<Paciente> findByIdClinicaAndEstaPacienteActivoTrue(Long idClinica);
```

Genera:
```sql
SELECT * FROM Pacientes
WHERE IdClinica = ? AND EstaPacienteActivo = TRUE;
```

### Query con `@Query` JPQL (cuando query method no alcanza)
```java
@Query("SELECT c FROM Consulta c WHERE c.idMedicoResponsable = :medico AND c.fechaYHoraDeLaConsulta > :desde")
List<Consulta> consultasRecientesDelMedico(@Param("medico") Long medico, @Param("desde") LocalDateTime desde);
```

### Query con SQL nativo (caso extremo)
```java
@Query(value = "SELECT * FROM Consultas WHERE EstadoActualDeLaConsulta = 'Aprobado' LIMIT 10", nativeQuery = true)
List<Consulta> ultimasAprobadas();
```

En MedScribe **el 95%** de las queries son query methods automaticos.

## Configuracion en application.properties

```properties
# Conexion a MySQL
spring.datasource.url=jdbc:mysql://mysql:3306/MedScribeDB?useSSL=false&serverTimezone=America/Lima&allowPublicKeyRetrieval=true
spring.datasource.username=root
spring.datasource.password=${SA_PASSWORD}
spring.datasource.driver-class-name=com.mysql.cj.jdbc.Driver

# JPA / Hibernate
spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=false
spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.MySQLDialect
spring.jpa.properties.hibernate.format_sql=true

# Connection pool (HikariCP, default en Spring Boot)
spring.datasource.hikari.maximum-pool-size=10
spring.datasource.hikari.minimum-idle=2
```

### Que hace `ddl-auto=update`
- Si la tabla no existe, la crea segun la entidad.
- Si la tabla existe pero la entidad tiene una nueva columna, agrega la columna.
- **NO modifica columnas existentes ni borra datos.**

Esta opcion es comoda para desarrollo. **En produccion idealmente seria `none` o `validate`** para evitar cambios inesperados.

## Diagrama ER simplificado

```
┌─────────────┐
│  Clinicas   │ 1
│             ├──┐
└─────────────┘  │
                 │ N
                 ▼
        ┌──────────────────┐
        │     Usuarios     │ 1     ┌──────────────────┐
        │ ┌─→ Medicos      ├──────►│   RolesDeClinica │
        │ │                 │  N    └──────────────────┘
        └─┴────────────────┘
              │
              │ 1
              ▼ N
        ┌─────────────┐ N    1 ┌─────────────┐
        │  Consultas  ├───────►│  Pacientes  │
        │             │        └─────────────┘
        └─────┬───────┘
              │ 1
              │
              ▼ N
        ┌─────────────┐
        │ Documentos  │
        └─────────────┘
```

## Lifecycle de una entidad

```
new Paciente()  ─── transient (no en BD) ───
       │
       │ pacienteRepositorio.save(p)
       ▼
   managed     ─── en BD, Hibernate la rastrea ───
       │
       │ entityManager.detach(p) o cierre de sesion
       ▼
   detached    ─── ya no en sesion ───
       │
       │ pacienteRepositorio.delete(p)
       ▼
   removed     ─── marcado para borrar ───
```

En MedScribe **soft delete**: nunca pasamos a `removed` real. En cambio:
```java
public void desactivar(Long idPaciente) {
    Paciente p = buscarPorId(idPaciente);
    p.setEstaPacienteActivo(false);
    p.setFechaEliminacion(LocalDateTime.now());
    pacienteRepositorio.save(p);  // UPDATE, no DELETE
}
```

## Decisiones de diseno importantes

### ¿Por que FK simples (Long) y no relaciones bidireccionales?

```java
// SIMPLE (lo que usamos)
@Column(name = "IdPacienteAtendido")
private Long idPacienteAtendido;

// BIDIRECCIONAL (NO usamos)
@ManyToOne(fetch = FetchType.LAZY)
@JoinColumn(name = "IdPacienteAtendido")
private Paciente paciente;
```

**Razones:**
1. Evita el problema **N+1** (Hibernate genera N queries adicionales en algunas situaciones).
2. Mas explicito: cuando necesito el paciente, hago un `findById()` separado.
3. Menos magia, mas control.
4. Serializacion JSON mas predecible (no hay loops infinitos).

### ¿Por que LONGTEXT y no TEXT?

| Tipo | Tamano max |
|---|---|
| TINYTEXT | 255 bytes |
| TEXT | 65,535 bytes (~65 KB) |
| MEDIUMTEXT | 16,777,215 bytes (~16 MB) |
| LONGTEXT | 4,294,967,295 bytes (~4 GB) |

Una nota SOAP completa con secciones detalladas puede pasar de 65 KB. **De hecho tuvimos un bug exactamente por esto** porque Hibernate creo `NotaClinicaEstructurada` como TEXT por defecto.

Lo solucionamos con:
```sql
ALTER TABLE Consultas
  MODIFY COLUMN NotaClinicaEstructurada LONGTEXT,
  MODIFY COLUMN TranscripcionDelAudio LONGTEXT;
```

Y agregamos `@Lob` en la entidad para que en el futuro Hibernate use LONGTEXT.

### ¿Por que `IdClinica` esta en casi todas las tablas?

**Multi-tenant a nivel BD.** Cada query del backend filtra por `IdClinica` del usuario autenticado. Si esta columna estuviera solo en `Usuarios`, las queries serian mas complejas y propensas a errores. Con `IdClinica` en cada tabla, las queries son simples y seguras.
