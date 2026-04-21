import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Paciente, PacientePeticion } from '../modelos/paciente.model';

/** CRUD de pacientes contra el gateway REST. */
@Injectable({ providedIn: 'root' })
export class PacienteService {
  private readonly http = inject(HttpClient);
  private readonly urlBase = `${environment.apiUrl}/pacientes`;

  listarTodos(): Observable<Paciente[]> {
    return this.http.get<Paciente[]>(this.urlBase);
  }

  obtenerPorId(id: number): Observable<Paciente> {
    return this.http.get<Paciente>(`${this.urlBase}/${id}`);
  }

  crear(paciente: PacientePeticion): Observable<Paciente> {
    return this.http.post<Paciente>(this.urlBase, paciente);
  }

  actualizar(id: number, paciente: PacientePeticion): Observable<Paciente> {
    return this.http.put<Paciente>(`${this.urlBase}/${id}`, paciente);
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.urlBase}/${id}`);
  }
}
