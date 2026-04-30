import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  LucideAngularModule,
  ArrowLeft,
  FileText,
  CheckCircle,
  XCircle,
  Edit3,
  Download,
  User,
  Stethoscope,
  Mic
} from 'lucide-angular';
import { CargandoComponent } from '../../componentes/comunes/cargando.component';
import { EditorNotaClinicaComponent } from '../../componentes/comunes/editor-nota-clinica.component';
import { Consulta } from '../../modelos/consulta.model';
import { Paciente } from '../../modelos/paciente.model';
import { AutenticacionService } from '../../servicios/autenticacion.service';
import { ConsultaService } from '../../servicios/consulta.service';
import { PacienteService } from '../../servicios/paciente.service';
import { DocumentoService } from '../../servicios/documento.service';

@Component({
  selector: 'app-pagina-detalle-consulta',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, CargandoComponent, EditorNotaClinicaComponent],
  template: `
    <app-cargando *ngIf="estaCargando(); else contenido"></app-cargando>

    <ng-template #contenido>
      <div *ngIf="consulta()" class="space-y-6 max-w-5xl">
        <div class="flex items-center gap-4">
          <button (click)="router.navigate(['/consultas'])"
            class="p-2 rounded-lg hover:bg-slate-100 transition-colors">
            <lucide-icon [img]="iconoArrowLeft" class="w-5 h-5 text-slate-400"></lucide-icon>
          </button>
          <div class="flex-1">
            <h1 class="text-xl font-bold text-slate-800">Consulta #{{ consulta()!.idConsulta }}</h1>
            <p class="text-sm text-slate-400">{{ fechaFormateada() }}</p>
          </div>
          <span class="text-xs font-semibold px-3 py-1.5 rounded-full border"
            [ngClass]="colorEstado(consulta()!.estadoActualDeLaConsulta)">
            {{ consulta()!.estadoActualDeLaConsulta }}
          </span>
        </div>

        <div *ngIf="mensajeAccion()" class="bg-emerald-50 text-emerald-600 text-sm px-4 py-3 rounded-lg border border-emerald-100 flex items-center gap-2">
          <lucide-icon [img]="iconoCheckCircle" class="w-4 h-4"></lucide-icon>
          {{ mensajeAccion() }}
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div class="bg-white rounded-xl border border-slate-200 p-5">
            <h3 class="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1">
              <lucide-icon [img]="iconoUser" class="w-3.5 h-3.5 text-medico-500"></lucide-icon> Paciente
            </h3>
            <div *ngIf="paciente(); else sinPaciente" class="space-y-2">
              <p class="text-sm font-semibold text-slate-800">{{ paciente()!.nombreDelPaciente }} {{ paciente()!.apellidoDelPaciente }}</p>
              <p class="text-xs text-slate-500">{{ paciente()!.tipoDocumentoIdentidad }}: {{ paciente()!.numeroDocumentoIdentidad }}</p>
              <p class="text-xs text-slate-500">{{ paciente()!.sexoBiologico }} — {{ (paciente()!.fechaDeNacimiento || '').split('T')[0] }}</p>
              <p *ngIf="paciente()!.telefonoDeContacto" class="text-xs text-slate-500">Tel: {{ paciente()!.telefonoDeContacto }}</p>
            </div>
            <ng-template #sinPaciente>
              <p class="text-xs text-slate-400">Sin paciente vinculado</p>
            </ng-template>
          </div>

          <div class="bg-white rounded-xl border border-slate-200 p-5">
            <h3 class="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1">
              <lucide-icon [img]="iconoStethoscope" class="w-3.5 h-3.5 text-medico-500"></lucide-icon> Consulta
            </h3>
            <div class="space-y-2">
              <div class="flex justify-between"><span class="text-xs text-slate-400">Tipo</span><span class="text-xs font-medium text-slate-700">{{ consulta()!.tipoDocumentoClinico }}</span></div>
              <div class="flex justify-between"><span class="text-xs text-slate-400">Especialidad</span><span class="text-xs font-medium text-slate-700">{{ consulta()!.especialidadMedicaAplicada }}</span></div>
              <div class="flex justify-between"><span class="text-xs text-slate-400">Fecha</span><span class="text-xs font-medium text-slate-700">{{ soloFecha() }}</span></div>
              <div class="flex justify-between"><span class="text-xs text-slate-400">Hora</span><span class="text-xs font-medium text-slate-700">{{ soloHora() }}</span></div>
            </div>
          </div>

          <div class="bg-white rounded-xl border border-slate-200 p-5">
            <h3 class="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Acciones</h3>
            <div class="space-y-2">
              <button *ngIf="esBorrador() && puedeEditar" (click)="aprobarConsulta()"
                class="w-full flex items-center justify-center gap-2 py-2 bg-emerald-500 text-white rounded-lg text-xs font-medium hover:bg-emerald-600 transition-colors">
                <lucide-icon [img]="iconoCheckCircle" class="w-3.5 h-3.5"></lucide-icon> Aprobar Consulta
              </button>
              <button *ngIf="esBorrador() && puedeEliminar" (click)="rechazarConsulta()"
                class="w-full flex items-center justify-center gap-2 py-2 border border-red-200 text-red-500 rounded-lg text-xs font-medium hover:bg-red-50 transition-colors">
                <lucide-icon [img]="iconoXCircle" class="w-3.5 h-3.5"></lucide-icon> Rechazar
              </button>
            </div>
          </div>
        </div>

        <div *ngIf="consulta()!.transcripcionDelAudio" class="bg-white rounded-xl border border-slate-200 p-6">
          <h3 class="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-2">
            <lucide-icon [img]="iconoMic" class="w-4 h-4 text-medico-500"></lucide-icon> Transcripcion del Audio
          </h3>
          <p class="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap bg-slate-50 rounded-lg p-4 max-h-48 overflow-y-auto">
            {{ consulta()!.transcripcionDelAudio }}
          </p>
        </div>

        <div class="bg-white rounded-xl border border-slate-200 p-6">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-sm font-semibold text-slate-800 flex items-center gap-2">
              <lucide-icon [img]="estaEditando() ? iconoEdit3 : iconoFileText" class="w-4 h-4"
                [ngClass]="estaEditando() ? 'text-amber-500' : 'text-medico-500'"></lucide-icon>
              {{ estaEditando() ? 'Editando Nota Clinica' : 'Nota Clinica' }}
            </h3>
            <button *ngIf="!estaEditando() && esBorrador() && puedeEditar" (click)="estaEditando.set(true)"
              class="flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-lg border border-amber-200 text-amber-600 hover:bg-amber-50 transition-colors">
              <lucide-icon [img]="iconoEdit3" class="w-3 h-3"></lucide-icon> Editar
            </button>
          </div>

          <app-editor-nota-clinica *ngIf="estaEditando()"
            [notaClinicaOriginal]="consulta()!.notaClinicaEstructurada || ''"
            (alGuardar)="guardarNotaEditada($event)"
            (alCancelar)="estaEditando.set(false)">
          </app-editor-nota-clinica>

          <div *ngIf="!estaEditando()" class="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
            {{ consulta()!.notaClinicaEstructurada || 'Sin nota clinica generada' }}
          </div>
        </div>
      </div>
    </ng-template>
  `
})
export class PaginaDetalleConsultaComponent {
  private readonly consultaService = inject(ConsultaService);
  private readonly pacienteService = inject(PacienteService);
  private readonly autenticacion = inject(AutenticacionService);
  private readonly route = inject(ActivatedRoute);
  readonly router = inject(Router);

