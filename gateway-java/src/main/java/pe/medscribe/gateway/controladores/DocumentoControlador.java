package pe.medscribe.gateway.controladores;

import jakarta.validation.Valid;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import pe.medscribe.gateway.dto.DocumentoPeticion;
import pe.medscribe.gateway.modelos.Documento;
import pe.medscribe.gateway.servicios.DocumentoServicio;

import java.io.File;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/documentos")
public class DocumentoControlador {

    private final DocumentoServicio documentoServicio;

    public DocumentoControlador(DocumentoServicio documentoServicio) {
        this.documentoServicio = documentoServicio;
    }

    @GetMapping("/medico/{idMedico}")
    public ResponseEntity<List<Documento>> listarPorMedico(@PathVariable Long idMedico) {
        return ResponseEntity.ok(documentoServicio.listarPorMedico(idMedico));
    }

    @GetMapping("/{idDocumento}")
    public ResponseEntity<Documento> buscarPorId(@PathVariable Long idDocumento) {
        return ResponseEntity.ok(documentoServicio.buscarPorId(idDocumento));
    }

    @GetMapping("/consulta/{idConsulta}")
    public ResponseEntity<List<Documento>> listarPorConsulta(@PathVariable Long idConsulta) {
        return ResponseEntity.ok(documentoServicio.listarPorConsulta(idConsulta));
    }

    @PostMapping
    public ResponseEntity<?> crear(@Valid @RequestBody DocumentoPeticion peticion) {
        Documento documento = documentoServicio.crear(peticion);
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                "mensaje", "Documento registrado",
                "idDocumento", documento.getIdDocumento()
        ));
    }

    @GetMapping("/{idDocumento}/descargar")
    public ResponseEntity<?> descargar(@PathVariable Long idDocumento) {
        Documento documento = documentoServicio.buscarPorId(idDocumento);
        String rutaSegura = limpiarRuta(documento.getRutaFisicaDelArchivo());
        File archivo = new File(rutaSegura);
        if (!archivo.exists()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("mensaje", "El archivo fisico no existe en el servidor"));
        }

        Resource recurso = new FileSystemResource(archivo);
        String nombreDescarga = "MedScribe_" + documento.getTipoDocumentoClinico() + "_" +
                documento.getIdDocumento() + "." + documento.getFormatoDeArchivo().toLowerCase();
        MediaType tipoMime = "PDF".equals(documento.getFormatoDeArchivo())
                ? MediaType.APPLICATION_PDF
                : MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.wordprocessingml.document");

        return ResponseEntity.ok()
                .contentType(tipoMime)
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + nombreDescarga + "\"")
                .body(recurso);
    }

    @PutMapping("/{idDocumento}/aprobar")
    public ResponseEntity<?> aprobar(@PathVariable Long idDocumento) {
        Documento documento = documentoServicio.buscarPorId(idDocumento);
        if (!"Borrador".equals(documento.getEstadoDeAprobacion())) {
            return ResponseEntity.badRequest().body(Map.of("mensaje", "Solo se pueden aprobar documentos en estado Borrador"));
        }
        documentoServicio.actualizarEstado(idDocumento, "Aprobado");
        return ResponseEntity.ok(Map.of("mensaje", "Documento aprobado correctamente"));
    }

    private String limpiarRuta(String ruta) {
        if (ruta == null) return "";
        return ruta.replace("..", "").replace("~", "").trim();
    }
}
