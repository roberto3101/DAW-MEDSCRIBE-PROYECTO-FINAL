import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, Users, Plus, Search, Pencil, Trash2, AlertCircle } from 'lucide-angular';
import { AutenticacionService } from '../../servicios/autenticacion.service';
import { PacienteService } from '../../servicios/paciente.service';
import { Paciente, SexoBiologico, TipoDocumento } from '../../modelos/paciente.model';
import { ModalComponent } from '../../componentes/comunes/modal.component';
import { CargandoComponent } from '../../componentes/comunes/cargando.component';
import {
  validarNombre,
  sanitizarNombre,
  validarDocumentoIdentidad,
  sanitizarDocumento,
  obtenerMaxLengthDocumento,
  obtenerPlaceholderDocumento,
  validarFechaNacimiento,
  validarTelefono,
  validarCorreo,
  validarDireccion
} from '../../utilidades/validaciones';

interface FormularioPaciente {
  nombreDelPaciente: string;
  apellidoDelPaciente: string;
  numeroDocumentoIdentidad: string;
  tipoDocumentoIdentidad: TipoDocumento;
  fechaDeNacimiento: string;
  sexoBiologico: SexoBiologico;
  telefonoDeContacto: string;
  correoElectronico: string;
  direccionDomiciliaria: string;
}

const FORMULARIO_INICIAL: FormularioPaciente = {
  nombreDelPaciente: '',
  apellidoDelPaciente: '',
  numeroDocumentoIdentidad: '',
  tipoDocumentoIdentidad: 'DNI',
  fechaDeNacimiento: '',
  sexoBiologico: 'Masculino',
  telefonoDeContacto: '',
  correoElectronico: '',
  direccionDomiciliaria: '',
};

