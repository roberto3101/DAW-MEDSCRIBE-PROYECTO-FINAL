# 01. Fundamentos que debes dominar

---

## 1. ¿Que es MySQL?

**MySQL es uno de los sistemas de gestion de bases de datos relacionales (RDBMS) mas usados del mundo.** Es open source (propiedad de Oracle desde 2010), gratuito, robusto y bien documentado.

### Por que MySQL y no otro
- **Estandar de la industria**: usado por Facebook, YouTube, Twitter, Booking, etc.
- **Excelente performance** para cargas de lectura/escritura mixtas.
- **Hibernate y Spring Data JPA** lo soportan perfectamente.
- **Docker oficial** disponible: `mysql:8.0`.
- **Familiar**: la rubrica del curso permite cualquier RDBMS, MySQL es el estandar academico en Cibertec.

### Como interactuamos con MySQL
1. **Desde Spring Boot** via Spring Data JPA (lo que hace Cesar).
2. **Desde la terminal** via cliente `mysql` (para administracion).
3. **Desde Docker** via `docker exec -it medscribe-mysql mysql ...`.

---

## 2. ¿Que es JPA y como se relaciona con Hibernate?

**JPA (Java Persistence API)** es una **especificacion** de Java para mapeo objeto-relacional (ORM). Define las anotaciones (`@Entity`, `@Table`, `@Column`, etc.) pero NO la implementacion.

**Hibernate** es la **implementacion mas popular** de JPA. Es lo que efectivamente traduce las anotaciones en SQL y ejecuta queries.

### Sin JPA tendrias que escribir
```java
String sql = "SELECT * FROM Pacientes WHERE NumeroDocumentoIdentidad = ?";
PreparedStatement ps = conn.prepareStatement(sql);
ps.setString(1, "12345678");
ResultSet rs = ps.executeQuery();
while (rs.next()) {
    Paciente p = new Paciente();
    p.setIdPaciente(rs.getLong("IdPaciente"));
    p.setNombreDelPaciente(rs.getString("NombreDelPaciente"));
    // ... mapear 12 columnas mas
}
rs.close(); ps.close(); conn.close();
```

### Con JPA solo escribes
```java
@Entity
@Table(name = "Pacientes")
public class Paciente {
    @Id @GeneratedValue
    private Long idPaciente;
    @Column(name = "NombreDelPaciente")
    private String nombreDelPaciente;
    // ...
}

// Y en el repositorio:
public interface PacienteRepositorio extends JpaRepository<Paciente, Long> {
    Optional<Paciente> findByNumeroDocumentoIdentidad(String numero);
}
```

Hibernate genera el SQL, ejecuta la query, mapea el ResultSet a Paciente, cierra recursos. **Cero codigo adicional.**

---

## 3. Modelo entidad-relacion (ER)

Un buen modelo ER se construye respondiendo:
- ¿Cuales son las **entidades** del dominio? (Pacientes, Consultas, Medicos...)
- ¿Que **atributos** tiene cada entidad?
- ¿Que **relaciones** hay entre ellas?
- ¿De que **cardinalidad** es cada relacion (1:1, 1:N, N:M)?

### En MedScribe (resumen rapido)

```
Clinica  1───N─→  Paciente
Clinica  1───N─→  Medico
Clinica  1───N─→  RolDeClinica
Clinica  1───N─→  Usuario

Usuario  1───1─→  Medico  (un usuario puede ser un medico)
Usuario  1───1─→  UsuarioDeClinica  (vinculo con rol especifico)
RolDeClinica  1───N─→  UsuarioDeClinica

Medico   1───N─→  Consulta  (un medico atiende muchas consultas)
Paciente 1───N─→  Consulta  (un paciente puede tener muchas consultas)
Consulta 1───N─→  Documento (una consulta genera multiples PDFs/Words)
```

---

## 4. Claves foraneas (FK) e integridad referencial

Una **clave foranea** garantiza que una columna apunte a una fila existente en otra tabla. Si intentas insertar una `Consulta` con `IdPaciente = 999` y ese paciente no existe, MySQL **rechaza el INSERT**.

### En SQL
```sql
CREATE TABLE Consultas (
    IdConsulta BIGINT PRIMARY KEY AUTO_INCREMENT,
    IdPacienteAtendido BIGINT NOT NULL,
    IdMedicoResponsable BIGINT NOT NULL,
    -- ... otras columnas
    FOREIGN KEY (IdPacienteAtendido) REFERENCES Pacientes(IdPaciente),
    FOREIGN KEY (IdMedicoResponsable) REFERENCES Medicos(IdMedico)
);
```

### En JPA
```java
@Entity
public class Consulta {
    // FK simple sin relacion bidireccional
    @Column(name = "IdPacienteAtendido", nullable = false)
    private Long idPacienteAtendido;

    // O con relacion explicita
    @ManyToOne
    @JoinColumn(name = "IdPacienteAtendido")
    private Paciente paciente;
}
```

En MedScribe usamos **FK simples** (Long) sin relaciones bidireccionales por simplicidad y para evitar el problema N+1. Cesar trae los pacientes en queries separadas cuando los necesita.

---

## 5. Normalizacion (3NF)

La **tercera forma normal** evita redundancia: cada dato vive en una sola tabla.

