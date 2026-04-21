package pe.medscribe.gateway.modelos;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "PlantillasHistoriaClinica")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PlantillaHistoriaClinica {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "IdPlantilla")
    private Long idPlantilla;

    @Column(name = "IdClinica", nullable = false)
    private Long idClinica;

    @Column(name = "NombreDeLaPlantilla", nullable = false, length = 100)
    private String nombreDeLaPlantilla;

    @Column(name = "TipoDocumentoClinico", nullable = false, length = 50)
    private String tipoDocumentoClinico;

    @Column(name = "EsPlantillaPorDefecto", nullable = false)
    private Boolean esPlantillaPorDefecto;

    @Column(name = "EstaPlantillaActiva", nullable = false)
    private Boolean estaPlantillaActiva;

    @Column(name = "FechaCreacion", nullable = false)
    private LocalDateTime fechaCreacion;

    @PrePersist
    public void prePersistir() {
        if (fechaCreacion == null) fechaCreacion = LocalDateTime.now();
        if (estaPlantillaActiva == null) estaPlantillaActiva = true;
        if (esPlantillaPorDefecto == null) esPlantillaPorDefecto = false;
    }
}
