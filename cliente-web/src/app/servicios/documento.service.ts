import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { environment } from '../../environments/environment';
import { Documento, DocumentoPeticion } from '../modelos/documento.model';
import { AutenticacionService } from './autenticacion.service';

@Injectable({ providedIn: 'root' })
export class DocumentoService {
  private readonly http = inject(HttpClient);
  private readonly autenticacion = inject(AutenticacionService);
  private readonly urlBase = `${environment.apiUrl}/documentos`;

  listarDocumentosPorMedico(idMedico: number): Observable<Documento[]> {
    return this.http.get<Documento[]>(`${this.urlBase}/medico/${idMedico}`);
  }

  listarTodos(): Observable<Documento[]> {
    const usuario = this.autenticacion.obtenerUsuario();
    if (!usuario) return of([]);
    return this.listarDocumentosPorMedico(usuario.idUsuario);
  }

  buscarDocumentoPorId(id: number): Observable<Documento> {
    return this.http.get<Documento>(`${this.urlBase}/${id}`);
  }

  listarPorConsulta(idConsulta: number): Observable<Documento[]> {
    return this.http.get<Documento[]>(`${this.urlBase}/consulta/${idConsulta}`);
  }

  crear(documento: DocumentoPeticion): Observable<Documento> {
    return this.http.post<Documento>(this.urlBase, documento);
  }

  descargar(id: number): Observable<Blob> {
    return this.http.get(`${this.urlBase}/${id}/descargar`, { responseType: 'blob' });
  }

  aprobar(id: number): Observable<Documento> {
    return this.http.put<Documento>(`${this.urlBase}/${id}/aprobar`, {});
  }

  urlDescarga(id: number): string {
    return `${this.urlBase}/${id}/descargar`;
  }

  // Alias retrocompatibles
  obtenerPorId(id: number): Observable<Documento> { return this.buscarDocumentoPorId(id); }
}
