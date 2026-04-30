package pe.medscribe.gateway.modelos;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "Consultas")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Consulta {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "IdConsulta")
    private Long idConsulta;

    @Column(name = "IdClinica")
    private Long idClinica;

    @Column(name = "IdMedicoResponsable", nullable = false)
    private Long idMedicoResponsable;

    @Column(name = "IdPacienteAtendido", nullable = false)
    private Long idPacienteAtendido;

    @Column(name = "IdPlantillaUtilizada")
    private Long idPlantillaUtilizada;

    @Column(name = "EspecialidadMedicaAplicada", nullable = false, length = 100)
    private String especialidadMedicaAplicada;

    @Column(name = "TipoDocumentoClinico", nullable = false, length = 50)
    private String tipoDocumentoClinico;

    @Column(name = "RutaArchivoDeAudio", length = 500)
    private String rutaArchivoDeAudio;

    @Lob
    @Column(name = "TranscripcionDelAudio")
    private String transcripcionDelAudio;

    @Lob
    @Column(name = "NotaClinicaEstructurada")
    private String notaClinicaEstructurada;

    @Column(name = "EstadoActualDeLaConsulta", nullable = false, length = 30)
    private String estadoActualDeLaConsulta;

    @Column(name = "DuracionEnSegundos")
    private Integer duracionEnSegundos;

    @Column(name = "FechaYHoraDeLaConsulta", nullable = false)
    private LocalDateTime fechaYHoraDeLaConsulta;

    @Column(name = "FechaCreacionEnSistema", nullable = false)
    private LocalDateTime fechaCreacionEnSistema;

    @Column(name = "FechaEliminacion")
    private LocalDateTime fechaEliminacion;

    @PrePersist
    public void prePersistir() {
        if (fechaCreacionEnSistema == null) fechaCreacionEnSistema = LocalDateTime.now();
        if (fechaYHoraDeLaConsulta == null) fechaYHoraDeLaConsulta = LocalDateTime.now();
        if (estadoActualDeLaConsulta == null) estadoActualDeLaConsulta = "Grabando";
        if (duracionEnSegundos == null) duracionEnSegundos = 0;
    }
}