@Component({
  selector: 'app-pagina-pacientes',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule, ModalComponent, CargandoComponent],
  template: `
    <app-cargando *ngIf="estaCargando(); else contenido"></app-cargando>

    <ng-template #contenido>
      <div class="space-y-6">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-2xl font-bold text-slate-800 flex items-center gap-3">
              <lucide-icon [img]="iconoUsers" class="w-7 h-7 text-medico-500"></lucide-icon>
              Pacientes
            </h1>
            <p class="text-slate-400 mt-1">{{ pacientes().length }} pacientes registrados</p>
          </div>
          <button *ngIf="tienePermiso('pacientes', 'crear')" (click)="abrirModalCrear()"
            class="flex items-center gap-2 bg-medico-500 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-medico-600 transition-colors shadow-sm">
            <lucide-icon [img]="iconoPlus" class="w-4 h-4"></lucide-icon> Nuevo Paciente
          </button>
        </div>

        <div *ngIf="mensajeExito()" class="bg-emerald-50 text-emerald-600 text-sm px-4 py-3 rounded-lg border border-emerald-100">
          {{ mensajeExito() }}
        </div>

        <div class="relative">
          <lucide-icon [img]="iconoSearch" class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300"></lucide-icon>
          <input type="text" [(ngModel)]="busqueda"
            placeholder="Buscar por nombre, apellido o DNI..."
            class="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-medico-500/20 focus:border-medico-400" />
        </div>

        <div class="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table class="w-full">
            <thead>
              <tr class="bg-slate-50 border-b border-slate-200">
                <th class="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Paciente</th>
                <th class="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Documento</th>
                <th class="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Contacto</th>
                <th class="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Sexo</th>
                <th class="text-right px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr *ngFor="let paciente of pacientesFiltrados()" class="hover:bg-slate-50/50 transition-colors">
                <td class="px-6 py-4">
                  <div class="flex items-center gap-3">
                    <div class="w-9 h-9 bg-medico-50 rounded-full flex items-center justify-center">
                      <span class="text-sm font-bold text-medico-600">{{ paciente.nombreDelPaciente.charAt(0) }}</span>
                    </div>
                    <div>
                      <p class="text-sm font-medium text-slate-700">{{ paciente.nombreDelPaciente }} {{ paciente.apellidoDelPaciente }}</p>
                      <p class="text-xs text-slate-400">{{ (paciente.fechaDeNacimiento || '').split('T')[0] }}</p>
                    </div>
                  </div>
                </td>
                <td class="px-6 py-4">
                  <span class="text-sm text-slate-600">{{ paciente.tipoDocumentoIdentidad }}: {{ paciente.numeroDocumentoIdentidad }}</span>
                </td>
                <td class="px-6 py-4">
                  <p class="text-sm text-slate-600">{{ paciente.telefonoDeContacto }}</p>
                  <p class="text-xs text-slate-400">{{ paciente.correoElectronico }}</p>
                </td>
                <td class="px-6 py-4">
                  <span [ngClass]="paciente.sexoBiologico === 'Femenino' ? 'bg-pink-50 text-pink-600' : 'bg-sky-50 text-sky-600'"
                    class="text-xs font-medium px-2 py-1 rounded-full">
                    {{ paciente.sexoBiologico }}
                  </span>
                </td>
                <td class="px-6 py-4 text-right">
                  <button *ngIf="tienePermiso('pacientes', 'editar')" (click)="abrirModalEditar(paciente)"
                    class="p-1.5 rounded-lg hover:bg-medico-50 text-slate-400 hover:text-medico-600 transition-colors">
                    <lucide-icon [img]="iconoPencil" class="w-4 h-4"></lucide-icon>
                  </button>
                  <button *ngIf="tienePermiso('pacientes', 'eliminar')" (click)="desactivarPaciente(paciente.idPaciente)"
                    class="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors ml-1">
                    <lucide-icon [img]="iconoTrash" class="w-4 h-4"></lucide-icon>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
          <div *ngIf="pacientesFiltrados().length === 0" class="text-center py-12 text-slate-400">No se encontraron pacientes</div>
        </div>

        <app-modal [estaAbierto]="modalAbierto()" (alCerrar)="modalAbierto.set(false)"
          [titulo]="pacienteEnEdicion() ? 'Editar Paciente' : 'Nuevo Paciente'">
          <form (ngSubmit)="guardarPaciente()" class="space-y-4" novalidate>
            <div *ngIf="errorEnvio()" class="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-lg border border-red-100 flex items-start gap-2">
              <lucide-icon [img]="iconoAlert" class="w-4 h-4 flex-shrink-0 mt-0.5"></lucide-icon>
              <span>{{ errorEnvio() }}</span>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-slate-600 mb-1">Nombre</label>
                <input type="text" [ngModel]="formulario.nombreDelPaciente" name="nombreDelPaciente"
                  (ngModelChange)="formulario.nombreDelPaciente = sanitizarNombre($event)"
                  (blur)="marcarTocado('nombreDelPaciente')"
                  maxlength="100" placeholder="Ej. Maria"
                  [class]="claseInput('nombreDelPaciente')" />
                <p *ngIf="debeMostrarError('nombreDelPaciente')" class="mt-1 text-xs text-red-600 flex items-center gap-1">
                  <lucide-icon [img]="iconoAlert" class="w-3 h-3"></lucide-icon>
                  <span>{{ errores().nombreDelPaciente }}</span>
                </p>
              </div>
              <div>
                <label class="block text-sm font-medium text-slate-600 mb-1">Apellido</label>
                <input type="text" [ngModel]="formulario.apellidoDelPaciente" name="apellidoDelPaciente"
                  (ngModelChange)="formulario.apellidoDelPaciente = sanitizarNombre($event)"
                  (blur)="marcarTocado('apellidoDelPaciente')"
                  maxlength="100" placeholder="Ej. Garcia Lopez"
                  [class]="claseInput('apellidoDelPaciente')" />
                <p *ngIf="debeMostrarError('apellidoDelPaciente')" class="mt-1 text-xs text-red-600 flex items-center gap-1">
                  <lucide-icon [img]="iconoAlert" class="w-3 h-3"></lucide-icon>
                  <span>{{ errores().apellidoDelPaciente }}</span>
                </p>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-slate-600 mb-1">Tipo Documento</label>
                <select [ngModel]="formulario.tipoDocumentoIdentidad" name="tipoDocumentoIdentidad"
                  (ngModelChange)="manejarCambioTipoDocumento($event)"
                  [class]="claseInput('tipoDocumentoIdentidad')">
                  <option value="DNI">DNI</option>
                  <option value="CE">CE</option>
                  <option value="Pasaporte">Pasaporte</option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium text-slate-600 mb-1">Numero Documento</label>
                <input type="text" [ngModel]="formulario.numeroDocumentoIdentidad" name="numeroDocumentoIdentidad"
                  (ngModelChange)="formulario.numeroDocumentoIdentidad = sanitizarDocumento(formulario.tipoDocumentoIdentidad, $event)"
                  (blur)="marcarTocado('numeroDocumentoIdentidad')"
                  [attr.maxlength]="maxLengthDoc()" [attr.inputmode]="formulario.tipoDocumentoIdentidad === 'Pasaporte' ? 'text' : 'numeric'"
                  [placeholder]="placeholderDoc()"
                  [class]="claseInput('numeroDocumentoIdentidad')" />
                <p *ngIf="debeMostrarError('numeroDocumentoIdentidad')" class="mt-1 text-xs text-red-600 flex items-center gap-1">
                  <lucide-icon [img]="iconoAlert" class="w-3 h-3"></lucide-icon>
                  <span>{{ errores().numeroDocumentoIdentidad }}</span>
                </p>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-slate-600 mb-1">Fecha Nacimiento</label>
                <input type="date" [(ngModel)]="formulario.fechaDeNacimiento" name="fechaDeNacimiento"
                  (blur)="marcarTocado('fechaDeNacimiento')"
                  [max]="hoyISO"
                  [class]="claseInput('fechaDeNacimiento')" />
                <p *ngIf="debeMostrarError('fechaDeNacimiento')" class="mt-1 text-xs text-red-600 flex items-center gap-1">
                  <lucide-icon [img]="iconoAlert" class="w-3 h-3"></lucide-icon>
                  <span>{{ errores().fechaDeNacimiento }}</span>
                </p>
              </div>
              <div>
                <label class="block text-sm font-medium text-slate-600 mb-1">Sexo</label>
                <select [(ngModel)]="formulario.sexoBiologico" name="sexoBiologico"
                  [class]="claseInput('sexoBiologico')">
                  <option value="Masculino">Masculino</option>
                  <option value="Femenino">Femenino</option>
                </select>
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium text-slate-600 mb-1">Telefono</label>
              <input type="tel" [(ngModel)]="formulario.telefonoDeContacto" name="telefonoDeContacto"
                (blur)="marcarTocado('telefonoDeContacto')"
                maxlength="20" placeholder="+51 999 888 777"
                [class]="claseInput('telefonoDeContacto')" />
              <p *ngIf="debeMostrarError('telefonoDeContacto')" class="mt-1 text-xs text-red-600 flex items-center gap-1">
                <lucide-icon [img]="iconoAlert" class="w-3 h-3"></lucide-icon>
                <span>{{ errores().telefonoDeContacto }}</span>
              </p>
            </div>

            <div>
              <label class="block text-sm font-medium text-slate-600 mb-1">Correo</label>
              <input type="email" [(ngModel)]="formulario.correoElectronico" name="correoElectronico"
                (blur)="marcarTocado('correoElectronico')"
                maxlength="150" placeholder="correo@ejemplo.com"
                [class]="claseInput('correoElectronico')" />
              <p *ngIf="debeMostrarError('correoElectronico')" class="mt-1 text-xs text-red-600 flex items-center gap-1">
                <lucide-icon [img]="iconoAlert" class="w-3 h-3"></lucide-icon>
                <span>{{ errores().correoElectronico }}</span>
              </p>
            </div>

            <div>
              <label class="block text-sm font-medium text-slate-600 mb-1">Direccion</label>
              <input type="text" [(ngModel)]="formulario.direccionDomiciliaria" name="direccionDomiciliaria"
                (blur)="marcarTocado('direccionDomiciliaria')"
                maxlength="300" placeholder="Av. Ejemplo 123, Lima"
                [class]="claseInput('direccionDomiciliaria')" />
              <p *ngIf="debeMostrarError('direccionDomiciliaria')" class="mt-1 text-xs text-red-600 flex items-center gap-1">
                <lucide-icon [img]="iconoAlert" class="w-3 h-3"></lucide-icon>
                <span>{{ errores().direccionDomiciliaria }}</span>
              </p>
            </div>

            <div class="flex gap-3 pt-2">
              <button type="button" (click)="modalAbierto.set(false)"
                class="flex-1 px-4 py-2.5 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors">
                Cancelar
              </button>
              <button type="submit" [disabled]="intentoEnviar() && !formularioEsValido()"
                class="flex-1 px-4 py-2.5 bg-medico-500 text-white rounded-lg text-sm font-medium hover:bg-medico-600 transition-colors disabled:bg-slate-300 disabled:cursor-not-allowed">
                {{ pacienteEnEdicion() ? 'Actualizar' : 'Registrar' }}
              </button>
            </div>
          </form>
        </app-modal>
      </div>
    </ng-template>
  `
})
export class PaginaPacientesComponent {
  private readonly pacienteService = inject(PacienteService);
  private readonly autenticacion = inject(AutenticacionService);

