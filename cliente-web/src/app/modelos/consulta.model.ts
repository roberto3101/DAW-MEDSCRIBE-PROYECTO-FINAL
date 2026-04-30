export type TipoDocumentoClinico = 'SOAP' | 'HistoriaClinica' | 'Receta' | 'Personalizada';

export type EstadoConsulta =
  | 'Grabando'
  | 'Transcribiendo'
  | 'Procesando'
  | 'Borrador'
  | 'Aprobado'
  | 'Rechazado';

export interface Consulta {
  idConsulta: number;
  idClinica?: number;
  idMedicoResponsable: number;
  idPacienteAtendido: number;
  idPlantillaUtilizada?: number | null;
  especialidadMedicaAplicada: string;
  tipoDocumentoClinico: TipoDocumentoClinico;
  rutaArchivoDeAudio?: string;
  transcripcionDelAudio?: string;
  notaClinicaEstructurada?: string;
  estadoActualDeLaConsulta?: EstadoConsulta;
  duracionEnSegundos?: number;
  fechaYHoraDeLaConsulta?: string;
  fechaCreacionEnSistema?: string;
  fechaEliminacion?: string | null;
}

export interface RegistrarConsultaPeticion {
  idMedicoResponsable: number;
  idPacienteAtendido: number;
  especialidad: string;
  tipoDocumento: TipoDocumentoClinico;
  transcripcion?: string;
  notaClinica?: string;
  idClinica?: number;
}

export interface ConsultaPeticion {
  idMedicoResponsable: number;
  idPacienteAtendido: number;
  especialidadMedicaAplicada: string;
  tipoDocumentoClinico: TipoDocumentoClinico;
  transcripcionDelAudio?: string;
  notaClinicaEstructurada?: string;
  rutaArchivoDeAudio?: string;
  estadoActualDeLaConsulta?: EstadoConsulta;
  duracionEnSegundos?: number;
  fechaYHoraDeLaConsulta?: string;
  idClinica?: number;
}

export interface RespuestaCrearConsulta {
  idConsulta: number;
  transcripcion: string;
  notaClinica: string;
  estado: string;
}
