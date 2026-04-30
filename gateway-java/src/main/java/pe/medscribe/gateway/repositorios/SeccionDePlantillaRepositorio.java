package pe.medscribe.gateway.repositorios;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import pe.medscribe.gateway.modelos.SeccionDePlantilla;

import java.util.List;

@Repository
public interface SeccionDePlantillaRepositorio extends JpaRepository<SeccionDePlantilla, Long> {
    List<SeccionDePlantilla> findByIdPlantilla(Long idPlantilla);
}
