import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  Consulta,
  ConsultaPeticion,
  RegistrarConsultaPeticion
} from '../modelos/consulta.model';
import { AutenticacionService } from './autenticacion.service';

/** CRUD de consultas medicas. */
@Injectable({ providedIn: 'root' })
export class ConsultaService {
  private readonly http = inject(HttpClient);
  private readonly autenticacion = inject(AutenticacionService);
  private readonly urlBase = `${environment.apiUrl}/consultas`;

  /**
   * El backend solo expone el listado filtrado por medico.
   * Usamos el id del usuario autenticado; si no hay sesion
   * devolvemos un listado vacio para no romper la UI.
   */
  listarTodas(): Observable<Consulta[]> {
    const usuario = this.autenticacion.obtenerUsuario();
    if (!usuario) {
      return of([]);
    }
    return this.http.get<Consulta[]>(
      `${this.urlBase}/medico/${usuario.idUsuario}`
    );
  }

  obtenerPorId(id: number): Observable<Consulta> {
    return this.http.get<Consulta>(`${this.urlBase}/${id}`);
  }

  crear(consulta: RegistrarConsultaPeticion): Observable<Consulta> {
    return this.http.post<Consulta>(`${this.urlBase}/registrar`, consulta);
  }

  actualizar(id: number, consulta: ConsultaPeticion): Observable<Consulta> {
    return this.http.put<Consulta>(`${this.urlBase}/${id}`, consulta);
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.urlBase}/${id}`);
  }

  aprobar(id: number): Observable<Consulta> {
    return this.http.put<Consulta>(`${this.urlBase}/${id}/aprobar`, {});
  }

  rechazar(id: number): Observable<Consulta> {
    return this.http.put<Consulta>(`${this.urlBase}/${id}/rechazar`, {});
  }
}
