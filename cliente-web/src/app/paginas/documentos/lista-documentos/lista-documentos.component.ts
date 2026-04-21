import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DocumentoService } from '../../../servicios/documento.service';
import { Documento } from '../../../modelos/documento.model';

/** Lista de documentos clinicos. */
@Component({
  selector: 'app-lista-documentos',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './lista-documentos.component.html',
  styleUrls: ['./lista-documentos.component.css']
})
export class ListaDocumentosComponent implements OnInit {
  private readonly documentoService = inject(DocumentoService);

  documentos: Documento[] = [];
  cargando = false;
  error: string | null = null;

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.cargando = true;
    this.error = null;
    this.documentoService.listarTodos().subscribe({
      next: (data) => {
        this.documentos = data;
        this.cargando = false;
      },
      error: () => {
        this.error = 'No se pudo obtener la lista de documentos.';
        this.cargando = false;
      }
    });
  }

  urlDescarga(id: number | undefined): string {
    return id === undefined ? '#' : this.documentoService.urlDescarga(id);
  }

  aprobar(documento: Documento): void {
    if (documento.idDocumento === undefined) return;
    this.documentoService.aprobar(documento.idDocumento).subscribe({
      next: () => this.cargar(),
      error: () => alert('No se pudo aprobar el documento.')
    });
  }
}
