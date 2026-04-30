import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  LucideAngularModule,
  FileText,
  Download,
  Search,
  Filter,
  File,
  FileSpreadsheet,
  ChevronLeft,
  ChevronRight
} from 'lucide-angular';
import { CargandoComponent } from '../../componentes/comunes/cargando.component';
import { Documento } from '../../modelos/documento.model';
import { DocumentoService } from '../../servicios/documento.service';

@Component({
  selector: 'app-pagina-documentos',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule, CargandoComponent],
  template: `
    <div class="space-y-6">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-slate-800 flex items-center gap-3">
            <lucide-icon [img]="iconoFileText" class="w-7 h-7 text-medico-500"></lucide-icon>
            Documentos
          </h1>
          <p class="text-slate-400 mt-1">{{ documentosFiltrados().length }} documentos generados</p>
        </div>
      </div>

      <div class="bg-white rounded-xl border border-slate-200 p-4">
        <div class="flex flex-wrap gap-3">
          <div class="flex-1 min-w-[200px] relative">
            <lucide-icon [img]="iconoSearch" class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300"></lucide-icon>
            <input type="text" [(ngModel)]="busqueda" placeholder="Buscar documento..."
              class="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-medico-500/20 focus:border-medico-400" />
          </div>
          <select [(ngModel)]="filtroTipo"
            class="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-medico-500/20">
            <option value="">Todos los tipos</option>
            <option value="SOAP">Nota SOAP</option>
            <option value="HistoriaClinica">Historia Clinica</option>
            <option value="Receta">Receta</option>
          </select>
          <select [(ngModel)]="filtroFormato"
            class="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-medico-500/20">
            <option value="">Todos los formatos</option>
            <option value="PDF">PDF</option>
            <option value="Word">Word</option>
          </select>
          <button *ngIf="filtroTipo || filtroFormato || busqueda" (click)="limpiarFiltros()"
            class="px-4 py-2 border border-slate-200 text-slate-500 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors flex items-center gap-1">
            <lucide-icon [img]="iconoFilter" class="w-3 h-3"></lucide-icon> Limpiar
          </button>
        </div>
      </div>

      <app-cargando *ngIf="estaCargando()"></app-cargando>

      <div *ngIf="!estaCargando() && documentosFiltrados().length === 0"
        class="bg-white rounded-xl border border-slate-200 border-dashed p-16 text-center">
        <lucide-icon [img]="iconoFileText" class="w-16 h-16 text-slate-200 mx-auto mb-4"></lucide-icon>
        <p class="text-slate-400 text-sm">No hay documentos</p>
      </div>

      <div *ngIf="!estaCargando() && documentosFiltrados().length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div *ngFor="let doc of documentosFiltrados()"
          class="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition-shadow group">
          <div class="flex items-start justify-between mb-3">
            <div [ngClass]="doc.formatoDeArchivo === 'PDF' ? 'bg-red-50' : 'bg-medico-50'"
              class="w-10 h-10 rounded-lg flex items-center justify-center">
              <lucide-icon [img]="doc.formatoDeArchivo === 'PDF' ? iconoFile : iconoFileSpreadsheet"
                [ngClass]="doc.formatoDeArchivo === 'PDF' ? 'text-red-500' : 'text-medico-500'" class="w-5 h-5"></lucide-icon>
            </div>
            <span [ngClass]="doc.formatoDeArchivo === 'PDF' ? 'bg-red-50 text-red-500' : 'bg-medico-50 text-medico-500'"
              class="text-[10px] font-bold px-2 py-0.5 rounded-full">
              {{ doc.formatoDeArchivo }}
            </span>
          </div>
          <p class="text-sm font-semibold text-slate-800 mb-0.5">Documento #{{ doc.idDocumento }}</p>
          <p class="text-[11px] text-slate-400 truncate mb-2" [title]="doc.rutaFisicaDelArchivo">{{ doc.rutaFisicaDelArchivo }}</p>
          <div class="flex items-center gap-3 text-xs text-slate-400 mb-4 flex-wrap">
            <span>{{ doc.tipoDocumentoClinico }}</span>
            <span>&bull;</span>
            <span>v{{ doc.numeroDeVersion }}</span>
            <span>&bull;</span>
            <span [ngClass]="colorEstado(doc.estadoDeAprobacion)">{{ doc.estadoDeAprobacion }}</span>
          </div>
          <button (click)="descargarDocumento(doc)"
            class="w-full flex items-center justify-center gap-2 py-2 border border-slate-200 rounded-lg text-sm text-slate-600 font-medium hover:bg-medico-50 hover:text-medico-600 hover:border-medico-200 transition-all">
            <lucide-icon [img]="iconoDownload" class="w-4 h-4"></lucide-icon> Descargar
          </button>
        </div>
      </div>
    </div>
  `
})
export class PaginaDocumentosComponent {
  private readonly documentoService = inject(DocumentoService);

  iconoFileText = FileText;
  iconoDownload = Download;
  iconoSearch = Search;
  iconoFilter = Filter;
  iconoFile = File;
  iconoFileSpreadsheet = FileSpreadsheet;
  iconoChevronLeft = ChevronLeft;
  iconoChevronRight = ChevronRight;

  documentos = signal<Documento[]>([]);
  estaCargando = signal(true);
  busqueda = '';
  filtroTipo = '';
  filtroFormato = '';

  documentosFiltrados = computed(() => {
    const q = this.busqueda.toLowerCase();
    return this.documentos().filter(d => {
      if (this.filtroTipo && d.tipoDocumentoClinico !== this.filtroTipo) return false;
      if (this.filtroFormato && d.formatoDeArchivo !== this.filtroFormato) return false;
      if (q && !(`${d.rutaFisicaDelArchivo} ${d.tipoDocumentoClinico}`.toLowerCase().includes(q))) return false;
      return true;
    });
  });

  constructor() {
    this.cargarDocumentos();
  }

  cargarDocumentos(): void {
    this.documentoService.listarTodos().subscribe({
      next: (datos) => {
        this.documentos.set(datos);
        this.estaCargando.set(false);
      },
      error: () => this.estaCargando.set(false)
    });
  }

  limpiarFiltros(): void {
    this.busqueda = '';
    this.filtroTipo = '';
    this.filtroFormato = '';
  }

  colorEstado(estado: string): string {
    if (estado === 'Aprobado') return 'text-emerald-600';
    if (estado === 'Rechazado') return 'text-red-500';
    return 'text-amber-600';
  }

  descargarDocumento(doc: Documento): void {
    this.documentoService.descargar(doc.idDocumento).subscribe({
      next: (blob) => {
        const extension = doc.formatoDeArchivo === 'PDF' ? 'pdf' : 'docx';
        const enlace = document.createElement('a');
        enlace.href = URL.createObjectURL(blob);
        enlace.download = `documento_${doc.idDocumento}.${extension}`;
        enlace.click();
        URL.revokeObjectURL(enlace.href);
      }
    });
  }
}
