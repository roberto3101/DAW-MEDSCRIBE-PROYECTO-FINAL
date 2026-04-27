import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  CambiarRolPeticion,
  CrearUsuarioEnClinicaPeticion,
  PermisosPersonalizadosPeticion,
  PermisosUsuarioRespuesta,
  UsuarioDeClinica
} from '../modelos/rol.model';

@Injectable({ providedIn: 'root' })
export class UsuarioClinicaService {
  private readonly http = inject(HttpClient);
  private readonly urlBase = `${environment.apiUrl}/usuarios-clinica`;

  listarUsuarios(): Observable<UsuarioDeClinica[]> {
    return this.http.get<UsuarioDeClinica[]>(this.urlBase);
  }

  crearUsuario(peticion: CrearUsuarioEnClinicaPeticion): Observable<UsuarioDeClinica> {
    return this.http.post<UsuarioDeClinica>(this.urlBase, peticion);
  }

  cambiarRol(idUsuario: number, peticion: CambiarRolPeticion): Observable<UsuarioDeClinica> {
    return this.http.put<UsuarioDeClinica>(`${this.urlBase}/${idUsuario}/cambiar-rol`, peticion);
  }

  obtenerPermisos(idUsuario: number): Observable<PermisosUsuarioRespuesta> {
    return this.http.get<PermisosUsuarioRespuesta>(`${this.urlBase}/${idUsuario}/permisos`);
  }

  guardarPermisosPersonalizados(
    idUsuario: number,
    peticion: PermisosPersonalizadosPeticion
  ): Observable<void> {
    return this.http.put<void>(`${this.urlBase}/${idUsuario}/permisos`, peticion);
  }
}
