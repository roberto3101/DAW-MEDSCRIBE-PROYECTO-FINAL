import { CommonModule } from '@angular/common';
import { Component, ElementRef, ViewChild, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  LucideAngularModule,
  Mic,
  Square,
  Send,
  FileText,
  CheckCircle,
  RotateCcw,
  Download,
  Edit3,
  Search,
  Clock,
  User,
  UserPlus,
  AlertCircle,
  Users,
  Eye
} from 'lucide-angular';
import { EditorNotaClinicaComponent } from '../../componentes/comunes/editor-nota-clinica.component';
import { Paciente } from '../../modelos/paciente.model';
import { AutenticacionService } from '../../servicios/autenticacion.service';
import { ConsultaService } from '../../servicios/consulta.service';
import { PacienteService } from '../../servicios/paciente.service';

type EstadoFlujo = 'esperando' | 'grabando' | 'detenido' | 'transcribiendo' | 'procesando' | 'completado';

const ETIQUETAS: Record<EstadoFlujo, string> = {
  esperando: 'Presiona el microfono para iniciar',
  grabando: 'Grabando consulta...',
  detenido: 'Grabacion lista. Procesa con IA o graba de nuevo.',
  transcribiendo: 'Transcribiendo audio con IA...',
  procesando: 'Generando nota clinica...',
  completado: 'Documento generado exitosamente',
};

const IA_BASE = 'http://localhost:8000';

