package pe.medscribe.gateway.repositorios;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import pe.medscribe.gateway.modelos.Suscripcion;

import java.util.List;

@Repository
public interface SuscripcionRepositorio extends JpaRepository<Suscripcion, Long> {
    List<Suscripcion> findByIdClinica(Long idClinica);
    List<Suscripcion> findByIdClinicaAndEstadoDeLaSuscripcion(Long idClinica, String estado);
}
