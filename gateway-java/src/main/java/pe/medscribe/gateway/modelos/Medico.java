package pe.medscribe.gateway.modelos;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "Medicos")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Medico {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "IdMedico")
    private Long idMedico;

    @Column(name = "IdClinica")
    private Long idClinica;

    @Column(name = "IdUsuarioVinculado", nullable = false)
    private Long idUsuarioVinculado;

    @Column(name = "NombreDelMedico", nullable = false, length = 100)
    private String nombreDelMedico;

    @Column(name = "ApellidoDelMedico", nullable = false, length = 100)
    private String apellidoDelMedico;

    @Column(name = "EspecialidadMedica", nullable = false, length = 100)
    private String especialidadMedica;

    @Column(name = "NumeroColegiaturaDelPeru", nullable = false, length = 20)
    private String numeroColegiaturaDelPeru;

    @Column(name = "TelefonoDeContacto", length = 20)
    private String telefonoDeContacto;

    @Column(name = "EstaMedicoActivo", nullable = false)
    private Boolean estaMedicoActivo;

    @PrePersist
    public void prePersistir() {
        if (estaMedicoActivo == null) estaMedicoActivo = true;
    }
}
