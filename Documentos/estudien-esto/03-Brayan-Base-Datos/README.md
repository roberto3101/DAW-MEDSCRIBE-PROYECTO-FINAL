# Guia de estudio — Brayan Emanuel Pedro Gil Lipe

**Codigo:** i202335854
**Tema:** Base de datos MySQL 8.0 + Mapeo JPA con Hibernate
**Carpetas del codigo:** `base-datos/migraciones/` + entidades JPA en `gateway-java/src/main/java/pe/medscribe/gateway/modelos/`

---

## Tu mision en la presentacion

Vas a explicar **el modelo de datos**: como las 14 tablas se relacionan, por que estan disenadas asi, y como se mapean a entidades Java con JPA. Tu parte es la que demuestra que el equipo entiende **persistencia, integridad referencial y multi-tenant a nivel BD**.

## Tu tiempo en la sustentacion

Aproximadamente **4 minutos**. Hablas despues de Cesar (backend) y antes de Roberto (servicio IA).

## Orden de lectura

| Archivo | Que aprenderas | Tiempo |
|---|---|---|
| `01-fundamentos.md` | MySQL, JPA, Hibernate, claves foraneas, normalizacion, multi-tenant | 15 min |
| `02-recorrido-tablas.md` | Cada una de las 14 tablas explicada, con su entidad JPA correspondiente | 15 min |
| `03-jpa-y-mysql.md` | Como las anotaciones JPA generan el SQL, decisiones de diseno | 15 min |
| `04-preguntas-y-respuestas.md` | Posibles preguntas del profesor con respuestas listas | 15 min |
| `05-guion-presentacion.md` | Tu guion minuto a minuto | 10 min |

## Tu mensaje principal

> "El modelo de datos tiene **14 tablas** disenadas con normalizacion 3NF, **integridad referencial via FK**, **indices unicos** en correos y RUC, y soporte **multi-tenant** mediante una columna `IdClinica` en cada tabla relevante. Las entidades JPA estan mapeadas con anotaciones de Hibernate y respetan los nombres en espanol del dominio medico peruano."

## Tu archivo clave en la demo

- **`base-datos/migraciones/MedScribeDB_MigracionCompleta_MySQL.sql`** — el script SQL maestro con CREATE TABLE de las 14 tablas, FKs, indices y datos seed.
- **`gateway-java/src/main/java/pe/medscribe/gateway/modelos/Usuario.java`** — entidad ejemplo con todas las anotaciones JPA tipicas.

## Lo que el profesor querra ver

1. Que sepas explicar **el modelo entidad-relacion** (diagrama ER).
2. Que conozcas el **proposito de cada tabla** principal.
3. Que entiendas **el mapeo JPA** (entidad ↔ tabla, atributos ↔ columnas, relaciones).
4. Que sepas justificar las **decisiones de diseno** (por que multi-tenant, por que LONGTEXT en notas, etc.).
5. Que puedas **conectarte a la BD en vivo** y mostrar las tablas.

## Lo que NO debes hacer

- No expliques los endpoints REST (eso es de Cesar).
- No expliques el cascade IA (eso es de Roberto).
- No expliques Angular (eso es de Antony).
- No leas el SQL completo en pantalla. Senala las tablas mas importantes.

## Demo recomendada (1 minuto)

Conectate a MySQL desde la terminal:
```bash
docker exec -it medscribe-mysql mysql -uroot -p'MedScribe2026!' MedScribeDB
```

Comandos a ejecutar:
```sql
SHOW TABLES;
DESCRIBE Pacientes;
SELECT IdPaciente, NombreDelPaciente, NumeroDocumentoIdentidad, IdClinica
  FROM Pacientes WHERE EstaPacienteActivo = TRUE;
```

Esto demuestra que las tablas existen, los datos estan persistidos y el multi-tenant funciona (todas las filas tienen `IdClinica`).
