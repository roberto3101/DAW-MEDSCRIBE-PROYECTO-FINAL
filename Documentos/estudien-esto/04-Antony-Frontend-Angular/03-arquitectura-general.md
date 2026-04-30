# 03. Arquitectura general del frontend

---

## 1. Vision de alto nivel

El frontend de MedScribe es una **SPA (Single Page Application) en Angular 17** que se comunica con dos backends por HTTP:

```
┌──────────────────────┐
│   Navegador (SPA)    │
│   Angular 17 + TW    │
└────────┬─────────────┘
         │ HTTPS + JWT
         ├──────────────► Gateway Java (Spring Boot)  :8080
         │                   ↳ MySQL :3306
         │
         └──────────────► Servicio IA (FastAPI)       :8000
                             ↳ Whisper / LLMs externos
```

**Ningun secreto vive en el frontend.** Las API keys de Whisper y de los LLMs estan en el `.env` del Servicio IA, no en Angular.

---

## 2. Capas internas de la SPA

```
┌────────────────────────────────────────────┐
│ PRESENTACION                               │
│  ─ Plantillas (publico, autenticado)       │
│  ─ Paginas (12)                            │
│  ─ Componentes reutilizables (modal, etc.) │
└──────────────────┬─────────────────────────┘
                   │ usa signals + ngModel
┌──────────────────▼─────────────────────────┐
│ ESTADO Y LOGICA                            │
│  ─ Servicios (inject + HttpClient)         │
│  ─ Signals (autenticacion, permisos)       │
│  ─ Guards (auth, solo-admin)               │
└──────────────────┬─────────────────────────┘
                   │ HTTP con interceptor
┌──────────────────▼─────────────────────────┐
│ INFRAESTRUCTURA                            │
│  ─ HttpClient + auth interceptor           │
│  ─ Router (lazy loading)                   │
│  ─ Tailwind config                         │
└────────────────────────────────────────────┘
```

---

## 3. Patron de carpetas

| Carpeta | Que vive ahi |
|---|---|
| `paginas/` | Componentes de pagina (uno por ruta). |
| `componentes/` | Piezas reutilizables (modal, spinner, editor SOAP). |
| `plantillas/` | Layouts (sidebar + header vs solo logo centrado). |
| `servicios/` | Llamadas HTTP, una clase por entidad. |
| `modelos/` | Interfaces TS que reflejan los DTOs del backend. |
| `guardianes/` | Funciones `CanActivateFn` para proteger rutas. |
| `interceptores/` | Interceptor JWT. |
| `utilidades/` | Funciones puras (validaciones, formato). |

**Regla:** una carpeta = una responsabilidad. No mezclamos servicios con componentes ni utilidades con modelos.

---

## 4. Flujo de una peticion tipica

Ejemplo: usuario hace click en "Pacientes".

1. **Router** detecta `/pacientes` -> ejecuta `authGuard` -> permite acceso.
2. **Lazy loading** descarga el chunk de `pagina-pacientes.component.ts`.
3. **Componente** se monta -> en `ngOnInit` llama `pacienteService.listar()`.
4. **PacienteService** ejecuta `http.get(...)`.
5. **AuthInterceptor** intercepta la peticion y agrega `Authorization: Bearer <token>`.
6. **Gateway Java** valida el JWT, extrae `idClinica`, filtra `WHERE IdClinica = ?` y devuelve los pacientes.
7. **Componente** recibe el array y lo asigna a un signal -> el template se renderiza con `*ngFor`.

---

## 5. Manejo de estado: por que signals y no NgRx

Para una app del tamano de MedScribe, **NgRx (Redux) seria sobre-ingenieria**. Lo que tenemos:

| Estado | Donde vive |
|---|---|
| Usuario autenticado | `signal` en `AutenticacionService` |
| Permisos del usuario | `computed` derivado del usuario |
| Lista de pacientes | Signal local en `PaginaPacientesComponent` |
| Form de nueva consulta | Variables del componente con `[(ngModel)]` |

**Si la app creciera 10x**, evaluariamos NgRx Signals Store. Pero hoy no se justifica.

---

## 6. Multi-tenant en el frontend

El frontend **no envia `idClinica` en ninguna peticion**. Lo extrae el backend del JWT.

```typescript
// MAL (lo que NO hacemos)
this.http.post('/pacientes', { ...paciente, idClinica: 5 });

// BIEN (lo que SI hacemos)
this.http.post('/pacientes', paciente);
// El backend lee idClinica del JWT del header Authorization.
```

