package pe.medscribe.gateway.controladores;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import pe.medscribe.gateway.dto.RegistrarClinicaPeticion;
import pe.medscribe.gateway.modelos.Clinica;
import pe.medscribe.gateway.servicios.ClinicaServicio;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/clinicas")
public class ClinicaControlador {

    private final ClinicaServicio clinicaServicio;

    public ClinicaControlador(ClinicaServicio clinicaServicio) {
        this.clinicaServicio = clinicaServicio;
    }

    @GetMapping
    @PreAuthorize("hasRole('Administrador')")
    public ResponseEntity<List<Clinica>> listar() {
        return ResponseEntity.ok(clinicaServicio.listar());
    }

    @GetMapping("/{idClinica}")
    public ResponseEntity<Clinica> buscarPorId(@PathVariable Long idClinica) {
        return ResponseEntity.ok(clinicaServicio.buscarPorId(idClinica));
    }

    @PostMapping("/registrar")
    public ResponseEntity<?> registrar(@Valid @RequestBody RegistrarClinicaPeticion peticion) {
        Clinica clinica = clinicaServicio.registrarClinicaCompleta(peticion);
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                "mensaje", "Clinica registrada correctamente",
                "idClinica", clinica.getIdClinica()
        ));
    }
}
