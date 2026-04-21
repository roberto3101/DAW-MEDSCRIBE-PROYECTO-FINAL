import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { environment } from '../../environments/environment';
import { Documento, DocumentoPeticion } from '../modelos/documento.model';
import { AutenticacionService } from './autenticacion.service';

/** CRUD de documentos clinicos. */
@Injectable({ providedIn: 'root' })
export class DocumentoService {
  private readonly http = inject(HttpClient);
  private readonly autenticacion = inject(AutenticacionService);
  private readonly urlBase = `${environment.apiUrl}/documentos`;

  /**
   * El backend solo expone el listado filtrado por medico;
   * reutilizamos el id del usuario autenticado.
   */
  listarTodos(): Observable<Documento[]> {
    const usuario = this.autenticacion.obtenerUsuario();
    if (!usuario) {
      return of([]);
    }
    return this.http.get<Documento[]>(
      `${this.urlBase}/medico/${usuario.idUsuario}`
    );
  }

  obtenerPorId(id: number): Observable<Documento> {
    return this.http.get<Documento>(`${this.urlBase}/${id}`);
  }

  listarPorConsulta(idConsulta: number): Observable<Documento[]> {
    return this.http.get<Documento[]>(
      `${this.urlBase}/consulta/${idConsulta}`
    );
  }

  crear(documento: DocumentoPeticion): Observable<Documento> {
    return this.http.post<Documento>(this.urlBase, documento);
  }

  aprobar(id: number): Observable<Documento> {
    return this.http.put<Documento>(`${this.urlBase}/${id}/aprobar`, {});
  }

  urlDescarga(id: number): string {
    return `${this.urlBase}/${id}/descargar`;
  }
}