@Component({
  selector: 'app-pagina-nueva-consulta',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule, EditorNotaClinicaComponent],
  template: `
    <div class="space-y-6">
      <div>
        <h1 class="text-2xl font-bold text-slate-800 flex items-center gap-3">
          <lucide-icon [img]="iconoMic" class="w-7 h-7 text-medico-500"></lucide-icon>
          Nueva Consulta
        </h1>
        <p class="text-slate-400 mt-1">Graba la consulta y genera el documento clinico</p>
      </div>

      <div #seccionPaciente class="bg-white rounded-xl border p-5 mb-6 transition-all duration-500"
        [ngClass]="resaltarSeccionPaciente() ? 'border-amber-300 shadow-[0_0_0_4px_rgba(251,191,36,0.18)] ring-2 ring-amber-200' : (!pacienteEncontrado() ? 'border-amber-200/70' : 'border-slate-200')">
        <div class="flex items-center justify-between mb-3">
          <h3 class="text-sm font-semibold text-slate-800 flex items-center gap-2">
            <lucide-icon [img]="iconoUser" class="w-4 h-4 text-medico-500"></lucide-icon>
            Paciente
            <span *ngIf="!pacienteEncontrado()" class="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-200">
              Requerido
            </span>
          </h3>
          <span *ngIf="pacienteEncontrado()" class="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200">
            <lucide-icon [img]="iconoCheckCircle" class="w-3 h-3"></lucide-icon> Seleccionado
          </span>
        </div>

        <div class="flex gap-3">
          <div class="flex-1 relative">
            <lucide-icon [img]="iconoSearch" class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300"></lucide-icon>
            <input #inputBusqueda type="text" [ngModel]="textoBusqueda()"
              (ngModelChange)="manejarCambioBusqueda($event)"
              (focus)="alEnfocarBusqueda()"
              (keydown.enter)="buscarPaciente()"
              placeholder="Busca por DNI o nombre del paciente"
              autocomplete="off"
              class="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-medico-500/20 focus:border-medico-400" />

            <div *ngIf="mostrarSugerencias() && !pacienteEncontrado() && textoBusqueda().trim().length >= 2"
              class="absolute top-full left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-lg shadow-lg z-20 max-h-72 overflow-y-auto">
              <div *ngIf="cargandoLista() && sugerencias().length === 0" class="px-4 py-3 text-xs text-slate-400">Cargando pacientes...</div>
              <div *ngIf="!cargandoLista() && sugerencias().length === 0" class="px-4 py-3 text-xs text-slate-400">
                Sin coincidencias.
              </div>
              <button *ngFor="let p of sugerencias()" type="button"
                (mousedown)="seleccionarPaciente(p); $event.preventDefault()"
                class="w-full text-left px-4 py-2.5 hover:bg-medico-50 border-b border-slate-100 last:border-b-0 transition-colors">
                <p class="text-sm font-medium text-slate-800">{{ p.nombreDelPaciente }} {{ p.apellidoDelPaciente }}</p>
                <div class="flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-slate-400 mt-0.5">
                  <span>{{ p.tipoDocumentoIdentidad }}: {{ p.numeroDocumentoIdentidad }}</span>
                  <span *ngIf="p.sexoBiologico">{{ p.sexoBiologico }}</span>
                  <span *ngIf="p.fechaDeNacimiento">{{ (p.fechaDeNacimiento || '').split('T')[0] }}</span>
                </div>
              </button>
            </div>
          </div>
          <button type="button" (click)="buscarPaciente()" [disabled]="textoBusqueda().trim().length < 2 || buscandoPaciente()"
            class="px-4 py-2.5 bg-medico-500 text-white rounded-lg text-sm font-medium hover:bg-medico-600 transition-colors disabled:opacity-50">
            {{ buscandoPaciente() ? '...' : 'Buscar' }}
          </button>
        </div>

        <div *ngIf="pacienteEncontrado() as pac" class="mt-3 p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
          <div class="flex items-start justify-between">
            <div>
              <p class="text-sm font-semibold text-slate-800">{{ pac.nombreDelPaciente }} {{ pac.apellidoDelPaciente }}</p>
              <div class="flex flex-wrap gap-3 mt-1 text-xs text-slate-500">
                <span>{{ pac.tipoDocumentoIdentidad }}: {{ pac.numeroDocumentoIdentidad }}</span>
                <span>{{ pac.sexoBiologico }}</span>
                <span>{{ (pac.fechaDeNacimiento || '').split('T')[0] }}</span>
                <span *ngIf="pac.telefonoDeContacto">Tel: {{ pac.telefonoDeContacto }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div class="space-y-4">
          <div class="bg-white rounded-xl border border-slate-200 p-6">
            <div class="grid grid-cols-2 gap-4 mb-6">
              <div>
                <label class="block text-sm font-medium text-slate-600 mb-1">Tipo de Documento</label>
                <select [(ngModel)]="tipoDocumento" [disabled]="estadoFlujo() !== 'esperando'"
                  class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-medico-500/20 disabled:opacity-50">
                  <option value="SOAP">Nota SOAP</option>
                  <option value="HistoriaClinica">Historia Clinica</option>
                  <option value="Receta">Receta Medica</option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium text-slate-600 mb-1">Especialidad</label>
                <select [(ngModel)]="especialidad" [disabled]="estadoFlujo() !== 'esperando'"
                  class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-medico-500/20 disabled:opacity-50">
                  <option>Medicina General</option>
                  <option>Pediatria</option>
                  <option>Cardiologia</option>
                  <option>Ginecologia</option>
                  <option>Traumatologia</option>
                  <option>Dermatologia</option>
                </select>
              </div>
            </div>

            <div class="flex items-center justify-between p-3 bg-slate-50 rounded-lg mb-4">
              <div class="flex items-center gap-2">
                <lucide-icon [img]="iconoUsers" class="w-4 h-4 text-medico-500"></lucide-icon>
                <span class="text-sm font-medium text-slate-600">Separar voces (diarizacion)</span>
              </div>
              <button type="button" (click)="diarizacionActiva.set(!diarizacionActiva())"
                [disabled]="estadoFlujo() !== 'esperando' && estadoFlujo() !== 'detenido'"
                [ngClass]="diarizacionActiva() ? 'bg-medico-500' : 'bg-slate-300'"
                class="relative w-11 h-6 rounded-full transition-colors duration-200 disabled:opacity-50">
                <div class="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200"
                  [ngClass]="diarizacionActiva() ? 'translate-x-5' : 'translate-x-0'"></div>
              </button>
            </div>

            <div *ngIf="diarizacionActiva()" class="flex gap-2 mb-4">
              <button type="button" (click)="motorDiarizacion.set('pyannote')"
                [ngClass]="motorDiarizacion() === 'pyannote' ? 'bg-medico-50 border-medico-300 text-medico-700' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'"
                class="flex-1 text-xs font-medium px-3 py-2 rounded-lg border transition-colors">
                Pyannote (local, gratuito)
              </button>
              <button type="button" (click)="motorDiarizacion.set('deepgram')"
                [ngClass]="motorDiarizacion() === 'deepgram' ? 'bg-medico-50 border-medico-300 text-medico-700' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'"
                class="flex-1 text-xs font-medium px-3 py-2 rounded-lg border transition-colors">
                Deepgram (cloud, preciso)
              </button>
            </div>

            <div *ngIf="!pacienteEncontrado() && estadoFlujo() === 'esperando'"
              (click)="solicitarSeleccionPaciente()"
              class="w-full mb-5 flex items-center gap-3 px-4 py-3 rounded-lg bg-gradient-to-r from-amber-50 to-amber-50/60 border border-amber-200 hover:border-amber-300 hover:shadow-sm transition-all text-left cursor-pointer group">
              <div class="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0 group-hover:bg-amber-200 transition-colors">
                <lucide-icon [img]="iconoUserPlus" class="w-4 h-4 text-amber-600"></lucide-icon>
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-semibold text-amber-800">Selecciona un paciente para continuar</p>
                <p class="text-xs text-amber-600/80 mt-0.5">La grabacion se habilitara cuando vincules al paciente de esta consulta.</p>
              </div>
              <lucide-icon [img]="iconoAlert" class="w-4 h-4 text-amber-500 flex-shrink-0"></lucide-icon>
            </div>

            <div class="flex flex-col items-center py-8">
              <div class="relative">
                <div *ngIf="estadoFlujo() === 'grabando'" class="absolute inset-0 -m-2 rounded-full border-4 border-red-300 animate-ping"></div>
                <button type="button" (click)="alternarGrabacion($event)"
                  [disabled]="enProcesoIA() || estadoFlujo() === 'detenido'"
                  class="relative z-10 w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  [ngClass]="claseBotonMic()">
                  <lucide-icon *ngIf="estadoFlujo() === 'grabando'" [img]="iconoSquare" class="w-8 h-8 text-white"></lucide-icon>
                  <lucide-icon *ngIf="estadoFlujo() !== 'grabando'" [img]="iconoMic" class="w-10 h-10 text-white"></lucide-icon>
                </button>
              </div>

              <p *ngIf="estadoFlujo() === 'grabando' || estadoFlujo() === 'detenido'"
                class="text-2xl font-mono font-bold text-slate-800 mt-4">{{ duracionFormateada() }}</p>

              <p class="text-sm mt-4 font-medium"
                [ngClass]="claseTextoEstado()">
                {{ textoEstado() }}
              </p>

              <div *ngIf="enProcesoIA()" class="w-48 h-1.5 bg-slate-100 rounded-full mt-4 overflow-hidden">
                <div class="h-full bg-medico-500 rounded-full transition-all duration-1000"
                  [style.width]="estadoFlujo() === 'transcribiendo' ? '40%' : '80%'"></div>
              </div>
            </div>

            <div #accionesGrabacion *ngIf="audioListo() && estadoFlujo() === 'detenido'"
                 class="flex gap-3 sticky bottom-4 z-10 mt-4 bg-white/90 backdrop-blur-sm p-2 rounded-lg shadow-sm ring-1 ring-medico-200">
              <button type="button" (click)="reiniciarGrabacion()"
                class="flex-1 flex items-center justify-center gap-2 border border-slate-200 text-slate-600 py-2.5 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors">
                <lucide-icon [img]="iconoRotate" class="w-4 h-4"></lucide-icon> Grabar de nuevo
              </button>
              <button type="button" (click)="enviarAlServicioIA()"
                class="flex-1 flex items-center justify-center gap-2 bg-medico-500 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-medico-600 transition-colors shadow-sm ring-2 ring-medico-300">
                <lucide-icon [img]="iconoSend" class="w-4 h-4"></lucide-icon> Procesar con IA
              </button>
            </div>

            <button *ngIf="estadoFlujo() === 'completado'" type="button" (click)="reiniciarGrabacion()"
              class="w-full flex items-center justify-center gap-2 border border-medico-200 text-medico-600 py-2.5 rounded-lg text-sm font-medium hover:bg-medico-50 transition-colors">
              <lucide-icon [img]="iconoRotate" class="w-4 h-4"></lucide-icon> Nueva grabacion
            </button>
          </div>
        </div>

        <div class="space-y-4">
          <div *ngIf="transcripcion()" class="bg-white rounded-xl border border-slate-200 p-6">
            <h3 class="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-2">
              <lucide-icon [img]="iconoFileText" class="w-4 h-4 text-medico-500"></lucide-icon> Transcripcion
            </h3>
            <div *ngIf="infoDiarizacion() as info" class="flex flex-wrap items-center gap-2 mb-3">
              <span class="text-xs font-medium px-2.5 py-1 rounded-full bg-medico-50 text-medico-600">
                {{ info.hablantes_detectados }} hablantes
              </span>
              <span class="text-xs font-medium px-2.5 py-1 rounded-full bg-slate-100 text-slate-500">
                {{ info.segmentos?.length || 0 }} segmentos
              </span>
              <span *ngIf="info.motor" class="text-xs font-medium px-2.5 py-1 rounded-full bg-cyan-50 text-cyan-600">
                Motor: {{ info.motor === 'deepgram' ? 'Deepgram' : 'Pyannote' }}
              </span>
            </div>
            <p class="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">{{ transcripcion() }}</p>
          </div>

          <div *ngIf="notaClinica()" class="bg-white rounded-xl border border-slate-200 p-6">
            <ng-container *ngIf="estaEditando(); else vista">
              <h3 class="text-sm font-semibold text-slate-800 flex items-center gap-2 mb-4">
                <lucide-icon [img]="iconoEdit3" class="w-4 h-4 text-amber-500"></lucide-icon>
                Editando Nota Clinica
              </h3>
              <app-editor-nota-clinica
                [notaClinicaOriginal]="notaClinica()"
                (alGuardar)="guardarEdicionNota($event)"
                (alCancelar)="estaEditando.set(false)">
              </app-editor-nota-clinica>
            </ng-container>
            <ng-template #vista>
              <div class="flex items-center justify-between mb-3">
                <h3 class="text-sm font-semibold text-slate-800 flex items-center gap-2">
                  <lucide-icon [img]="iconoCheckCircle" class="w-4 h-4 text-exito"></lucide-icon>
                  Nota Clinica Generada
                </h3>
                <button (click)="estaEditando.set(true)"
                  class="flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-lg border border-amber-200 text-amber-600 hover:bg-amber-50 transition-colors">
                  <lucide-icon [img]="iconoEdit3" class="w-3 h-3"></lucide-icon> Editar antes de aprobar
                </button>
              </div>
              <div class="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">{{ notaClinica() }}</div>
              <div class="flex gap-3 mt-5 pt-4 border-t border-slate-100">
                <button (click)="descargarDocumento('pdf')"
                  class="flex-1 flex items-center justify-center gap-2 bg-red-50 text-red-600 py-2.5 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors">
                  <lucide-icon [img]="iconoDownload" class="w-4 h-4"></lucide-icon> Descargar PDF
                </button>
                <button (click)="descargarDocumento('word')"
                  class="flex-1 flex items-center justify-center gap-2 bg-medico-50 text-medico-600 py-2.5 rounded-lg text-sm font-medium hover:bg-medico-100 transition-colors">
                  <lucide-icon [img]="iconoDownload" class="w-4 h-4"></lucide-icon> Descargar Word
                </button>
              </div>
            </ng-template>
          </div>

          <div *ngIf="!transcripcion() && !notaClinica()"
            class="bg-white rounded-xl border border-slate-200 border-dashed p-12 flex flex-col items-center justify-center text-center">
            <lucide-icon [img]="iconoFileText" class="w-12 h-12 text-slate-200 mb-3"></lucide-icon>
            <p class="text-sm text-slate-400">La transcripcion y nota clinica apareceran aqui</p>
          </div>
        </div>
      </div>
    </div>
  `
})
export class PaginaNuevaConsultaComponent {
  private readonly pacienteService = inject(PacienteService);
  private readonly consultaService = inject(ConsultaService);
  private readonly autenticacion = inject(AutenticacionService);

