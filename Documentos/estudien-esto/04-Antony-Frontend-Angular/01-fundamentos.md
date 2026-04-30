# 01. Fundamentos que debes dominar

---

## 1. ¿Que es Angular?

**Angular es el framework de Google para construir aplicaciones web SPA** (Single Page Applications). Esta basado en TypeScript y es uno de los tres frameworks dominantes (junto con React y Vue).

### Por que Angular y no otro
- **La rubrica del curso lo exige** (DAW = Desarrollo de Aplicaciones Web I).
- Es el framework con **arquitectura mas opinada**: te dice como organizar tu codigo, lo que es bueno para equipos.
- **TypeScript de primera clase**: no opcional como en React.
- **Ecosistema maduro**: Angular CLI, Angular Material, RxJS, todo integrado.
- Empresas como Google, Microsoft, Forbes, Deutsche Bank lo usan en produccion.

### La diferencia clave: SPA vs MPA
- **MPA (Multi-Page App)**: cada click recarga la pagina entera desde el servidor. Ejemplo: WordPress.
- **SPA (Single-Page App)**: la pagina se carga una sola vez, y el JavaScript decide que mostrar segun la URL. Mucho mas fluido. Ejemplo: Gmail, Trello, MedScribe.

---

## 2. ¿Que es un componente standalone?

Hasta Angular 13, todo componente debia declararse en un `NgModule`. Era boilerplate molesto.

**Desde Angular 17, los componentes son standalone por defecto**: se importan directamente donde se usan, sin necesidad de modulos.

### Sin standalone (Angular antiguo)
```typescript
// app.module.ts
@NgModule({
  declarations: [LoginComponent, DashboardComponent, ...],
  imports: [CommonModule, FormsModule, RouterModule, ...],
  bootstrap: [AppComponent]
})
export class AppModule { }
```

### Con standalone (Angular 17, lo que usamos)
```typescript
// pagina-inicio-sesion.component.ts
@Component({
  selector: 'app-pagina-inicio-sesion',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, LucideAngularModule],
  template: `<form>...</form>`
})
export class PaginaInicioSesionComponent {
  // ...
}
```

**Ventajas:**
- Menos boilerplate.
- Mejor tree-shaking (Angular elimina codigo no usado).
- Importes explicitos: ves de un vistazo de que depende cada componente.

---

## 3. ¿Que son los signals?

**Signals son el nuevo sistema de estado reactivo de Angular** (introducido en v16, mejorado en v17). Son una alternativa moderna a `BehaviorSubject` de RxJS para estado simple.

### Sin signals (RxJS)
```typescript
private usuarioSubject = new BehaviorSubject<Usuario | null>(null);
usuario$ = this.usuarioSubject.asObservable();

// En el componente
ngOnInit() {
  this.usuario$.subscribe(u => this.usuario = u);
}

// En el template
<p>{{ (usuario$ | async)?.nombreCompleto }}</p>
```

### Con signals (mas directo)
```typescript
private usuarioSignal = signal<Usuario | null>(null);
readonly usuario = this.usuarioSignal.asReadonly();

// En el template (sin async pipe, sin subscribe)
<p>{{ usuario()?.nombreCompleto }}</p>
```

**Ventajas:**
- Sintaxis mas directa.
- Change detection mas eficiente (solo se re-renderiza lo que dependende del signal cambiado).
- **Computed signals** automaticos: derivar estado se cachea solo.

```typescript
readonly esAdmin = computed(() => this.usuario()?.rolDelSistema === 'Administrador');
```

---

## 4. ¿Que es lazy loading?

**Lazy loading = cargar el codigo de cada pagina solo cuando se accede a ella**, en vez de descargar todo el bundle al inicio.

### Sin lazy loading
```typescript
import { PaginaPacientes } from './paginas/pacientes/...';
import { PaginaConsultas } from './paginas/consultas/...';
// ... 12 imports

const routes = [
  { path: 'pacientes', component: PaginaPacientes },
  { path: 'consultas', component: PaginaConsultas },
  // ...
];
```
Resultado: bundle inicial de **~500 KB**. El usuario descarga toda la app aunque solo visite el login.

### Con lazy loading (lo que usamos)
```typescript
const routes = [
  { path: 'pacientes',
    loadComponent: () => import('./paginas/pacientes/...').then(m => m.PaginaPacientesComponent) },
  { path: 'consultas',
    loadComponent: () => import('./paginas/consultas/...').then(m => m.PaginaConsultasComponent) },
  // ...
];
```
Resultado: bundle inicial de **~98 KB**. El usuario descarga login primero; cuando hace click en "Pacientes", se descarga ese chunk en ese momento.

---

## 5. ¿Que es HttpClient + Interceptor?

**HttpClient es el servicio de Angular para hacer peticiones HTTP** (GET, POST, PUT, DELETE).

