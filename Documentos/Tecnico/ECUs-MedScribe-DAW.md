# Especificaciones de Casos de Uso (ECUs) — MedScribe AI

## Indice de casos de uso

| ID | Nombre | Actor principal | Prioridad |
|---|---|---|---|
| CU-01 | Iniciar sesion | Usuario (Medico/Administrador) | Alta |
| CU-02 | Registrar nueva clinica | Visitante | Alta |
| CU-03 | Gestionar pacientes | Medico, Administrador | Alta |
| CU-04 | Crear consulta con audio | Medico | Alta |
| CU-05 | Procesar audio con IA | Medico | Alta |
| CU-06 | Aprobar consulta | Medico | Media |
| CU-07 | Descargar documento clinico | Medico | Media |
| CU-08 | Gestionar usuarios de la clinica | Administrador | Media |
| CU-09 | Gestionar roles y permisos | Administrador | Media |
| CU-10 | Configurar formato de documentos | Administrador | Baja |

---

## CU-01 — Iniciar sesion

| Campo | Valor |
|---|---|
| **ID** | CU-01 |
| **Nombre** | Iniciar sesion |
| **Actor principal** | Usuario (Medico o Administrador) |
| **Precondiciones** | El usuario tiene una cuenta activa en la clinica. El sistema esta operativo. |
| **Postcondiciones** | El sistema entrega un token JWT al usuario y lo redirige al panel principal. |
| **Flujo principal** | 1. El usuario abre `http://localhost:3000`. 2. El sistema redirige a `/iniciar-sesion`. 3. El usuario ingresa correo y contrasena. 4. El usuario presiona el boton **Iniciar Sesion**. 5. El frontend envia `POST /api/autenticacion/iniciar-sesion`. 6. El backend valida el correo en BD. 7. El backend verifica la contrasena con `BCryptPasswordEncoder.matches()`. 8. Si es valida, el backend genera un JWT firmado con HS512 que contiene `idUsuario`, `idClinica` y `rol`. 9. El backend devuelve `{token, usuario}`. 10. El frontend guarda el token en `localStorage` y navega a `/panel`. |
| **Flujo alternativo A1** | 7a. La contrasena no coincide. 7b. El backend responde HTTP 401 con `{mensaje: "Credenciales incorrectas"}`. 7c. El frontend muestra el mensaje en pantalla. |
| **Flujo alternativo A2** | 8a. La cuenta esta desactivada (`estaCuentaActiva = false`). 8b. El backend responde HTTP 401 con `{mensaje: "La cuenta se encuentra desactivada"}`. |
| **Reglas de negocio** | - Cada correo es unico en el sistema. - La contrasena se guarda hasheada con BCrypt (cost factor 10). - El JWT expira en 24 horas. |

## CU-02 — Registrar nueva clinica

| Campo | Valor |
|---|---|
| **ID** | CU-02 |
| **Nombre** | Registrar nueva clinica |
| **Actor principal** | Visitante (sin sesion) |
| **Precondiciones** | El RUC y el correo del administrador no estan registrados previamente. |
| **Postcondiciones** | Se crea un registro en `Clinicas`, un registro en `Usuarios` con rol `Administrador` y un periodo de prueba activo. |
| **Flujo principal** | 1. El visitante hace click en "Registrar clinica" desde la pagina de login. 2. El sistema muestra un asistente de 3 pasos. 3. **Paso 1:** ingresa razon social, RUC (11 digitos), nombre comercial, correo de contacto. 4. **Paso 2:** ingresa nombre completo del administrador, correo y contrasena (min 8 caracteres con mayusculas, minusculas y numeros). 5. **Paso 3:** confirmacion. 6. El frontend envia `POST /api/clinicas/registrar`. 7. El backend valida unicidad del RUC y del correo del administrador. 8. El backend genera un slug publico unico para la clinica. 9. El backend crea la clinica y el usuario administrador en una sola transaccion. 10. El backend responde HTTP 201 con `{idClinica}`. 11. El frontend muestra mensaje de exito y redirige a login. |
| **Flujo alternativo A1** | 7a. El RUC ya existe. 7b. El backend responde HTTP 400 con `{mensaje: "Ya existe una clinica con ese RUC"}`. |
| **Flujo alternativo A2** | 7b. El correo del administrador ya existe. 7c. El backend responde HTTP 400 con `{mensaje: "El correo del administrador ya esta registrado"}`. |
| **Reglas de negocio** | - El RUC debe tener exactamente 11 digitos. - La contrasena se hashea con BCrypt antes de persistir. - El primer usuario de la clinica siempre es Administrador. |

