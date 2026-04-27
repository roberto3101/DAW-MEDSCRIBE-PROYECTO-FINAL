import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import {
  LucideAngularModule,
  Stethoscope,
  Shield,
  Zap,
  FileCheck,
  Mail,
  Lock,
  ArrowRight
} from 'lucide-angular';
import { AutenticacionService } from '../../servicios/autenticacion.service';

@Component({
  selector: 'app-pagina-inicio-sesion',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, LucideAngularModule],
  template: `
    <div class="min-h-screen flex">
      <div class="flex-1 flex items-center justify-center p-8 bg-white">
        <div class="w-full max-w-md">
          <div class="flex items-center gap-3 mb-8">
            <div class="w-12 h-12 bg-gradient-to-br from-medico-400 to-medico-600 rounded-xl flex items-center justify-center shadow-lg shadow-medico-200">
              <lucide-icon [img]="iconoStethoscope" class="w-6 h-6 text-white"></lucide-icon>
            </div>
            <div>
              <h1 class="text-2xl font-bold text-slate-800">MedScribe AI</h1>
              <p class="text-sm text-slate-400">Documentacion medica automatizada</p>
            </div>
          </div>

          <div class="bg-slate-50/50 rounded-2xl border border-slate-100 p-8">
            <h2 class="text-xl font-semibold text-slate-800 mb-1">Iniciar Sesion</h2>
            <p class="text-sm text-slate-400 mb-6">Ingresa tus credenciales para continuar</p>

            <form (ngSubmit)="manejarEnvio()" class="space-y-4">
              <div *ngIf="error()" class="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-lg border border-red-100">
                {{ error() }}
              </div>

              <div>
                <label class="block text-sm font-medium text-slate-600 mb-1.5">Correo Electronico</label>
                <div class="relative">
                  <lucide-icon [img]="iconoMail" class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300"></lucide-icon>
                  <input type="email" name="correo" [(ngModel)]="correo" required
                    placeholder="medico@clinica.pe"
                    class="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-medico-500/20 focus:border-medico-400 transition-all" />
                </div>
              </div>

              <div>
                <label class="block text-sm font-medium text-slate-600 mb-1.5">Contrasena</label>
                <div class="relative">
                  <lucide-icon [img]="iconoLock" class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300"></lucide-icon>
                  <input type="password" name="contrasena" [(ngModel)]="contrasena" required minlength="8"
                    placeholder="Minimo 8 caracteres"
                    class="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-medico-500/20 focus:border-medico-400 transition-all" />
                </div>
              </div>

              <button type="submit" [disabled]="estaCargando()"
                class="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-medico-500 to-medico-600 text-white py-2.5 rounded-lg text-sm font-medium hover:from-medico-600 hover:to-medico-700 transition-all duration-200 shadow-sm shadow-medico-200 disabled:opacity-50 disabled:cursor-not-allowed">
                <div *ngIf="estaCargando()" class="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <ng-container *ngIf="!estaCargando()">
                  Iniciar Sesion
                  <lucide-icon [img]="iconoArrowRight" class="w-4 h-4"></lucide-icon>
                </ng-container>
              </button>

              <p class="text-center text-xs text-slate-400 mt-4">
                No tienes cuenta?
                <a routerLink="/registrar-clinica" class="text-medico-500 hover:text-medico-600 font-medium">Registrar clinica</a>
              </p>
            </form>
          </div>

          <p class="text-center text-xs text-slate-300 mt-6">
            MedScribe AI v1.0 &middot; Lima, Peru &middot; 2026
          </p>
        </div>
      </div>

      <div class="hidden lg:flex flex-1 bg-gradient-to-br from-medico-600 via-medico-700 to-cyan-700 items-center justify-center relative overflow-hidden">
        <!-- Particulas animadas con CSS puro (sustituye Three.js) -->
        <div class="absolute inset-0 opacity-60">
          <div class="absolute w-96 h-96 rounded-full bg-medico-400/20 blur-3xl top-10 left-10 animate-pulse"></div>
          <div class="absolute w-80 h-80 rounded-full bg-cyan-300/20 blur-3xl bottom-10 right-10 animate-pulse" style="animation-delay: 1s"></div>
          <div class="absolute w-64 h-64 rounded-full bg-medico-300/10 blur-2xl top-1/2 left-1/2 animate-pulse" style="animation-delay: 2s"></div>
        </div>

        <div class="relative z-10 px-12 max-w-lg">
          <h2 class="text-3xl font-bold text-white mb-3">Documenta consultas en segundos</h2>
          <p class="text-medico-200 text-base leading-relaxed mb-10">
            Graba tu consulta por voz y recibe un documento clinico estructurado listo para revision y aprobacion.
          </p>

          <div class="space-y-5">
            <div *ngFor="let caract of caracteristicas" class="flex items-start gap-4">
              <div class="w-10 h-10 bg-white/10 backdrop-blur-sm rounded-lg flex items-center justify-center flex-shrink-0 border border-white/10">
                <lucide-icon [img]="caract.icono" class="w-5 h-5 text-medico-200"></lucide-icon>
              </div>
              <div>
                <h3 class="text-sm font-semibold text-white">{{ caract.titulo }}</h3>
                <p class="text-sm text-medico-300">{{ caract.descripcion }}</p>
              </div>
            </div>
          </div>

          <div class="flex gap-8 mt-12 pt-8 border-t border-white/10">
            <div>
              <p class="text-2xl font-bold text-white">2-4h</p>
              <p class="text-xs text-medico-300">Ahorro diario</p>
            </div>
            <div>
              <p class="text-2xl font-bold text-white">95%</p>
              <p class="text-xs text-medico-300">Precision</p>
            </div>
            <div>
              <p class="text-2xl font-bold text-white">&lt;30s</p>
              <p class="text-xs text-medico-300">Por consulta</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class PaginaInicioSesionComponent {
  private readonly autenticacion = inject(AutenticacionService);
  private readonly router = inject(Router);

  iconoStethoscope = Stethoscope;
  iconoMail = Mail;
  iconoLock = Lock;
  iconoArrowRight = ArrowRight;

  correo = '';
  contrasena = '';
  estaCargando = signal(false);
  error = signal('');

  caracteristicas = [
    { icono: Zap, titulo: 'Transcripcion Instantanea', descripcion: 'Audio a texto en segundos con IA' },
    { icono: FileCheck, titulo: 'Notas SOAP Automaticas', descripcion: 'Estructuracion clinica profesional' },
    { icono: Shield, titulo: 'Datos Seguros', descripcion: 'Encriptacion y cumplimiento normativo' },
  ];

  manejarEnvio(): void {
    this.error.set('');
    this.estaCargando.set(true);

    this.autenticacion.iniciarSesion({
      correoElectronico: this.correo,
      contrasena: this.contrasena
    }).subscribe({
      next: () => {
        this.estaCargando.set(false);
        this.router.navigate(['/panel']);
      },
      error: () => {
        this.estaCargando.set(false);
        this.error.set('Credenciales incorrectas');
      }
    });
  }
}
