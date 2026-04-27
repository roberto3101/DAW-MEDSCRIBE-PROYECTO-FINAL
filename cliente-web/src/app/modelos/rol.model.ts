export interface Rol {
  idRol: number;
  idClinica?: number;
  nombreDelRol: string;
  descripcionDelRol: string;
  permisosEnFormatoJSON: string;
  esRolBase: boolean;
  estaActivo: boolean;
}

export interface RolPeticion {
  nombre: string;
  descripcion: string;
  permisosJson: string;
  idClinica?: number;
}

export interface UsuarioDeClinica {
  idUsuario: number;
  idClinica?: number;
  nombreCompleto: string;
  correoElectronico: string;
  rolDelSistema: string;
  nombreDelRol: string;
  estaCuentaActiva: boolean;
  fechaRegistroEnSistema: string;
  idRol: number;
}

export interface CrearUsuarioEnClinicaPeticion {
  nombreCompleto: string;
  correoElectronico: string;
  contrasena: string;
  idRol: number;
  rolDelSistema?: string;
}

export interface CambiarRolPeticion {
  idRol: number;
}

export interface PermisosPersonalizadosPeticion {
  permisosPersonalizadosJSON: string;
}

export interface PermisosUsuarioRespuesta {
  idUsuario: number;
  nombreCompleto: string;
  nombreDelRol: string;
  permisosDelRolBase: string;
  permisosPersonalizados: string;
}

export interface Clinica {
  idClinica: number;
  razonSocial: string;
  rucDeLaClinica: string;
  nombreComercial: string;
  direccion?: string;
  telefono?: string;
  correo?: string;
  logoUrl?: string;
  colorPrimario?: string;
  estaClinicaActiva?: boolean;
}

export interface RegistrarClinicaPeticion {
  razonSocial: string;
  ruc: string;
  nombreComercial: string;
  correoContacto: string;
  nombreAdmin: string;
  correoAdmin: string;
  contrasenaAdmin: string;
}