  iconoArrowLeft = ArrowLeft;
  iconoFileText = FileText;
  iconoCheckCircle = CheckCircle;
  iconoXCircle = XCircle;
  iconoEdit3 = Edit3;
  iconoUser = User;
  iconoStethoscope = Stethoscope;
  iconoMic = Mic;

  consulta = signal<Consulta | null>(null);
  paciente = signal<Paciente | null>(null);
  estaCargando = signal(true);
  estaEditando = signal(false);
  mensajeAccion = signal('');

  puedeEditar = this.autenticacion.tienePermiso('consultas', 'editar');
  puedeEliminar = this.autenticacion.tienePermiso('consultas', 'eliminar');

  esBorrador = () => this.consulta()?.estadoActualDeLaConsulta === 'Borrador';
  fechaFormateada = () => {
    const c = this.consulta();
    if (!c?.fechaYHoraDeLaConsulta) return '';
    const partes = c.fechaYHoraDeLaConsulta.split('T');
    return `${partes[0]} a las ${partes[1] ? partes[1].substring(0, 5) : ''}`;
  };
  soloFecha = () => this.consulta()?.fechaYHoraDeLaConsulta?.split('T')[0] || '';
  soloHora = () => {
    const partes = this.consulta()?.fechaYHoraDeLaConsulta?.split('T');
    return partes?.[1] ? partes[1].substring(0, 5) : '';
  };

