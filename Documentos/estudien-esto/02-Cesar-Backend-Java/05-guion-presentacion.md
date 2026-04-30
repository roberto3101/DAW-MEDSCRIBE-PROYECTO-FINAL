# 05. Guion de presentacion — Cesar Tovar

> Tu parte: **6 minutos**. Hablas en la seccion del informe HTML correspondiente al **backend**.

---

## ANTES DE EMPEZAR

- [ ] Antony esta presentando el frontend — espera tu turno.
- [ ] Tienes Postman abierto con una coleccion lista (login + GET pacientes).
- [ ] Tienes IntelliJ o VS Code con el proyecto Java abierto en `gateway-java/`.
- [ ] Sabes en que momento toca tu seccion (cuando Antony avance).
- [ ] Verificaste que el backend este corriendo: `curl http://localhost:5000/api/pacientes` debe dar 401.

---

## SECCION A — INTRODUCCION DEL BACKEND (1:00)

**En pantalla:** Seccion del HTML "Backend Spring Boot".

**Lo que dices:**
> "Buenas tardes profesor. Mi nombre es **Cesar Augusto Tovar Rondan**, codigo i202315442. Yo me encargue del **backend en Java con Spring Boot 3.3**, que es el componente central del sistema y donde se cumple la mayoria de la rubrica del curso DAW.
>
> Implemente **35+ endpoints REST** distribuidos en **siete controladores**: Autenticacion, Pacientes, Consultas, Documentos, Roles, Usuarios y Clinicas. Use **Spring Security con JWT firmado en HS512** y **BCryptPasswordEncoder** para cumplir el requisito explicito del curso de cifrar contrasenas en BD.
>
> La persistencia es con **Spring Data JPA** sobre **MySQL 8.0**, manejo **14 entidades JPA** con anotaciones, y use **Lombok** para reducir el boilerplate de getters, setters y builders."

→ **Avanza con `→`**

---

## SECCION B — SEGURIDAD: LOGIN + JWT + BCRYPT (2:00)

**En pantalla:** Diagrama de secuencia del login.

**Lo que dices (parte teorica, ~1:00):**
> "Aqui esta el flujo de autenticacion. Cuando el usuario manda su correo y contrasena al endpoint **`POST /api/autenticacion/iniciar-sesion`**, mi controlador valida el formato con `@Valid` y delega al servicio.
>
> El servicio busca el usuario por correo, valida que la cuenta este activa, y verifica la contrasena con `passwordEncoder.matches()`. Esto es **BCrypt**: un algoritmo de hash disenado para ser computacionalmente lento, lo que dificulta el ataque de fuerza bruta. **La contrasena en texto plano nunca se guarda en BD; solo el hash.**
>
> Si la verificacion pasa, genero un **JWT firmado con HS512** que contiene el id del usuario, el id de la clinica, el rol y los permisos serializados. El frontend lo guarda y lo envia en cada peticion siguiente."

**Lo que haces (demo, ~1:00):**
1. Cambia a Postman.
2. Ejecuta `POST /api/autenticacion/iniciar-sesion` con admin@medscribe.pe.
3. Muestra el response con el token JWT.
4. **Copia el token** y pega en https://jwt.io.
5. Muestra el payload decodificado.

**Mientras lo haces, dices:**
> "Aqui pueden ver el JWT que recibo. Tiene tres partes separadas por puntos: header, payload y firma. Si lo decodifico en jwt.io ven el payload con `idUsuario`, `idClinica`, `rol` y `exp` con la fecha de expiracion en 24 horas. Como esta firmado con HS512, **nadie puede modificarlo sin invalidar la firma**."

→ **Avanza con `→`**

---

## SECCION C — CRUD CON MULTI-TENANT (1:30)

**En pantalla:** Diagrama de clases o ejemplo de PacienteServicio.