  iconoUsers = Users;
  iconoPlus = Plus;
  iconoSearch = Search;
  iconoPencil = Pencil;
  iconoTrash = Trash2;
  iconoAlert = AlertCircle;

  sanitizarNombre = sanitizarNombre;
  sanitizarDocumento = sanitizarDocumento;

  pacientes = signal<Paciente[]>([]);
  estaCargando = signal(true);
  busqueda = '';
  modalAbierto = signal(false);
  pacienteEnEdicion = signal<Paciente | null>(null);
  mensajeExito = signal('');
  errorEnvio = signal('');
  intentoEnviar = signal(false);

  formulario: FormularioPaciente = { ...FORMULARIO_INICIAL };
  camposTocados = signal<Record<string, boolean>>({});

  hoyISO = new Date().toISOString().split('T')[0];

  maxLengthDoc = () => obtenerMaxLengthDocumento(this.formulario.tipoDocumentoIdentidad);
  placeholderDoc = () => obtenerPlaceholderDocumento(this.formulario.tipoDocumentoIdentidad);

  errores = computed(() => ({
    nombreDelPaciente: validarNombre(this.formulario.nombreDelPaciente, 'El nombre'),
    apellidoDelPaciente: validarNombre(this.formulario.apellidoDelPaciente, 'El apellido'),
    numeroDocumentoIdentidad: validarDocumentoIdentidad(this.formulario.tipoDocumentoIdentidad, this.formulario.numeroDocumentoIdentidad),
    fechaDeNacimiento: validarFechaNacimiento(this.formulario.fechaDeNacimiento),
    telefonoDeContacto: validarTelefono(this.formulario.telefonoDeContacto),
    correoElectronico: validarCorreo(this.formulario.correoElectronico),
    direccionDomiciliaria: validarDireccion(this.formulario.direccionDomiciliaria),
  }));

