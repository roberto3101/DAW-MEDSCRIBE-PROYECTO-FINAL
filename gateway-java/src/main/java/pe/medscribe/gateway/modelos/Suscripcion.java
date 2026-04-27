package pe.medscribe.gateway.modelos;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "Suscripciones")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Suscripcion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "IdSuscripcion")
    private Long idSuscripcion;

    @Column(name = "IdClinica", nullable = false)
    private Long idClinica;

    @Column(name = "IdPlan", nullable = false)
    private Long idPlan;

    @Column(name = "EstadoDeLaSuscripcion", nullable = false, length = 20)
    private String estadoDeLaSuscripcion;

    @Column(name = "CicloDeFacturacion", nullable = false, length = 10)
    private String cicloDeFacturacion;

    @Column(name = "FechaInicio", nullable = false)
    private LocalDateTime fechaInicio;

    @Column(name = "FechaFin")
    private LocalDateTime fechaFin;

    @Column(name = "FechaProximoCobro")
    private LocalDate fechaProximoCobro;

    @Column(name = "EsTrial", nullable = false)
    private Boolean esTrial;

    @Column(name = "DiasDelTrial")
    private Integer diasDelTrial;

    @Column(name = "FechaFinDelTrial")
    private LocalDate fechaFinDelTrial;

    @Column(name = "OverrideMaxSedes")
    private Integer overrideMaxSedes;

    @Column(name = "OverrideMaxUsuarios")
    private Integer overrideMaxUsuarios;

    @Column(name = "OverrideMaxConsultas")
    private Integer overrideMaxConsultas;

    @Column(name = "OverrideMaxMedicos")
    private Integer overrideMaxMedicos;

    @Column(name = "FechaCreacion", nullable = false)
    private LocalDateTime fechaCreacion;
}
