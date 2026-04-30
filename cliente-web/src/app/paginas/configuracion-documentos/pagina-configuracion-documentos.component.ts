import { CommonModule } from '@angular/common';
import { Component, ElementRef, ViewChild, computed, inject, signal } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import {
  LucideAngularModule,
  Settings,
  Upload,
  Save,
  Building2,
  User,
  FileText,
  CheckCircle,
  Image as ImageIcon,
  Pen
} from 'lucide-angular';
import { CargandoComponent } from '../../componentes/comunes/cargando.component';
import { ModalFirmaDigitalComponent } from '../../componentes/comunes/modal-firma-digital.component';

const IA_BASE = 'http://localhost:8000';

interface ConfiguracionDocumentos {
  nombre_clinica: string;
  ruc: string;
  direccion: string;
  telefono: string;
  correo: string;
  logo_path: string;
  nombre_medico: string;
  colegiatura: string;
  especialidad_medico: string;
  formato_documento: string;
  firma_medico: string;
  firma_clinica: string;
}

interface FormatoDisponible {
  codigo: string;
  nombre: string;
  descripcion: string;
}

@Component({
  selector: 'app-pagina-configuracion-documentos',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule, CargandoComponent, ModalFirmaDigitalComponent],
  template: `
    <app-cargando *ngIf="estaCargando()"></app-cargando>

    <div *ngIf="!estaCargando()" class="space-y-6 max-w-4xl">
      <div>
        <h1 class="text-2xl font-bold text-slate-800 flex items-center gap-3">
          <lucide-icon [img]="iconoSettings" class="w-7 h-7 text-medico-500"></lucide-icon>
          Configuracion de Documentos
        </h1>
        <p class="text-slate-400 mt-1">Configura los datos que apareceran en los documentos generados</p>
      </div>

      <div *ngIf="mensajeExito()" class="bg-emerald-50 text-emerald-600 text-sm px-4 py-3 rounded-lg border border-emerald-100 flex items-center gap-2">
        <lucide-icon [img]="iconoCheckCircle" class="w-4 h-4"></lucide-icon>
        {{ mensajeExito() }}
      </div>

      <div class="bg-white rounded-xl border border-slate-200 p-6">
        <h2 class="text-sm font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <lucide-icon [img]="iconoFileText" class="w-4 h-4 text-medico-500"></lucide-icon>
          Formato de Documento
        </h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <button *ngFor="let f of formatosDisponibles()" type="button"
            (click)="seleccionarFormato(f.codigo)"
            [ngClass]="config.formato_documento === f.codigo ? colorBorde(f.codigo) + ' shadow-sm' : 'border-slate-200 bg-white hover:border-slate-300'"
            class="text-left p-4 rounded-xl border-2 transition-all duration-200">
            <div class="mb-3 rounded-md border border-slate-200 bg-white p-2 h-16 flex flex-col justify-between overflow-hidden">
              <div class="h-1 w-full rounded-full" [ngClass]="colorBarra(f.codigo)"></div>
              <div class="space-y-1 mt-1">
                <div class="h-1 w-3/4 bg-slate-200 rounded-full"></div>
                <div class="h-1 w-1/2 bg-slate-100 rounded-full"></div>
                <div class="h-1 w-2/3 bg-slate-100 rounded-full"></div>
              </div>
            </div>
            <p class="text-xs font-semibold text-slate-700">{{ f.nombre }}</p>
            <p class="text-[10px] text-slate-400 mt-0.5 leading-tight">{{ f.descripcion }}</p>
            <div *ngIf="config.formato_documento === f.codigo" class="flex items-center gap-1 mt-2">
              <lucide-icon [img]="iconoCheckCircle" class="w-3 h-3 text-medico-500"></lucide-icon>
              <span class="text-[10px] font-medium text-medico-600">Seleccionado</span>
            </div>
          </button>
        </div>
      </div>

      <div *ngIf="urlPreview()" class="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div class="flex items-center justify-between px-5 py-3 border-b border-slate-100 bg-slate-50">
          <h3 class="text-xs font-semibold text-slate-600 uppercase tracking-wider flex items-center gap-2">
            <lucide-icon [img]="iconoFileText" class="w-3.5 h-3.5 text-medico-500"></lucide-icon>
            Vista previa &mdash; {{ nombreFormatoSeleccionado() }}
          </h3>
          <div class="flex items-center gap-3">
            <div class="flex bg-white rounded-lg border border-slate-200 overflow-hidden">
              <button *ngFor="let tipo of tiposDocumentoPreview"
                (click)="seleccionarTipoPreview(tipo.valor)"
                [ngClass]="tipoDocumentoPreview() === tipo.valor ? 'bg-medico-500 text-white' : 'text-slate-500 hover:bg-slate-50'"
                class="text-[10px] font-medium px-3 py-1.5 transition-colors">
                {{ tipo.etiqueta }}
              </button>
            </div>
            <a [href]="urlPreview()" target="_blank" rel="noopener noreferrer"
              class="text-[10px] font-medium px-2 py-1 rounded bg-medico-50 text-medico-600 hover:bg-medico-100 transition-colors">
              Abrir
            </a>
            <button (click)="urlPreview.set('')"
              class="text-[10px] font-medium px-2 py-1 rounded bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors">
              Cerrar
            </button>
          </div>
        </div>
        <iframe [src]="urlPreviewSegura()" class="w-full h-[700px] border-0" title="Vista previa del documento"></iframe>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div class="bg-white rounded-xl border border-slate-200 p-6">
          <h2 class="text-sm font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <lucide-icon [img]="iconoBuilding" class="w-4 h-4 text-medico-500"></lucide-icon>
            Datos de la Clinica
          </h2>
          <div class="space-y-4">
            <div>
              <label class="block text-xs font-medium text-slate-500 mb-1">Nombre de la Clinica</label>
              <input type="text" [(ngModel)]="config.nombre_clinica" maxlength="200"
                placeholder="Clinica San Pablo"
                class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-medico-500/20 focus:border-medico-400" />
            </div>
            <div>
              <label class="block text-xs font-medium text-slate-500 mb-1">RUC</label>
              <input type="text" [(ngModel)]="config.ruc" maxlength="11"
                (input)="sanitizarRuc($event)"
                placeholder="20123456789"
                class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-medico-500/20 focus:border-medico-400" />
              <p class="text-[10px] text-slate-300 mt-0.5">{{ config.ruc.length }}/11 digitos</p>
            </div>
            <div>
              <label class="block text-xs font-medium text-slate-500 mb-1">Direccion</label>
              <input type="text" [(ngModel)]="config.direccion" maxlength="300"
                placeholder="Av. Arequipa 1234, Miraflores, Lima"
                class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-medico-500/20 focus:border-medico-400" />
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-medium text-slate-500 mb-1">Telefono</label>
                <input type="tel" [(ngModel)]="config.telefono" maxlength="20"
                  placeholder="01-555-1234"
                  class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-medico-500/20 focus:border-medico-400" />
              </div>
              <div>
                <label class="block text-xs font-medium text-slate-500 mb-1">Correo</label>
                <input type="email" [(ngModel)]="config.correo" maxlength="150"
                  placeholder="info@clinica.pe"
                  class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-medico-500/20 focus:border-medico-400" />
              </div>
            </div>
            <div>
              <label class="block text-xs font-medium text-slate-500 mb-2">Logo de la Clinica</label>
              <div class="flex items-center gap-4">
                <div *ngIf="!config.logo_path" class="w-16 h-16 bg-slate-50 rounded-lg flex items-center justify-center border border-dashed border-slate-300">
                  <lucide-icon [img]="iconoImage" class="w-6 h-6 text-slate-300"></lucide-icon>
                </div>
                <div *ngIf="config.logo_path" class="w-16 h-16 bg-slate-100 rounded-lg flex items-center justify-center border border-slate-200">
                  <lucide-icon [img]="iconoCheckCircle" class="w-6 h-6 text-exito"></lucide-icon>
                </div>
                <div>
                  <input #fileInput type="file" accept="image/*" (change)="subirLogo($event)" class="hidden" />
                  <button (click)="fileInput.click()" [disabled]="estaSubiendoLogo()"
                    class="flex items-center gap-2 px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50">
                    <lucide-icon [img]="iconoUpload" class="w-4 h-4"></lucide-icon>
                    {{ estaSubiendoLogo() ? 'Subiendo...' : (config.logo_path ? 'Cambiar logo' : 'Subir logo') }}
                  </button>
                  <p class="text-[10px] text-slate-400 mt-1">PNG, JPG o SVG. Maximo 2MB.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-xl border border-slate-200 p-6">
          <h2 class="text-sm font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <lucide-icon [img]="iconoUser" class="w-4 h-4 text-medico-500"></lucide-icon>
            Datos del Medico (Firma)
          </h2>
          <div class="space-y-4">
            <div>
              <label class="block text-xs font-medium text-slate-500 mb-1">Nombre Completo del Medico</label>
              <input type="text" [(ngModel)]="config.nombre_medico" maxlength="100"
                placeholder="Dr. Jose Roberto Garcia"
                class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-medico-500/20 focus:border-medico-400" />
            </div>
            <div>
              <label class="block text-xs font-medium text-slate-500 mb-1">Numero de Colegiatura (CMP)</label>
              <input type="text" [(ngModel)]="config.colegiatura" maxlength="20"
                placeholder="CMP-12345"
                class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-medico-500/20 focus:border-medico-400" />
            </div>
            <div>
              <label class="block text-xs font-medium text-slate-500 mb-1">Especialidad Medica</label>
              <input type="text" [(ngModel)]="config.especialidad_medico" maxlength="100"
                placeholder="Medicina General"
                class="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-medico-500/20 focus:border-medico-400" />
            </div>
            <div class="border border-slate-100 rounded-lg p-4 mt-4">
              <h3 class="text-xs font-semibold text-slate-700 mb-3 flex items-center gap-1">
                <lucide-icon [img]="iconoPen" class="w-3 h-3 text-medico-500"></lucide-icon>
                Firma Digital del Medico
              </h3>
              <div *ngIf="config.firma_medico" class="text-center">
                <img [src]="config.firma_medico" alt="Firma" class="max-h-20 mx-auto border border-slate-200 rounded-lg p-1" />
                <div class="flex justify-center gap-2 mt-2">
                  <button (click)="modalFirmaMedico.set(true)" class="text-xs text-medico-600 hover:text-medico-700 font-medium">Cambiar firma</button>
                  <button (click)="config.firma_medico = ''" class="text-xs text-red-500 hover:text-red-600 font-medium">Eliminar</button>
                </div>
              </div>
              <button *ngIf="!config.firma_medico" (click)="modalFirmaMedico.set(true)"
                class="w-full py-6 border-2 border-dashed border-slate-200 rounded-lg text-sm text-slate-400 hover:border-medico-300 hover:text-medico-500 transition-colors flex flex-col items-center gap-1">
                <lucide-icon [img]="iconoPen" class="w-5 h-5"></lucide-icon>
                Dibujar firma del medico
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-xl border border-slate-200 p-6">
        <h2 class="text-sm font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <lucide-icon [img]="iconoBuilding" class="w-4 h-4 text-medico-500"></lucide-icon>
          Firma Digital de la Clinica
        </h2>
        <div *ngIf="config.firma_clinica" class="text-center">
          <img [src]="config.firma_clinica" alt="Firma de la clinica" class="max-h-24 mx-auto border border-slate-200 rounded-lg p-2" />
          <div class="flex justify-center gap-2 mt-3">
            <button (click)="modalFirmaClinica.set(true)" class="text-xs text-medico-600 hover:text-medico-700 font-medium">Cambiar firma</button>
            <button (click)="config.firma_clinica = ''" class="text-xs text-red-500 hover:text-red-600 font-medium">Eliminar</button>
          </div>
        </div>
        <button *ngIf="!config.firma_clinica" (click)="modalFirmaClinica.set(true)"
          class="w-full py-8 border-2 border-dashed border-slate-200 rounded-lg text-sm text-slate-400 hover:border-medico-300 hover:text-medico-500 transition-colors flex flex-col items-center gap-1">
          <lucide-icon [img]="iconoPen" class="w-5 h-5"></lucide-icon>
          Dibujar firma o sello de la clinica
        </button>
      </div>

      <div class="flex justify-end">
        <button (click)="guardarConfiguracion()" [disabled]="estaGuardando()"
          class="flex items-center gap-2 px-6 py-2.5 bg-medico-500 text-white rounded-lg text-sm font-medium hover:bg-medico-600 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed">
          <lucide-icon [img]="iconoSave" class="w-4 h-4"></lucide-icon>
          {{ estaGuardando() ? 'Guardando...' : 'Guardar Configuracion' }}
        </button>
      </div>

      <app-modal-firma-digital
        [estaAbierto]="modalFirmaMedico()"
        titulo="Firma Digital del Medico"
        (alCerrar)="modalFirmaMedico.set(false)"
        (alConfirmar)="config.firma_medico = $event; modalFirmaMedico.set(false)">
      </app-modal-firma-digital>

      <app-modal-firma-digital
        [estaAbierto]="modalFirmaClinica()"
        titulo="Firma Digital de la Clinica"
        (alCerrar)="modalFirmaClinica.set(false)"
        (alConfirmar)="config.firma_clinica = $event; modalFirmaClinica.set(false)">
      </app-modal-firma-digital>
    </div>
  `
})
export class PaginaConfiguracionDocumentosComponent {
  iconoSettings = Settings;
  iconoUpload = Upload;
  iconoSave = Save;
  iconoBuilding = Building2;
  iconoUser = User;
  iconoFileText = FileText;
  iconoCheckCircle = CheckCircle;
  iconoImage = ImageIcon;
  iconoPen = Pen;