  formularioEsValido = computed(() => Object.values(this.errores()).every(e => !e));

  pacientesFiltrados = computed(() => {
    const q = (this.busqueda || '').toLowerCase();
    return this.pacientes().filter(p =>
      `${p.nombreDelPaciente} ${p.apellidoDelPaciente} ${p.numeroDocumentoIdentidad}`.toLowerCase().includes(q)
    );
  });

  constructor() {
    this.cargarPacientes();
  }

  tienePermiso(modulo: string, accion: string): boolean {
    return this.autenticacion.tienePermiso(modulo, accion);
  }

  cargarPacientes(): void {
    this.estaCargando.set(true);
    this.pacienteService.listarPacientes().subscribe({
      next: (datos) => {
        this.pacientes.set(datos);
        this.estaCargando.set(false);
      },
      error: () => {
        this.estaCargando.set(false);
      }
    });
  }

  debeMostrarError(campo: string): boolean {
    return (this.camposTocados()[campo] || this.intentoEnviar()) && !!(this.errores() as any)[campo];
  }

  marcarTocado(campo: string): void {
    this.camposTocados.update(prev => ({ ...prev, [campo]: true }));
  }

  claseInput(campo: string): string {
    const base = 'w-full px-3 py-2 bg-slate-50 border rounded-lg text-sm focus:outline-none focus:ring-2';
    if (this.debeMostrarError(campo)) return `${base} border-red-300 focus:ring-red-500/20 focus:border-red-400`;
    return `${base} border-slate-200 focus:ring-medico-500/20 focus:border-medico-400`;
  }

