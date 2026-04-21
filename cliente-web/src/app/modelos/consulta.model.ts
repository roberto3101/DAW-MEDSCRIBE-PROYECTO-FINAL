/** Tipos de documento clinico admitidos por la consulta. */
export type TipoDocumentoClinico =
  | 'SOAP'
  | 'HistoriaClinica'
  | 'Receta'
  | 'Personalizada';

/** Estados por los que atraviesa una consulta. */
export type EstadoConsulta =
  | 'Grabando'
  | 'Transcribiendo'
  | 'Procesando'
  | 'Borrador'
  | 'Aprobado'
  | 'Rechazado';

/**
 * Entidad consulta devuelta por el gateway
 * (coincide con `modelos/Consulta.java`).
 */
export interface Consulta {
  idConsulta?: number;
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

/**
 * Cuerpo aceptado por POST /api/consultas/registrar
 * (coincide con `RegistrarConsultaPeticion.java`).
 */
export interface RegistrarConsultaPeticion {
  idMedicoResponsable: number;
  idPacienteAtendido: number;
  especialidad: string;
  tipoDocumento: TipoDocumentoClinico;
  transcripcion?: string;
  notaClinica?: string;
  idClinica?: number;
}

/**
 * Cuerpo aceptado por PUT /api/consultas/{id}
 * (coincide con `ConsultaPeticion.java`).
 */
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