  config: ConfiguracionDocumentos = {
    nombre_clinica: '', ruc: '', direccion: '', telefono: '', correo: '',
    logo_path: '', nombre_medico: '', colegiatura: '', especialidad_medico: '',
    formato_documento: 'moderno_medico', firma_medico: '', firma_clinica: '',
  };

  formatosDisponibles = signal<FormatoDisponible[]>([
    { codigo: 'clasico_minsa', nombre: 'Clasico MINSA', descripcion: 'Formato oficial del MINSA' },
    { codigo: 'moderno_medico', nombre: 'Moderno Medico', descripcion: 'Diseno moderno y limpio' },
    { codigo: 'clinico_elegante', nombre: 'Clinico Elegante', descripcion: 'Estilo profesional elegante' },
    { codigo: 'compacto_funcional', nombre: 'Compacto Funcional', descripcion: 'Optimizado para impresion' },
  ]);

  estaCargando = signal(false);
  estaGuardando = signal(false);
  estaSubiendoLogo = signal(false);
  mensajeExito = signal('');
  modalFirmaMedico = signal(false);
  modalFirmaClinica = signal(false);

  urlPreview = signal('');
  tipoDocumentoPreview = signal('SOAP');

  tiposDocumentoPreview = [
    { valor: 'SOAP', etiqueta: 'SOAP' },
    { valor: 'HistoriaClinica', etiqueta: 'Historia Clinica' },
    { valor: 'Receta', etiqueta: 'Receta' }
  ];