  @ViewChild('seccionPaciente') seccionPacienteRef?: ElementRef<HTMLDivElement>;
  @ViewChild('inputBusqueda') inputBusquedaRef?: ElementRef<HTMLInputElement>;
  @ViewChild('accionesGrabacion') accionesGrabacionRef?: ElementRef<HTMLDivElement>;

  iconoMic = Mic;
  iconoSquare = Square;
  iconoSend = Send;
  iconoFileText = FileText;
  iconoCheckCircle = CheckCircle;
  iconoRotate = RotateCcw;
  iconoDownload = Download;
  iconoEdit3 = Edit3;
  iconoSearch = Search;
  iconoClock = Clock;
  iconoUser = User;
  iconoUserPlus = UserPlus;
  iconoAlert = AlertCircle;
  iconoUsers = Users;
  iconoEye = Eye;

  diarizacionActiva = signal(false);
  motorDiarizacion = signal<'pyannote' | 'deepgram'>('pyannote');
  infoDiarizacion = signal<any>(null);

  estadoFlujo = signal<EstadoFlujo>('esperando');
  tipoDocumento = 'SOAP';
  especialidad = 'Medicina General';
  transcripcion = signal('');
  notaClinica = signal('');
  estaEditando = signal(false);
  duracion = signal(0);
  audioListo = signal(false);

