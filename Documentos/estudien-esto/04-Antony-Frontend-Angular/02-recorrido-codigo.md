# 02. Recorrido por el codigo del frontend

Esta es la guia para que Antony pueda abrir cualquier carpeta de `cliente-web/src/app/` y explicar que hace cada archivo. Sigue el orden en que un nuevo desarrollador deberia leer el proyecto.

---

## Estructura general de `cliente-web/`

```
cliente-web/
├── src/
│   ├── app/
│   │   ├── componentes/        # Componentes reutilizables (modal, cargando, editor, etc.)
│   │   ├── plantillas/         # Layouts (publico para login, autenticado para panel)
│   │   ├── paginas/            # Una carpeta por cada pagina (12 paginas)
│   │   ├── servicios/          # Servicios HTTP (uno por entidad: paciente, medico, etc.)
│   │   ├── modelos/            # Interfaces TypeScript (Paciente, Consulta, etc.)
│   │   ├── guardianes/         # Guards de rutas (authGuard, soloAdminGuard)
│   │   ├── interceptores/      # auth.interceptor.ts (agrega JWT)
│   │   ├── utilidades/         # validaciones, formato-fecha, formato-numero
│   │   ├── app.component.ts    # Componente raiz
│   │   ├── app.config.ts       # Bootstrap, providers
│   │   └── app.routes.ts       # Definicion de las 13 rutas
│   ├── styles.css              # Tailwind + estilos globales
│   ├── index.html
│   └── main.ts                 # Entry point
├── tailwind.config.js          # Paleta medico-* y exito/error/advertencia
├── angular.json                # Configuracion del CLI
└── package.json                # Dependencias (Angular 17, Tailwind, Lucide, RxJS)
```

---

## 1. Entry point: `main.ts` y `app.config.ts`

### `main.ts`
```typescript
import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';

bootstrapApplication(AppComponent, appConfig);
```

Solo arranca la app. **No usa `AppModule`** porque trabajamos con standalone components.

### `app.config.ts`
Aqui se registran los providers globales:
```typescript
export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor])),
    provideAnimations(),
    importProvidersFrom(LucideAngularModule.pick({...iconos}))
  ]
};
```

**Lo importante:** `withInterceptors([authInterceptor])` activa el interceptor que agrega el JWT a cada peticion.

---

## 2. Rutas: `app.routes.ts`

13 rutas en total, todas con **lazy loading**:

```typescript
export const routes: Routes = [
  // Publicas
  { path: 'iniciar-sesion', loadComponent: () => import('./paginas/iniciar-sesion/...') },
  { path: 'registrar-clinica', loadComponent: () => import('./paginas/registrar-clinica/...') },

  // Privadas (requieren authGuard)
  { path: '', component: PlantillaAutenticadaComponent, canActivate: [authGuard],
    children: [
      { path: 'panel', loadComponent: () => import('./paginas/panel/...') },
      { path: 'pacientes', loadComponent: () => import('./paginas/pacientes/...') },
      { path: 'consultas', loadComponent: () => import('./paginas/consultas/...') },
      { path: 'nueva-consulta', loadComponent: () => import('./paginas/nueva-consulta/...') },
      // ... medicos, usuarios, roles, perfil-clinica, etc.
    ]
  },
  { path: '**', redirectTo: '/panel' }  // Cualquier ruta desconocida -> panel
];
```

**Bug que arreglamos**: al inicio habia dos `path: ''` ambiguos y la pantalla salia en blanco. Lo solucionamos haciendo que la raiz redirija segun si esta autenticado o no.

---

## 3. Servicios HTTP: `servicios/`

Un archivo por entidad. Patron repetido:

### `paciente.service.ts`
```typescript
@Injectable({ providedIn: 'root' })
export class PacienteService {
  private http = inject(HttpClient);
  private url = `${environment.apiUrl}/pacientes`;

  listar(): Observable<Paciente[]> {
    return this.http.get<Paciente[]>(this.url);
  }

  crear(p: PacientePeticion): Observable<Paciente> {
    return this.http.post<Paciente>(this.url, p);
  }

  actualizar(id: number, p: PacientePeticion): Observable<Paciente> {
    return this.http.put<Paciente>(`${this.url}/${id}`, p);
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }
}
```