### Mal disenado (no normalizado)
```
Consultas
| IdConsulta | NombreMedico   | NumeroColegiatura | NombrePaciente | DocumentoPaciente |
|------------|----------------|-------------------|----------------|-------------------|
| 1          | Dr. Juan Perez | CMP-12345         | Maria Garcia   | DNI 12345678      |
| 2          | Dr. Juan Perez | CMP-12345         | Carlos Lopez   | DNI 87654321      |
```

Si el doctor cambia de nombre, hay que actualizar TODAS las filas. Mal.

### Bien disenado (3NF)
```
Medicos
| IdMedico | NombreDelMedico | NumeroColegiatura |
|----------|-----------------|-------------------|
| 1        | Dr. Juan Perez  | CMP-12345         |

Pacientes
| IdPaciente | NombreDelPaciente | NumeroDocumentoIdentidad |
|------------|-------------------|--------------------------|
| 1          | Maria Garcia      | 12345678                 |
| 2          | Carlos Lopez      | 87654321                 |

Consultas
| IdConsulta | IdMedicoResponsable | IdPacienteAtendido |
|------------|---------------------|--------------------|
| 1          | 1                   | 1                  |
| 2          | 1                   | 2                  |
```

Si el doctor cambia de nombre, **una sola fila** se actualiza.

---

## 6. Multi-tenant a nivel BD

**Multi-tenant** significa que una sola instancia de la BD sirve a multiples clinicas con datos aislados.

### Como se implementa en MedScribe
**Cada tabla relevante tiene una columna `IdClinica`**:

```sql
CREATE TABLE Pacientes (
    IdPaciente BIGINT PRIMARY KEY AUTO_INCREMENT,
    IdClinica BIGINT NOT NULL,  -- <-- multi-tenant
    NombreDelPaciente VARCHAR(100) NOT NULL,
    -- ...
    FOREIGN KEY (IdClinica) REFERENCES Clinicas(IdClinica)
);
```

**Cada query desde el backend filtra por `IdClinica`** del usuario autenticado:
```sql
SELECT * FROM Pacientes
WHERE IdClinica = ? AND EstaPacienteActivo = TRUE;
```

**Asi un usuario fisicamente NO puede ver pacientes de otra clinica.** El `IdClinica` viene del JWT, no del cliente, asi que tampoco puede falsearlo.

---

## 7. Indices y performance

Un **indice** acelera las queries de busqueda. Sin indice, MySQL hace **full table scan** (lee todas las filas). Con indice, va directo a la fila buscada (O(log n)).

### Indices en MedScribe
```sql
-- Indice unico para login rapido
CREATE UNIQUE INDEX IX_Usuarios_CorreoElectronico
  ON Usuarios(CorreoElectronico);

-- Indice unico para evitar pacientes duplicados
CREATE UNIQUE INDEX IX_Pacientes_NumeroDocumento
  ON Pacientes(NumeroDocumentoIdentidad);

-- Indice unico para evitar clinicas duplicadas
CREATE UNIQUE INDEX IX_Clinicas_RUC
  ON Clinicas(RucDeLaClinica);
```

### Las claves primarias y FK ya tienen indice automatico

MySQL crea indices automaticos en cada PRIMARY KEY y FOREIGN KEY. Por eso no necesito declarar manualmente indices en `IdClinica`.

---

## 8. Migracion vs ddl-auto de Hibernate

Hibernate puede crear/actualizar las tablas automaticamente con `spring.jpa.hibernate.ddl-auto=update`. **Esto es comodo en desarrollo pero peligroso en produccion** porque puede borrar columnas o cambiar tipos sin que te enteres.

### En MedScribe usamos un enfoque hibrido
- **Script SQL maestro** (`base-datos/migraciones/MedScribeDB_MigracionCompleta_MySQL.sql`) que crea todas las tablas con seeds.
- **`spring.jpa.hibernate.ddl-auto=none`** en produccion (Hibernate NO toca el esquema).
- En desarrollo, si necesitamos cambios usamos `update` puntualmente y luego actualizamos el script SQL.

### Caso real
Tuvimos un bug donde Hibernate creo `NotaClinicaEstructurada` como TEXT (65 KB max) en vez de LONGTEXT. **Tuvimos que hacer ALTER TABLE manual:**
```sql
ALTER TABLE Consultas
  MODIFY COLUMN NotaClinicaEstructurada LONGTEXT,
  MODIFY COLUMN TranscripcionDelAudio LONGTEXT;
```

Esto demuestra por que **el script SQL es la fuente de verdad**, no Hibernate.

---

## Glosario

| Termino | Definicion |
|---|---|
| RDBMS | Relational Database Management System (MySQL, Postgres, SQL Server, etc.). |
| JPA | Java Persistence API, especificacion de ORM. |
| Hibernate | Implementacion de JPA mas usada. |
| ORM | Object-Relational Mapping, mapear objetos a tablas. |
| FK | Foreign Key, clave foranea. |
| 3NF | Tercera forma normal: cada dato en una sola tabla. |
| Multi-tenant | Una BD para muchos clientes con datos aislados. |
| LONGTEXT | Tipo MySQL para texto hasta 4GB (vs TEXT que es 65 KB). |
| AUTO_INCREMENT | Genera IDs unicos automaticamente. |
| Index | Estructura de datos para acelerar busquedas. |
| ddl-auto | Configuracion de Hibernate para gestionar el esquema. |