  textoBusqueda = signal('');
  pacienteEncontrado = signal<Paciente | null>(null);
  buscandoPaciente = signal(false);
  listaPacientes = signal<Paciente[]>([]);
  cargandoLista = signal(false);
  mostrarSugerencias = signal(false);
  listaCargada = signal(false);
  resaltarSeccionPaciente = signal(false);

  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private intervaloDuracion: any = null;
  private streamAudio: MediaStream | null = null;

  enProcesoIA = computed(() => this.estadoFlujo() === 'transcribiendo' || this.estadoFlujo() === 'procesando');
  duracionFormateada = computed(() => {
    const s = this.duracion();
    const m = Math.floor(s / 60);
    const r = s % 60;
    return `${m.toString().padStart(2, '0')}:${r.toString().padStart(2, '0')}`;
  });

  textoEstado = computed(() => {
    if (!this.pacienteEncontrado() && this.estadoFlujo() === 'esperando') {
      return 'Selecciona un paciente antes de grabar';
    }
    return ETIQUETAS[this.estadoFlujo()];
  });

  claseTextoEstado = computed(() => {
    const e = this.estadoFlujo();
    if (e === 'completado') return 'text-exito';
    if (e === 'grabando') return 'text-red-500';
    if (!this.pacienteEncontrado() && e === 'esperando') return 'text-amber-600';
    return 'text-slate-400';
  });

