import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, Save, X, Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-angular';

interface SeccionNota {
  titulo: string;
  contenido: string;
  expandida: boolean;
}

const SECCIONES_SUGERIDAS = [
  'Datos del Paciente', 'Motivo de Consulta', 'Enfermedad Actual', 'Antecedentes',
  'Examen Fisico', 'Diagnostico', 'Plan de Tratamiento', 'Indicaciones Generales',
  'Proxima Cita', 'S - Subjetivo', 'O - Objetivo', 'A - Analisis', 'P - Plan',
  'Prescripcion', 'Notas de Verificacion',
];

@Component({
  selector: 'app-editor-nota-clinica',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  template: `
    <div class="space-y-3">
      <div class="flex items-center justify-between">
        <p class="text-xs text-slate-400">Edite cada seccion individualmente. Las secciones vacias no apareceran en el documento.</p>
        <div class="flex gap-2">
          <button (click)="alCancelar.emit()"
            class="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50">
            <lucide-icon [img]="iconoX" class="w-3 h-3"></lucide-icon> Cancelar
          </button>
          <button (click)="emitirGuardado()"
            class="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-emerald-500 text-white hover:bg-emerald-600">
            <lucide-icon [img]="iconoSave" class="w-3 h-3"></lucide-icon> Guardar cambios
          </button>
        </div>
      </div>

      <div *ngFor="let seccion of secciones; let i = index"
           [ngClass]="tieneContenidoVacio(seccion.contenido) ? 'border-amber-200 bg-amber-50/30' : 'border-slate-200'"
           class="border rounded-lg overflow-hidden transition-all">
        <div class="flex items-center gap-2 px-3 py-2 bg-slate-50 border-b border-slate-100">
          <div class="flex flex-col gap-0.5">
            <button (click)="moverSeccion(i, 'arriba')" [disabled]="i === 0"
              class="text-slate-300 hover:text-slate-500 disabled:opacity-20">
              <lucide-icon [img]="iconoChevronUp" class="w-3 h-3"></lucide-icon>
            </button>
            <button (click)="moverSeccion(i, 'abajo')" [disabled]="i === secciones.length - 1"
              class="text-slate-300 hover:text-slate-500 disabled:opacity-20">
              <lucide-icon [img]="iconoChevronDown" class="w-3 h-3"></lucide-icon>
            </button>
          </div>
          <input type="text" [(ngModel)]="seccion.titulo"
            class="flex-1 text-sm font-semibold text-slate-700 bg-transparent border-none focus:outline-none" />
          <span *ngIf="tieneContenidoVacio(seccion.contenido)"
            class="text-[9px] font-medium px-1.5 py-0.5 rounded bg-amber-100 text-amber-600">
            Requiere edicion
          </span>
          <button (click)="seccion.expandida = !seccion.expandida" class="p-1 rounded hover:bg-slate-200 text-slate-400">
            <lucide-icon [img]="seccion.expandida ? iconoChevronUp : iconoChevronDown" class="w-3.5 h-3.5"></lucide-icon>
          </button>
          <button (click)="eliminarSeccion(i)" class="p-1 rounded hover:bg-red-50 text-slate-300 hover:text-red-500">
            <lucide-icon [img]="iconoTrash2" class="w-3.5 h-3.5"></lucide-icon>
          </button>
        </div>
        <div *ngIf="seccion.expandida" class="p-3">
          <textarea [(ngModel)]="seccion.contenido"
            [rows]="obtenerRows(seccion.contenido)"
            placeholder="Escriba el contenido de esta seccion..."
            class="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 leading-relaxed focus:outline-none focus:ring-2 focus:ring-medico-500/20 focus:border-medico-400 resize-y">
          </textarea>
        </div>
      </div>

      <div class="relative">
        <button (click)="mostrarSugerencias = !mostrarSugerencias"
          class="w-full flex items-center justify-center gap-2 py-2.5 border-2 border-dashed border-slate-200 rounded-lg text-sm text-slate-400 hover:border-medico-300 hover:text-medico-500 transition-colors">
          <lucide-icon [img]="iconoPlus" class="w-4 h-4"></lucide-icon> Agregar seccion
        </button>
        <div *ngIf="mostrarSugerencias"
          class="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
          <button *ngFor="let titulo of seccionesDisponibles()" (click)="agregarSeccion(titulo)"
            class="w-full text-left px-4 py-2 text-sm text-slate-600 hover:bg-medico-50 hover:text-medico-600 transition-colors">
            {{ titulo }}
          </button>
          <button (click)="agregarSeccion('Nueva Seccion')"
            class="w-full text-left px-4 py-2 text-sm text-medico-600 font-medium hover:bg-medico-50 border-t border-slate-100">
            + Seccion personalizada
          </button>
        </div>
      </div>
    </div>
  `
})
export class EditorNotaClinicaComponent implements OnChanges {
  @Input() notaClinicaOriginal = '';
  @Output() alGuardar = new EventEmitter<string>();
  @Output() alCancelar = new EventEmitter<void>();

