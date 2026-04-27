import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  Consulta,
  ConsultaPeticion,
  RegistrarConsultaPeticion,
  RespuestaCrearConsulta
} from '../modelos/consulta.model';
import { AutenticacionService } from './autenticacion.service';

@Injectable({ providedIn: 'root' })
export class ConsultaService {
  private readonly http = inject(HttpClient);
  private readonly autenticacion = inject(AutenticacionService);
  private readonly urlBase = `${environment.apiUrl}/consultas`;

  listarConsultasPorMedico(idMedico: number): Observable<Consulta[]> {
    return this.http.get<Consulta[]>(`${this.urlBase}/medico/${idMedico}`);
  }

  listarTodas(): Observable<Consulta[]> {
    const usuario = this.autenticacion.obtenerUsuario();
    if (!usuario) return of([]);
    return this.listarConsultasPorMedico(usuario.idUsuario);
  }

  buscarConsultaPorId(id: number): Observable<Consulta> {
    return this.http.get<Consulta>(`${this.urlBase}/${id}`);
  }

  crearConsultaDesdeAudio(formData: FormData): Observable<RespuestaCrearConsulta> {
    return this.http.post<RespuestaCrearConsulta>(this.urlBase, formData);
  }

  registrarConsulta(consulta: RegistrarConsultaPeticion): Observable<Consulta> {
    return this.http.post<Consulta>(`${this.urlBase}/registrar`, consulta);
  }

  actualizar(id: number, consulta: ConsultaPeticion): Observable<Consulta> {
    return this.http.put<Consulta>(`${this.urlBase}/${id}`, consulta);
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.urlBase}/${id}`);
  }

  aprobarConsulta(id: number): Observable<Consulta> {
    return this.http.put<Consulta>(`${this.urlBase}/${id}/aprobar`, {});
  }

  rechazarConsulta(id: number): Observable<Consulta> {
    return this.http.put<Consulta>(`${this.urlBase}/${id}/rechazar`, {});
  }

  // Alias retrocompatibles
  obtenerPorId(id: number): Observable<Consulta> { return this.buscarConsultaPorId(id); }
  crear(consulta: RegistrarConsultaPeticion): Observable<Consulta> { return this.registrarConsulta(consulta); }
  aprobar(id: number): Observable<Consulta> { return this.aprobarConsulta(id); }
  rechazar(id: number): Observable<Consulta> { return this.rechazarConsulta(id); }
}
