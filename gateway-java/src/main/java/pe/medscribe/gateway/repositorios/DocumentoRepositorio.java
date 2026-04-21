package pe.medscribe.gateway.repositorios;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import pe.medscribe.gateway.modelos.Documento;

import java.util.List;

@Repository
public interface DocumentoRepositorio extends JpaRepository<Documento, Long> {
    List<Documento> findByIdConsultaVinculada(Long idConsultaVinculada);
    List<Documento> findByIdClinica(Long idClinica);

    @Query("SELECT d FROM Documento d WHERE d.idConsultaVinculada IN " +
            "(SELECT c.idConsulta FROM Consulta c WHERE c.idMedicoResponsable = :idMedico)")
    List<Documento> listarPorIdMedico(@Param("idMedico") Long idMedico);
}
