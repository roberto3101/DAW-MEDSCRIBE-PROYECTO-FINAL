# 04. Preguntas y respuestas para defender tu parte

---

## Bloque MySQL + diseno

### P1: ¿Por que MySQL y no PostgreSQL?

**R:** Porque es el **estandar academico de Cibertec** y el mas popular en empresas peruanas. PostgreSQL tiene mas features avanzadas (jsonb, array, full-text search nativo) pero MySQL es mas que suficiente para nuestro caso, tiene mejor performance en lecturas simples, y el ecosistema de Spring Data JPA lo soporta perfectamente.

### P2: ¿Cual es la version de MySQL y por que?

**R:** **MySQL 8.0.** Es la version LTS (Long Term Support) actual, soporta JSON nativo, mejoras de performance sobre 5.7, y es lo que ofrece el contenedor oficial `mysql:8.0`. Versiones posteriores (8.4, 9.0) tienen cambios breaking que no necesitamos.

### P3: ¿Cuantas tablas tiene tu BD?

**R:** **14 tablas en total.** Cinco son del nucleo multi-tenant (Clinicas, Usuarios, Medicos, Pacientes, RolesDeClinica), cuatro son operacionales (Consultas, Documentos, AuditoriaDeConsultas, UsuariosDeClinica), tres son para plantillas (PlantillasHistoriaClinica, SeccionesDePlantilla, ValoresDeSeccionPorConsulta), y dos para el modelo SaaS (PlanesSuscripcion, Suscripciones).

### P4: ¿Como aseguras la integridad referencial?

**R:** Con **claves foraneas** declaradas en cada tabla relacionada. Por ejemplo, `Consultas.IdPacienteAtendido` tiene FK a `Pacientes.IdPaciente`. Si alguien intenta insertar una consulta apuntando a un paciente inexistente, MySQL rechaza el INSERT. Tambien tengo **indices unicos** en CorreoElectronico, NumeroDocumentoIdentidad y RUC para evitar duplicados.

### P5: ¿Esta normalizada tu BD? ¿En que forma?

**R:** **Tercera forma normal (3NF).** Cada dato vive en una sola tabla. Por ejemplo, los datos del medico (nombre, colegiatura) viven solo en `Medicos`, no se repiten en cada `Consulta`. Si el medico cambia su numero de colegiatura, solo actualizo una fila. Esto evita anomalias de actualizacion y reduce el espacio.

### P6: ¿Por que el campo `EstaPacienteActivo` en lugar de hacer DELETE?

**R:** **Soft delete por compliance medico.** Una historia clinica nunca se borra fisicamente porque es evidencia legal. Al "eliminar" un paciente, marco `EstaPacienteActivo = FALSE` y guardo `FechaEliminacion`. El registro se mantiene en BD para auditoria. Las queries por defecto filtran con `WHERE EstaPacienteActivo = TRUE`.

---

## Bloque JPA + Hibernate

### P7: ¿Que es JPA y como se relaciona con Hibernate?

**R:** **JPA (Java Persistence API) es la especificacion** estandar de Java para mapeo objeto-relacional. **Hibernate es la implementacion** mas usada de esa especificacion. Es como decir "JPA es la interfaz, Hibernate es la clase concreta". Spring Data JPA usa Hibernate por debajo, pero podriamos cambiar a EclipseLink sin tocar el codigo de las entidades.

### P8: ¿Como mapeas una entidad Java a una tabla MySQL?

**R:** Con **anotaciones JPA**. `@Entity` marca la clase como persistente, `@Table(name = "Pacientes")` indica el nombre de la tabla, `@Id @GeneratedValue(strategy = IDENTITY)` define la PK con auto-increment, y `@Column(name=, length=, nullable=, unique=)` configura cada columna. Tambien uso `@Lob` para texto grande (LONGTEXT) y `@Enumerated(EnumType.STRING)` para enums como `RolDelSistema`.

### P9: ¿Como genera Spring Data JPA las queries?

**R:** Por **convencion de nombres**. Si declaro un metodo `findByCorreoElectronico(String)` en mi repositorio, Spring genera automaticamente `SELECT * FROM Usuarios WHERE CorreoElectronico = ?`. Para queries mas complejas uso `@Query` con JPQL (orientado a objetos) o `@Query(nativeQuery = true)` con SQL puro de MySQL.

### P10: ¿Que pasa si Hibernate no genera el SQL correcto?

**R:** Lo activo con `spring.jpa.show-sql=true` para ver el SQL generado en consola. Si esta mal, escribo la query manualmente con `@Query`. **De hecho tuvimos un bug exactamente asi**: Hibernate creaba `NotaClinicaEstructurada` como TEXT (65 KB max) en vez de LONGTEXT, lo que causaba truncamiento. Lo arreglamos con `ALTER TABLE` manual y agregando `@Lob` en la entidad.

---

## Bloque multi-tenant y seguridad

### P11: ¿Como aseguras que una clinica no vea los datos de otra?

**R:** **Multi-tenant a nivel de columna.** Cada tabla relevante (Pacientes, Consultas, Documentos, Roles) tiene una columna `IdClinica`. Cuando un usuario hace una peticion, el backend extrae su `IdClinica` del JWT (no del request body) y filtra todas las queries con `WHERE IdClinica = ?`. **Es fisicamente imposible** que un usuario vea datos de otra clinica.

### P12: ¿Por que no usas schemas separados por clinica?