  iconoSave = Save;
  iconoX = X;
  iconoPlus = Plus;
  iconoTrash2 = Trash2;
  iconoChevronUp = ChevronUp;
  iconoChevronDown = ChevronDown;

  secciones: SeccionNota[] = [];
  mostrarSugerencias = false;

  ngOnChanges(cambios: SimpleChanges): void {
    if (cambios['notaClinicaOriginal']) {
      this.secciones = this.parsearNotaASecciones(this.notaClinicaOriginal || '');
    }
  }

  parsearNotaASecciones(nota: string): SeccionNota[] {
    const secciones: SeccionNota[] = [];
    let seccionActual: SeccionNota | null = null;

    for (const linea of nota.split('\n')) {
      const texto = linea.trim();
      let esTitulo = false;
      let tituloLimpio = '';

      if (texto.startsWith('## ')) {
        tituloLimpio = texto.substring(3).trim().replace(/\*/g, '');
        esTitulo = true;
      } else if (texto.startsWith('# ')) {
        tituloLimpio = texto.substring(2).trim().replace(/\*/g, '');
        esTitulo = true;
      } else if (texto.startsWith('**') && texto.endsWith('**')) {
        tituloLimpio = texto.replace(/\*/g, '').trim();
        esTitulo = true;
      } else if (texto.startsWith('### ')) {
        tituloLimpio = texto.substring(4).trim().replace(/\*/g, '');
        esTitulo = true;
      }

      if (esTitulo && tituloLimpio) {
        seccionActual = { titulo: tituloLimpio, contenido: '', expandida: true };
        secciones.push(seccionActual);
      } else if (seccionActual) {
        seccionActual.contenido += (seccionActual.contenido ? '\n' : '') + linea;
      } else if (texto) {
        seccionActual = { titulo: 'Informacion General', contenido: linea, expandida: true };
        secciones.push(seccionActual);
      }
    }

    for (const s of secciones) s.contenido = s.contenido.trim();
    return secciones.filter(s => s.contenido || s.titulo);
  }

  seccionesANotaClinica(): string {
    return this.secciones
      .filter(s => s.contenido.trim())
      .map(s => `## ${s.titulo}\n${s.contenido}`)
      .join('\n\n');
  }

  moverSeccion(indice: number, direccion: 'arriba' | 'abajo'): void {
    const nuevoIndice = direccion === 'arriba' ? indice - 1 : indice + 1;
    if (nuevoIndice < 0 || nuevoIndice >= this.secciones.length) return;
    const temp = this.secciones[indice];
    this.secciones[indice] = this.secciones[nuevoIndice];
    this.secciones[nuevoIndice] = temp;
  }

  eliminarSeccion(indice: number): void {
    if (!confirm('Eliminar esta seccion del documento?')) return;
    this.secciones = this.secciones.filter((_, i) => i !== indice);
  }

  agregarSeccion(titulo: string): void {
    this.secciones = [...this.secciones, { titulo, contenido: '', expandida: true }];
    this.mostrarSugerencias = false;
  }

  seccionesDisponibles(): string[] {
    const existentes = new Set(this.secciones.map(s => s.titulo));
    return SECCIONES_SUGERIDAS.filter(s => !existentes.has(s));
  }

  tieneContenidoVacio(contenido: string): boolean {
    const lower = (contenido || '').toLowerCase();
    return lower.includes('no disponible') || lower.includes('no se proporcion') ||
      lower.includes('no se tiene') || lower.includes('no se mencion') ||
      lower.includes('no se registr') || lower.includes('no se realiz');
  }

  obtenerRows(contenido: string): number {
    return Math.max(2, (contenido || '').split('\n').length + 1);
  }

  emitirGuardado(): void {
    this.alGuardar.emit(this.seccionesANotaClinica());
  }
}