**Cumple los 4 metodos HTTP de la rubrica.** Mismo patron en `medico.service.ts`, `consulta.service.ts`, `rol.service.ts`, `usuario-clinica.service.ts`, `clinica.service.ts`, `documento.service.ts`.

### `autenticacion.service.ts` (el mas importante)
```typescript
@Injectable({ providedIn: 'root' })
export class AutenticacionService {
  private usuarioSignal = signal<Usuario | null>(null);
  readonly usuario = this.usuarioSignal.asReadonly();
  readonly estaAutenticado = computed(() => this.usuario() !== null);
  readonly esAdmin = computed(() => this.usuario()?.rolDelSistema === 'Administrador');
  readonly permisos = computed(() => this.usuario()?.permisosDelRol ?? []);

  iniciarSesion(correo: string, contrasenia: string) {
    return this.http.post<RespuestaAutenticacion>(`${url}/iniciar-sesion`, {correo, contrasenia})
      .pipe(tap(r => {
        localStorage.setItem('token', r.token);
        this.usuarioSignal.set(r.usuario);
      }));
  }

  cerrarSesion() {
    localStorage.removeItem('token');
    this.usuarioSignal.set(null);
    this.router.navigate(['/iniciar-sesion']);
  }
}
```

Usa **signals** para que cualquier componente que lea `autenticacion.usuario()` se re-renderice automaticamente cuando cambia.

---

## 4. Interceptor: `interceptores/auth.interceptor.ts`

```typescript
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem('token');
  if (token) {
    const peticion = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` }
    });
    return next(peticion);
  }
  return next(req);
};
```

**Lo magico:** ningun servicio HTTP se preocupa por agregar el header. El interceptor lo hace para todas las peticiones.

---

## 5. Guardianes: `guardianes/`

### `auth.guard.ts`
```typescript
export const authGuard: CanActivateFn = () => {
  const auth = inject(AutenticacionService);
  const router = inject(Router);
  if (auth.estaAutenticado()) return true;
  router.navigate(['/iniciar-sesion']);
  return false;
};
```

### `solo-admin.guard.ts`
```typescript
export const soloAdminGuard: CanActivateFn = () => {
  const auth = inject(AutenticacionService);
  if (auth.esAdmin()) return true;
  return false;
};
```

Se usa en rutas como `/usuarios` y `/roles` para que solo administradores puedan entrar.

---

## 6. Componentes reutilizables: `componentes/`

| Componente | Uso |
|---|---|
| `cargando.component.ts` | Spinner centrado, se muestra mientras carga datos. |
| `modal.component.ts` | Modal generico con header + slot para contenido + acciones. |
| `modal-firma-digital.component.ts` | Canvas para firmar con mouse/dedo. Devuelve base64 del PNG. |
| `editor-nota-clinica.component.ts` | Editor de las 7 secciones SOAP, con [(ngModel)] por seccion. |

---

## 7. Plantillas: `plantillas/`

### `plantilla-publico.component.ts`
Layout para login y registro: solo el logo y el `<router-outlet>` centrado.

### `plantilla-autenticado.component.ts`
Layout principal:
- Sidebar a la izquierda con menu (links generados dinamicamente segun permisos del usuario).
- Header arriba con nombre del usuario, clinica, boton de cerrar sesion.
- `<router-outlet>` en el centro para mostrar la pagina activa.

```html
<aside>
  <a routerLink="/panel">Panel</a>
  <a routerLink="/pacientes" *ngIf="puedeVer('pacientes')">Pacientes</a>
  <a routerLink="/consultas">Consultas</a>
  <a routerLink="/usuarios" *ngIf="esAdmin()">Usuarios</a>