  constructor() {
    const idParam = this.route.snapshot.paramMap.get('id');
    const id = Number(idParam);
    if (!id) {
      this.router.navigate(['/consultas']);
      return;
    }
    this.cargarConsulta(id);
  }

  cargarConsulta(id: number): void {
    this.consultaService.buscarConsultaPorId(id).subscribe({
      next: (consulta) => {
        this.consulta.set(consulta);
        if (consulta.idPacienteAtendido) {
          this.pacienteService.buscarPacientePorId(consulta.idPacienteAtendido).subscribe({
            next: (p) => {
              this.paciente.set(p);
              this.estaCargando.set(false);
            },
            error: () => this.estaCargando.set(false)
          });
        } else {
          this.estaCargando.set(false);
        }
      },
      error: () => {
        this.estaCargando.set(false);
        this.router.navigate(['/consultas']);
      }
    });
  }

  aprobarConsulta(): void {
    const id = this.consulta()?.idConsulta;
    if (!id) return;
    this.consultaService.aprobarConsulta(id).subscribe({
      next: () => {
        this.consulta.update(prev => prev ? { ...prev, estadoActualDeLaConsulta: 'Aprobado' } : null);
        this.mensajeAccion.set('Consulta aprobada exitosamente');
        setTimeout(() => this.mensajeAccion.set(''), 3000);
      }
    });
  }

  rechazarConsulta(): void {
    if (!confirm('Rechazar esta consulta? La nota clinica no se podra utilizar.')) return;
    const id = this.consulta()?.idConsulta;
    if (!id) return;
    this.consultaService.rechazarConsulta(id).subscribe({
      next: () => {
        this.consulta.update(prev => prev ? { ...prev, estadoActualDeLaConsulta: 'Rechazado' } : null);
        this.mensajeAccion.set('Consulta rechazada');
        setTimeout(() => this.mensajeAccion.set(''), 3000);
      }
    });
  }

  guardarNotaEditada(notaEditada: string): void {
    this.consulta.update(prev => prev ? { ...prev, notaClinicaEstructurada: notaEditada } : null);
    this.estaEditando.set(false);
    this.mensajeAccion.set('Nota clinica actualizada');
    setTimeout(() => this.mensajeAccion.set(''), 3000);
  }

  colorEstado(estado: string | undefined): string {
    const colores: Record<string, string> = {
      Borrador: 'bg-amber-50 text-amber-600 border-amber-200',
      Aprobado: 'bg-emerald-50 text-emerald-600 border-emerald-200',
      Rechazado: 'bg-red-50 text-red-500 border-red-200',
    };
    return colores[estado || ''] || 'bg-slate-100 text-slate-500 border-slate-200';
  }
}
