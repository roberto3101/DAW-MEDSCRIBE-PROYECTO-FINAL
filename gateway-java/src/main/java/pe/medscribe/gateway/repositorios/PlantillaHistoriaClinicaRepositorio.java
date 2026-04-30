package pe.medscribe.gateway.repositorios;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import pe.medscribe.gateway.modelos.PlantillaHistoriaClinica;

import java.util.List;

@Repository
public interface PlantillaHistoriaClinicaRepositorio extends JpaRepository<PlantillaHistoriaClinica, Long> {
    List<PlantillaHistoriaClinica> findByIdClinica(Long idClinica);
}