**R:** **Por simplicidad.** Tener un schema por cliente requiere logica compleja para cambiar de schema en runtime, migraciones por separado, etc. Con `IdClinica` en columnas, una sola query simple basta. Para escalas muy grandes (cientos de clinicas con millones de filas) reconsideraria sharding o schemas separados, pero para nuestro caso es overkill.

### P13: ¿Como guardas las contrasenas?

**R:** **Como hash BCrypt en la columna `ContrasenaHasheada` de la tabla Usuarios.** El hash es de 60 caracteres como `$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy`. La contrasena en texto plano nunca se guarda. Si alguien roba la BD, no puede recuperar las contrasenas porque BCrypt es one-way.

---

## Bloque queries y performance

### P14: ¿Tienes indices en tu BD?

**R:** **Si.** Indices unicos en `Usuarios.CorreoElectronico`, `Pacientes.NumeroDocumentoIdentidad` y `Clinicas.RucDeLaClinica` para evitar duplicados y acelerar busquedas. Las claves primarias y foraneas tienen indice automatico en MySQL. Si en el futuro las queries se volvieran lentas (monitoreo con `EXPLAIN`), agregaria indices en columnas filtradas frecuentemente como `Consultas.IdMedicoResponsable + EstadoActualDeLaConsulta`.

### P15: ¿Que pasa si la BD se corrompe o se pierde?

**R:** Tres niveles de proteccion: (1) **Volumen Docker persistente** (`mysql_data`) que sobrevive a reinicios del contenedor. (2) **Script SQL maestro** (`MedScribeDB_MigracionCompleta_MySQL.sql`) que recrea toda la estructura y datos seed. (3) En produccion implementaria **backups diarios automaticos** con `mysqldump` + replicacion master-replica. Para esta entrega academica los volumenes Docker son suficientes.

### P16: ¿Cuantas filas puede manejar tu modelo?

**R:** MySQL 8.0 escala bien hasta **millones de filas por tabla** sin necesidad de optimizacion especial, siempre y cuando los indices esten bien. Para una clinica tipica con 100 pacientes/mes y 5 consultas/paciente serian ~6,000 consultas anuales. Una clinica grande con 10,000 pacientes seria ~600,000 consultas anuales — todavia manejable sin sharding.

---

## Bloque diseno de entidades

### P17: ¿Por que usas FK simples (Long) y no relaciones JPA bidireccionales?

**R:** **Por simplicidad y para evitar el problema N+1.** Las relaciones JPA bidireccionales (`@ManyToOne`, `@OneToMany`) son potentes pero pueden generar queries adicionales inesperadas y problemas de serializacion (ciclos infinitos al convertir a JSON). En MedScribe uso `Long idPacienteAtendido` directamente; cuando necesito el paciente, hago un `pacienteRepositorio.findById()` explicito. Mas codigo pero mas predecible.

### P18: ¿Por que separas Usuario de Medico en dos tablas?

**R:** **Porque no todos los usuarios son medicos.** Un Administrador es Usuario pero no Medico (no tiene colegiatura ni especialidad). Si pusiera todos los datos de medico en Usuarios, tendria muchas columnas NULL para administradores. La separacion respeta la **3NF**: cada tabla tiene atributos relacionados a una sola entidad logica.

### P19: ¿Cuales tablas tienen mayor riesgo de crecer mucho?

**R:** **`Consultas` y `Documentos`** porque crecen con cada atencion. Una clinica con 10 medicos atendiendo 25 pacientes/dia generaria ~62,500 consultas/anio. Para mantener performance: (1) los indices en `IdMedicoResponsable`, `IdPacienteAtendido` y `FechaYHoraDeLaConsulta` son clave. (2) Para historicos viejos podria implementar archivado a una tabla `ConsultasHistoricas` o particionado por anio.

---

## Bloque "trampa"

### P20: ¿Que pasa si dos usuarios actualizan el mismo paciente al mismo tiempo?

**R:** **Last write wins.** El segundo update sobrescribe al primero. En produccion implementariamos **optimistic locking** con `@Version` de JPA: si dos usuarios cargaron el mismo paciente con version 5 y ambos hacen update, el segundo recibe `OptimisticLockException` y debe recargar. Para nuestro alcance academico no lo implementamos.

### P21: ¿Has considerado usar NoSQL?

**R:** **Si, lo evaluamos.** NoSQL (MongoDB, DynamoDB) tiene sentido cuando los datos son denormalizados, sin esquema fijo, o cuando se necesita escalar horizontalmente a niveles extremos. Pero MedScribe tiene datos **muy relacionales** (un paciente tiene N consultas, una consulta tiene N documentos, todo pertenece a una clinica) y la cantidad de datos es manejable. SQL es la mejor opcion para nuestro caso.

### P22: Si el profesor pide ver un INSERT real, ¿como se lo muestras?

**R:** Conecto a MySQL desde la terminal:
```bash
docker exec -it medscribe-mysql mysql -uroot -p'MedScribe2026!' MedScribeDB
```
Luego:
```sql
SELECT IdPaciente, NombreDelPaciente, ApellidoDelPaciente, NumeroDocumentoIdentidad, IdClinica
  FROM Pacientes
  WHERE EstaPacienteActivo = TRUE;
```
Y muestro las 2-3 filas seed mas el paciente "Juan Prueba" que creamos en demos.

---

## Si no sabes algo

> "Buena pregunta. La estructura especifica esta en el script SQL `base-datos/migraciones/MedScribeDB_MigracionCompleta_MySQL.sql`. La idea general es `[concepto]`. Si quiere podemos abrirlo para verlo en detalle."
