package pe.medscribe.gateway.repositorios;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import pe.medscribe.gateway.modelos.Medico;

import java.util.List;
import java.util.Optional;

@Repository
public interface MedicoRepositorio extends JpaRepository<Medico, Long> {
    Optional<Medico> findByIdUsuarioVinculado(Long idUsuarioVinculado);
    Optional<Medico> findByNumeroColegiaturaDelPeru(String numero);
    List<Medico> findByIdClinica(Long idClinica);
}
