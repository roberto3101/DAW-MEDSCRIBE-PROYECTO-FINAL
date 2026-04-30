# 05. Guion de presentacion (lo que vas a decir)

Tu turno como encargado del Frontend Angular dura aproximadamente **5-7 minutos**. Este guion es para que sepas exacto que decir en cada momento. **Memoriza la estructura**, no las palabras.

---

## Apertura (30 segundos)

> "Buenas tardes profesor. Soy Antony Murillo y voy a presentar la parte del frontend de MedScribe AI.
>
> El frontend es una **Single Page Application desarrollada en Angular 17**, que se comunica con dos backends por HTTP: el gateway en Java Spring Boot y el servicio de IA en Python FastAPI.
>
> Voy a cubrir cuatro puntos: la arquitectura del frontend, los componentes y rutas, el manejo de estado con signals, y la funcionalidad estrella que es la grabacion y procesamiento de consultas medicas."

---

## Punto 1: Arquitectura del frontend (1.5 minutos)

> "Empezando por la arquitectura.
>
> El frontend esta organizado en **siete carpetas** dentro de `src/app/`:
> - `paginas/` con las 12 paginas de la aplicacion,
> - `componentes/` con piezas reutilizables como modales y spinners,
> - `plantillas/` con los dos layouts (publico para login, autenticado para el panel),
> - `servicios/` con un servicio HTTP por cada entidad (paciente, medico, consulta, etc.),
> - `modelos/` con las interfaces TypeScript que reflejan los DTOs del backend,
> - `guardianes/` con los guards que protegen las rutas,
> - e `interceptores/` donde vive el interceptor que agrega el JWT a cada peticion.
>
> Esta separacion responde al principio de **una carpeta = una responsabilidad**.
>
> Tres decisiones arquitectonicas importantes: **uno**, todos los componentes son **standalone**, sin NgModules, lo cual reduce el boilerplate y mejora el tree-shaking. **Dos**, todas las 13 rutas usan **lazy loading**, asi el bundle inicial baja de 500 KB a solo 98 KB. **Tres**, el manejo de estado es con **signals nativos de Angular**, no con NgRx, porque la app no justifica esa complejidad."

---

## Punto 2: Comunicacion HTTP y seguridad (1.5 minutos)

> "El frontend se comunica con el backend a traves de **HttpClient**.
>
> Cada entidad tiene su servicio. Por ejemplo, `PacienteService` implementa los cuatro metodos HTTP que pide la rubrica: GET para listar, POST para crear, PUT para actualizar y DELETE para eliminar. **Esto se replica en consultas, medicos, roles y usuarios.**
>
> La parte interesante es **como agregamos el token JWT**. En vez de manualmente meter el header `Authorization: Bearer ...` en cada peticion, definimos un **interceptor** que lo hace automaticamente. El interceptor lee el token de `localStorage`, clona la peticion agregando el header y la deja seguir. Cero codigo duplicado.
>
> Para la **seguridad de rutas**, uso dos guards. El `authGuard` verifica que el usuario este logueado, sino redirige a `/iniciar-sesion`. El `soloAdminGuard` verifica que el rol sea Administrador, y se aplica a las rutas de gestion de usuarios y roles.
>
> Importante: el frontend **nunca envia el `idClinica` al backend**. Eso lo extrae el backend del JWT firmado, asi que un atacante no puede modificarlo desde el navegador para ver pacientes de otra clinica."

---

## Punto 3: Estado reactivo con signals (1 minuto)

> "Para el estado del usuario logueado uso **signals**, que son la nueva forma reactiva de Angular 17.
>
> En el `AutenticacionService` tengo:
> - Un `signal` privado con el usuario,
> - Un `computed signal` para `esAdmin`,
> - Otro `computed signal` para los permisos del rol.
>
> Cualquier componente que llame `auth.usuario()` o `auth.esAdmin()` **se re-renderiza automaticamente** cuando el valor cambia. Por ejemplo, el sidebar muestra u oculta menus segun los permisos del usuario, todo reactivo.
>
> Si tuviera que comparar con la alternativa: con RxJS necesitaria `BehaviorSubject` mas `async pipe` mas `subscribe`/`unsubscribe`. Con signals es una sola linea: `auth.usuario()`. Mas directo y mas eficiente en change detection."

