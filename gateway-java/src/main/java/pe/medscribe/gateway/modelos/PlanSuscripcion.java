package pe.medscribe.gateway.modelos;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "PlanesSuscripcion")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PlanSuscripcion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "IdPlan")
    private Long idPlan;

    @Column(name = "CodigoDelPlan", nullable = false, length = 20, unique = true)
    private String codigoDelPlan;

    @Column(name = "NombreDelPlan", nullable = false, length = 50)
    private String nombreDelPlan;

    @Column(name = "DescripcionDelPlan", length = 500)
    private String descripcionDelPlan;

    @Column(name = "PrecioMensualEnSoles", nullable = false, precision = 10, scale = 2)
    private BigDecimal precioMensualEnSoles;

    @Column(name = "PrecioAnualEnSoles", precision = 10, scale = 2)
    private BigDecimal precioAnualEnSoles;

    @Column(name = "MaximoDeSedesPermitidas", nullable = false)
    private Integer maximoDeSedesPermitidas;

    @Column(name = "MaximoDeUsuariosPermitidos", nullable = false)
    private Integer maximoDeUsuariosPermitidos;

    @Column(name = "MaximoDeConsultasPorMes", nullable = false)
    private Integer maximoDeConsultasPorMes;

    @Column(name = "MaximoDeMedicosPorClinica", nullable = false)
    private Integer maximoDeMedicosPorClinica;

    @Column(name = "PermiteGenerarWord", nullable = false)
    private Boolean permiteGenerarWord;

    @Column(name = "PermiteModoVerificacion", nullable = false)
    private Boolean permiteModoVerificacion;

    @Column(name = "PermitePersonalizarPlantillas", nullable = false)
    private Boolean permitePersonalizarPlantillas;

    @Column(name = "PermiteSoportePrioritario", nullable = false)
    private Boolean permiteSoportePrioritario;

    @Column(name = "AlmacenamientoMaximoEnMB", nullable = false)
    private Integer almacenamientoMaximoEnMB;

    @Column(name = "OrdenDeVisualizacion", nullable = false)
    private Integer ordenDeVisualizacion;

    @Column(name = "EstaPlanActivo", nullable = false)
    private Boolean estaPlanActivo;

    @Column(name = "FechaCreacion", nullable = false)
    private LocalDateTime fechaCreacion;
}
