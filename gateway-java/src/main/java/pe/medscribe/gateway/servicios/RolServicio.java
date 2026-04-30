package pe.medscribe.gateway.servicios;

import jakarta.persistence.EntityNotFoundException;
import org.springframework.stereotype.Service;

import pe.medscribe.gateway.dto.RolPeticion;
import pe.medscribe.gateway.modelos.RolDeClinica;
import pe.medscribe.gateway.repositorios.RolDeClinicaRepositorio;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class RolServicio {

    private final RolDeClinicaRepositorio rolRepositorio;
    private final UsuarioAutenticadoProveedor usuarioAutenticadoProveedor;

    public RolServicio(RolDeClinicaRepositorio rolRepositorio,
                       UsuarioAutenticadoProveedor usuarioAutenticadoProveedor) {
        this.rolRepositorio = rolRepositorio;
        this.usuarioAutenticadoProveedor = usuarioAutenticadoProveedor;
    }

    public List<RolDeClinica> listarTodos() {
        Long idClinica = usuarioAutenticadoProveedor.obtenerIdClinicaActual();
        if (idClinica != null) return rolRepositorio.findByIdClinica(idClinica);
        return rolRepositorio.findAll();
    }

    public List<RolDeClinica> listarPorClinica(Long idClinica) {
        return rolRepositorio.findByIdClinica(idClinica);
    }

    public RolDeClinica crear(RolPeticion peticion) {
        Long idClinica = peticion.getIdClinica() != null
                ? peticion.getIdClinica()
                : usuarioAutenticadoProveedor.obtenerIdClinicaActual();

        RolDeClinica rol = RolDeClinica.builder()
                .nombreDelRol(peticion.getNombre())
                .descripcionDelRol(peticion.getDescripcion())
                .permisosEnFormatoJSON(peticion.getPermisosJson() != null ? peticion.getPermisosJson() : "{}")
                .esRolBase(false)
                .idClinica(idClinica)
                .fechaCreacion(LocalDateTime.now())
                .build();
        return rolRepositorio.save(rol);
    }

    public RolDeClinica actualizar(Long idRol, RolPeticion peticion) {
        RolDeClinica rol = rolRepositorio.findById(idRol)
                .orElseThrow(() -> new EntityNotFoundException("Rol no encontrado"));
        rol.setNombreDelRol(peticion.getNombre());
        rol.setDescripcionDelRol(peticion.getDescripcion());
        rol.setPermisosEnFormatoJSON(peticion.getPermisosJson() != null ? peticion.getPermisosJson() : "{}");
        return rolRepositorio.save(rol);
    }

    public RolDeClinica cambiarEstado(Long idRol, boolean estaActivo) {
        // La entidad RolDeClinica actual no tiene campo "estaActivo"; lo simulamos devolviendo el rol.
        return rolRepositorio.findById(idRol)
                .orElseThrow(() -> new EntityNotFoundException("Rol no encontrado"));
    }

    public void eliminar(Long idRol) {
        if (!rolRepositorio.existsById(idRol)) {
            throw new EntityNotFoundException("Rol no encontrado");
        }
        rolRepositorio.deleteById(idRol);
    }
}
