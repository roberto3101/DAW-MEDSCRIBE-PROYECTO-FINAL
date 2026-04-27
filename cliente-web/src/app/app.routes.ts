import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  // Redireccion raiz ANTES de los layouts (si no, el primer path:'' atrapa / con outlet vacio)
  { path: '', pathMatch: 'full', redirectTo: 'iniciar-sesion' },

  // Rutas publicas envueltas en PlantillaPublico
  {
    path: '',
    loadComponent: () =>
      import('./componentes/plantilla/plantilla-publico.component').then(m => m.PlantillaPublicoComponent),
    children: [
      {
        path: 'iniciar-sesion',
        loadComponent: () =>
          import('./paginas/inicio-sesion/pagina-inicio-sesion.component').then(m => m.PaginaInicioSesionComponent)
      },
      {
        path: 'registrar-clinica',
        loadComponent: () =>
          import('./paginas/registro-clinica/pagina-registro-clinica.component').then(m => m.PaginaRegistroClinicaComponent)
      }
    ]
  },

  // Rutas protegidas envueltas en PlantillaAutenticado
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./componentes/plantilla/plantilla-autenticado.component').then(m => m.PlantillaAutenticadoComponent),
    children: [
      {
        path: 'panel',
        loadComponent: () =>
          import('./paginas/panel/pagina-panel.component').then(m => m.PaginaPanelComponent)
      },
      {
        path: 'pacientes',
        loadComponent: () =>
          import('./paginas/pacientes/pagina-pacientes.component').then(m => m.PaginaPacientesComponent)
      },
      {
        path: 'consultas',
        loadComponent: () =>
          import('./paginas/consultas/pagina-consultas.component').then(m => m.PaginaConsultasComponent)
      },
      {
        path: 'consultas/nueva',
        loadComponent: () =>
          import('./paginas/nueva-consulta/pagina-nueva-consulta.component').then(m => m.PaginaNuevaConsultaComponent)
      },
      {
        path: 'consultas/:id',
        loadComponent: () =>
          import('./paginas/consultas/pagina-detalle-consulta.component').then(m => m.PaginaDetalleConsultaComponent)
      },
      {
        path: 'documentos',
        loadComponent: () =>
          import('./paginas/documentos/pagina-documentos.component').then(m => m.PaginaDocumentosComponent)
      },
      {
        path: 'configuracion-documentos',
        loadComponent: () =>
          import('./paginas/configuracion-documentos/pagina-configuracion-documentos.component').then(m => m.PaginaConfiguracionDocumentosComponent)
      },
      {
        path: 'usuarios-clinica',
        loadComponent: () =>
          import('./paginas/usuarios-clinica/pagina-usuarios-clinica.component').then(m => m.PaginaUsuariosClinicaComponent)
      },
      {
        path: 'roles',
        loadComponent: () =>
          import('./paginas/roles/pagina-roles.component').then(m => m.PaginaRolesComponent)
      },
      {
        path: 'perfil',
        loadComponent: () =>
          import('./paginas/perfil/pagina-perfil.component').then(m => m.PaginaPerfilComponent)
      }
    ]
  },

  { path: '**', redirectTo: 'iniciar-sesion' }
];
