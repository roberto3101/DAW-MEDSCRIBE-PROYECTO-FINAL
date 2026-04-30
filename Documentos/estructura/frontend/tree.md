# Arbol del frontend `cliente-web/`

```
cliente-web/
├── Dockerfile                       # Multi-stage: node build + nginx serve
├── angular.json                     # Configuracion Angular CLI
├── nginx.conf                       # Proxy /api → gateway, /api/ia → servicio-ia
├── package.json                     # Angular 17 + Lucide + RxJS
├── postcss.config.js                # Tailwind + autoprefixer
├── tailwind.config.js               # Paleta medico-* + Inter font
├── tsconfig.json
├── tsconfig.app.json
└── src/
    ├── main.ts                      # bootstrapApplication(AppComponent)
    ├── index.html                   # base href="/", carga Inter font
    ├── styles.css                   # Tailwind directives + body styles
    ├── environments/
    │   ├── environment.ts           # production: apiUrl = '/api'
    │   └── environment.development.ts # apiUrl = 'http://localhost:5000/api'
    └── app/
        ├── app.component.ts         # Root con <router-outlet>
        ├── app.component.html
        ├── app.component.css
        ├── app.config.ts            # provideRouter + provideHttpClient + interceptors
        ├── app.routes.ts            # 13 rutas con loadComponent
        │
        ├── componentes/
        │   ├── comunes/
        │   │   ├── cargando.component.ts
        │   │   ├── modal.component.ts
        │   │   ├── modal-firma-digital.component.ts   # Canvas para firma
        │   │   └── editor-nota-clinica.component.ts   # Editor por secciones
        │   └── plantilla/
        │       ├── plantilla-publico.component.ts     # Sin sidebar
        │       └── plantilla-autenticado.component.ts # Con sidebar nav
        │
        ├── paginas/
        │   ├── inicio-sesion/
        │   │   └── pagina-inicio-sesion.component.ts
        │   ├── registro-clinica/
        │   │   └── pagina-registro-clinica.component.ts
        │   ├── panel/
        │   │   └── pagina-panel.component.ts
        │   ├── pacientes/
        │   │   └── pagina-pacientes.component.ts
        │   ├── consultas/
        │   │   ├── pagina-consultas.component.ts          # Lista
        │   │   └── pagina-detalle-consulta.component.ts   # Detalle
        │   ├── nueva-consulta/
        │   │   └── pagina-nueva-consulta.component.ts     # Audio + IA
        │   ├── documentos/
        │   │   └── pagina-documentos.component.ts
        │   ├── configuracion-documentos/
        │   │   └── pagina-configuracion-documentos.component.ts
        │   ├── usuarios-clinica/
        │   │   └── pagina-usuarios-clinica.component.ts
        │   ├── roles/
        │   │   └── pagina-roles.component.ts
        │   └── perfil/
        │       └── pagina-perfil.component.ts
        │
        ├── servicios/
        │   ├── autenticacion.service.ts        # signal<Usuario>, computed<permisos>
        │   ├── paciente.service.ts
        │   ├── consulta.service.ts
        │   ├── documento.service.ts
        │   ├── rol.service.ts
        │   ├── usuario-clinica.service.ts
        │   └── clinica.service.ts
        │
        ├── modelos/
        │   ├── usuario.model.ts          # Usuario, Permisos, Login
        │   ├── paciente.model.ts
        │   ├── consulta.model.ts         # Consulta, EstadoConsulta, TipoDocumento
        │   ├── documento.model.ts
        │   └── rol.model.ts              # Rol, UsuarioDeClinica, Clinica
        │
        ├── guards/
        │   └── auth.guard.ts             # Bloquea rutas sin token
        │
        ├── interceptores/
        │   └── auth.interceptor.ts       # Anade Bearer JWT, maneja 401
        │
        └── utilidades/
            ├── validaciones.ts           # validarDNI, validarCorreo, validarContrasena
            ├── formatear-fecha.ts        # DD/MM/YYYY HH:mm + edad
            ├── constantes.ts             # ROLES, ESTADOS, TIPOS_DOCUMENTO
            └── geolocalizacion.ts        # Detectar pais via IP (para tel)
```

## Estadisticas

| Categoria | Cantidad |
|---|---|
| Paginas standalone | 12 |
| Componentes reutilizables | 6 |
| Servicios HTTP | 7 |
| Modelos TypeScript | 5 |
| Lineas de codigo TypeScript | ~4,500 |
| Bundle inicial (gzip) | ~98 KB |
| Bundle total | ~365 KB |

## Rutas (app.routes.ts)

| Path | Component | Auth |
|---|---|---|
| `/` | redirect a `/iniciar-sesion` | publico |
| `/iniciar-sesion` | PaginaInicioSesion | publico |
| `/registrar-clinica` | PaginaRegistroClinica | publico |
| `/panel` | PaginaPanel | requerido |
| `/pacientes` | PaginaPacientes | requerido |
| `/consultas` | PaginaConsultas (lista) | requerido |
| `/consultas/nueva` | PaginaNuevaConsulta | requerido |
| `/consultas/:id` | PaginaDetalleConsulta | requerido |
| `/documentos` | PaginaDocumentos | requerido |
| `/configuracion-documentos` | PaginaConfiguracionDocumentos | requerido |
| `/usuarios-clinica` | PaginaUsuariosClinica | requerido |
| `/roles` | PaginaRoles | requerido |
| `/perfil` | PaginaPerfil | requerido |
| `**` | redirect a `/iniciar-sesion` | - |
