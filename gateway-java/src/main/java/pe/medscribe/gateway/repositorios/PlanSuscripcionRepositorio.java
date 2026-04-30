package pe.medscribe.gateway.repositorios;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import pe.medscribe.gateway.modelos.PlanSuscripcion;

import java.util.List;

@Repository
public interface PlanSuscripcionRepositorio extends JpaRepository<PlanSuscripcion, Long> {
    List<PlanSuscripcion> findByEstaPlanActivoTrue();
}