  private readonly sanitizer = inject(DomSanitizer);

  urlPreviewSegura = computed<SafeResourceUrl>(() =>
    this.sanitizer.bypassSecurityTrustResourceUrl(this.urlPreview())
  );

  nombreFormatoSeleccionado = computed(() =>
    this.formatosDisponibles().find(f => f.codigo === this.config.formato_documento)?.nombre || ''
  );

  constructor() {
    this.cargarConfiguracion();
    this.cargarFormatos();
  }

  cargarFormatos(): void {
    fetch(`${IA_BASE}/api/ia/configuracion/formatos`)
      .then(r => r.ok ? r.json() : null)
      .then(datos => {
        if (datos?.formatos?.length) {
          this.formatosDisponibles.set(datos.formatos);
        }
      })
      .catch(() => {});
  }

  seleccionarFormato(codigo: string): void {
    this.config.formato_documento = codigo;
    this.actualizarPreview();
  }

  seleccionarTipoPreview(tipo: string): void {
    this.tipoDocumentoPreview.set(tipo);
    this.actualizarPreview();
  }

  actualizarPreview(): void {
    const url = `${IA_BASE}/api/ia/configuracion/preview-formato/${this.config.formato_documento}?tipo_documento=${this.tipoDocumentoPreview()}&t=${Date.now()}`;
    this.urlPreview.set(url);
  }

