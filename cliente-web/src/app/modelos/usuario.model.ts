export type RolSistema = 'Administrador' | 'Medico' | 'Recepcionista' | string;

export interface Usuario {
  idUsuario: number;
  idClinica?: number | null;
  nombreCompleto: string;
  correoElectronico: string;
  rolDelSistema: RolSistema;
  nombreRol?: string;
  nombreClinica?: string;
  permisosDelRol?: string;
  permisosPersonalizados?: string;
  estaCuentaActiva?: boolean;
}

export interface SolicitudLogin {
  correoElectronico: string;
  contrasena: string;
}

export interface RespuestaLogin {
  token: string;
  usuario: Usuario;
}

export interface RegistroUsuarioPeticion {
  nombreCompleto: string;
  correoElectronico: string;
  contrasena: string;
  rolDelSistema: string;
  especialidadMedica?: string;
  numeroColegiaturaDelPeru?: string;
}

export interface CambiarContrasenaPeticion {
  idUsuario: number;
  contrasenaActual: string;
  contrasenaNueva: string;
}

export interface PermisosModulo {
  ver: boolean;
  crear: boolean;
  editar: boolean;
  eliminar: boolean;
}

export interface PermisosParsed {
  pacientes: PermisosModulo;
  consultas: PermisosModulo;
  documentos: PermisosModulo;
  configuracion: PermisosModulo;
  usuarios: PermisosModulo;
  roles: PermisosModulo;
  [key: string]: PermisosModulo;
}
