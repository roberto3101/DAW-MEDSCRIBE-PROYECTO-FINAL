package pe.medscribe.gateway.repositorios;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import pe.medscribe.gateway.modelos.AuditoriaDeConsulta;

import java.util.List;

@Repository
public interface AuditoriaDeConsultaRepositorio extends JpaRepository<AuditoriaDeConsulta, Long> {
    List<AuditoriaDeConsulta> findByIdConsulta(Long idConsulta);
}