  claseBotonMic = computed(() => {
    const e = this.estadoFlujo();
    if (e === 'grabando') return 'bg-red-500 hover:bg-red-600 shadow-red-200 scale-110';
    if (!this.pacienteEncontrado() && e === 'esperando') return 'bg-gradient-to-br from-slate-300 to-slate-400 hover:from-amber-400 hover:to-amber-500 shadow-slate-200';
    return 'bg-gradient-to-br from-medico-500 to-medico-600 hover:from-medico-600 hover:to-medico-700 shadow-medico-200';
  });

  sugerencias = computed(() => {
    if (this.pacienteEncontrado() || this.textoBusqueda().trim().length < 2) return [];
    const q = this.normalizar(this.textoBusqueda());
    return this.listaPacientes().filter(p => {
      const nombre = this.normalizar(`${p.nombreDelPaciente || ''} ${p.apellidoDelPaciente || ''}`);
      const doc = (p.numeroDocumentoIdentidad || '').toLowerCase();
      return nombre.includes(q) || doc.includes(q);
    }).slice(0, 8);
  });

  normalizar(texto: string): string {
    return texto.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
  }

  manejarCambioBusqueda(valor: string): void {
    if (valor.length > 100) return;
    this.textoBusqueda.set(valor);
    this.mostrarSugerencias.set(true);
    if (this.pacienteEncontrado()) this.pacienteEncontrado.set(null);
    if (valor.trim().length >= 2) this.cargarListaPacientes();
  }

  alEnfocarBusqueda(): void {
    this.cargarListaPacientes();
    if (this.textoBusqueda().trim().length >= 2 && !this.pacienteEncontrado()) {
      this.mostrarSugerencias.set(true);
    }
  }

  cargarListaPacientes(): void {
    if (this.listaCargada() || this.cargandoLista()) return;
    this.cargandoLista.set(true);
    this.pacienteService.listarPacientes().subscribe({
      next: (datos) => {
        this.listaPacientes.set(datos);
        this.listaCargada.set(true);
        this.cargandoLista.set(false);
      },
      error: () => this.cargandoLista.set(false)
    });
  }