## CU-03 — Gestionar pacientes

| Campo | Valor |
|---|---|
| **ID** | CU-03 |
| **Nombre** | Gestionar pacientes (CRUD) |
| **Actor principal** | Medico o Administrador con permiso `pacientes.{accion}` |
| **Precondiciones** | El usuario esta autenticado y tiene los permisos correspondientes. |
| **Postcondiciones** | El paciente queda creado, modificado o desactivado segun la accion. |
| **Flujo principal (crear)** | 1. El usuario navega a `/pacientes`. 2. El sistema muestra la lista actual con buscador. 3. El usuario hace click en **+ Nuevo Paciente**. 4. El sistema abre un modal con el formulario. 5. El usuario completa: nombre, apellido, tipo y numero de documento, fecha de nacimiento, sexo, telefono, correo, direccion. 6. El frontend valida en tiempo real (DNI 8 digitos, CE 9-12, Pasaporte alfanumerico 6-12, fecha no futura, contrasenas con mayuscula/minuscula/numero). 7. El usuario presiona **Registrar**. 8. El frontend envia `POST /api/pacientes` con JWT. 9. El backend valida con `@Valid`, asigna `idClinica` desde el token JWT (multi-tenant). 10. Spring Data JPA persiste el paciente. 11. El backend responde 201. 12. El modal se cierra y la lista se refresca. |
| **Flujo alternativo (editar)** | El usuario hace click en el icono lapiz, el modal carga datos actuales, modifica y envia `PUT /api/pacientes/{id}`. |
| **Flujo alternativo (desactivar)** | El usuario hace click en el icono basura, confirma, el frontend envia `DELETE /api/pacientes/{id}` que hace soft delete (marca `estaPacienteActivo = false`). |
| **Reglas de negocio** | - Cada paciente pertenece a una sola clinica (`idClinica` derivado del JWT). - El numero de documento es unico globalmente. - El delete es logico, no fisico. |

## CU-04 — Crear consulta con audio

| Campo | Valor |
|---|---|
| **ID** | CU-04 |
| **Nombre** | Crear consulta grabando audio |
| **Actor principal** | Medico |
| **Precondiciones** | El medico esta autenticado y existe al menos un paciente en la clinica. El navegador tiene permiso de microfono. |
| **Postcondiciones** | Se registra una nueva consulta en estado `Borrador` con la transcripcion y la nota clinica generada por IA. |
| **Flujo principal** | 1. El medico navega a `/consultas/nueva`. 2. El sistema muestra el formulario con buscador de pacientes. 3. El medico busca por DNI o nombre y selecciona el paciente. 4. El medico configura tipo de documento (SOAP/Historia Clinica/Receta) y especialidad. 5. (Opcional) Activa la separacion de voces (diarizacion) y elige motor (Pyannote o Deepgram). 6. El medico presiona el boton de microfono. 7. El navegador solicita permiso del microfono. 8. El sistema graba audio con MediaRecorder. 9. El medico presiona el boton de detener. 10. El sistema muestra duracion final y boton **Procesar con IA**. 11. Continua en CU-05. |
| **Flujo alternativo A1** | 7a. El navegador rechaza el permiso. 7b. El sistema muestra alerta de error y vuelve al estado inicial. |
| **Flujo alternativo A2** | El medico no selecciono paciente y trata de grabar. El sistema desplaza la vista al cuadro de paciente con borde amarillo y mensaje "Selecciona un paciente para continuar". |
| **Reglas de negocio** | - Sin paciente seleccionado, el microfono esta deshabilitado. - El audio se mantiene en memoria del navegador hasta que se procese o descarte. |

