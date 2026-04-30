# 04. Preguntas y respuestas (lo que te puede preguntar el profesor)

Estas son las preguntas mas probables que te haran como encargado del frontend. Cada respuesta esta pensada para que la digas en 30-60 segundos sin trabarte.

---

## Bloque 1: Angular y por que lo elegimos

### P1. ¿Por que Angular y no React o Vue?
Angular nos dio tres ventajas: **uno**, TypeScript es obligatorio, asi que el codigo es mas seguro desde el inicio. **Dos**, la arquitectura es opinada: Angular nos dice como organizar componentes, servicios, rutas, asi que no perdemos tiempo decidiendo estructura. **Tres**, el ecosistema es maduro: Angular CLI, Material, RxJS, todo viene integrado. Ademas, la rubrica permite cualquier framework SPA y Angular es el estandar academico en Cibertec.

### P2. ¿Que version de Angular usaste?
**Angular 17**, que es la version LTS al momento del desarrollo. Lo importante de la 17 es que los componentes son **standalone por defecto** (sin NgModule), tiene **signals** como nuevo sistema reactivo, y soporta **lazy loading con `loadComponent`** sin tener que crear modulos.

### P3. ¿Que es un componente standalone?
Es un componente que **se importa directamente donde se usa**, sin necesidad de declararlo en un NgModule. Hasta Angular 13 todo componente debia estar en un modulo, lo cual era boilerplate molesto. Con standalone, en cada componente declaras sus propios `imports: [CommonModule, FormsModule, ...]` y listo. Es mas claro y permite mejor tree-shaking.

---

## Bloque 2: Estado y reactividad

### P4. ¿Que son los signals y para que los usaste?
Signals son el **nuevo sistema reactivo de Angular** introducido en la version 16. Son una alternativa moderna a `BehaviorSubject` de RxJS para estado simple. Los uso en el `AutenticacionService` para guardar el usuario logueado: `private usuarioSignal = signal<Usuario | null>(null)`. Cualquier componente que llame `auth.usuario()` se re-renderiza automaticamente cuando cambia el valor. Tambien uso **computed signals** para derivar `esAdmin` y `permisos` del usuario.

### P5. ¿Por que no usaste NgRx o un store global?
Porque para una app del tamano de MedScribe seria sobre-ingenieria. NgRx tiene mucha ceremonia: actions, reducers, effects, selectors. Para nuestro caso, un signal en el `AutenticacionService` cubre el unico estado verdaderamente global que es el usuario. El resto del estado vive en cada componente con `[(ngModel)]` o signals locales. Si la app creciera 10 veces, evaluariamos un Signal Store.

---

## Bloque 3: Performance y carga

### P6. ¿Que es lazy loading y por que lo usaste?
Lazy loading significa **cargar el codigo de cada pagina solo cuando el usuario accede a ella**. Sin lazy loading, el navegador descarga toda la app al inicio, son 500 KB. Con lazy loading, descarga primero el login (98 KB) y cuando el usuario hace click en "Pacientes" descarga ese chunk. Lo configuramos en `app.routes.ts` con `loadComponent: () => import('...')`. **Las 13 rutas usan lazy loading.**

### P7. ¿Que es tree-shaking?
Es la tecnica de **eliminar codigo no usado del bundle final**. Angular CLI con webpack analiza que clases, funciones e iconos efectivamente se importan y descarta el resto. Por eso los componentes standalone son mejor que NgModule: con imports explicitos por componente, el tree-shaking es mas preciso.

---

## Bloque 4: Comunicacion HTTP

### P8. ¿Como hace el frontend las peticiones HTTP?
Con el servicio `HttpClient` de Angular. Cada entidad tiene su servicio: `PacienteService`, `MedicoService`, etc. Cada servicio implementa los **4 metodos: GET, POST, PUT, DELETE**. Inyectamos `HttpClient` con `inject(HttpClient)` y devolvemos `Observable`s que el componente se suscribe.

### P9. ¿Como envias el JWT en cada peticion?
Con un **interceptor**. En vez de agregar el header `Authorization: Bearer ...` en cada llamada, defini `auth.interceptor.ts` que se ejecuta antes de cada peticion HTTP, lee el token de `localStorage`, clona la peticion agregando el header y la deja seguir. **Cero codigo duplicado en los servicios.**

### P10. ¿Donde guardas el token JWT?
En `localStorage`. Es lo mas simple y permite que el token persista entre recargas de pagina. La alternativa seria una cookie HttpOnly, mas segura contra XSS, pero requiere coordinacion con el backend para CSRF y para el caso academico `localStorage` es estandar y aceptado.

---

## Bloque 5: Estilos y UX

### P11. ¿Por que Tailwind y no Bootstrap o Material?
Tailwind nos da **clases utilitarias** que componemos en el HTML directamente. Tres ventajas: **uno**, cero CSS escrito a mano para 95% de los casos. **Dos**, consistencia: defini la paleta `medico-*` en `tailwind.config.js` y se usa en todo el proyecto, asi cualquier componente usa los mismos azules. **Tres**, tree-shaking: en build solo se incluyen las clases efectivamente usadas, asi que el CSS final pesa menos de 20 KB.