  buscarPaciente(): void {
    const q = this.textoBusqueda().trim();
    if (q.length < 2) return;
    this.buscandoPaciente.set(true);
    this.pacienteEncontrado.set(null);

    const esNumerico = /^\d+$/.test(q);
    if (esNumerico && q.length >= 8) {
      this.pacienteService.buscarPacientePorDocumento(q).subscribe({
        next: (paciente) => {
          this.seleccionarPaciente(paciente);
          this.buscandoPaciente.set(false);
        },
        error: () => {
          this.cargarListaPacientes();
          this.mostrarSugerencias.set(true);
          this.buscandoPaciente.set(false);
        }
      });
    } else {
      this.cargarListaPacientes();
      this.mostrarSugerencias.set(true);
      this.buscandoPaciente.set(false);
    }
  }

  seleccionarPaciente(paciente: Paciente): void {
    this.pacienteEncontrado.set(paciente);
    this.textoBusqueda.set(`${paciente.nombreDelPaciente} ${paciente.apellidoDelPaciente}`.trim());
    this.mostrarSugerencias.set(false);
  }

  solicitarSeleccionPaciente(): void {
    this.resaltarSeccionPaciente.set(true);
    this.seccionPacienteRef?.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setTimeout(() => this.inputBusquedaRef?.nativeElement.focus(), 350);
    setTimeout(() => this.resaltarSeccionPaciente.set(false), 2400);
  }

