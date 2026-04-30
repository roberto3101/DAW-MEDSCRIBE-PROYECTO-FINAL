import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Rol, RolPeticion } from '../modelos/rol.model';

@Injectable({ providedIn: 'root' })
export class RolService {
  private readonly http = inject(HttpClient);
  private readonly urlBase = `${environment.apiUrl}/roles`;

  listarRoles(): Observable<Rol[]> {
    return this.http.get<Rol[]>(this.urlBase);
  }

  crearRol(peticion: RolPeticion): Observable<Rol> {
    return this.http.post<Rol>(this.urlBase, peticion);
  }

  actualizarRol(idRol: number, peticion: RolPeticion): Observable<Rol> {
    return this.http.put<Rol>(`${this.urlBase}/${idRol}`, peticion);
  }

  cambiarEstadoRol(idRol: number, estaActivo: boolean): Observable<Rol> {
    return this.http.put<Rol>(`${this.urlBase}/${idRol}/estado`, { estaActivo });
  }

  eliminarRol(idRol: number): Observable<void> {
    return this.http.delete<void>(`${this.urlBase}/${idRol}`);
  }
}
