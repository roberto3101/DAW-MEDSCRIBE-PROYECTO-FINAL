package pe.medscribe.gateway.controladores;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import pe.medscribe.gateway.dto.ConsultaPeticion;
import pe.medscribe.gateway.dto.RegistrarConsultaPeticion;
import pe.medscribe.gateway.modelos.Consulta;
import pe.medscribe.gateway.servicios.ClienteServicioIA;
import pe.medscribe.gateway.servicios.ConsultaServicio;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@RestController
@RequestMapping("/api/consultas")
public class ConsultaControlador {

    private static final Set<String> FORMATOS_PERMITIDOS = Set.of("wav", "mp3", "m4a", "ogg", "webm");
    private static final long TAMANO_MAXIMO_BYTES = 50L * 1024 * 1024;

    private final ConsultaServicio consultaServicio;
    private final ClienteServicioIA clienteServicioIA;

    public ConsultaControlador(ConsultaServicio consultaServicio, ClienteServicioIA clienteServicioIA) {
        this.consultaServicio = consultaServicio;
        this.clienteServicioIA = clienteServicioIA;
    }

    @GetMapping("/medico/{idMedico}")
    public ResponseEntity<List<Consulta>> listarPorMedico(@PathVariable Long idMedico) {
        return ResponseEntity.ok(consultaServicio.listarPorMedico(idMedico));
    }

    @GetMapping("/{idConsulta}")
    public ResponseEntity<Consulta> buscarPorId(@PathVariable Long idConsulta) {
        return ResponseEntity.ok(consultaServicio.buscarPorId(idConsulta));
    }

    @PostMapping(consumes = {"multipart/form-data"})
    public ResponseEntity<?> crearDesdeAudio(
            @RequestParam("archivoDeAudio") MultipartFile archivoDeAudio,
            @RequestParam("idMedicoResponsable") Long idMedicoResponsable,
            @RequestParam("idPacienteAtendido") Long idPacienteAtendido,
            @RequestParam("especialidadMedicaAplicada") String especialidad,
            @RequestParam("tipoDocumentoClinico") String tipoDocumentoClinico,
            @RequestParam(value = "idClinica", required = false) Long idClinica) throws IOException {

        if (archivoDeAudio == null || archivoDeAudio.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("mensaje", "El archivo de audio es obligatorio"));
        }
        if (archivoDeAudio.getSize() > TAMANO_MAXIMO_BYTES) {
            return ResponseEntity.badRequest().body(Map.of("mensaje", "El archivo de audio no debe superar los 50 MB"));
        }

        String nombre = archivoDeAudio.getOriginalFilename() != null ? archivoDeAudio.getOriginalFilename() : "audio";
        String extension = "";
        int punto = nombre.lastIndexOf('.');
        if (punto >= 0) extension = nombre.substring(punto + 1).toLowerCase();

        if (!FORMATOS_PERMITIDOS.contains(extension)) {
            return ResponseEntity.badRequest().body(Map.of("mensaje", "Formato de audio no permitido. Use: wav, mp3, m4a, ogg, webm"));
        }

        byte[] bytesAudio = archivoDeAudio.getBytes();
        String transcripcion = clienteServicioIA.transcribirAudioATexto(bytesAudio, extension);
        String notaClinica = clienteServicioIA.procesarTranscripcion(transcripcion, especialidad, tipoDocumentoClinico);

        Consulta nuevaConsulta = Consulta.builder()
                .idMedicoResponsable(idMedicoResponsable)
                .idPacienteAtendido(idPacienteAtendido)
                .especialidadMedicaAplicada(especialidad)
                .tipoDocumentoClinico(tipoDocumentoClinico)
                .rutaArchivoDeAudio("audios/" + UUID.randomUUID() + "." + extension)
                .transcripcionDelAudio(transcripcion)
                .notaClinicaEstructurada(notaClinica)
                .estadoActualDeLaConsulta("Borrador")
                .idClinica(idClinica)
                .build();

        Consulta guardada = consultaServicio.crearConsultaConDocumento(nuevaConsulta, tipoDocumentoClinico);

        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                "idConsulta", guardada.getIdConsulta(),
                "transcripcion", transcripcion,
                "notaClinica", notaClinica,
                "estado", "Borrador"
        ));
    }

    @PostMapping("/registrar")
    public ResponseEntity<?> registrarConsultaProcesada(@RequestBody RegistrarConsultaPeticion peticion) {
        Consulta consulta = Consulta.builder()
                .idMedicoResponsable(peticion.getIdMedicoResponsable())
                .idPacienteAtendido(peticion.getIdPacienteAtendido())
                .especialidadMedicaAplicada(peticion.getEspecialidad())
                .tipoDocumentoClinico(peticion.getTipoDocumento() != null ? peticion.getTipoDocumento() : "SOAP")
                .transcripcionDelAudio(peticion.getTranscripcion())
                .notaClinicaEstructurada(peticion.getNotaClinica())
                .estadoActualDeLaConsulta("Borrador")
                .idClinica(peticion.getIdClinica() != null ? peticion.getIdClinica() : 1L)
                .build();

        Consulta guardada = consultaServicio.crearConsultaConDocumento(consulta, consulta.getTipoDocumentoClinico());
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                "mensaje", "Consulta registrada",
                "idConsulta", guardada.getIdConsulta()
        ));
    }

    @PutMapping("/{idConsulta}")
    public ResponseEntity<?> actualizar(@PathVariable Long idConsulta, @Valid @RequestBody ConsultaPeticion peticion) {
        Consulta actualizada = consultaServicio.actualizar(idConsulta, peticion);
        return ResponseEntity.ok(actualizada);
    }

    @DeleteMapping("/{idConsulta}")
    public ResponseEntity<?> eliminar(@PathVariable Long idConsulta) {
        consultaServicio.eliminar(idConsulta);
        return ResponseEntity.ok(Map.of("mensaje", "Consulta eliminada correctamente"));
    }

    @PutMapping("/{idConsulta}/aprobar")
    public ResponseEntity<?> aprobar(@PathVariable Long idConsulta) {
        consultaServicio.aprobarConsultaYDocumentos(idConsulta);
        return ResponseEntity.ok(Map.of("mensaje", "Consulta y documentos aprobados correctamente"));
    }

    @PutMapping("/{idConsulta}/rechazar")
    public ResponseEntity<?> rechazar(@PathVariable Long idConsulta) {
        Consulta consulta = consultaServicio.buscarPorId(idConsulta);
        if (!"Borrador".equals(consulta.getEstadoActualDeLaConsulta())) {
            return ResponseEntity.badRequest().body(Map.of("mensaje", "Solo se pueden rechazar consultas en estado Borrador"));
        }
        consultaServicio.actualizarEstado(idConsulta, "Rechazado");
        return ResponseEntity.ok(Map.of("mensaje", "Consulta rechazada correctamente"));
    }
}
