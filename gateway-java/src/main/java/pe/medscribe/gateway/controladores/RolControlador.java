package pe.medscribe.gateway.controladores;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import pe.medscribe.gateway.dto.RolPeticion;
import pe.medscribe.gateway.modelos.RolDeClinica;
import pe.medscribe.gateway.servicios.RolServicio;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/roles")
public class RolControlador {

    private final RolServicio rolServicio;

    public RolControlador(RolServicio rolServicio) {
        this.rolServicio = rolServicio;
    }

    @GetMapping
    public ResponseEntity<List<RolDeClinica>> listar(@RequestParam(value = "idClinica", required = false) Long idClinica) {
        if (idClinica != null) {
            return ResponseEntity.ok(rolServicio.listarPorClinica(idClinica));
        }
        return ResponseEntity.ok(rolServicio.listarTodos());
    }

    @PostMapping
    @PreAuthorize("hasRole('Administrador')")
    public ResponseEntity<?> crear(@Valid @RequestBody RolPeticion peticion) {
        RolDeClinica rol = rolServicio.crear(peticion);
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                "mensaje", "Rol creado correctamente",
                "idRol", rol.getIdRol()
        ));
    }

    @PutMapping("/{idRol}")
    @PreAuthorize("hasRole('Administrador')")
    public ResponseEntity<?> actualizar(@PathVariable Long idRol, @Valid @RequestBody RolPeticion peticion) {
        rolServicio.actualizar(idRol, peticion);
        return ResponseEntity.ok(Map.of("mensaje", "Rol actualizado correctamente"));
    }

    @DeleteMapping("/{idRol}")
    @PreAuthorize("hasRole('Administrador')")
    public ResponseEntity<?> eliminar(@PathVariable Long idRol) {
        rolServicio.eliminar(idRol);
        return ResponseEntity.ok(Map.of("mensaje", "Rol eliminado correctamente"));
    }
}
