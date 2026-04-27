import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  LucideAngularModule,
  UserCircle,
  Mail,
  Lock,
  Save,
  CheckCircle,
  Stethoscope
} from 'lucide-angular';
import { AutenticacionService } from '../../servicios/autenticacion.service';
import { validarContrasena } from '../../utilidades/validaciones';

@Component({
  selector: 'app-pagina-perfil',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  template: `
    <div class="space-y-6 max-w-3xl">
      <div>
        <h1 class="text-2xl font-bold text-slate-800 flex items-center gap-3">
          <lucide-icon [img]="iconoUserCircle" class="w-7 h-7 text-medico-500"></lucide-icon>
          Mi Perfil
        </h1>
        <p class="text-slate-400 mt-1">Informacion de tu cuenta y datos profesionales</p>
      </div>

      <div *ngIf="mensajeExito()" class="bg-emerald-50 text-emerald-600 text-sm px-4 py-3 rounded-lg border border-emerald-100 flex items-center gap-2">
        <lucide-icon [img]="iconoCheckCircle" class="w-4 h-4"></lucide-icon>
        {{ mensajeExito() }}
      </div>

      <div class="bg-white rounded-xl border border-slate-200 p-6">
        <div class="flex items-start gap-6">
          <div class="w-20 h-20 bg-gradient-to-br from-medico-400 to-medico-600 rounded-2xl flex items-center justify-center shadow-lg shadow-medico-200 flex-shrink-0">
            <span class="text-3xl font-bold text-white">{{ inicial() }}</span>
          </div>
          <div class="flex-1">
            <h2 class="text-lg font-semibold text-slate-800">{{ usuario()?.nombreCompleto }}</h2>
            <p class="text-sm text-slate-400">{{ usuario()?.correoElectronico }}</p>
            <div class="flex gap-2 mt-2">
              <span class="text-xs font-medium px-2.5 py-1 rounded-full"
                [ngClass]="colorRol()">
                {{ usuario()?.rolDelSistema }}
              </span>
              <span class="text-xs font-medium px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600">
                Cuenta activa
              </span>
            </div>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div class="bg-white rounded-xl border border-slate-200 p-6">
          <h2 class="text-sm font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <lucide-icon [img]="iconoMail" class="w-4 h-4 text-medico-500"></lucide-icon>
            Datos de la Cuenta
          </h2>
          <div class="space-y-3">
            <div class="flex justify-between py-2 border-b border-slate-50">
              <span class="text-xs text-slate-400">Nombre Completo</span>
              <span class="text-sm text-slate-700 font-medium">{{ usuario()?.nombreCompleto }}</span>
            </div>
            <div class="flex justify-between py-2 border-b border-slate-50">
              <span class="text-xs text-slate-400">Correo Electronico</span>
              <span class="text-sm text-slate-600">{{ usuario()?.correoElectronico }}</span>
            </div>
            <div class="flex justify-between py-2 border-b border-slate-50">
              <span class="text-xs text-slate-400">Rol del Sistema</span>
              <span class="text-sm text-slate-600">{{ usuario()?.rolDelSistema }}</span>
            </div>
            <div class="flex justify-between py-2 border-b border-slate-50">
              <span class="text-xs text-slate-400">ID de Usuario</span>
              <span class="text-sm text-slate-600">{{ usuario()?.idUsuario }}</span>
            </div>
            <div class="flex justify-between py-2">
              <span class="text-xs text-slate-400">Estado</span>
              <div class="flex items-center gap-1.5">
                <div class="w-2 h-2 rounded-full bg-emerald-500"></div>
                <span class="text-sm text-emerald-600">Activa</span>
              </div>
            </div>
          </div>
        </div>

        <div *ngIf="usuario()?.rolDelSistema === 'Medico'" class="bg-white rounded-xl border border-slate-200 p-6">
          <h2 class="text-sm font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <lucide-icon [img]="iconoStethoscope" class="w-4 h-4 text-medico-500"></lucide-icon>
            Datos Profesionales
          </h2>
          <div class="space-y-3">
            <div class="flex justify-between py-2 border-b border-slate-50">
              <span class="text-xs text-slate-400">Especialidad</span>
              <span class="text-sm text-slate-600">Medicina General</span>
            </div>
            <div class="flex justify-between py-2 border-b border-slate-50">
              <span class="text-xs text-slate-400">Colegiatura</span>
              <span class="text-sm text-slate-600">CMP-12345</span>
            </div>
            <div class="flex justify-between py-2">
              <span class="text-xs text-slate-400">Estado Medico</span>
              <div class="flex items-center gap-1.5">
                <div class="w-2 h-2 rounded-full bg-emerald-500"></div>
                <span class="text-sm text-emerald-600">Activo</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-xl border border-slate-200 p-6">
        <h2 class="text-sm font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <lucide-icon [img]="iconoLock" class="w-4 h-4 text-medico-500"></lucide-icon>
          Cambiar Contrasena
        </h2>

        <div *ngIf="error()" class="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-lg border border-red-100 mb-4">
          {{ error() }}
        </div>

        <form (ngSubmit)="manejarCambioContrasena()" class="space-y-4">
          <div>
            <label class="block text-xs font-medium text-slate-500 mb-1">Contrasena Actual</label>
            <input type="password" name="contrasenaActual" [(ngModel)]="contrasenaActual"
              required minlength="8" maxlength="50" placeholder="Ingresa tu contrasena actual"
              class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-medico-500/20 focus:border-medico-400" />
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-medium text-slate-500 mb-1">Nueva Contrasena</label>
              <input type="password" name="contrasenaNueva" [(ngModel)]="contrasenaNueva"
                required minlength="8" maxlength="50" placeholder="Minimo 8 caracteres"
                class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-medico-500/20 focus:border-medico-400" />
            </div>
            <div>
              <label class="block text-xs font-medium text-slate-500 mb-1">Confirmar Contrasena</label>
              <input type="password" name="confirmarContrasena" [(ngModel)]="confirmarContrasena"
                required minlength="8" maxlength="50" placeholder="Repite la nueva contrasena"
                class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-medico-500/20 focus:border-medico-400" />
            </div>
          </div>
          <div class="flex justify-end">
            <button type="submit"
              class="flex items-center gap-2 px-5 py-2.5 bg-medico-500 text-white rounded-lg text-sm font-medium hover:bg-medico-600 transition-colors">
              <lucide-icon [img]="iconoSave" class="w-4 h-4"></lucide-icon>
              Actualizar Contrasena
            </button>
          </div>
        </form>
      </div>
    </div>
  `
})
export class PaginaPerfilComponent {
  private readonly autenticacion = inject(AutenticacionService);

