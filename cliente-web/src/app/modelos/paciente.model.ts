/** Tipos de documento aceptados por el backend. */
export type TipoDocumento = 'DNI' | 'CE' | 'Pasaporte';

/** Sexo biologico (valores aceptados por el backend). */
export type SexoBiologico = 'Masculino' | 'Femenino' | 'Otro';

/**
 * Representacion completa del paciente que devuelve el gateway
 * (coincide con la entidad `Paciente` del backend).
 */
export interface Paciente {
  idPaciente?: number;
  idClinica?: number;
  nombreDelPaciente: string;
  apellidoDelPaciente: string;
  numeroDocumentoIdentidad: string;
  tipoDocumentoIdentidad: TipoDocumento;
  fechaDeNacimiento: string;
  sexoBiologico: SexoBiologico;
  telefonoDeContacto?: string;
  correoElectronico?: string;
  direccionDomiciliaria?: string;
  estaPacienteActivo?: boolean;
  fechaRegistroEnSistema?: string;
  fechaEliminacion?: string | null;
}

/**
 * Cuerpo aceptado por POST/PUT /api/pacientes
 * (coincide con el DTO `PacientePeticion` del gateway).
 */
export interface PacientePeticion {
  nombreDelPaciente: string;
  apellidoDelPaciente: string;
  numeroDocumentoIdentidad: string;
  tipoDocumentoIdentidad: TipoDocumento;
  fechaDeNacimiento: string;
  sexoBiologico: SexoBiologico;
  telefonoDeContacto?: string;
  correoElectronico?: string;
  direccionDomiciliaria?: string;
  idClinica?: number;
}
