import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { RespuestaLogin, Usuario } from '../modelos/usuario.model';

/** Servicio encargado del flujo de autenticacion con el gateway. */
@Injectable({ providedIn: 'root' })
export class AutenticacionService {
  private readonly http = inject(HttpClient);
  private readonly urlBase = `${environment.apiUrl}/autenticacion`;

  private readonly claveToken = 'token';
  private readonly claveUsuario = 'usuario';

  /** Solicita un token al backend y lo persiste en localStorage. */
  iniciarSesion(correo: string, contrasena: string): Observable<RespuestaLogin> {
    return this.http
      .post<RespuestaLogin>(`${this.urlBase}/iniciar-sesion`, {
        correoElectronico: correo,
        contrasena
      })
      .pipe(
        tap((respuesta) => {
          localStorage.setItem(this.claveToken, respuesta.token);
          localStorage.setItem(
            this.claveUsuario,
            JSON.stringify(respuesta.usuario)
          );
        })
      );
  }

  /** Limpia el estado de sesion en el cliente. */
  cerrarSesion(): void {
    localStorage.removeItem(this.claveToken);
    localStorage.removeItem(this.claveUsuario);
  }

  /** Devuelve el token JWT si existe. */
  obtenerToken(): string | null {
    return localStorage.getItem(this.claveToken);
  }

  /** Recupera los datos del usuario autenticado. */
  obtenerUsuario(): Usuario | null {
    const crudo = localStorage.getItem(this.claveUsuario);
    if (!crudo) {
      return null;
    }
    try {
      return JSON.parse(crudo) as Usuario;
    } catch {
      return null;
    }
  }

  /** Indica si hay una sesion activa. */
  estaAutenticado(): boolean {
    return this.obtenerToken() !== null;
  }
}
