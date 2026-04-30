import { TipoDocumentoClinico } from './consulta.model';

export type FormatoArchivo = 'PDF' | 'Word';

export type EstadoAprobacion = 'Borrador' | 'Aprobado' | 'Rechazado';

export interface Documento {
  idDocumento: number;
  idClinica?: number;
  idConsultaVinculada: number;
  tipoDocumentoClinico: TipoDocumentoClinico;
  formatoDeArchivo: FormatoArchivo;
  rutaFisicaDelArchivo: string;
  estadoDeAprobacion: EstadoAprobacion;
  numeroDeVersion: number;
  fechaDeGeneracion?: string;
  fechaEliminacion?: string | null;
}

export interface DocumentoPeticion {
  idConsultaVinculada: number;
  tipoDocumentoClinico: TipoDocumentoClinico;
  formatoDeArchivo: FormatoArchivo;
  rutaFisicaDelArchivo: string;
  estadoDeAprobacion?: EstadoAprobacion;
  numeroDeVersion?: number;
  idClinica?: number;
}