  iconoUserCircle = UserCircle;
  iconoMail = Mail;
  iconoLock = Lock;
  iconoSave = Save;
  iconoCheckCircle = CheckCircle;
  iconoStethoscope = Stethoscope;

  usuario = this.autenticacion.usuario;
  inicial = () => this.usuario()?.nombreCompleto?.charAt(0) || 'U';

  contrasenaActual = '';
  contrasenaNueva = '';
  confirmarContrasena = '';
  mensajeExito = signal('');
  error = signal('');

  colorRol(): string {
    const rol = this.usuario()?.rolDelSistema;
    if (rol === 'Administrador') return 'bg-amber-50 text-amber-600';
    if (rol === 'Medico') return 'bg-medico-50 text-medico-600';
    return 'bg-slate-100 text-slate-600';
  }

  manejarCambioContrasena(): void {
    this.error.set('');
    if (!this.contrasenaActual) {
      this.error.set('Debes ingresar tu contrasena actual');
      return;
    }
    const errorValidacion = validarContrasena(this.contrasenaNueva);
    if (errorValidacion) { this.error.set(errorValidacion); return; }
    if (this.contrasenaNueva === this.contrasenaActual) {
      this.error.set('La nueva contrasena debe ser diferente a la actual');
      return;
    }
    if (this.contrasenaNueva !== this.confirmarContrasena) {
      this.error.set('Las contrasenas no coinciden');
      return;
    }
    const idUsuario = this.usuario()?.idUsuario;
    if (!idUsuario) {
      this.error.set('No se pudo identificar al usuario');
      return;
    }

    this.autenticacion.cambiarContrasena({
      idUsuario,
      contrasenaActual: this.contrasenaActual,
      contrasenaNueva: this.contrasenaNueva
    }).subscribe({
      next: () => {
        this.mensajeExito.set('Contrasena actualizada correctamente');
        this.contrasenaActual = '';
        this.contrasenaNueva = '';
        this.confirmarContrasena = '';
        setTimeout(() => this.mensajeExito.set(''), 3000);
      },
      error: (err) => {
        this.error.set(err?.error?.mensaje || err?.error?.message || 'Error al actualizar la contrasena');
      }
    });
  }
}
