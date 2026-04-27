package pe.medscribe.gateway.controladores;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import pe.medscribe.gateway.dto.PacientePeticion;
import pe.medscribe.gateway.modelos.Paciente;
import pe.medscribe.gateway.servicios.PacienteServicio;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/pacientes")
public class PacienteControlador {

    private final PacienteServicio pacienteServicio;

    public PacienteControlador(PacienteServicio pacienteServicio) {
        this.pacienteServicio = pacienteServicio;
    }

    @GetMapping
    public ResponseEntity<List<Paciente>> listar(@RequestParam(value = "idClinica", required = false) Long idClinica) {
        if (idClinica != null) {
            return ResponseEntity.ok(pacienteServicio.listarPorClinica(idClinica));
        }
        return ResponseEntity.ok(pacienteServicio.listarTodosLosActivos());
    }

    @GetMapping("/{idPaciente}")
    public ResponseEntity<Paciente> buscarPorId(@PathVariable Long idPaciente) {
        return ResponseEntity.ok(pacienteServicio.buscarPorId(idPaciente));
    }

    @GetMapping("/documento/{numeroDocumento}")
    public ResponseEntity<?> buscarPorDocumento(@PathVariable String numeroDocumento) {
        if (numeroDocumento == null || numeroDocumento.length() < 8) {
            return ResponseEntity.badRequest().body(Map.of("mensaje", "El numero de documento debe tener al menos 8 caracteres"));
        }
        return pacienteServicio.buscarPorNumeroDocumento(numeroDocumento)
                .<ResponseEntity<?>>map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("mensaje", "Paciente no encontrado con ese numero de documento")));
    }

    @PostMapping
    public ResponseEntity<?> crear(@Valid @RequestBody PacientePeticion peticion) {
        Paciente paciente = pacienteServicio.crear(peticion);
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                "mensaje", "Paciente registrado correctamente",
                "idPaciente", paciente.getIdPaciente()
        ));
    }

    @PutMapping("/{idPaciente}")
    public ResponseEntity<?> actualizar(@PathVariable Long idPaciente, @Valid @RequestBody PacientePeticion peticion) {
        pacienteServicio.actualizar(idPaciente, peticion);
        return ResponseEntity.ok(Map.of("mensaje", "Paciente actualizado correctamente"));
    }

    @DeleteMapping("/{idPaciente}")
    public ResponseEntity<?> desactivar(@PathVariable Long idPaciente) {
        pacienteServicio.desactivar(idPaciente);
        return ResponseEntity.ok(Map.of("mensaje", "Paciente desactivado correctamente"));
    }
}