## CU-05 — Procesar audio con IA

| Campo | Valor |
|---|---|
| **ID** | CU-05 |
| **Nombre** | Procesar audio con cascade de IA |
| **Actor principal** | Medico (sistema automatico) |
| **Precondiciones** | Existe un blob de audio grabado en el navegador. |
| **Postcondiciones** | Se obtiene una transcripcion textual y una nota clinica estructurada en formato SOAP/Historia/Receta. |
| **Flujo principal** | 1. El medico presiona **Procesar con IA**. 2. El frontend envia el blob como `multipart/form-data` a `POST /api/ia/transcribir` (con o sin diarizacion segun configuracion). 3. El servicio Python ejecuta el cascade Whisper: intenta Groq → HuggingFace → Mistral → Deepgram hasta obtener una transcripcion no vacia. 4. El servicio devuelve `{transcripcion, diarizacion?}`. 5. El frontend valida que la transcripcion tenga al menos 10 caracteres. 6. El frontend envia `POST /api/ia/procesar` con `{transcripcion, especialidad, tipo_documento}`. 7. El servicio ejecuta el cascade LLM: Groq → SambaNova → Cerebras → ... hasta generar una nota completa. 8. El servicio inyecta los datos del paciente al inicio de la nota. 9. El servicio devuelve `{nota_clinica, clasificacion}`. 10. El frontend muestra transcripcion y nota lado a lado. 11. El frontend envia `POST /api/consultas/registrar` para persistir en MySQL. |
| **Flujo alternativo A1** | 3a. Todos los proveedores de transcripcion fallan. 3b. El servicio devuelve HTTP 502 con detalle del error. 3c. El frontend muestra alerta y vuelve al estado `detenido`. |
| **Flujo alternativo A2** | 5a. La transcripcion devuelve vacio (audio sin voz). 5b. El frontend muestra alerta "Habla mas fuerte y vuelve a grabar" y vuelve al estado `detenido`. |
| **Reglas de negocio** | - Si Pyannote falla por dependencias faltantes, el backend cae automaticamente a Deepgram. - El estado inicial de la consulta es `Borrador` para permitir revision antes de aprobar. |

## CU-06 — Aprobar consulta

| Campo | Valor |
|---|---|
| **ID** | CU-06 |
| **Nombre** | Aprobar consulta y documentos asociados |
| **Actor principal** | Medico con permiso `consultas.editar` |
| **Precondiciones** | Existe una consulta en estado `Borrador`. |
| **Postcondiciones** | La consulta y todos sus documentos pasan a estado `Aprobado`. |
| **Flujo principal** | 1. El medico abre el detalle de la consulta. 2. Revisa la nota clinica generada y, si lo desea, la edita. 3. Presiona **Aprobar Consulta**. 4. El frontend envia `PUT /api/consultas/{id}/aprobar`. 5. El backend, en una transaccion, actualiza el estado de la consulta a `Aprobado` y de todos los documentos asociados a `Aprobado`. 6. El backend responde 200. 7. El frontend muestra confirmacion y badge verde "Aprobado". |
| **Flujo alternativo A1** | El usuario presiona **Rechazar** en lugar de aprobar. El backend cambia estado a `Rechazado`. |
| **Reglas de negocio** | - Solo se pueden aprobar consultas en estado `Borrador`. - La aprobacion es atomica (transaccion JPA). |

## CU-07 — Descargar documento clinico

| Campo | Valor |
|---|---|
| **ID** | CU-07 |
| **Nombre** | Descargar documento clinico |
| **Actor principal** | Medico |
| **Precondiciones** | Existe una nota clinica generada (puede estar en cualquier estado). |
| **Postcondiciones** | El usuario obtiene un archivo PDF o Word con el formato configurado. |
| **Flujo principal** | 1. El medico presiona **Descargar PDF** o **Descargar Word**. 2. El frontend envia `POST /api/ia/generar-pdf` (o `generar-word`) con la nota y datos del paciente. 3. El servicio Python compone el documento usando ReportLab/python-docx con el formato seleccionado en configuracion (Clasico MINSA, Moderno Medico, Clinico Elegante o Compacto Funcional). 4. El servicio devuelve el archivo como `application/pdf` o `application/vnd.openxmlformats-...`. 5. El frontend dispara la descarga del navegador. |
| **Reglas de negocio** | - El logo y firma de la clinica/medico se incluyen si estan configurados. - Los formatos disponibles son los configurados en `/configuracion-documentos`. |