**Lo que dices:**
> "El proyecto implementa los **cuatro metodos REST** que pide la rubrica: GET, POST, PUT y DELETE, sobre cinco entidades principales: Pacientes, Consultas, Documentos, Roles y Usuarios.
>
> Quiero resaltar un patron de seguridad importante: **multi-tenant**. Cada clinica solo ve sus propios datos. Esto NO se logra confiando en lo que envia el cliente — eso seria inseguro. En cambio, **el `idClinica` se obtiene del JWT del usuario autenticado**.
>
> Cree un servicio helper llamado `UsuarioAutenticadoProveedor` que extrae el usuario actual del SecurityContext de Spring. Los repositorios filtran con queries como `findByIdClinicaAndEstaPacienteActivoTrue(idClinica)`. **Asi un usuario fisicamente NO PUEDE ver pacientes de otra clinica.**"

**Lo que haces (demo rapida):**
1. Vuelve a Postman.
2. Agrega el token al header `Authorization: Bearer <jwt>`.
3. Ejecuta `GET /api/pacientes`.
4. Muestra la lista filtrada por la clinica del admin.

→ **Avanza con `→`**

---

## SECCION D — TRANSACCIONES Y EXCEPCIONES (1:00)

**En pantalla:** Codigo de `aprobarConsultaYDocumentos()`.

**Lo que dices:**
> "Para casos donde modifico multiples entidades a la vez uso **`@Transactional`**, una de las anotaciones mas potentes de Spring. Por ejemplo, al aprobar una consulta tengo que cambiar el estado de la consulta Y el de todos sus documentos asociados. Si en el medio falla algo — perdida de conexion, validacion incumplida — `@Transactional` **revierte automaticamente** todos los cambios. Esto se llama atomicidad y es fundamental para integridad de datos.
>
> Para manejar errores de manera consistente implemente un **`@ControllerAdvice` global** que captura todas las excepciones y las traduce a respuestas HTTP estructuradas. Asi el frontend nunca recibe un stack trace en bruto: si la contrasena es incorrecta recibe 401 con mensaje claro; si una entidad no existe, 404; si la validacion `@Valid` falla, 400 con detalle por campo."

→ **Avanza con `→`**

---

## SECCION E — CIERRE Y PASO A BRAYAN (0:30)

**Lo que dices:**
> "Para resumir mi parte: implemente los **35 endpoints REST**, **autenticacion JWT con BCrypt**, **CRUD completo con multi-tenant**, **manejo de transacciones y excepciones global**, y use **Spring Security + Spring Data JPA + Lombok**, cumpliendo cada punto del stack que pide la rubrica.
>
> Los datos se persisten en MySQL, y para hablar de eso le paso la palabra a mi compañero **Brayan Pedro Gil**, que se encargo del modelo de datos."

→ **Avanza con `→`** (pasa a la seccion de Brayan)

---

## TIEMPO TOTAL: 6:00

---

## SI EL TIEMPO TE QUEDA CORTO (4 min)

Salta la seccion D (transacciones) y enfocate en:
- **Seccion A:** intro (1 min)
- **Seccion B:** login + JWT con demo (2 min)
- **Seccion C:** CRUD + multi-tenant (1 min)

---

## PALABRAS CLAVE QUE DEBES MENCIONAR

- Spring Boot 3.3
- Spring Security
- Spring Data JPA
- Lombok
- JWT (HS512)
- BCryptPasswordEncoder
- `@RestController`, `@Service`, `@Repository`, `@Entity`, `@Transactional`
- Multi-tenant
- `@ControllerAdvice` para excepciones
- 35+ endpoints REST
- 7 controladores
- 14 entidades

---

## SI TE INTERRUMPEN

- "¿Por que no usaste sesiones HTTP?" → "Stateless es mas escalable; ver pregunta P8."
- "¿Como manejas multi-tenant?" → "El idClinica viene del JWT, no del cliente; ver P14."
- "¿BCrypt es realmente necesario?" → "La rubrica lo pide y es estandar de la industria; ver P11."

---

## TIPS

- **Habla con confianza tecnica**. Eres el backend, eres el corazon del sistema.
- **No te disculpes** por usar herramientas estandar. Spring Boot es la mejor opcion.
- **Cuando muestres Postman**, hazlo rapido y enfocado. No abras 10 pestanas.
- **Pasa la palabra a Brayan con energia**: "...mi compañero Brayan se encargo del modelo de datos".