### P12. ¿Como hiciste responsive?
Tailwind tiene prefijos por breakpoint: `sm:`, `md:`, `lg:`, `xl:`. Por ejemplo, `grid-cols-1 lg:grid-cols-3` significa una columna en mobile y tres en desktop. La sidebar se colapsa en mobile con un boton hamburguesa.

---

## Bloque 6: Seguridad

### P13. ¿Como proteges las rutas que requieren login?
Con un **guard**: `auth.guard.ts`. Es una funcion `CanActivateFn` que se ejecuta antes de activar la ruta. Lee `auth.estaAutenticado()` y si es `false` redirige a `/iniciar-sesion`. Lo aplico en `app.routes.ts` con `canActivate: [authGuard]` en el contenedor de rutas privadas.

### P14. ¿Y como restringes que solo administradores vean ciertas paginas?
Con otro guard: `solo-admin.guard.ts`. Verifica `auth.esAdmin()` (un computed signal). Lo aplico en las rutas `/usuarios` y `/roles`.

### P15. ¿Como evitas que un usuario vea pacientes de otra clinica?
**El frontend no envia `idClinica` en ninguna peticion.** El backend lo extrae del JWT (que esta firmado y no se puede falsear) y filtra todas las queries con `WHERE IdClinica = ?`. Si yo, como atacante, modificara el JS del frontend para mandar otro `idClinica`, el backend lo ignoraria porque solo confia en el del token.

---

## Bloque 7: Funcionalidad estrella (nueva consulta)

### P16. ¿Como graba audio el navegador?
Uso la **MediaRecorder API** que es estandar HTML5. Pido permiso del microfono con `navigator.mediaDevices.getUserMedia({audio: true})`, creo un `MediaRecorder`, llamo `start(1000)` para que genere chunks cada segundo, y al detener llamo `requestData()` antes de `stop()` para asegurar que el ultimo chunk se vacie. Luego junto los chunks en un Blob y lo envio al backend.

### P17. ¿Que es la diarizacion?
Es **identificar quien habla en cada momento** del audio. En MedScribe lo usamos para distinguir Doctor de Paciente en la consulta. El usuario puede activar un toggle "Diarizar" y el backend usa Pyannote o Deepgram para devolver el texto etiquetado por hablante.

### P18. ¿Que pasa si la transcripcion falla?
El backend tiene una **cascade**: prueba Groq, si falla pasa a HuggingFace, si falla pasa a Mistral, si falla pasa a Deepgram. Solo si **los cuatro fallan** devuelve un error 500. El frontend muestra ese error en un alert para que el usuario reintente.

---

## Bloque 8: Trampas comunes (preguntas dificiles)

### P19. ¿Que pasa si el JWT expira mientras el usuario navega?
El backend devuelve 401. El interceptor podria capturarlo y redirigir a login, pero hoy no lo implementamos: el usuario ve un error y debe re-loguearse. Es una mejora futura agregar un interceptor de respuesta que haga `auth.cerrarSesion()` automaticamente en 401.

### P20. ¿Por que Template-driven forms y no Reactive?
Para nuestros formularios (login, paciente, medico) que tienen 5-10 campos, template-driven con `[(ngModel)]` es mas simple. Reactive forms con `FormGroup` y `Validators` brillan en formularios grandes y dinamicos, no es nuestro caso.

### P21. ¿Como manejaste el bug del boton "Detener" que recargaba la pagina?
El problema era que `<button>` dentro de un `<form>` tiene `type="submit"` por defecto, y al apretarlo se enviaba el form recargando la pagina. Lo arregle agregando `type="button"` explicito y haciendo el handler `alternarGrabacion($event)` con `$event.preventDefault()`.

### P22. ¿Y el bug de los audio chunks vacios?
`MediaRecorder.start()` sin argumentos solo emite un chunk cuando llamas `stop()`, pero a veces ese chunk venia vacio. Lo arregle con `start(1000)` para emitir cada segundo, y llamando `requestData()` antes de `stop()` para forzar el flush del ultimo chunk.

---

## Bloque 9: Si te preguntan por temas que no son tuyos

### P23. ¿Como funciona el backend?
"Es Java Spring Boot. Cesar es el experto en eso. Yo se que el frontend lo llama por HTTP a `http://localhost:8080/api/...` con JWT en el header."

### P24. ¿Como esta la base de datos?
"MySQL con 14 tablas y multi-tenant por `IdClinica`. Brayan es el encargado del modelo. Yo solo se que cada peticion del frontend dispara queries filtradas por la clinica del usuario."

### P25. ¿Como funciona la IA?
"FastAPI en Python que llama a Whisper para transcribir y a un LLM para generar la nota SOAP. Roberto es el encargado. Desde el frontend solo veo dos endpoints: `/transcribir` y `/generar-nota`."

---

## Tip final

Si te trabas con una pregunta tecnica, **siempre puedes responder**: "Eso lo manejo el backend, en el frontend solo recibo la respuesta y la muestro." Es honesto y delimita tu responsabilidad. **No inventes**.