```typescript
@Injectable({ providedIn: 'root' })
export class PacienteService {
  private http = inject(HttpClient);
  private url = `${environment.apiUrl}/pacientes`;

  listarPacientes() {
    return this.http.get<Paciente[]>(this.url);
  }

  crear(paciente: PacientePeticion) {
    return this.http.post<Paciente>(this.url, paciente);
  }

  actualizar(id: number, paciente: PacientePeticion) {
    return this.http.put<Paciente>(`${this.url}/${id}`, paciente);
  }

  eliminar(id: number) {
    return this.http.delete<void>(`${this.url}/${id}`);
  }
}
```

**Esto cumple los 4 metodos HTTP de la rubrica.**

### Interceptor JWT (lo magico)

En vez de agregar el header `Authorization: Bearer ...` en cada llamada, defino un **interceptor** que lo hace automaticamente:

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

**Resultado:** desde cualquier componente, llamo `pacienteService.listarPacientes()` y el interceptor agrega el JWT sin que yo me preocupe.

---

## 6. ¿Que es Tailwind CSS?

**Tailwind es un framework CSS basado en clases utilitarias.** En vez de escribir CSS personalizado, compones diseno con clases predefinidas.

### Sin Tailwind (CSS clasico)
```html
<div class="card">
  <h2 class="card-title">Pacientes</h2>
  <button class="btn-primary">Nuevo</button>
</div>
```
```css
.card { padding: 24px; background: white; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
.card-title { font-size: 1.5rem; font-weight: bold; color: #1e293b; margin-bottom: 16px; }
.btn-primary { padding: 8px 16px; background: #0ea5e9; color: white; border-radius: 8px; }
```

### Con Tailwind (lo que usamos)
```html
<div class="p-6 bg-white rounded-xl shadow-sm">
  <h2 class="text-2xl font-bold text-slate-800 mb-4">Pacientes</h2>
  <button class="px-4 py-2 bg-medico-500 text-white rounded-lg">Nuevo</button>
</div>
```

**Ventajas:**
- **Cero CSS escrito a mano** para 95% de los casos.
- **Consistencia**: la paleta `medico-*` se usa igual en todo el proyecto.
- **Responsive**: clases como `lg:grid-cols-3` aplican solo en pantallas grandes.
- **Tree-shaking**: en build solo se incluyen las clases efectivamente usadas.

### Paleta personalizada en `tailwind.config.js`
```javascript
theme: {
  extend: {
    colors: {
      medico: {
        50:  '#f0f9ff',  // Mas claro
        500: '#0ea5e9',  // Principal
        600: '#0284c7',  // Hover
        900: '#0c4a6e',  // Mas oscuro
      },
      exito: '#10b981',
      error: '#ef4444',
      advertencia: '#f59e0b',
    }
  }
}
```

---

## 7. ¿Que es un Guard?

**Un guard es codigo que decide si una ruta puede activarse o no.** Lo uso para proteger las paginas que requieren login:

```typescript
export const authGuard: CanActivateFn = () => {
  const autenticacion = inject(AutenticacionService);
  const router = inject(Router);

  if (autenticacion.estaAutenticado()) {
    return true;  // Permite acceder
  }
  router.navigate(['/iniciar-sesion']);
  return false;  // Bloquea
};
```

En las rutas:
```typescript
{
  path: '/panel',
  canActivate: [authGuard],
  loadComponent: () => import('./paginas/panel/...').then(m => m.PaginaPanelComponent)
}
```

Si el usuario no esta logueado y trata de acceder a `/panel`, el guard lo redirige a `/iniciar-sesion`.

---

## 8. Forms reactivos vs template-driven

Angular tiene dos formas de manejar formularios:

| | Template-driven (lo que usamos) | Reactive |
|---|---|---|
| Simplicidad | Mas simple | Mas verboso |
| Validacion | `required`, `minlength` en HTML | FormGroup + Validators en TS |
| Para formularios | Pequenos (login, paciente) | Grandes y complejos |

En MedScribe uso **template-driven** con `[(ngModel)]` y validaciones HTML5 + funciones custom en `validaciones.ts`. Es mas que suficiente para nuestros formularios.

---

## Glosario

| Termino | Definicion |
|---|---|
| Angular 17 | Framework de Google para SPAs, basado en TypeScript. |
| SPA | Single Page Application: una sola pagina, JS gestiona la navegacion. |
| Standalone component | Componente que no necesita NgModule. |
| Signal | Estado reactivo nativo de Angular 16+. |
| Computed signal | Signal derivado de otros, se cachea automaticamente. |
| Lazy loading | Cargar el codigo de una pagina solo al accederla. |
| HttpClient | Servicio de Angular para llamadas HTTP. |
| Interceptor | Funcion que se ejecuta antes/despues de cada peticion HTTP. |
| Guard | Funcion que decide si una ruta puede activarse. |
| Tailwind CSS | Framework CSS de clases utilitarias. |
| RxJS | Libreria de programacion reactiva (Observable, Subject, etc.). |
| Bundle | Archivo JS empaquetado que el navegador descarga. |
| Tree-shaking | Eliminar codigo no usado del bundle final. |
