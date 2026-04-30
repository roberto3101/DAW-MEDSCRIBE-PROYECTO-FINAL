import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { LucideAngularModule, Building2, User, ArrowRight, Stethoscope, CheckCircle } from 'lucide-angular';
import { ClinicaService } from '../../servicios/clinica.service';

@Component({
  selector: 'app-pagina-registro-clinica',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, LucideAngularModule],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-slate-50 via-sky-50 to-cyan-50 flex items-center justify-center p-4">
      <div class="w-full max-w-lg">
        <div class="flex items-center gap-3 mb-6 justify-center">
          <div class="w-12 h-12 bg-gradient-to-br from-medico-400 to-medico-600 rounded-xl flex items-center justify-center shadow-lg shadow-medico-200">
            <lucide-icon [img]="iconoStethoscope" class="w-6 h-6 text-white"></lucide-icon>
          </div>
          <div>
            <h1 class="text-2xl font-bold text-slate-800">MedScribe AI</h1>
            <p class="text-xs text-slate-400">Registrar nueva clinica</p>
          </div>
        </div>

        <div class="flex gap-2 mb-6 justify-center">
          <div *ngFor="let p of [1,2,3]"
            class="h-1.5 w-16 rounded-full transition-colors"
            [ngClass]="paso() >= p ? 'bg-medico-500' : 'bg-slate-200'"></div>
        </div>

        <div class="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
          <div *ngIf="error()" class="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-lg border border-red-100 mb-4">
            {{ error() }}
          </div>

          <div *ngIf="paso() === 1" class="space-y-4">
            <h2 class="text-lg font-semibold text-slate-800 flex items-center gap-2">
              <lucide-icon [img]="iconoBuilding" class="w-5 h-5 text-medico-500"></lucide-icon>
              Datos de la Clinica
            </h2>
            <div>
              <label class="block text-xs font-medium text-slate-500 mb-1">Razon Social *</label>
              <input type="text" [(ngModel)]="formulario.razonSocial" maxlength="200"
                placeholder="Clinica San Pablo SAC"
                class="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-medico-500/20 focus:border-medico-400" />
            </div>
            <div>
              <label class="block text-xs font-medium text-slate-500 mb-1">RUC *</label>
              <input type="text" [(ngModel)]="formulario.ruc" maxlength="11"
                (input)="sanitizarRuc($event)"
                placeholder="20123456789"
                class="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-medico-500/20 focus:border-medico-400" />
              <p class="text-[10px] text-slate-300 mt-0.5">{{ formulario.ruc.length }}/11 digitos</p>
            </div>
            <div>
              <label class="block text-xs font-medium text-slate-500 mb-1">Nombre Comercial</label>
              <input type="text" [(ngModel)]="formulario.nombreComercial" maxlength="200"
                placeholder="MedScribe Demo"
                class="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-medico-500/20 focus:border-medico-400" />
            </div>
            <div>
              <label class="block text-xs font-medium text-slate-500 mb-1">Correo de Contacto *</label>
              <input type="email" [(ngModel)]="formulario.correoContacto" maxlength="150"
                placeholder="admin@clinica.pe"
                class="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-medico-500/20 focus:border-medico-400" />
            </div>
            <button (click)="avanzarPaso()"
              class="w-full flex items-center justify-center gap-2 bg-medico-500 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-medico-600 transition-colors">
              Siguiente
              <lucide-icon [img]="iconoArrowRight" class="w-4 h-4"></lucide-icon>
            </button>
          </div>

          <form *ngIf="paso() === 2" (ngSubmit)="registrarClinica()" class="space-y-4">
            <h2 class="text-lg font-semibold text-slate-800 flex items-center gap-2">
              <lucide-icon [img]="iconoUser" class="w-5 h-5 text-medico-500"></lucide-icon>
              Cuenta del Administrador
            </h2>
            <div>
              <label class="block text-xs font-medium text-slate-500 mb-1">Nombre Completo *</label>
              <input type="text" name="nombreAdmin" [(ngModel)]="formulario.nombreAdmin"
                maxlength="100" required placeholder="Dr. Jose Roberto"
                class="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-medico-500/20 focus:border-medico-400" />
            </div>
            <div>
              <label class="block text-xs font-medium text-slate-500 mb-1">Correo del Administrador *</label>
              <input type="email" name="correoAdmin" [(ngModel)]="formulario.correoAdmin"
                maxlength="150" required placeholder="admin@clinica.pe"
                class="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-medico-500/20 focus:border-medico-400" />
            </div>
            <div>
              <label class="block text-xs font-medium text-slate-500 mb-1">Contrasena *</label>
              <input type="password" name="contrasenaAdmin" [(ngModel)]="formulario.contrasenaAdmin"
                minlength="8" maxlength="50" required placeholder="Minimo 8 caracteres"
                class="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-medico-500/20 focus:border-medico-400" />
            </div>
            <div>
              <label class="block text-xs font-medium text-slate-500 mb-1">Confirmar Contrasena *</label>
              <input type="password" name="confirmarContrasena" [(ngModel)]="formulario.confirmarContrasena"
                minlength="8" maxlength="50" required placeholder="Repite la contrasena"
                class="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-medico-500/20 focus:border-medico-400" />
            </div>
            <div class="flex gap-3">
              <button type="button" (click)="paso.set(1)"
                class="flex-1 py-2.5 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
                Atras
              </button>
              <button type="submit" [disabled]="estaCargando()"
                class="flex-1 flex items-center justify-center gap-2 bg-medico-500 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-medico-600 transition-colors disabled:opacity-50">
                {{ estaCargando() ? 'Registrando...' : 'Crear Clinica' }}
              </button>
            </div>
          </form>

          <div *ngIf="paso() === 3" class="text-center py-6">
            <div class="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <lucide-icon [img]="iconoCheckCircle" class="w-8 h-8 text-emerald-500"></lucide-icon>
            </div>
            <h2 class="text-lg font-semibold text-slate-800 mb-2">Clinica registrada exitosamente</h2>
            <p class="text-sm text-slate-400 mb-6">
              Tu clinica tiene 30 dias de prueba gratuita. Inicia sesion con las credenciales que registraste.
            </p>
            <button (click)="router.navigate(['/iniciar-sesion'])"
              class="w-full bg-medico-500 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-medico-600 transition-colors">
              Ir a Iniciar Sesion
            </button>
          </div>
        </div>

        <p class="text-center text-xs text-slate-400 mt-4">
          Ya tienes cuenta?
          <a routerLink="/iniciar-sesion" class="text-medico-500 hover:text-medico-600 font-medium">Iniciar Sesion</a>
        </p>
      </div>
    </div>
  `
})
export class PaginaRegistroClinicaComponent {
  private readonly clinicaService = inject(ClinicaService);
  readonly router = inject(Router);

  iconoStethoscope = Stethoscope;
  iconoBuilding = Building2;
  iconoUser = User;
  iconoArrowRight = ArrowRight;
  iconoCheckCircle = CheckCircle;

  paso = signal(1);
  estaCargando = signal(false);
  error = signal('');

  formulario = {
    razonSocial: '',
    ruc: '',
    nombreComercial: '',
    correoContacto: '',
    nombreAdmin: '',
    correoAdmin: '',
    contrasenaAdmin: '',
    confirmarContrasena: '',
  };

  sanitizarRuc(evento: Event): void {
    const input = evento.target as HTMLInputElement;
    const soloDigitos = input.value.replace(/\D/g, '').slice(0, 11);
    this.formulario.ruc = soloDigitos;
    input.value = soloDigitos;
  }

  validarPaso1(): string {
    if (!this.formulario.razonSocial.trim()) return 'La razon social es obligatoria';
    if (this.formulario.ruc.length !== 11) return 'El RUC debe tener 11 digitos';
    if (!this.formulario.correoContacto.includes('@')) return 'Correo de contacto invalido';
    return '';
  }

  validarPaso2(): string {
    if (!this.formulario.nombreAdmin.trim()) return 'El nombre del administrador es obligatorio';
    if (!this.formulario.correoAdmin.includes('@')) return 'Correo del administrador invalido';
    if (this.formulario.contrasenaAdmin.length < 8) return 'La contrasena debe tener al menos 8 caracteres';
    if (this.formulario.contrasenaAdmin !== this.formulario.confirmarContrasena) return 'Las contrasenas no coinciden';
    return '';
  }

  avanzarPaso(): void {
    const errorValidacion = this.validarPaso1();
    if (errorValidacion) { this.error.set(errorValidacion); return; }
    this.error.set('');
    this.paso.set(2);
  }

  registrarClinica(): void {
    const errorValidacion = this.validarPaso2();
    if (errorValidacion) { this.error.set(errorValidacion); return; }

    this.estaCargando.set(true);
    this.error.set('');

    this.clinicaService.registrarClinica({
      razonSocial: this.formulario.razonSocial,
      ruc: this.formulario.ruc,
      nombreComercial: this.formulario.nombreComercial || this.formulario.razonSocial,
      correoContacto: this.formulario.correoContacto,
      nombreAdmin: this.formulario.nombreAdmin,
      correoAdmin: this.formulario.correoAdmin,
      contrasenaAdmin: this.formulario.contrasenaAdmin,
    }).subscribe({
      next: () => {
        this.estaCargando.set(false);
        this.paso.set(3);
      },
      error: (err) => {
        this.estaCargando.set(false);
        this.error.set(err?.error?.mensaje || err?.error?.message || 'Error al registrar la clinica');
      }
    });
  }
}
