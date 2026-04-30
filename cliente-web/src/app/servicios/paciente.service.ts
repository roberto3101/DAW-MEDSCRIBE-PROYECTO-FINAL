import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Paciente, PacientePeticion } from '../modelos/paciente.model';

@Injectable({ providedIn: 'root' })
export class PacienteService {
  private readonly http = inject(HttpClient);
  private readonly urlBase = `${environment.apiUrl}/pacientes`;

  listarPacientes(): Observable<Paciente[]> {
    return this.http.get<Paciente[]>(this.urlBase);
  }

  buscarPacientePorId(id: number): Observable<Paciente> {
    return this.http.get<Paciente>(`${this.urlBase}/${id}`);
  }

  buscarPacientePorDocumento(numero: string): Observable<Paciente> {
    return this.http.get<Paciente>(`${this.urlBase}/documento/${numero}`);
  }

  crearPaciente(paciente: PacientePeticion): Observable<Paciente> {
    return this.http.post<Paciente>(this.urlBase, paciente);
  }

  actualizarPaciente(id: number, paciente: PacientePeticion): Observable<Paciente> {
    return this.http.put<Paciente>(`${this.urlBase}/${id}`, paciente);
  }

  desactivarPaciente(id: number): Observable<void> {
    return this.http.delete<void>(`${this.urlBase}/${id}`);
  }

  // Alias retrocompatibles (usados en componentes antiguos)
  listarTodos(): Observable<Paciente[]> { return this.listarPacientes(); }
  obtenerPorId(id: number): Observable<Paciente> { return this.buscarPacientePorId(id); }
  crear(paciente: PacientePeticion): Observable<Paciente> { return this.crearPaciente(paciente); }
  actualizar(id: number, paciente: PacientePeticion): Observable<Paciente> { return this.actualizarPaciente(id, paciente); }
  eliminar(id: number): Observable<void> { return this.desactivarPaciente(id); }
}
