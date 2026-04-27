package pe.medscribe.gateway.modelos;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "ValoresDeSeccionPorConsulta")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ValorDeSeccionPorConsulta {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "IdValor")
    private Long idValor;

    @Column(name = "IdClinica", nullable = false)
    private Long idClinica;

    @Column(name = "IdConsulta", nullable = false)
    private Long idConsulta;

    @Column(name = "IdSeccion", nullable = false)
    private Long idSeccion;

    @Lob
    @Column(name = "ValorIngresado")
    private String valorIngresado;

    @Column(name = "FechaRegistro", nullable = false)
    private LocalDateTime fechaRegistro;

    @PrePersist
    public void prePersistir() {
        if (fechaRegistro == null) fechaRegistro = LocalDateTime.now();
    }
}
