package pe.medscribe.gateway.modelos;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "SeccionesDePlantilla")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SeccionDePlantilla {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "IdSeccion")
    private Long idSeccion;

    @Column(name = "IdClinica", nullable = false)
    private Long idClinica;

    @Column(name = "IdPlantilla", nullable = false)
    private Long idPlantilla;

    @Column(name = "NombreDeLaSeccion", nullable = false, length = 100)
    private String nombreDeLaSeccion;

    @Column(name = "DescripcionDeLaSeccion", length = 300)
    private String descripcionDeLaSeccion;

    @Column(name = "OrdenDeVisualizacion", nullable = false)
    private Integer ordenDeVisualizacion;

    @Column(name = "EsSeccionObligatoria", nullable = false)
    private Boolean esSeccionObligatoria;

    @Column(name = "TipoDeCampo", nullable = false, length = 30)
    private String tipoDeCampo;

    @Lob
    @Column(name = "OpcionesDeSeleccion")
    private String opcionesDeSeleccion;

    @Column(name = "InstruccionParaIA", length = 500)
    private String instruccionParaIA;

    @Column(name = "EstaSeccionActiva", nullable = false)
    private Boolean estaSeccionActiva;
}
