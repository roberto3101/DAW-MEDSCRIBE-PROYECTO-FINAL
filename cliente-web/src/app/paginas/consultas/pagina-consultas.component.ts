import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  LucideAngularModule,
  Activity,
  Search,
  Filter,
  Clock,
  CheckCircle,
  XCircle,
  FileEdit,
  ChevronRight
} from 'lucide-angular';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { CargandoComponent } from '../../componentes/comunes/cargando.component';
import { Consulta } from '../../modelos/consulta.model';
import { Paciente } from '../../modelos/paciente.model';
import { ConsultaService } from '../../servicios/consulta.service';
import { PacienteService } from '../../servicios/paciente.service';

@Component({
  selector: 'app-pagina-consultas',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule, CargandoComponent],
  template: `
    <app-cargando *ngIf="estaCargando(); else contenido"></app-cargando>

    <ng-template #contenido>
      <div class="space-y-6">
        <div>
          <h1 class="text-2xl font-bold text-slate-800 flex items-center gap-3">
            <lucide-icon [img]="iconoActivity" class="w-7 h-7 text-medico-500"></lucide-icon>
            Consultas
          </h1>
          <p class="text-slate-400 mt-1">{{ contadores().total }} consultas registradas</p>
        </div>

        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <button *ngFor="let tarjeta of tarjetasEstado()" (click)="toggleFiltroEstado(tarjeta.filtro)"
            class="p-3 rounded-xl border text-left transition-all"
            [ngClass]="filtroEstado() === tarjeta.filtro ? tarjeta.color + ' shadow-sm ring-2 ring-offset-1 ring-current/20' : 'bg-white border-slate-200 hover:bg-slate-50'">
            <p class="text-xl font-bold">{{ tarjeta.valor }}</p>
            <p class="text-xs">{{ tarjeta.etiqueta }}</p>
          </button>
        </div>

        <div class="flex flex-wrap gap-3">
          <div class="flex-1 min-w-[200px] relative">
            <lucide-icon [img]="iconoSearch" class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300"></lucide-icon>
            <input type="text" [(ngModel)]="busqueda"
              placeholder="Buscar por paciente o especialidad..."
              class="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-medico-500/20 focus:border-medico-400" />
          </div>
          <select [(ngModel)]="filtroTipo"
            class="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-medico-500/20">
            <option value="">Todos los tipos</option>
            <option value="SOAP">Nota SOAP</option>
            <option value="HistoriaClinica">Historia Clinica</option>
            <option value="Receta">Receta</option>
          </select>
          <button *ngIf="filtroEstado() || filtroTipo || busqueda" (click)="limpiarFiltros()"
            class="px-3 py-2 border border-slate-200 text-slate-500 rounded-lg text-sm hover:bg-slate-50 flex items-center gap-1">
            <lucide-icon [img]="iconoFilter" class="w-3 h-3"></lucide-icon> Limpiar
          </button>
        </div>

        <div *ngIf="consultasFiltradas().length === 0; else listaConsultas"
          class="bg-white rounded-xl border border-slate-200 border-dashed p-16 text-center">
          <lucide-icon [img]="iconoActivity" class="w-16 h-16 text-slate-200 mx-auto mb-4"></lucide-icon>
          <p class="text-slate-400 text-sm">No hay consultas{{ (filtroEstado() || filtroTipo || busqueda) ? ' con esos filtros' : '' }}</p>
        </div>

        <ng-template #listaConsultas>
          <div class="space-y-2">
            <button *ngFor="let consulta of consultasFiltradas()"
              (click)="router.navigate(['/consultas', consulta.idConsulta])"
              class="w-full bg-white rounded-xl border border-slate-200 p-4 hover:shadow-md hover:border-medico-200 transition-all text-left group">
              <div class="flex items-start gap-4">
                <div class="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                  [ngClass]="colorEstado(consulta.estadoActualDeLaConsulta)">
                  <lucide-icon [img]="iconoEstado(consulta.estadoActualDeLaConsulta)" class="w-5 h-5"></lucide-icon>
                </div>
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2 mb-1">
                    <p class="text-sm font-semibold text-slate-800 truncate">{{ nombrePaciente(consulta.idPacienteAtendido) }}</p>
                    <span class="text-[10px] font-medium px-2 py-0.5 rounded-full flex-shrink-0"
                      [ngClass]="colorEstado(consulta.estadoActualDeLaConsulta)">
                      {{ consulta.estadoActualDeLaConsulta }}
                    </span>
                  </div>
                  <div class="flex items-center gap-3 text-xs text-slate-400 mb-2">
                    <span>{{ consulta.tipoDocumentoClinico }}</span>
                    <span>&bull;</span>
                    <span>{{ consulta.especialidadMedicaAplicada }}</span>
                    <span>&bull;</span>
                    <span>{{ fechaFormateada(consulta.fechaYHoraDeLaConsulta) }}</span>
                  </div>
                  <p class="text-xs text-slate-400 truncate">{{ preview(consulta.notaClinicaEstructurada) }}...</p>
                </div>
                <lucide-icon [img]="iconoChevronRight" class="w-5 h-5 text-slate-300 group-hover:text-medico-500 transition-colors flex-shrink-0 mt-2"></lucide-icon>
              </div>
            </button>
          </div>
        </ng-template>
      </div>
    </ng-template>
  `
})
export class PaginaConsultasComponent {
  private readonly consultaService = inject(ConsultaService);
  private readonly pacienteService = inject(PacienteService);
  readonly router = inject(Router);

