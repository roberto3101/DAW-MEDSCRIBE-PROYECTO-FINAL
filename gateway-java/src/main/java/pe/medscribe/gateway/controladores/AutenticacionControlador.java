package pe.medscribe.gateway.controladores;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import pe.medscribe.gateway.dto.CambiarContrasenaPeticion;
import pe.medscribe.gateway.dto.InicioSesionPeticion;
import pe.medscribe.gateway.dto.RegistroUsuarioPeticion;
import pe.medscribe.gateway.dto.RespuestaAutenticacion;
import pe.medscribe.gateway.modelos.Usuario;
import pe.medscribe.gateway.servicios.AutenticacionServicio;

import java.util.Map;

@RestController
@RequestMapping("/api/autenticacion")
public class AutenticacionControlador {

    private final AutenticacionServicio autenticacionServicio;

    public AutenticacionControlador(AutenticacionServicio autenticacionServicio) {
        this.autenticacionServicio = autenticacionServicio;
    }

    @PostMapping("/iniciar-sesion")
    public ResponseEntity<RespuestaAutenticacion> iniciarSesion(@Valid @RequestBody InicioSesionPeticion peticion) {
        RespuestaAutenticacion respuesta = autenticacionServicio.iniciarSesion(peticion);
        return ResponseEntity.ok(respuesta);
    }

    @PostMapping("/registro")
    public ResponseEntity<?> registrar(@Valid @RequestBody RegistroUsuarioPeticion peticion) {
        Usuario usuario = autenticacionServicio.registrarUsuario(peticion);
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                "mensaje", "Usuario registrado correctamente",
                "idUsuario", usuario.getIdUsuario()
        ));
    }

    @PostMapping("/cambiar-contrasena")
    public ResponseEntity<?> cambiarContrasena(@Valid @RequestBody CambiarContrasenaPeticion peticion) {
        autenticacionServicio.cambiarContrasena(peticion);
        return ResponseEntity.ok(Map.of("mensaje", "Contrasena actualizada correctamente"));
    }
}
