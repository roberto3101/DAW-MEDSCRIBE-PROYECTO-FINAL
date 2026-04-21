# MedScribe AI - Cliente Web (Angular 17)

Frontend Angular 17 del proyecto MedScribe. Consume el gateway .NET expuesto
en `http://localhost:5000/api` y permite gestionar pacientes, consultas y
documentos clinicos.

## Requisitos

- Node.js 18+
- Gateway .NET corriendo en el puerto 5000 (ver el proyecto MedScribe)

## Instalacion

```bash
cd cliente-web
npm install
```

## Levantar en desarrollo

```bash
npm start
```

Abre el navegador en: http://localhost:3000

## Build de produccion

```bash
npm run build
```

Los archivos finales quedan en `dist/cliente-web/`.

## Credenciales de prueba

| Rol           | Email                  | Password    |
|---------------|------------------------|-------------|
| Administrador | admin@medscribe.pe     | Admin2026!  |
| Medico        | jroberto@medscribe.pe  | Medico2026! |

## Arquitectura

- **Componentes standalone** (Angular 17+). No hay NgModules.
- **Router con lazy loading** (`loadComponent`).
- **HttpClient** con interceptor funcional que inyecta el JWT.
- **Guard funcional** (`authGuard`) que protege las rutas privadas.

### Endpoints REST consumidos

| Metodo | Ruta                              | Uso                          |
|--------|-----------------------------------|------------------------------|
| POST   | `/api/autenticacion/iniciar-sesion` | Login                        |
| GET    | `/api/pacientes`                  | Listar pacientes             |
| GET    | `/api/pacientes/:id`              | Obtener paciente             |
| POST   | `/api/pacientes`                  | Crear paciente               |
| PUT    | `/api/pacientes/:id`              | Actualizar paciente          |
| DELETE | `/api/pacientes/:id`              | Eliminar paciente            |
| GET    | `/api/consultas`                  | Listar consultas             |
| POST   | `/api/consultas`                  | Crear consulta               |
| DELETE | `/api/consultas/:id`              | Eliminar consulta            |
| GET    | `/api/documentos`                 | Listar documentos            |
| DELETE | `/api/documentos/:id`             | Eliminar documento           |

## Estructura

```
src/
  app/
    modelos/            # Interfaces TypeScript
    servicios/          # Servicios HTTP
    interceptores/      # Interceptor de auth (JWT)
    guards/             # Guard de auth
    paginas/            # Paginas del sitio
      login/
      dashboard/
      pacientes/
      consultas/
      documentos/
  environments/         # Configuracion por entorno
```
