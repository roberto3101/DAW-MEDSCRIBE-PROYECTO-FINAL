import { TipoDocumentoClinico } from './consulta.model';

/** Formatos de archivo admitidos para el documento generado. */
export type FormatoArchivo = 'PDF' | 'Word';

/** Estados de aprobacion admitidos por el backend. */
export type EstadoAprobacion = 'Borrador' | 'Aprobado' | 'Rechazado';

/**
 * Entidad documento devuelta por el gateway
 * (coincide con `modelos/Documento.java`).
 */
export interface Documento {
  idDocumento?: number;
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

/**
 * Cuerpo aceptado por POST /api/documentos
 * (coincide con `DocumentoPeticion.java`).
 */
export interface DocumentoPeticion {
  idConsultaVinculada: number;
  tipoDocumentoClinico: TipoDocumentoClinico;
  formatoDeArchivo: FormatoArchivo;
  rutaFisicaDelArchivo: string;
  estadoDeAprobacion?: EstadoAprobacion;
  numeroDeVersion?: number;
  idClinica?: number;
}
