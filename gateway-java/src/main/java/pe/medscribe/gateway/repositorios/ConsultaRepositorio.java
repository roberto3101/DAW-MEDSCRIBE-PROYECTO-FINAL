package pe.medscribe.gateway.repositorios;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import pe.medscribe.gateway.modelos.Consulta;

import java.util.List;

@Repository
public interface ConsultaRepositorio extends JpaRepository<Consulta, Long> {
    List<Consulta> findByIdMedicoResponsable(Long idMedicoResponsable);
    List<Consulta> findByIdPacienteAtendido(Long idPacienteAtendido);
    List<Consulta> findByIdClinica(Long idClinica);
    List<Consulta> findByEstadoActualDeLaConsulta(String estado);
}