  manejarCambioTipoDocumento(nuevoTipo: TipoDocumento): void {
    this.formulario.tipoDocumentoIdentidad = nuevoTipo;
    this.formulario.numeroDocumentoIdentidad = sanitizarDocumento(nuevoTipo, this.formulario.numeroDocumentoIdentidad);
  }

  abrirModalCrear(): void {
    this.pacienteEnEdicion.set(null);
    this.formulario = { ...FORMULARIO_INICIAL };
    this.camposTocados.set({});
    this.intentoEnviar.set(false);
    this.errorEnvio.set('');
    this.modalAbierto.set(true);
  }

  abrirModalEditar(paciente: Paciente): void {
    this.pacienteEnEdicion.set(paciente);
    this.formulario = {
      nombreDelPaciente: paciente.nombreDelPaciente,
      apellidoDelPaciente: paciente.apellidoDelPaciente,
      numeroDocumentoIdentidad: paciente.numeroDocumentoIdentidad,
      tipoDocumentoIdentidad: paciente.tipoDocumentoIdentidad,
      fechaDeNacimiento: (paciente.fechaDeNacimiento || '').split('T')[0],
      sexoBiologico: paciente.sexoBiologico,
      telefonoDeContacto: paciente.telefonoDeContacto || '',
      correoElectronico: paciente.correoElectronico || '',
      direccionDomiciliaria: paciente.direccionDomiciliaria || '',
    };
    this.camposTocados.set({});
    this.intentoEnviar.set(false);
    this.errorEnvio.set('');
    this.modalAbierto.set(true);
  }

  guardarPaciente(): void {
    this.intentoEnviar.set(true);
    this.errorEnvio.set('');
    if (!this.formularioEsValido()) return;

    const datos = {
      ...this.formulario,
      nombreDelPaciente: this.formulario.nombreDelPaciente.trim(),
      apellidoDelPaciente: this.formulario.apellidoDelPaciente.trim(),
      numeroDocumentoIdentidad: this.formulario.numeroDocumentoIdentidad.trim().toUpperCase(),
      correoElectronico: this.formulario.correoElectronico.trim(),
      direccionDomiciliaria: this.formulario.direccionDomiciliaria.trim(),
    };

    const pacienteExistente = this.pacienteEnEdicion();
    const onSuccess = () => {
      this.mensajeExito.set(pacienteExistente ? 'Paciente actualizado correctamente' : 'Paciente registrado correctamente');
      this.modalAbierto.set(false);
      this.cargarPacientes();
      setTimeout(() => this.mensajeExito.set(''), 3000);
    };
    const onError = (err: any) => {
      const mensaje = err?.error?.mensaje || err?.error?.message || 'Error al guardar paciente';
      this.errorEnvio.set(mensaje);
    };

    if (pacienteExistente) {
      this.pacienteService.actualizarPaciente(pacienteExistente.idPaciente, datos).subscribe({ next: onSuccess, error: onError });
    } else {
      this.pacienteService.crearPaciente(datos).subscribe({ next: onSuccess, error: onError });
    }
  }

  desactivarPaciente(idPaciente: number): void {
    if (!confirm('Esta seguro de desactivar este paciente?')) return;
    this.pacienteService.desactivarPaciente(idPaciente).subscribe({
      next: () => this.cargarPacientes(),
      error: () => alert('Error al desactivar paciente')
    });
  }
}
