package pe.medscribe.gateway.repositorios;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import pe.medscribe.gateway.modelos.Clinica;

import java.util.Optional;

@Repository
public interface ClinicaRepositorio extends JpaRepository<Clinica, Long> {
    Optional<Clinica> findByRucDeLaClinica(String ruc);
    Optional<Clinica> findBySlugPublico(String slug);
    boolean existsByRucDeLaClinica(String ruc);
    boolean existsBySlugPublico(String slug);
}
