package pe.medscribe.gateway.repositorios;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import pe.medscribe.gateway.modelos.Paciente;

import java.util.List;
import java.util.Optional;

@Repository
public interface PacienteRepositorio extends JpaRepository<Paciente, Long> {
    Optional<Paciente> findByNumeroDocumentoIdentidad(String numeroDocumentoIdentidad);
    List<Paciente> findByIdClinica(Long idClinica);
    List<Paciente> findByEstaPacienteActivoTrue();
    List<Paciente> findByIdClinicaAndEstaPacienteActivoTrue(Long idClinica);
}