</aside>
<main><router-outlet /></main>
```

---

## 8. Paginas: `paginas/`

### Paginas con CRUD (patron repetido)
- `pacientes/`, `medicos/`, `roles/`, `usuarios-clinica/`, `consultas/`

Cada una tiene:
1. Tabla con la lista (HTML con `*ngFor`).
2. Botones "Editar" / "Eliminar" / "Activar/Desactivar".
3. Modal para crear/editar con `[(ngModel)]`.
4. Validaciones inline (required, minlength, custom).

### `pagina-iniciar-sesion.component.ts`
Form con dos inputs (correo, contrasenia), llama `autenticacion.iniciarSesion(...)`, redirige a `/panel`.

### `pagina-registrar-clinica.component.ts`
Form de 3 pasos (datos clinica, datos admin, confirmacion), llama al endpoint POST `/api/clinicas/registrar`.

### `pagina-nueva-consulta.component.ts` (la mas compleja)
**Esta es la pagina estrella. Hace:**
1. Muestra dropdown de pacientes para elegir.
2. Boton "Iniciar grabacion" -> usa `MediaRecorder` API del navegador.
3. Boton "Detener" -> envia el blob al backend `/transcribir`.
4. Muestra la transcripcion (con diarizacion si esta activada).
5. Boton "Procesar con IA" -> envia transcripcion al backend `/generar-nota`.
6. Muestra la nota SOAP en el `editor-nota-clinica`.
7. Boton "Firmar" -> abre `modal-firma-digital`.
8. Boton "Generar PDF" / "Generar Word" -> descarga el documento.

**Bugs que arreglamos:**
- El boton "Detener" recargaba la pagina porque era `<button>` sin `type="button"` (default es submit). Fix: agregar `type="button"`.
- Audio chunks vacios. Fix: cambiar `mediaRecorder.start()` por `mediaRecorder.start(1000)` para chunks cada 1 segundo + llamar `requestData()` antes de detener.
- Scroll automatico a la transcripcion cuando llega.

### `pagina-panel.component.ts`
Dashboard con tarjetas: total pacientes, consultas del mes, etc. Usa `forkJoin` para llamar varios endpoints en paralelo.

---

## 9. Modelos: `modelos/`

Interfaces TypeScript que reflejan los DTOs del backend.

```typescript
export interface Paciente {
  idPaciente: number;
  nombreDelPaciente: string;
  apellidosDelPaciente: string;
  numeroDocumentoIdentidad: string;
  fechaDeNacimiento: string;
  estaPacienteActivo: boolean;
  // ...
}

export interface Consulta {
  idConsulta: number;
  fechaDeAtencion: string;
  motivoDeConsulta: string;
  notaClinicaEstructurada: string;  // JSON con secciones SOAP
  estaFirmada: boolean;
  // ...
}
```

---

## 10. Utilidades: `utilidades/`

### `validaciones.ts`
Funciones puras para validar formularios:
```typescript
export function esCorreoValido(correo: string): boolean { ... }
export function esDniValido(dni: string): boolean { return /^\d{8}$/.test(dni); }
export function esRucValido(ruc: string): boolean { return /^(10|20)\d{9}$/.test(ruc); }
```

### `formato-fecha.ts`
```typescript
export function formatearFecha(fecha: string): string {
  return new Date(fecha).toLocaleDateString('es-PE', {...});
}
```

---

## 11. Estilos: `styles.css` y Tailwind

`styles.css` solo tiene:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

/* Algunos overrides minimos */
body { font-family: 'Inter', sans-serif; }
```

Todo el resto del estilo es **clases Tailwind directamente en los templates HTML**.

---

## Como recorrer el codigo si te toca preguntar

1. Si te preguntan **"como funciona el login"** -> abre `pagina-iniciar-sesion.component.ts` -> `autenticacion.service.ts` -> `auth.interceptor.ts`.
2. Si te preguntan **"como se protegen las rutas"** -> `app.routes.ts` -> `auth.guard.ts` -> `solo-admin.guard.ts`.
3. Si te preguntan **"como hace una grabacion"** -> `pagina-nueva-consulta.component.ts` (metodo `alternarGrabacion`).
4. Si te preguntan **"como se ve el menu segun el rol"** -> `plantilla-autenticado.component.ts` (`*ngIf="puedeVer(...)"`).
5. Si te preguntan **"donde estan los estilos"** -> "no hay CSS escrito a mano, usamos Tailwind directamente en los templates".
