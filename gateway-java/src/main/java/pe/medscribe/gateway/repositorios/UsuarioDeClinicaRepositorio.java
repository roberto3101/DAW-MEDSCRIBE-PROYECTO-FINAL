package pe.medscribe.gateway.repositorios;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import pe.medscribe.gateway.modelos.UsuarioDeClinica;

import java.util.List;
import java.util.Optional;

@Repository
public interface UsuarioDeClinicaRepositorio extends JpaRepository<UsuarioDeClinica, Long> {
    List<UsuarioDeClinica> findByIdClinica(Long idClinica);
    Optional<UsuarioDeClinica> findByIdUsuario(Long idUsuario);
    Optional<UsuarioDeClinica> findByIdUsuarioAndIdClinica(Long idUsuario, Long idClinica);
}
