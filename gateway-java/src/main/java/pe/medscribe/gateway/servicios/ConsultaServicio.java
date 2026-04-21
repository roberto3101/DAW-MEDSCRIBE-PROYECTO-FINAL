package pe.medscribe.gateway.servicios;

import jakarta.persistence.EntityNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import pe.medscribe.gateway.dto.ConsultaPeticion;
import pe.medscribe.gateway.modelos.Consulta;
import pe.medscribe.gateway.modelos.Documento;
import pe.medscribe.gateway.repositorios.ConsultaRepositorio;
import pe.medscribe.gateway.repositorios.DocumentoRepositorio;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
public class ConsultaServicio {

    private final ConsultaRepositorio consultaRepositorio;
    private final DocumentoRepositorio documentoRepositorio;

    public ConsultaServicio(ConsultaRepositorio consultaRepositorio, DocumentoRepositorio documentoRepositorio) {
        this.consultaRepositorio = consultaRepositorio;
        this.documentoRepositorio = documentoRepositorio;
    }

    public List<Consulta> listarPorMedico(Long idMedico) {
        return consultaRepositorio.findByIdMedicoResponsable(idMedico);
    }

    public Consulta buscarPorId(Long idConsulta) {
        return consultaRepositorio.findById(idConsulta)
                .orElseThrow(() -> new EntityNotFoundException("Consulta no encontrada"));
    }

    public Consulta crear(ConsultaPeticion peticion) {
        Consulta consulta = Consulta.builder()
                .idMedicoResponsable(peticion.getIdMedicoResponsable())
                .idPacienteAtendido(peticion.getIdPacienteAtendido())
                .especialidadMedicaAplicada(peticion.getEspecialidadMedicaAplicada())
                .tipoDocumentoClinico(peticion.getTipoDocumentoClinico())
                .rutaArchivoDeAudio(peticion.getRutaArchivoDeAudio())
                .transcripcionDelAudio(peticion.getTranscripcionDelAudio())
                .notaClinicaEstructurada(peticion.getNotaClinicaEstructurada())
                .estadoActualDeLaConsulta(peticion.getEstadoActualDeLaConsulta())
                .duracionEnSegundos(peticion.getDuracionEnSegundos() != null ? peticion.getDuracionEnSegundos() : 0)
                .fechaYHoraDeLaConsulta(peticion.getFechaYHoraDeLaConsulta() != null ? peticion.getFechaYHoraDeLaConsulta() : LocalDateTime.now())
                .idClinica(peticion.getIdClinica())
                .build();
        return consultaRepositorio.save(consulta);
    }

    public Consulta actualizar(Long idConsulta, ConsultaPeticion peticion) {
        Consulta consulta = buscarPorId(idConsulta);
        consulta.setEspecialidadMedicaAplicada(peticion.getEspecialidadMedicaAplicada());
        consulta.setTipoDocumentoClinico(peticion.getTipoDocumentoClinico());
        consulta.setTranscripcionDelAudio(peticion.getTranscripcionDelAudio());
        consulta.setNotaClinicaEstructurada(peticion.getNotaClinicaEstructurada());
        if (peticion.getEstadoActualDeLaConsulta() != null) {
            consulta.setEstadoActualDeLaConsulta(peticion.getEstadoActualDeLaConsulta());
        }
        if (peticion.getDuracionEnSegundos() != null) {
            consulta.setDuracionEnSegundos(peticion.getDuracionEnSegundos());
        }
        return consultaRepositorio.save(consulta);
    }

    public Consulta actualizarEstado(Long idConsulta, String nuevoEstado) {
        Consulta consulta = buscarPorId(idConsulta);
        consulta.setEstadoActualDeLaConsulta(nuevoEstado);
        return consultaRepositorio.save(consulta);
    }

    public void eliminar(Long idConsulta) {
        Consulta consulta = buscarPorId(idConsulta);
        consulta.setFechaEliminacion(LocalDateTime.now());
        consultaRepositorio.save(consulta);
    }

    @Transactional
    public Consulta aprobarConsultaYDocumentos(Long idConsulta) {
        Consulta consulta = buscarPorId(idConsulta);

        if (!"Borrador".equals(consulta.getEstadoActualDeLaConsulta())) {
            throw new IllegalStateException("Solo se pueden aprobar consultas en estado Borrador");
        }

        consulta.setEstadoActualDeLaConsulta("Aprobado");
        consultaRepositorio.save(consulta);

        List<Documento> documentos = documentoRepositorio.findByIdConsultaVinculada(idConsulta);
        for (Documento documento : documentos) {
            if ("Borrador".equals(documento.getEstadoDeAprobacion())) {
                documento.setEstadoDeAprobacion("Aprobado");
                documentoRepositorio.save(documento);
            }
        }

        return consulta;
    }

    @Transactional
    public Consulta crearConsultaConDocumento(Consulta consulta, String tipoDocumento) {
        Consulta consultaGuardada = consultaRepositorio.save(consulta);

        Documento documento = Documento.builder()
                .idConsultaVinculada(consultaGuardada.getIdConsulta())
                .idClinica(consulta.getIdClinica())
                .tipoDocumentoClinico(tipoDocumento)
                .formatoDeArchivo("PDF")
                .rutaFisicaDelArchivo("documentos/" + UUID.randomUUID() + ".pdf")
                .estadoDeAprobacion("Borrador")
                .numeroDeVersion(1)
                .fechaDeGeneracion(LocalDateTime.now())
                .build();
        documentoRepositorio.save(documento);

        return consultaGuardada;
    }
}