  colorBorde(codigo: string): string {
    const mapa: Record<string, string> = {
      clasico_minsa: 'border-slate-600 bg-slate-50',
      moderno_medico: 'border-sky-500 bg-sky-50',
      clinico_elegante: 'border-emerald-500 bg-emerald-50',
      compacto_funcional: 'border-indigo-500 bg-indigo-50'
    };
    return mapa[codigo] || 'border-medico-500 bg-medico-50';
  }

  colorBarra(codigo: string): string {
    const mapa: Record<string, string> = {
      clasico_minsa: 'bg-slate-700',
      moderno_medico: 'bg-sky-500',
      clinico_elegante: 'bg-emerald-500',
      compacto_funcional: 'bg-indigo-500'
    };
    return mapa[codigo] || 'bg-slate-400';
  }

  cargarConfiguracion(): void {
    this.estaCargando.set(true);
    fetch(`${IA_BASE}/api/ia/configuracion/obtener`)
      .then(r => r.json())
      .then(datos => {
        this.config = { ...this.config, ...datos };
        this.estaCargando.set(false);
      })
      .catch(() => this.estaCargando.set(false));
  }

  sanitizarRuc(evento: Event): void {
    const input = evento.target as HTMLInputElement;
    this.config.ruc = input.value.replace(/\D/g, '').slice(0, 11);
    input.value = this.config.ruc;
  }

