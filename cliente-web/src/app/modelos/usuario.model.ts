/** Rol del sistema asignado al usuario. */
export type RolSistema = 'Administrador' | 'Medico' | 'Asistente' | string;

/**
 * Usuario autenticado devuelto por el gateway
 * (coincide con `UsuarioDTO.java`).
 */
export interface Usuario {
  idUsuario: number;
  idClinica?: number | null;
  nombreCompleto: string;
  correoElectronico: string;
  rolDelSistema: RolSistema;
  estaCuentaActiva?: boolean;
}

/** Payload enviado al endpoint de inicio de sesion. */
export interface SolicitudLogin {
  correoElectronico: string;
  contrasena: string;
}

/** Respuesta del gateway al iniciar sesion. */
export interface RespuestaLogin {
  token: string;
  usuario: Usuario;
}
