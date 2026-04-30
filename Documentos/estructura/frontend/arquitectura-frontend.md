# Arquitectura del frontend MedScribe AI (Angular 17)

## Stack y patrones

- **Angular 17** con **componentes standalone** (sin NgModules).
- **Signals** para estado reactivo (sin RxJS Subject en estado simple).
- **Lazy loading** por ruta usando `loadComponent`.
- **Tailwind CSS 3.4** para estilos (paleta `medico-*` propia).
- **Lucide Angular** para iconografia.
- **HttpClient + interceptor** para autenticacion JWT automatica.

## Patron de carpetas

```
cliente-web/src/app/
├── app.component.ts            # Root: contiene <router-outlet>
├── app.config.ts               # Provee router, http, animations, interceptor
├── app.routes.ts               # 13 rutas: 2 publicas + 11 protegidas
│
├── componentes/                # Reutilizables
│   ├── comunes/
│   │   ├── cargando.component.ts
│   │   ├── modal.component.ts
│   │   ├── modal-firma-digital.component.ts
│   │   └── editor-nota-clinica.component.ts
│   └── plantilla/
│       ├── plantilla-publico.component.ts          # Layout sin auth
│       └── plantilla-autenticado.component.ts      # Layout con sidebar
│
├── paginas/                    # 12 paginas standalone
│   ├── inicio-sesion/
│   ├── registro-clinica/
│   ├── panel/
│   ├── pacientes/
│   ├── consultas/             (lista + detalle)
│   ├── nueva-consulta/
│   ├── documentos/
│   ├── configuracion-documentos/
│   ├── usuarios-clinica/
│   ├── roles/
│   └── perfil/
│
├── servicios/                  # 7 servicios HTTP
│   ├── autenticacion.service.ts        # Signal con usuario + permisos
│   ├── paciente.service.ts
│   ├── consulta.service.ts
│   ├── documento.service.ts
│   ├── rol.service.ts
│   ├── usuario-clinica.service.ts
│   └── clinica.service.ts
│
├── modelos/                    # 5 archivos de tipos TypeScript
│   ├── usuario.model.ts
│   ├── paciente.model.ts
│   ├── consulta.model.ts
│   ├── documento.model.ts
│   └── rol.model.ts
│
├── guards/
│   └── auth.guard.ts                   # CanActivateFn funcional
│
├── interceptores/
│   └── auth.interceptor.ts             # HttpInterceptorFn
│
└── utilidades/                 # 4 archivos de helpers puros
    ├── validaciones.ts                 # DNI, CE, pasaporte, email, contrasena
    ├── formatear-fecha.ts
    ├── constantes.ts
    └── geolocalizacion.ts
```

## Flujo de una peticion tipica

```
Usuario hace click en "Crear paciente"
          │
          ▼
Componente PaginaPacientes
          │
          ▼ inject()
Servicio PacienteService.crear(datos)
          │
          ▼ http.post()
HttpClient
          │
          ▼ HttpInterceptorFn
auth.interceptor (anade Bearer JWT)
          │
          ▼ HTTP
Backend Spring Boot
          │
          ▼
Respuesta { idPaciente: 42 }
          │
          ▼ subscribe()
Componente actualiza signal
          │
          ▼ change detection
UI se re-renderiza
```

## Decisiones arquitectonicas

### ¿Por que standalone en lugar de NgModules?

- **Menos boilerplate** (no hay que registrar componentes en NgModules).
- **Mejor tree-shaking** (Angular elimina codigo no usado mas eficientemente).
- **Es la direccion oficial** de Angular desde la version 14, recomendado por defecto.

### ¿Por que signals en lugar de BehaviorSubject?

- **Sintaxis mas directa**: `usuario()` vs `usuario$.subscribe()`.
- **Change detection mas eficiente** en Angular 17+.
- **Computeds** (derived state) son nativos y se cachean.

### ¿Por que lazy loading por ruta?

- El bundle inicial es **~100 KB** en lugar de **~500 KB**.
- Cada pagina se descarga solo cuando se accede.
- Mejor first-paint y time-to-interactive.

## Convenciones de codigo

- **Nombres en espanol** (consistente con backend y dominio medico): `iniciarSesion()`, `obtenerPacientes()`, `tienePermiso()`.
- **Selector con prefijo `app-`**: `<app-modal>`, `<app-cargando>`.
- **Inputs/Outputs claros**: `@Input() estaAbierto`, `@Output() alCerrar`.
- **Validaciones en frontend Y backend**: defense in depth.

## Estilos con Tailwind

Configuracion en `tailwind.config.js`:

```js
theme: {
  extend: {
    colors: {
      medico: {
        50:  '#f0f9ff',
        100: '#e0f2fe',
        // ... hasta 900
        500: '#0ea5e9',  // Color principal
        600: '#0284c7',
      },
      exito: '#10b981',
      error: '#ef4444',
      advertencia: '#f59e0b',
    },
    fontFamily: { sans: ['Inter', 'system-ui'] },
  }
}
```

Esto permite usar clases como `bg-medico-500`, `text-exito` consistentemente en todos los componentes.