  async iniciarGrabacion(): Promise<void> {
    if (!this.pacienteEncontrado()) {
      this.solicitarSeleccionPaciente();
      return;
    }
    // Evitar doble inicio
    if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
      return;
    }
    try {
      const flujo = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.streamAudio = flujo;
      const grabador = new MediaRecorder(flujo, { mimeType: 'audio/webm;codecs=opus' });
      this.mediaRecorder = grabador;
      this.audioChunks = [];
      this.audioListo.set(false);
      this.transcripcion.set('');
      this.notaClinica.set('');

      grabador.ondataavailable = (e) => {
        // Aceptar TODOS los chunks (incluso size=0 algunos browsers los mandan asi)
        if (e.data) this.audioChunks.push(e.data);
        console.log('[MIC] chunk recibido, size=', e.data?.size, 'total chunks=', this.audioChunks.length);
      };
      grabador.onerror = (e) => {
        console.error('[MIC] error de grabacion:', e);
        alert('Error en la grabacion: ' + ((e as any)?.error?.message || 'desconocido'));
      };
      grabador.onstop = () => {
        console.log('[MIC] stop disparado, chunks=', this.audioChunks.length);
        this.limpiarIntervalo();
        this.liberarMicrofono();
        // Siempre marcar listo al detener: el blob se validara al procesar
        this.audioListo.set(true);
        if (this.estadoFlujo() === 'grabando') {
          this.estadoFlujo.set('detenido');
        }
      };

      // start(250): emite chunks cada 250ms — mas frecuente, menos riesgo de perder audio
      grabador.start(250);
      console.log('[MIC] grabacion iniciada, state=', grabador.state);
      this.estadoFlujo.set('grabando');
      this.duracion.set(0);
      this.intervaloDuracion = setInterval(() => this.duracion.update(d => d + 1), 1000);
    } catch {
      alert('No se pudo acceder al microfono. Verifica los permisos del navegador.');
    }
  }

  detenerGrabacion(): void {
    // Cambiar estado INMEDIATAMENTE para deshabilitar el boton y evitar doble click
    this.estadoFlujo.set('detenido');
    this.limpiarIntervalo();
    try {
      if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
        // Forzar flush del ultimo chunk antes de stop (por si no llego el burst)
        try { this.mediaRecorder.requestData(); } catch { /* ignore */ }
        this.mediaRecorder.stop();
      } else {
        this.liberarMicrofono();
        this.audioListo.set(true);
      }
    } catch {
      this.liberarMicrofono();
      this.audioListo.set(true);
    }
    // Scroll automatico a los botones "Procesar con IA" para que sean visibles
    setTimeout(() => {
      this.accionesGrabacionRef?.nativeElement?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 150);
  }

  private async transcribirConFallback(blob: Blob): Promise<any> {
    const construirFormData = () => {
      const fd = new FormData();
      fd.append('archivo', blob, 'consulta.webm');
      return fd;
    };

    // 1) Intento principal: respetando preferencia del usuario (diarizar si/no)
    const urlPrimaria = this.diarizacionActiva()
      ? `${IA_BASE}/api/ia/transcribir?diarizar=true&motor_diarizacion=${this.motorDiarizacion()}`
      : `${IA_BASE}/api/ia/transcribir`;
    try {
      const resp = await fetch(urlPrimaria, { method: 'POST', body: construirFormData() });
      if (resp.ok) return await resp.json();
      // Si es error temporal de proveedor (502/503/403/504) caemos al fallback
      if (![502, 503, 403, 504].includes(resp.status)) {
        throw new Error(`Error ${resp.status} en transcripcion`);
      }
    } catch (error) {
      // El intento primario fallo por red; probamos fallback
    }

    // 2) Fallback: Deepgram con diarizacion (motor mas robusto)
    const urlFallback = `${IA_BASE}/api/ia/transcribir?diarizar=true&motor_diarizacion=deepgram`;
    const respFallback = await fetch(urlFallback, { method: 'POST', body: construirFormData() });
    if (!respFallback.ok) {
      throw new Error(`Error ${respFallback.status} en transcripcion (fallback Deepgram)`);
    }
    return await respFallback.json();
  }

  alternarGrabacion(evento?: Event): void {
    evento?.preventDefault();
    evento?.stopPropagation();
    const estado = this.estadoFlujo();
    if (estado === 'grabando') {
      this.detenerGrabacion();
    } else if (estado === 'esperando') {
      this.iniciarGrabacion();
    }
    // Si esta 'detenido' o 'procesando', no hacer nada (boton deberia estar disabled)
  }

  reiniciarGrabacion(): void {
    this.audioChunks = [];
    this.audioListo.set(false);
    this.duracion.set(0);
    this.transcripcion.set('');
    this.notaClinica.set('');
    this.infoDiarizacion.set(null);
    this.estadoFlujo.set('esperando');
    this.estaEditando.set(false);
  }

  private limpiarIntervalo(): void {
    if (this.intervaloDuracion) {
      clearInterval(this.intervaloDuracion);
      this.intervaloDuracion = null;
    }
  }

  private liberarMicrofono(): void {
    if (this.streamAudio) {
      this.streamAudio.getTracks().forEach(t => t.stop());
      this.streamAudio = null;
    }
  }

  async enviarAlServicioIA(): Promise<void> {
    console.log('[IA] enviar: chunks=', this.audioChunks.length);
    if (this.audioChunks.length === 0) {
      alert('No se capturo audio. Verifica los permisos del microfono y graba de nuevo.');
      this.estadoFlujo.set('esperando');
      return;
    }
    const blob = new Blob(this.audioChunks, { type: 'audio/webm' });
    console.log('[IA] blob size=', blob.size);
    if (blob.size === 0) {
      alert('El audio grabado esta vacio. Verifica el microfono y graba de nuevo.');
      this.estadoFlujo.set('esperando');
      return;
    }
    this.estadoFlujo.set('transcribiendo');
    try {
      const datosTranscripcion = await this.transcribirConFallback(blob);
      const textoTranscrito = (datosTranscripcion?.transcripcion || '').trim();
      if (!textoTranscrito || textoTranscrito.length < 10) {
        this.estadoFlujo.set('detenido');
        alert('La transcripcion esta vacia o es muy corta (menos de 10 caracteres). Habla mas fuerte y vuelve a grabar.');
        return;
      }
      this.transcripcion.set(textoTranscrito);
      if (datosTranscripcion.diarizacion) {
        this.infoDiarizacion.set(datosTranscripcion.diarizacion);
      }

      this.estadoFlujo.set('procesando');
      const respProcesamiento = await fetch(`${IA_BASE}/api/ia/procesar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcripcion: datosTranscripcion.transcripcion,
          especialidad: this.especialidad,
          tipo_documento: this.tipoDocumento
        })
      });
      if (!respProcesamiento.ok) {
        const texto = await respProcesamiento.text().catch(() => '');
        throw new Error(`Error ${respProcesamiento.status} al procesar nota clinica. ${texto.substring(0, 200)}`);
      }
      const datosProcesamiento = await respProcesamiento.json();
      this.finalizarConNota(datosProcesamiento.nota_clinica, datosTranscripcion.transcripcion);
    } catch (err: any) {
      alert(`Error al procesar: ${err?.message || 'Error desconocido'}`);
      this.estadoFlujo.set('detenido');
    }
  }

  private finalizarConNota(nota: string, transcripcionTexto: string): void {
    const enriquecida = this.inyectarDatosPaciente(nota);
    this.notaClinica.set(enriquecida);

    const usuario = this.autenticacion.obtenerUsuario();
    this.consultaService.registrarConsulta({
      idMedicoResponsable: usuario?.idUsuario || 1,
      idPacienteAtendido: this.pacienteEncontrado()?.idPaciente || 0,
      especialidad: this.especialidad,
      tipoDocumento: this.tipoDocumento as any,
      transcripcion: transcripcionTexto,
      notaClinica: enriquecida
    }).subscribe({ error: () => {} });

    this.estadoFlujo.set('completado');
  }

  private inyectarDatosPaciente(nota: string): string {
    const paciente = this.pacienteEncontrado();
    if (!paciente || !nota) return nota;

    const edad = this.calcularEdad(paciente.fechaDeNacimiento);
    const lineas: string[] = [];
    const nombreCompleto = `${paciente.nombreDelPaciente || ''} ${paciente.apellidoDelPaciente || ''}`.trim();
    if (nombreCompleto) lineas.push(`- Nombre: ${nombreCompleto}`);
    if (paciente.numeroDocumentoIdentidad) lineas.push(`- Documento: ${paciente.tipoDocumentoIdentidad || 'DNI'} ${paciente.numeroDocumentoIdentidad}`);
    if (paciente.sexoBiologico) lineas.push(`- Sexo: ${paciente.sexoBiologico}`);
    if (paciente.fechaDeNacimiento) lineas.push(`- Fecha de nacimiento: ${paciente.fechaDeNacimiento.split('T')[0]}${edad ? ` (${edad} anos)` : ''}`);
    if (paciente.telefonoDeContacto) lineas.push(`- Telefono: ${paciente.telefonoDeContacto}`);
    if (paciente.correoElectronico) lineas.push(`- Correo: ${paciente.correoElectronico}`);
    if (paciente.direccionDomiciliaria) lineas.push(`- Direccion: ${paciente.direccionDomiciliaria}`);

    if (lineas.length === 0) return nota;
    return `## Datos del Paciente\n${lineas.join('\n')}\n\n${nota}`;
  }

  private calcularEdad(fechaNac?: string): string {
    if (!fechaNac) return '';
    const nacimiento = new Date(fechaNac.split('T')[0]);
    if (isNaN(nacimiento.getTime())) return '';
    const hoy = new Date();
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const m = hoy.getMonth() - nacimiento.getMonth();
    if (m < 0 || (m === 0 && hoy.getDate() < nacimiento.getDate())) edad--;
    return edad >= 0 && edad < 130 ? String(edad) : '';
  }

  async descargarDocumento(formato: 'pdf' | 'word'): Promise<void> {
    if (!this.notaClinica()) return;
    try {
      const endpoint = formato === 'pdf' ? '/api/ia/generar-pdf' : '/api/ia/generar-word';
      const body: Record<string, unknown> = {
        nota_clinica: this.notaClinica(),
        tipo_documento: this.tipoDocumento,
        especialidad: this.especialidad || ''
      };
      const paciente = this.pacienteEncontrado();
      if (paciente) {
        body['paciente'] = {
          nombre_completo: `${paciente.nombreDelPaciente} ${paciente.apellidoDelPaciente}`.trim(),
          tipo_documento: paciente.tipoDocumentoIdentidad || '',
          numero_documento: paciente.numeroDocumentoIdentidad || '',
          sexo: paciente.sexoBiologico || '',
          fecha_nacimiento: paciente.fechaDeNacimiento || '',
          telefono: paciente.telefonoDeContacto || '',
          correo: paciente.correoElectronico || '',
          direccion: paciente.direccionDomiciliaria || ''
        };
      }
      const resp = await fetch(`${IA_BASE}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      if (!resp.ok) throw new Error(`Error ${resp.status}`);
      const blob = await resp.blob();
      const nombre = resp.headers.get('X-Nombre-Archivo') || `MedScribe_${this.tipoDocumento}.${formato === 'pdf' ? 'pdf' : 'docx'}`;
      const enlace = document.createElement('a');
      enlace.href = URL.createObjectURL(blob);
      enlace.download = nombre;
      enlace.click();
      URL.revokeObjectURL(enlace.href);
    } catch (err: any) {
      alert(`Error al generar ${formato.toUpperCase()}: ${err?.message || 'Error desconocido'}`);
    }
  }

  guardarEdicionNota(nueva: string): void {
    this.notaClinica.set(nueva);
    this.estaEditando.set(false);
  }
}