---

## Punto 4: Funcionalidad estrella - nueva consulta (1.5 minutos)

> "La pagina mas compleja del frontend es **`/nueva-consulta`**, donde el medico graba la conversacion y la IA genera la nota clinica.
>
> El flujo es: el medico selecciona un paciente, presiona **Iniciar grabacion**, el navegador pide permiso del microfono y arranca la **MediaRecorder API** con chunks cada segundo. Cuando el medico presiona **Detener**, junto los chunks en un Blob, lo envio al endpoint `/transcribir` del servicio IA, y muestro el texto.
>
> Si el medico activo el toggle de **diarizacion**, el texto viene etiquetado por hablante: 'Doctor:', 'Paciente:'. Esto lo procesa Pyannote o Deepgram en el backend.
>
> Despues, el medico presiona **Procesar con IA** y mando la transcripcion a `/generar-nota`. El backend usa el cascade de LLMs y devuelve un JSON con las **siete secciones SOAP**: subjetivo, objetivo, evaluacion, plan, antecedentes, examen fisico y diagnostico.
>
> Eso lo cargo en el editor donde el medico puede revisar y corregir, despues firmar con un canvas digital, y finalmente generar el PDF o el Word.
>
> Tuvimos dos bugs interesantes en esta pagina: el boton 'Detener' recargaba la pagina porque era un button dentro de un form sin `type='button'` explicito, y los chunks de audio venian vacios porque `start()` sin argumentos solo emite un chunk al final. Los dos los arreglamos."

---

## Cierre (30 segundos)

> "En resumen: el frontend de MedScribe es una SPA en Angular 17 con standalone components, lazy loading en todas las rutas, signals para estado reactivo, Tailwind para estilos consistentes, y un interceptor JWT que centraliza la autenticacion.
>
> La arquitectura escala sin problemas para triplicar el alcance del proyecto y nos permite, como equipo de cuatro, trabajar en paralelo sin pisarnos.
>
> Gracias, quedo atento a sus preguntas."

---

## Reglas para no trabarte

1. **Habla pausado.** Mejor 6 minutos claros que 4 minutos atropellados.
2. **Usa los dedos** al enumerar (uno, dos, tres). Te ayuda a no perder el hilo.
3. **Si te equivocas en una palabra, sigue.** Nadie nota los pequenos errores si la idea esta clara.
4. **Nunca digas "no se".** Di: "esa es una buena pregunta, eso lo maneja [Cesar/Brayan/Roberto] y puede explicarlo mejor."
5. **Cuando demuestres en pantalla**, primero anuncia que vas a hacer: "Voy a mostrar la pagina de pacientes para que vean los cuatro metodos HTTP en accion."
6. **Mira al profesor**, no solo a la pantalla.

---

## Cosas que SI debes mostrar en la demo

- [ ] Login con un usuario admin (debe redirigir al panel).
- [ ] Sidebar con todas las opciones de menu.
- [ ] Crear un paciente (POST), editarlo (PUT), eliminarlo (DELETE), ver la lista (GET).
- [ ] Ir a Nueva Consulta, grabar 30 segundos de audio, procesar con IA.
- [ ] Mostrar la nota SOAP generada.
- [ ] Firmar y generar PDF.
- [ ] Cerrar sesion.

---

## Cosas que NO debes hacer

- No abrir el codigo durante la demo a menos que te pregunten especifico. Enfocate en la UI.
- No improvises sobre el backend o la BD. Delegale a tus companeros.
- No te disculpes por bugs antiguos. Si funciona, funciona.
- No leas literalmente este guion. Usa la estructura, las palabras salen solas.

---

## Frase magica para cerrar preguntas dificiles

> "Es una excelente pregunta. En el frontend lo abordo asi: [respuesta corta]. La parte del backend la puede complementar [Cesar/Brayan/Roberto]."

Asi quedas siempre profesional y no te exiges saber todo.

**Mucha suerte. Lo tienes dominado.**
