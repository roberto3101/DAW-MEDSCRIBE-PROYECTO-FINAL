package pe.medscribe.gateway.modelos;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "AuditoriaDeConsultas")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuditoriaDeConsulta {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "IdAuditoria")
    private Long idAuditoria;

    @Column(name = "IdClinica", nullable = false)
    private Long idClinica;

    @Column(name = "IdConsulta", nullable = false)
    private Long idConsulta;

    @Column(name = "EstadoAnterior", nullable = false, length = 30)
    private String estadoAnterior;

    @Column(name = "EstadoNuevo", nullable = false, length = 30)
    private String estadoNuevo;

    @Column(name = "IdUsuarioQueRealizoElCambio")
    private Long idUsuarioQueRealizoElCambio;

    @Column(name = "FechaDelCambio", nullable = false)
    private LocalDateTime fechaDelCambio;

    @PrePersist
    public void prePersistir() {
        if (fechaDelCambio == null) fechaDelCambio = LocalDateTime.now();
    }
}