  iconoActivity = Activity;
  iconoSearch = Search;
  iconoFilter = Filter;
  iconoChevronRight = ChevronRight;

  consultas = signal<Consulta[]>([]);
  pacientesMap = signal<Record<number, string>>({});
  estaCargando = signal(true);
  filtroEstado = signal('');
  filtroTipo = '';
  busqueda = '';

  contadores = computed(() => {
    const lista = this.consultas();
    return {
      total: lista.length,
      borrador: lista.filter(c => c.estadoActualDeLaConsulta === 'Borrador').length,
      aprobado: lista.filter(c => c.estadoActualDeLaConsulta === 'Aprobado').length,
      rechazado: lista.filter(c => c.estadoActualDeLaConsulta === 'Rechazado').length,
    };
  });

  tarjetasEstado = computed(() => [
    { etiqueta: 'Todas', valor: this.contadores().total, filtro: '', color: 'bg-slate-50 text-slate-600 border-slate-200' },
    { etiqueta: 'Borrador', valor: this.contadores().borrador, filtro: 'Borrador', color: 'bg-amber-50 text-amber-600 border-amber-200' },
    { etiqueta: 'Aprobadas', valor: this.contadores().aprobado, filtro: 'Aprobado', color: 'bg-emerald-50 text-emerald-600 border-emerald-200' },
    { etiqueta: 'Rechazadas', valor: this.contadores().rechazado, filtro: 'Rechazado', color: 'bg-red-50 text-red-500 border-red-200' },
  ]);

  consultasFiltradas = computed(() => {
    return this.consultas().filter(c => {
      if (this.filtroEstado() && c.estadoActualDeLaConsulta !== this.filtroEstado()) return false;
      if (this.filtroTipo && c.tipoDocumentoClinico !== this.filtroTipo) return false;
      if (this.busqueda) {
        const nombre = (this.pacientesMap()[c.idPacienteAtendido] || '').toLowerCase();
        const q = this.busqueda.toLowerCase();
        if (!nombre.includes(q) && !c.especialidadMedicaAplicada.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  });

  constructor() {
    this.cargarDatos();
  }

  cargarDatos(): void {
    forkJoin({
      consultas: this.consultaService.listarTodas().pipe(catchError(() => of([] as Consulta[]))),
      pacientes: this.pacienteService.listarPacientes().pipe(catchError(() => of([] as Paciente[])))
    }).subscribe(({ consultas, pacientes }) => {
      this.consultas.set(consultas || []);
      const mapa: Record<number, string> = {};
      for (const p of (pacientes || [])) mapa[p.idPaciente] = `${p.nombreDelPaciente} ${p.apellidoDelPaciente}`;
      this.pacientesMap.set(mapa);
      this.estaCargando.set(false);
    });
  }

  toggleFiltroEstado(filtro: string): void {
    this.filtroEstado.set(this.filtroEstado() === filtro ? '' : filtro);
  }

  limpiarFiltros(): void {
    this.filtroEstado.set('');
    this.filtroTipo = '';
    this.busqueda = '';
  }

  colorEstado(estado: string | undefined): string {
    const colores: Record<string, string> = {
      Grabando: 'bg-blue-50 text-blue-600',
      Transcribiendo: 'bg-cyan-50 text-cyan-600',
      Procesando: 'bg-amber-50 text-amber-600',
      Borrador: 'bg-amber-50 text-amber-600',
      Aprobado: 'bg-emerald-50 text-emerald-600',
      Rechazado: 'bg-red-50 text-red-500',
    };
    return colores[estado || ''] || 'bg-slate-100 text-slate-500';
  }

  iconoEstado(estado: string | undefined): any {
    const iconos: Record<string, any> = {
      Borrador: FileEdit,
      Aprobado: CheckCircle,
      Rechazado: XCircle,
    };
    return iconos[estado || ''] || Clock;
  }

  nombrePaciente(id: number): string {
    return this.pacientesMap()[id] || 'Paciente no identificado';
  }

  fechaFormateada(fecha?: string): string {
    if (!fecha) return '';
    const partes = fecha.split('T');
    const hora = partes[1] ? partes[1].substring(0, 5) : '';
    return `${partes[0]} ${hora}`;
  }

  preview(nota?: string): string {
    if (!nota) return 'Sin nota clinica';
    return nota.substring(0, 120).replace(/[#*]/g, '');
  }
}
