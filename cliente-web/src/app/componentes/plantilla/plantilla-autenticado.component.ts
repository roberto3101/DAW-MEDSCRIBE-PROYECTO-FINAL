import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import {
  LucideAngularModule,
  LayoutDashboard,
  Users,
  Mic,
  FileText,
  UserCircle,
  LogOut,
  Stethoscope,
  Settings,
  Activity,
  Menu,
  X
} from 'lucide-angular';
import { AutenticacionService } from '../../servicios/autenticacion.service';

interface EnlaceMenu {
  ruta: string;
  etiqueta: string;
  icono: any;
  modulo: string;
}

@Component({
  selector: 'app-plantilla-autenticado',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, LucideAngularModule],
  template: `
    <div class="min-h-screen bg-slate-50 flex">
      <div *ngIf="menuMovilAbierto()" class="fixed inset-0 bg-black/30 z-40 lg:hidden" (click)="menuMovilAbierto.set(false)"></div>

      <aside class="w-64 bg-white border-r border-slate-200 flex flex-col fixed h-full z-50 transition-transform duration-200"
        [ngClass]="menuMovilAbierto() ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'">
        <div class="p-6 border-b border-slate-100">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 bg-gradient-to-br from-medico-400 to-medico-600 rounded-xl flex items-center justify-center">
              <lucide-icon [img]="iconoStethoscope" class="w-5 h-5 text-white"></lucide-icon>
            </div>
            <div>
              <h1 class="text-lg font-bold text-slate-800 leading-tight">MedScribe</h1>
              <p class="text-xs text-medico-500 font-medium">AI</p>
            </div>
          </div>
        </div>

        <nav class="flex-1 p-4 space-y-1">
          <a *ngFor="let enlace of enlacesVisibles()" [routerLink]="enlace.ruta"
             routerLinkActive="bg-medico-50 text-medico-700 shadow-sm"
             [routerLinkActiveOptions]="enlace.ruta === '/panel' ? {exact: true} : {exact: false}"
             (click)="menuMovilAbierto.set(false)"
             class="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 text-slate-500 hover:bg-slate-50 hover:text-slate-700">
            <lucide-icon [img]="enlace.icono" class="w-5 h-5"></lucide-icon>
            {{ enlace.etiqueta }}
          </a>
        </nav>

        <div class="p-4 border-t border-slate-100">
          <div class="flex items-center gap-3 px-4 py-2 mb-2">
            <div class="w-8 h-8 bg-medico-100 rounded-full flex items-center justify-center">
              <span class="text-sm font-bold text-medico-600">{{ usuarioInicial() }}</span>
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-slate-700 truncate">{{ usuario()?.nombreCompleto }}</p>
              <p class="text-xs text-slate-400">{{ usuario()?.nombreRol || usuario()?.rolDelSistema }}</p>
            </div>
          </div>
          <button (click)="manejarCerrarSesion()"
            class="flex items-center gap-3 px-4 py-2.5 w-full rounded-lg text-sm font-medium text-slate-500 hover:bg-red-50 hover:text-red-600 transition-all duration-200">
            <lucide-icon [img]="iconoLogOut" class="w-5 h-5"></lucide-icon>
            Cerrar Sesion
          </button>
        </div>
      </aside>

      <main class="flex-1 lg:ml-64">
        <header class="bg-white border-b border-slate-200 px-4 sm:px-8 py-4">
          <div class="flex items-center justify-between">
            <button (click)="menuMovilAbierto.set(true)" class="lg:hidden p-2 rounded-lg hover:bg-slate-100">
              <lucide-icon [img]="iconoMenu" class="w-5 h-5 text-slate-500"></lucide-icon>
            </button>
            <div class="hidden lg:block"></div>
            <div class="flex items-center gap-2 text-sm text-slate-400">
              <div class="w-2 h-2 rounded-full bg-exito animate-pulse"></div>
              Servicios activos
            </div>
          </div>
        </header>
        <div class="p-4 sm:p-6 lg:p-8">
          <router-outlet></router-outlet>
        </div>
      </main>
    </div>
  `
})
export class PlantillaAutenticadoComponent {
  private readonly autenticacion = inject(AutenticacionService);
  private readonly router = inject(Router);

  iconoStethoscope = Stethoscope;
  iconoLogOut = LogOut;
  iconoMenu = Menu;

  menuMovilAbierto = signal(false);

  usuario = this.autenticacion.usuario;
  usuarioInicial = computed(() => this.usuario()?.nombreCompleto?.charAt(0) || 'U');

  private todosLosEnlaces: EnlaceMenu[] = [
    { ruta: '/panel', etiqueta: 'Panel', icono: LayoutDashboard, modulo: '' },
    { ruta: '/consultas/nueva', etiqueta: 'Nueva Consulta', icono: Mic, modulo: 'consultas' },
    { ruta: '/consultas', etiqueta: 'Consultas', icono: Activity, modulo: 'consultas' },
    { ruta: '/pacientes', etiqueta: 'Pacientes', icono: Users, modulo: 'pacientes' },
    { ruta: '/documentos', etiqueta: 'Documentos', icono: FileText, modulo: 'documentos' },
    { ruta: '/configuracion-documentos', etiqueta: 'Config. Documentos', icono: Settings, modulo: 'configuracion' },
    { ruta: '/usuarios-clinica', etiqueta: 'Usuarios', icono: Users, modulo: 'usuarios' },
    { ruta: '/roles', etiqueta: 'Roles', icono: Settings, modulo: 'roles' },
    { ruta: '/perfil', etiqueta: 'Perfil', icono: UserCircle, modulo: '' },
  ];

  enlacesVisibles = computed(() =>
    this.todosLosEnlaces.filter(enlace =>
      !enlace.modulo || this.autenticacion.tienePermiso(enlace.modulo, 'ver')
    )
  );

  manejarCerrarSesion(): void {
    this.autenticacion.cerrarSesion();
    this.router.navigate(['/iniciar-sesion']);
  }
}