## CU-08 — Gestionar usuarios de la clinica

| Campo | Valor |
|---|---|
| **ID** | CU-08 |
| **Nombre** | Gestionar usuarios (CRUD + roles + permisos) |
| **Actor principal** | Administrador |
| **Precondiciones** | El usuario esta autenticado con rol Administrador. |
| **Postcondiciones** | El usuario destino queda creado, su rol modificado o sus permisos personalizados actualizados. |
| **Flujo principal** | 1. El administrador navega a `/usuarios-clinica`. 2. Ve la lista de usuarios con badges de rol y estado. 3. Para crear: presiona **+ Nuevo Usuario**, completa nombre/correo/contrasena/rol y envia `POST /api/usuarios-clinica`. 4. Para cambiar rol: presiona **Rol** en la fila, selecciona nuevo rol y envia `PUT /api/usuarios-clinica/{id}/cambiar-rol`. 5. Para personalizar permisos: presiona **Permisos**, ve matriz modulo x accion, marca/desmarca celdas y envia `PUT /api/usuarios-clinica/{id}/permisos`. |
| **Reglas de negocio** | - Solo Administradores pueden crear usuarios o cambiar roles (`@PreAuthorize("hasRole('Administrador')")`). - No se puede modificar los permisos de Usuarios y Roles del propio usuario logueado (proteccion contra autobloqueo). |

## CU-09 — Gestionar roles y permisos

| Campo | Valor |
|---|---|
| **ID** | CU-09 |
| **Nombre** | Crear, editar y desactivar roles |
| **Actor principal** | Administrador |
| **Precondiciones** | El usuario esta autenticado con rol Administrador. |
| **Postcondiciones** | El rol queda creado/editado/inactivo con su matriz de permisos JSON. |
| **Flujo principal** | 1. El administrador navega a `/roles`. 2. Ve tarjetas con los roles existentes (Administrador, Medico, Recepcionista + custom). 3. Para crear: presiona **+ Nuevo Rol**, ingresa nombre y descripcion, marca permisos en la tabla 6 modulos x 4 acciones (ver/crear/editar/eliminar), envia `POST /api/roles`. 4. Para editar: presiona **Editar** en la tarjeta. 5. Para desactivar: presiona el icono Power (solo en roles no base). |
| **Reglas de negocio** | - Los 3 roles base no se pueden eliminar. - Si se selecciona "crear" sobre un modulo, automaticamente se activa "ver". - Si se desmarca "ver", se desmarcan todos los demas (regla de coherencia). |

## CU-10 — Configurar formato de documentos

| Campo | Valor |
|---|---|
| **ID** | CU-10 |
| **Nombre** | Configurar datos clinica/medico/firma/formato |
| **Actor principal** | Administrador |
| **Precondiciones** | Usuario autenticado con permiso `configuracion.editar`. |
| **Postcondiciones** | La configuracion se guarda en el servicio IA y aplica a todos los documentos futuros. |
| **Flujo principal** | 1. Navega a `/configuracion-documentos`. 2. Edita nombre clinica, RUC, direccion, telefono, correo, datos del medico, formato. 3. Sube logo (PNG/JPG/SVG max 2MB). 4. Dibuja firma digital del medico y/o sello de clinica con canvas HTML5. 5. Selecciona formato (Clasico MINSA, Moderno Medico, Clinico Elegante, Compacto Funcional). 6. Visualiza preview en iframe con datos demo. 7. Presiona **Guardar Configuracion**. 8. El frontend envia `POST /api/ia/configuracion/guardar`. 9. El servicio persiste en `config_documentos.json`. |
| **Reglas de negocio** | - El logo se valida por extension y tamano antes de subir. - La firma se almacena como base64 PNG. |
