# Guia de estudio — Antony Lucas Murillo Aramburu

**Codigo:** i201916515
**Tema:** Frontend en Angular 17 (standalone components + signals + lazy loading)
**Carpeta del codigo:** `cliente-web/`

---

## Tu mision en la presentacion

Vas a explicar **el frontend**: la cara visible del sistema. Eres el **primer integrante** que habla en la sustentacion porque tu parte es la que el profesor "ve" mientras los demas explican lo de atras. Tu mision: dejar al profesor convencido de que el frontend es **profesional, completo y consume correctamente los servicios REST del backend**.

Tu parte es **clave para la rubrica DAW** (6 puntos por "Crea aplicacion angular que consume todos los servicios Rest").

## Tu tiempo en la sustentacion

Aproximadamente **5 minutos** dentro de los 20 totales del equipo. **Hablas primero**, despues vienes Cesar (backend), Brayan (BD) y Roberto (IA).

## Orden de lectura

| Archivo | Que aprenderas | Tiempo |
|---|---|---|
| `01-fundamentos.md` | Angular 17, standalone, signals, RxJS, Tailwind, en lenguaje simple | 15 min |
| `02-recorrido-codigo.md` | Cada carpeta y archivo importante explicado | 15 min |
| `03-arquitectura-general.md` | Patrones del frontend: lazy loading, interceptor JWT, layouts | 15 min |
| `04-preguntas-y-respuestas.md` | Lo que el profesor puede preguntarte y como responder | 15 min |
| `05-guion-presentacion.md` | Tu guion minuto a minuto | 10 min |

## Tu mensaje principal

> "El frontend Angular 17 implementa **12 paginas** con **componentes standalone** y **lazy loading por ruta**. Consume **todos los endpoints REST del backend** mediante 7 servicios HTTP que usan `HttpClient`, con un **interceptor que adjunta el JWT automaticamente** a cada peticion. El estilo es responsive con **Tailwind CSS** y la paleta `medico-*` propia del proyecto."

## Tu archivo clave en la demo

- **El navegador con la aplicacion corriendo en `http://localhost:3000`** — tu mejor demo es la app misma funcionando.
- **`cliente-web/src/app/app.routes.ts`** — define las 13 rutas con lazy loading.
- **`cliente-web/src/app/interceptores/auth.interceptor.ts`** — el interceptor JWT.
- **`cliente-web/src/app/servicios/paciente.service.ts`** — ejemplo de servicio REST.

## Lo que el profesor querra ver (rubrica DAW)

1. **Crear aplicacion angular** ✅ (Angular 17 standalone).
2. **Consume servicios Rest** ✅ (7 services con HttpClient).
3. **Los 4 metodos HTTP** ✅ (GET para listar, POST para crear, PUT para editar, DELETE para borrar).
4. **Persistencia evidente** ✅ (al crear/editar/borrar, los cambios persisten en MySQL via el backend).

## Lo que NO debes hacer

- No expliques en detalle la BD (eso es de Brayan).
- No expliques la logica del backend Java (eso es de Cesar).
- No expliques como funciona la IA (eso es de Roberto).
- No leas codigo en pantalla. **Tu fuerte es la demo visual.**

## Demo recomendada (3 minutos)

Tu demo es la mas visual del equipo. Sigue esta secuencia:

1. **Abre `http://localhost:3000`** y muestra el login con animaciones del fondo azul.
2. **Loguea como admin** (admin@medscribe.pe / Admin2026!) — el JWT se guarda automaticamente.
3. **Recorre las paginas**:
   - Panel: muestra estadisticas
   - Pacientes: muestra lista y crea uno nuevo (POST)
   - Consultas: muestra tarjetas con filtros
   - Roles: tabla de permisos
4. **Resalta el responsive** abriendo DevTools y cambiando a vista mobile.
5. Si tienes tiempo, abre **Network** y muestra como cada accion dispara una peticion HTTP con `Authorization: Bearer ...`.
