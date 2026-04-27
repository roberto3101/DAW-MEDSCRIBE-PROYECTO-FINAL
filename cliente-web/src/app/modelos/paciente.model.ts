export type TipoDocumento = 'DNI' | 'CE' | 'Pasaporte';

export type SexoBiologico = 'Masculino' | 'Femenino';

export interface Paciente {
  idPaciente: number;
  idClinica?: number;
  nombreDelPaciente: string;
  apellidoDelPaciente: string;
  numeroDocumentoIdentidad: string;
  tipoDocumentoIdentidad: TipoDocumento;
  fechaDeNacimiento: string;
  sexoBiologico: SexoBiologico;
  telefonoDeContacto: string;
  correoElectronico: string;
  direccionDomiciliaria: string;
  estaPacienteActivo: boolean;
  fechaRegistroEnSistema: string;
  fechaEliminacion?: string | null;
}

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
