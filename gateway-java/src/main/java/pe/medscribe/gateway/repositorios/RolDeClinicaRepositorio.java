package pe.medscribe.gateway.repositorios;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import pe.medscribe.gateway.modelos.RolDeClinica;

import java.util.List;

@Repository
public interface RolDeClinicaRepositorio extends JpaRepository<RolDeClinica, Long> {
    List<RolDeClinica> findByIdClinica(Long idClinica);
}