**Por que:** si el frontend enviara el `idClinica`, un atacante podria modificarlo y ver pacientes de otra clinica. Como viene del JWT firmado, **no se puede falsear**.

---

## 7. Cascade de IA visto desde el frontend

El frontend solo conoce dos endpoints:
- `POST /transcribir` -> devuelve texto
- `POST /generar-nota` -> devuelve JSON con las 7 secciones SOAP

**Internamente** el Servicio IA tiene la cascade Groq -> HuggingFace -> Mistral -> Deepgram, pero el frontend no se entera. Solo recibe el resultado o un error 500 si **todos** fallan.

```typescript
this.iaService.transcribir(audioBlob).subscribe({
  next: r => this.transcripcion.set(r.transcripcion),
  error: e => alert('No se pudo transcribir: ' + e.error.detail)
});
```

---

## 8. Build y despliegue

```
ng build --configuration production
↓
dist/cliente-web/browser/  (HTML + CSS + JS minificado, ~98 KB inicial)
↓
Nginx dentro de Docker sirve los archivos estaticos
```

El `Dockerfile` del frontend hace dos pasos:
1. **Stage builder**: Node 20 -> `npm ci` -> `ng build` -> genera `dist/`.
2. **Stage runtime**: Nginx alpine -> copia `dist/` a `/usr/share/nginx/html` -> expone puerto 80.

---

## 9. Variables de entorno

```typescript
// src/environments/environment.ts (desarrollo)
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8080/api',
  iaUrl: 'http://localhost:8000'
};

// src/environments/environment.prod.ts (produccion)
export const environment = {
  production: true,
  apiUrl: '/api',                   // mismo dominio
  iaUrl: 'https://ia.medscribe.pe'
};
```

Angular CLI hace **file replacement** en build prod automaticamente.

---

## 10. Decisiones de diseno

| Decision | Por que |
|---|---|
| Standalone components | Menos boilerplate, Angular 17 los promueve. |
| Signals en vez de RxJS para estado simple | Sintaxis directa, change detection eficiente. |
| Tailwind sin Bootstrap/Material | Consistencia visual con DSW1, paleta `medico-*` propia. |
| Template-driven forms | Formularios pequenos, no necesitan FormGroup. |
| Lazy loading en TODAS las rutas | Bundle inicial baja de 500 KB a 98 KB. |
| Multi-tenant por JWT | El frontend no decide la clinica, el backend si. |
| FK simples sin relaciones bidireccionales | Evita problema N+1 y simplifica DTOs. |
| Interceptor JWT global | Cero codigo duplicado en servicios. |

---

## 11. Diagrama de flujo: nueva consulta (la pagina mas compleja)

```
Usuario abre /nueva-consulta
        │
        ▼
Selecciona paciente del dropdown
        │
        ▼
Click "Iniciar grabacion"
        │
        ├── Navegador pide permiso de microfono
        │
        ▼
MediaRecorder.start(1000)  -> chunks cada 1s
        │
        ▼
Click "Detener"  ── requestData() ── stop()
        │
        ▼
Blob audio/webm  ──POST /transcribir──►  Servicio IA
                                              │
                                  Cascade Whisper -> texto
                                              │
        ◄─────── { transcripcion: "..." } ───┘
        │
        ▼
Muestra transcripcion + scroll automatico
        │
        ▼
Click "Procesar con IA"
        │
        ▼
POST /generar-nota  ──►  Servicio IA
                              │
                  Cascade LLM -> JSON SOAP
                              │
        ◄── { nota: { S, O, A, P, ... } } ──┘
        │
        ▼
Editor de nota SOAP (7 secciones editables)
        │
        ├── Click "Firmar" -> modal canvas -> base64 PNG
        │
        ▼
POST /consultas  -> guarda en MySQL
        │
        ├── Click "Generar PDF" -> ReportLab
        └── Click "Generar Word" -> python-docx
```

---

## 12. Que tan bien escala esta arquitectura

| Aspecto | Limite practico |
|---|---|
| Paginas | Hasta ~50 sin reorganizar (hoy: 12). |
| Componentes reutilizables | Sin limite. |
| Servicios HTTP | Uno por entidad, escala linealmente. |
| Estado global | Si supera 5 signals globales, evaluar Signal Store. |
| Bundle size | Lazy loading mantiene cada chunk pequeno. |
| Equipo | Tailwind + standalone permite que 5+ devs trabajen sin pisarse. |

**Conclusion:** la arquitectura aguanta sobradamente el alcance del proyecto y triplicarlo sin refactor mayor.
