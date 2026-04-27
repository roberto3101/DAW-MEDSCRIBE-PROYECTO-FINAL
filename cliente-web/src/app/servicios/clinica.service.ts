import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Clinica, RegistrarClinicaPeticion } from '../modelos/rol.model';

@Injectable({ providedIn: 'root' })
export class ClinicaService {
  private readonly http = inject(HttpClient);
  private readonly urlBase = `${environment.apiUrl}/clinicas`;

  listarClinicas(): Observable<Clinica[]> {
    return this.http.get<Clinica[]>(this.urlBase);
  }

  obtenerClinica(idClinica: number): Observable<Clinica> {
    return this.http.get<Clinica>(`${this.urlBase}/${idClinica}`);
  }

  registrarClinica(peticion: RegistrarClinicaPeticion): Observable<any> {
    return this.http.post(`${this.urlBase}/registrar`, peticion);
  }
}