  async guardarConfiguracion(): Promise<void> {
    this.estaGuardando.set(true);
    try {
      await fetch(`${IA_BASE}/api/ia/configuracion/guardar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(this.config),
      });
      this.mensajeExito.set('Configuracion guardada exitosamente');
      setTimeout(() => this.mensajeExito.set(''), 3000);
    } catch {
      alert('Error al guardar configuracion');
    } finally {
      this.estaGuardando.set(false);
    }
  }

  async subirLogo(evento: Event): Promise<void> {
    const input = evento.target as HTMLInputElement;
    const archivo = input.files?.[0];
    if (!archivo) return;
    const ext = archivo.name.split('.').pop()?.toLowerCase();
    const permitidas = ['png', 'jpg', 'jpeg', 'svg', 'webp'];
    if (!ext || !permitidas.includes(ext)) {
      alert('Solo se permiten imagenes: PNG, JPG, SVG, WEBP');
      return;
    }
    if (archivo.size > 2 * 1024 * 1024) {
      alert('El logo no debe superar 2 MB');
      return;
    }
    this.estaSubiendoLogo.set(true);
    try {
      const fd = new FormData();
      fd.append('archivo', archivo);
      const resp = await fetch(`${IA_BASE}/api/ia/configuracion/subir-logo`, { method: 'POST', body: fd });
      const datos = await resp.json();
      this.config.logo_path = datos.ruta;
      this.mensajeExito.set('Logo subido exitosamente');
      setTimeout(() => this.mensajeExito.set(''), 3000);
    } catch {
      alert('Error al subir logo');
    } finally {
      this.estaSubiendoLogo.set(false);
    }
  }
}
