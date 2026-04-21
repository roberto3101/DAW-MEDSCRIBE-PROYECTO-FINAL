package pe.medscribe.gateway.repositorios;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import pe.medscribe.gateway.modelos.ValorDeSeccionPorConsulta;

import java.util.List;

@Repository
public interface ValorDeSeccionPorConsultaRepositorio extends JpaRepository<ValorDeSeccionPorConsulta, Long> {
    List<ValorDeSeccionPorConsulta> findByIdConsulta(Long idConsulta);
}
