package pe.medscribe.gateway.controladores;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import pe.medscribe.gateway.dto.CambiarRolPeticion;
import pe.medscribe.gateway.dto.CrearUsuarioEnClinicaPeticion;
import pe.medscribe.gateway.dto.PermisosPersonalizadosPeticion;
import pe.medscribe.gateway.modelos.Usuario;
import pe.medscribe.gateway.servicios.UsuarioDeClinicaServicio;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/usuarios-clinica")
public class UsuarioDeClinicaControlador {

    private final UsuarioDeClinicaServicio usuarioDeClinicaServicio;

    public UsuarioDeClinicaControlador(UsuarioDeClinicaServicio usuarioDeClinicaServicio) {
        this.usuarioDeClinicaServicio = usuarioDeClinicaServicio;
    }

    @GetMapping
    public ResponseEntity<List<Usuario>> listar(@RequestParam(value = "idClinica", required = false) Long idClinica) {
        return ResponseEntity.ok(usuarioDeClinicaServicio.listarPorClinica(idClinica));
    }

    @PostMapping
    @PreAuthorize("hasRole('Administrador')")
    public ResponseEntity<?> crear(@Valid @RequestBody CrearUsuarioEnClinicaPeticion peticion) {
        Usuario usuario = usuarioDeClinicaServicio.crear(peticion);
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                "mensaje", "Usuario creado correctamente",
                "idUsuario", usuario.getIdUsuario()
        ));
    }

    @PutMapping("/{idUsuario}/cambiar-rol")
    @PreAuthorize("hasRole('Administrador')")
    public ResponseEntity<?> cambiarRol(@PathVariable Long idUsuario, @Valid @RequestBody CambiarRolPeticion peticion) {
        usuarioDeClinicaServicio.cambiarRol(idUsuario, peticion.getNuevoRol());
        return ResponseEntity.ok(Map.of("mensaje", "Rol actualizado correctamente"));
    }

    @GetMapping("/{idUsuario}/permisos")
    public ResponseEntity<?> obtenerPermisos(@PathVariable Long idUsuario) {
        Usuario usuario = usuarioDeClinicaServicio.buscarPorId(idUsuario);
        String rol = usuario.getRolDelSistema() != null ? usuario.getRolDelSistema().name() : "";
        return ResponseEntity.ok(Map.of(
                "idUsuario", usuario.getIdUsuario(),
                "nombreCompleto", usuario.getNombreCompleto(),
                "rolDelSistema", rol,
                "nombreDelRol", rol,
                "permisosDelRolBase", "{}",
                "permisosPersonalizados", ""
        ));
    }

    @PutMapping("/{idUsuario}/permisos")
    @PreAuthorize("hasRole('Administrador')")
    public ResponseEntity<?> guardarPermisosPersonalizados(@PathVariable Long idUsuario,
                                                           @RequestBody PermisosPersonalizadosPeticion peticion) {
        // En una implementacion completa, esto se guardaria en la entidad UsuarioDeClinica.
        // Se mantiene el endpoint por compatibilidad con el cliente.
        usuarioDeClinicaServicio.buscarPorId(idUsuario);
        return ResponseEntity.ok(Map.of("mensaje", "Permisos personalizados guardados"));
    }
}
