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

    public RolServicio(RolDeClinicaRepositorio rolRepositorio) {
        this.rolRepositorio = rolRepositorio;
    }

    public List<RolDeClinica> listarTodos() {
        return rolRepositorio.findAll();
    }

    public List<RolDeClinica> listarPorClinica(Long idClinica) {
        return rolRepositorio.findByIdClinica(idClinica);
    }

    public RolDeClinica crear(RolPeticion peticion) {
        RolDeClinica rol = RolDeClinica.builder()
                .nombreDelRol(peticion.getNombre())
                .descripcionDelRol(peticion.getDescripcion())
                .permisosEnFormatoJSON(peticion.getPermisosJson() != null ? peticion.getPermisosJson() : "{}")
                .esRolBase(false)
                .idClinica(peticion.getIdClinica())
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

    public void eliminar(Long idRol) {
        if (!rolRepositorio.existsById(idRol)) {
            throw new EntityNotFoundException("Rol no encontrado");
        }
        rolRepositorio.deleteById(idRol);
    }
}
