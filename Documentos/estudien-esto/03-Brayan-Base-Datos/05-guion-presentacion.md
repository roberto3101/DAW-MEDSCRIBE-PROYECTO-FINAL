# 05. Guion de presentacion — Brayan Pedro Gil

> Tu parte: **4 minutos**. Hablas en la seccion del informe HTML correspondiente a **base de datos**.

---

## ANTES DE EMPEZAR

- [ ] Cesar termino su parte (backend) — espera tu turno.
- [ ] Tienes una terminal abierta lista para conectarte a MySQL.
- [ ] Tienes el diagrama ER abierto en otra pestana o ya proyectado en el HTML.
- [ ] Verificaste que el contenedor `medscribe-mysql` este corriendo: `docker ps | grep mysql`.

---

## SECCION A — INTRODUCCION DEL MODELO DE DATOS (1:00)

**En pantalla:** Diagrama ER del HTML.

**Lo que dices:**
> "Buenas tardes profesor. Soy **Brayan Emanuel Pedro Gil Lipe**, codigo i202335854, y me encargue del **modelo de datos en MySQL 8.0** y su mapeo via **JPA con Hibernate**.
>
> El sistema MedScribe tiene **14 tablas** organizadas en cuatro grupos: cinco del nucleo multi-tenant (Clinicas, Usuarios, Medicos, Pacientes, RolesDeClinica), cuatro operacionales (Consultas, Documentos, AuditoriaDeConsultas, UsuariosDeClinica), tres de plantillas, y dos del modelo SaaS de suscripciones.
>
> El diseno respeta la **tercera forma normal**: cada dato vive en una sola tabla. Las relaciones se mantienen mediante **claves foraneas** que MySQL valida automaticamente, y todas las tablas relevantes incluyen una columna **`IdClinica`** para implementar **multi-tenant a nivel de base de datos**."

→ **Avanza con `→`**

---

## SECCION B — DEMO EN VIVO: CONECTAR Y EXPLORAR (1:30)

**En pantalla:** Terminal de Windows.

**Lo que haces:**
1. Cambia a la terminal.
2. Ejecuta:
```bash
docker exec -it medscribe-mysql mysql -uroot -p'MedScribe2026!' MedScribeDB
```
3. Muestra:
```sql
SHOW TABLES;
```
4. Esto lista las 14 tablas.
5. Despues:
```sql
DESCRIBE Pacientes;
```
6. Muestra las 14 columnas con tipos, NULL/NOT NULL, KEY.

**Lo que dices mientras ejecutas:**
> "Aqui me conecto al contenedor MySQL en Docker. `SHOW TABLES` me lista las **14 tablas** del proyecto. Vamos a ver el esquema de `Pacientes`: como pueden ver, tiene `IdPaciente` como clave primaria con AUTO_INCREMENT, **`IdClinica` como FK NOT NULL** que es la base del multi-tenant, los datos del paciente, y el campo `EstaPacienteActivo` para soft delete."

7. Despues ejecuta:
```sql
SELECT IdPaciente, NombreDelPaciente, NumeroDocumentoIdentidad, IdClinica
  FROM Pacientes WHERE EstaPacienteActivo = TRUE;
```

**Lo que dices:**
> "Aqui ven los pacientes activos. Note que **todos tienen IdClinica = 1**, que es la clinica demo. Si tuvieramos otra clinica con IdClinica = 2, sus pacientes nunca apareceran en estas queries porque el backend filtra por la clinica del usuario logueado."

→ **Avanza con `→`**

---

## SECCION C — RELACIONES Y JPA (1:00)

**En pantalla:** Codigo de la entidad `Paciente.java` o `Consulta.java`.

**Lo que dices:**
> "Las entidades Java estan mapeadas a las tablas con anotaciones JPA. Por ejemplo, la clase `Paciente` tiene `@Entity`, `@Table(name = 'Pacientes')`, y cada campo tiene `@Column` con la configuracion de la columna correspondiente.
>
> Use **claves foraneas simples** en vez de relaciones bidireccionales JPA para evitar el problema N+1 y mantener el codigo predecible. Por ejemplo, `Consulta` tiene `Long idPacienteAtendido` y cuando necesito el paciente, hago un `findById()` separado. Mas codigo pero menos magia.
>
> **Un caso interesante**: `TranscripcionDelAudio` y `NotaClinicaEstructurada` estan declaradas como `@Lob` para que Hibernate las mapee a **LONGTEXT** en MySQL. Inicialmente Hibernate las creaba como TEXT, lo que limita a 65 KB y causaba truncamiento de notas SOAP largas. Lo solucionamos con un `ALTER TABLE` y agregando `@Lob`."

→ **Avanza con `→`**

---

## SECCION D — CIERRE Y PASO A ROBERTO (0:30)

**Lo que dices:**
> "Para resumir mi parte: implemente **14 tablas en MySQL 8.0** con normalizacion 3NF, **integridad referencial via FKs**, **multi-tenant a nivel BD**, **indices unicos** en correos y RUC, y **mapeo JPA con Hibernate** respetando los nombres del dominio medico peruano. Todo persiste en un volumen Docker que sobrevive a reinicios.
>
> Para hablar de como esos datos se procesan con inteligencia artificial le paso la palabra a **Jose Roberto La Rosa**, nuestro coordinador, que se encargo del servicio de IA en Python."

→ **Avanza con `→`** (pasa a Roberto)

---

## TIEMPO TOTAL: 4:00

---

## SI EL TIEMPO TE QUEDA CORTO (3 min)

Salta la seccion C (JPA) y enfocate en:
- **Seccion A:** intro del modelo (1 min)
- **Seccion B:** demo en vivo (2 min)

La demo en vivo de MySQL es lo mas convincente.

---

## PALABRAS CLAVE QUE DEBES MENCIONAR

- MySQL 8.0
- 14 tablas
- Tercera forma normal (3NF)
- Claves foraneas (FK)
- Multi-tenant
- IdClinica
- BCryptHash en columna ContrasenaHasheada
- Soft delete (EstaPacienteActivo)
- LONGTEXT (vs TEXT)
- JPA + Hibernate
- @Entity, @Table, @Column, @Lob

---

## SI TE INTERRUMPEN

- "¿Por que MySQL?" → "Estandar academico, mejor performance para nuestro caso, ver P1."
- "¿Esta normalizada?" → "Si, 3NF, ver P5."
- "¿Como evitas que vea datos de otra clinica?" → "Multi-tenant via IdClinica, ver P11."

---

## TIPS

- **Habla con propiedad de DBA**. Eres el dueno de los datos.
- **No te disculpes** por usar MySQL clasico. Es la opcion correcta.
- **Cuando muestres SQL en vivo**, mantenlo simple. No abras 10 queries; basta SHOW TABLES + DESCRIBE + SELECT.
- **Si el SQL falla en vivo**, no panic: verifica que el contenedor este corriendo con `docker ps`.
- **Pasa la palabra a Roberto con energia**: "...nuestro coordinador, que se encargo del servicio de IA".
