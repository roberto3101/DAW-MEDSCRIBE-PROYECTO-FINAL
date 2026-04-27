package pe.medscribe.gateway.dto;

import jakarta.validation.constraints.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ConsultaPeticion {

    @NotNull
    @Min(1)
    private Long idMedicoResponsable;

    @NotNull
    @Min(1)
    private Long idPacienteAtendido;

    @NotBlank
    @Size(max = 100)
    private String especialidadMedicaAplicada;

    @NotBlank
    @Pattern(regexp = "^(SOAP|HistoriaClinica|Receta|Personalizada)$")
    private String tipoDocumentoClinico = "SOAP";

    private String transcripcionDelAudio;

    private String notaClinicaEstructurada;

    private String rutaArchivoDeAudio;

    private String estadoActualDeLaConsulta = "Borrador";

    @Min(0)
    @Max(7200)
    private Integer duracionEnSegundos;

    private LocalDateTime fechaYHoraDeLaConsulta;

    private Long idClinica;
}
