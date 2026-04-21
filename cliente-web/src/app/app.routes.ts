import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';

/** Definicion de rutas de la aplicacion. */
export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./paginas/login/login.component').then((m) => m.LoginComponent)
  },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./paginas/dashboard/dashboard.component').then(
        (m) => m.DashboardComponent
      )
  },
  {
    path: 'pacientes',
    canActivate: [authGuard],
    loadComponent: () =>
      import(
        './paginas/pacientes/lista-pacientes/lista-pacientes.component'
      ).then((m) => m.ListaPacientesComponent)
  },
  {
    path: 'pacientes/nuevo',
    canActivate: [authGuard],
    loadComponent: () =>
      import(
        './paginas/pacientes/formulario-paciente/formulario-paciente.component'
      ).then((m) => m.FormularioPacienteComponent)
  },
  {
    path: 'pacientes/editar/:id',
    canActivate: [authGuard],
    loadComponent: () =>
      import(
        './paginas/pacientes/formulario-paciente/formulario-paciente.component'
      ).then((m) => m.FormularioPacienteComponent)
  },
  {
    path: 'consultas',
    canActivate: [authGuard],
    loadComponent: () =>
      import(
        './paginas/consultas/lista-consultas/lista-consultas.component'
      ).then((m) => m.ListaConsultasComponent)
  },
  {
    path: 'consultas/nuevo',
    canActivate: [authGuard],
    loadComponent: () =>
      import(
        './paginas/consultas/formulario-consulta/formulario-consulta.component'
      ).then((m) => m.FormularioConsultaComponent)
  },
  {
    path: 'documentos',
    canActivate: [authGuard],
    loadComponent: () =>
      import(
        './paginas/documentos/lista-documentos/lista-documentos.component'
      ).then((m) => m.ListaDocumentosComponent)
  },
  { path: '', pathMatch: 'full', redirectTo: '/login' },
  { path: '**', redirectTo: '/login' }
];
