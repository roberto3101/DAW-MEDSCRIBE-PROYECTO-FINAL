package pe.medscribe.gateway.servicios;

import jakarta.persistence.EntityNotFoundException;
import org.springframework.stereotype.Service;

import pe.medscribe.gateway.dto.DocumentoPeticion;
import pe.medscribe.gateway.modelos.Documento;
import pe.medscribe.gateway.repositorios.DocumentoRepositorio;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class DocumentoServicio {

    private final DocumentoRepositorio documentoRepositorio;

    public DocumentoServicio(DocumentoRepositorio documentoRepositorio) {
        this.documentoRepositorio = documentoRepositorio;
    }

    public List<Documento> listarPorMedico(Long idMedico) {
        return documentoRepositorio.listarPorIdMedico(idMedico);
    }

    public Documento buscarPorId(Long idDocumento) {
        return documentoRepositorio.findById(idDocumento)
                .orElseThrow(() -> new EntityNotFoundException("Documento no encontrado"));
    }

    public List<Documento> listarPorConsulta(Long idConsulta) {
        return documentoRepositorio.findByIdConsultaVinculada(idConsulta);
    }

    public Documento crear(DocumentoPeticion peticion) {
        Documento documento = Documento.builder()
                .idConsultaVinculada(peticion.getIdConsultaVinculada())
                .tipoDocumentoClinico(peticion.getTipoDocumentoClinico())
                .formatoDeArchivo(peticion.getFormatoDeArchivo())
                .rutaFisicaDelArchivo(peticion.getRutaFisicaDelArchivo())
                .estadoDeAprobacion(peticion.getEstadoDeAprobacion())
                .numeroDeVersion(peticion.getNumeroDeVersion())
                .idClinica(peticion.getIdClinica())
                .fechaDeGeneracion(LocalDateTime.now())
                .build();
        return documentoRepositorio.save(documento);
    }

    public Documento actualizarEstado(Long idDocumento, String nuevoEstado) {
        Documento documento = buscarPorId(idDocumento);
        documento.setEstadoDeAprobacion(nuevoEstado);
        return documentoRepositorio.save(documento);
    }
}
