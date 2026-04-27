import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  CambiarContrasenaPeticion,
  PermisosModulo,
  PermisosParsed,
  RegistroUsuarioPeticion,
  RespuestaLogin,
  SolicitudLogin,
  Usuario
} from '../modelos/usuario.model';

const CLAVE_ALMACENAMIENTO = 'medscribe_sesion';
const CLAVE_TOKEN = 'token';

const PERMISOS_VACIOS: PermisosModulo = { ver: false, crear: false, editar: false, eliminar: false };

function parsearPermisos(permisosJson?: string): PermisosParsed | null {
  if (!permisosJson) return null;
  try {
    return JSON.parse(permisosJson);
  } catch {
    return null;
  }
}

@Injectable({ providedIn: 'root' })
export class AutenticacionService {
  private readonly http = inject(HttpClient);
  private readonly urlBase = `${environment.apiUrl}/autenticacion`;

  private readonly usuarioSignal = signal<Usuario | null>(this.cargarUsuarioLocalStorage());
  readonly usuario = this.usuarioSignal.asReadonly();
  readonly estaAutenticado = computed(() => this.usuarioSignal() !== null);
  readonly permisosDelUsuario = computed<PermisosParsed | null>(() => {
    const u = this.usuarioSignal();
    if (!u?.permisosDelRol) return null;
    const base = parsearPermisos(u.permisosDelRol);
    if (!base) return null;
    const personalizados = u.permisosPersonalizados ? parsearPermisos(u.permisosPersonalizados) : null;
    if (!personalizados) return base;
    const mergeado: PermisosParsed = { ...(base as any) };
    for (const modulo of Object.keys(personalizados)) {
      if (!mergeado[modulo]) mergeado[modulo] = { ...PERMISOS_VACIOS };
      for (const accion of Object.keys((personalizados as any)[modulo])) {
        (mergeado as any)[modulo][accion] = (personalizados as any)[modulo][accion];
      }
    }
    return mergeado;
  });

  iniciarSesion(peticion: SolicitudLogin): Observable<RespuestaLogin> {
    return this.http.post<RespuestaLogin>(`${this.urlBase}/iniciar-sesion`, peticion).pipe(
      tap((respuesta) => {
        localStorage.setItem(CLAVE_TOKEN, respuesta.token);
        localStorage.setItem(CLAVE_ALMACENAMIENTO, JSON.stringify(respuesta.usuario));
        this.usuarioSignal.set(respuesta.usuario);
      })
    );
  }

  registrarUsuario(peticion: RegistroUsuarioPeticion): Observable<RespuestaLogin> {
    return this.http.post<RespuestaLogin>(`${this.urlBase}/registro`, peticion).pipe(
      tap((respuesta) => {
        localStorage.setItem(CLAVE_TOKEN, respuesta.token);
        localStorage.setItem(CLAVE_ALMACENAMIENTO, JSON.stringify(respuesta.usuario));
        this.usuarioSignal.set(respuesta.usuario);
      })
    );
  }

  cambiarContrasena(peticion: CambiarContrasenaPeticion): Observable<void> {
    return this.http.post<void>(`${this.urlBase}/cambiar-contrasena`, peticion);
  }

  cerrarSesion(): void {
    localStorage.removeItem(CLAVE_TOKEN);
    localStorage.removeItem(CLAVE_ALMACENAMIENTO);
    this.usuarioSignal.set(null);
  }

  obtenerToken(): string | null {
    return localStorage.getItem(CLAVE_TOKEN);
  }

  obtenerUsuario(): Usuario | null {
    return this.usuarioSignal();
  }

  tienePermiso(modulo: string, accion: string): boolean {
    const u = this.usuarioSignal();
    if (!u) return false;
    // Si el usuario es Administrador del sistema, tiene todos los permisos.
    if (u.rolDelSistema === 'Administrador') return true;

    const permisos = this.permisosDelUsuario();
    // Si el backend no envio permisos (por ejemplo, versiones previas), conceder por defecto.
    if (!permisos) return true;
    const permisoModulo = permisos[modulo];
    if (!permisoModulo) return false;
    return (permisoModulo as any)[accion] === true;
  }

  actualizarUsuarioEnSesion(usuarioActualizado: Usuario): void {
    localStorage.setItem(CLAVE_ALMACENAMIENTO, JSON.stringify(usuarioActualizado));
    this.usuarioSignal.set(usuarioActualizado);
  }

  private cargarUsuarioLocalStorage(): Usuario | null {
    try {
      const crudo = localStorage.getItem(CLAVE_ALMACENAMIENTO);
      return crudo ? JSON.parse(crudo) : null;
    } catch {
      return null;
    }
  }
}
