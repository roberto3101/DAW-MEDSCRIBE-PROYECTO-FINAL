import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { LucideAngularModule, Mic, FileText, Users, Activity } from 'lucide-angular';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AutenticacionService } from '../../servicios/autenticacion.service';
import { ConsultaService } from '../../servicios/consulta.service';
import { PacienteService } from '../../servicios/paciente.service';
import { DocumentoService } from '../../servicios/documento.service';

@Component({
  selector: 'app-pagina-panel',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  template: `
    <div class="space-y-8">
      <div>
        <h1 class="text-2xl font-bold text-slate-800">
          Buen dia, {{ primerNombre() }}
        </h1>
        <p class="text-slate-400 mt-1">
          <ng-container *ngIf="usuario()?.nombreClinica">{{ usuario()?.nombreClinica }} — </ng-container>
          Panel de control de MedScribe AI
        </p>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div class="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition-shadow">
          <div class="flex items-center justify-between mb-3">
            <div class="w-10 h-10 rounded-lg flex items-center justify-center bg-medico-50 text-medico-600">
              <lucide-icon [img]="iconoActivity" class="w-5 h-5"></lucide-icon>
            </div>
          </div>
          <p class="text-2xl font-bold text-slate-800">{{ totalConsultas() }}</p>
          <p class="text-sm text-slate-400 mt-0.5">Consultas Registradas</p>
        </div>

        <div class="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition-shadow">
          <div class="flex items-center justify-between mb-3">
            <div class="w-10 h-10 rounded-lg flex items-center justify-center bg-cyan-50 text-cyan-600">
              <lucide-icon [img]="iconoUsers" class="w-5 h-5"></lucide-icon>
            </div>
          </div>
          <p class="text-2xl font-bold text-slate-800">{{ totalPacientes() }}</p>
          <p class="text-sm text-slate-400 mt-0.5">Pacientes Registrados</p>
        </div>

        <div class="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition-shadow">
          <div class="flex items-center justify-between mb-3">
            <div class="w-10 h-10 rounded-lg flex items-center justify-center bg-emerald-50 text-emerald-600">
              <lucide-icon [img]="iconoFileText" class="w-5 h-5"></lucide-icon>
            </div>
          </div>
          <p class="text-2xl font-bold text-slate-800">{{ totalDocumentos() }}</p>
          <p class="text-sm text-slate-400 mt-0.5">Documentos Generados</p>
        </div>
      </div>

      <button (click)="router.navigate(['/consultas/nueva'])"
        class="w-full bg-gradient-to-br from-medico-500 to-medico-600 rounded-xl p-6 text-white hover:from-medico-600 hover:to-medico-700 transition-all shadow-lg shadow-medico-200 group text-left">
        <div class="flex items-center gap-4">
          <div class="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
            <lucide-icon [img]="iconoMic" class="w-7 h-7"></lucide-icon>
          </div>
          <div>
            <h3 class="text-lg font-semibold">Nueva Consulta</h3>
            <p class="text-medico-100 text-sm mt-0.5">Grabar y transcribir una consulta medica</p>
          </div>
        </div>
      </button>
    </div>
  `
})
export class PaginaPanelComponent {
  private readonly autenticacion = inject(AutenticacionService);
  private readonly consultaService = inject(ConsultaService);
  private readonly pacienteService = inject(PacienteService);
  private readonly documentoService = inject(DocumentoService);
  readonly router = inject(Router);

  iconoMic = Mic;
  iconoFileText = FileText;
  iconoUsers = Users;
  iconoActivity = Activity;

  usuario = this.autenticacion.usuario;
  primerNombre = () => this.usuario()?.nombreCompleto?.split(' ')[0] || '';

  totalConsultas = signal(0);
  totalPacientes = signal(0);
  totalDocumentos = signal(0);

  constructor() {
    this.cargarEstadisticas();
  }

  cargarEstadisticas(): void {
    forkJoin({
      consultas: this.consultaService.listarTodas().pipe(catchError(() => of([]))),
      pacientes: this.pacienteService.listarPacientes().pipe(catchError(() => of([]))),
      documentos: this.documentoService.listarTodos().pipe(catchError(() => of([])))
    }).subscribe(({ consultas, pacientes, documentos }) => {
      this.totalConsultas.set(consultas?.length || 0);
      this.totalPacientes.set(pacientes?.length || 0);
      this.totalDocumentos.set(documentos?.length || 0);
    });
  }
}
