package pe.medscribe.gateway.dto;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DocumentoPeticion {

    @NotNull
    @Min(1)
    private Long idConsultaVinculada;

    @NotBlank
    @Pattern(regexp = "^(SOAP|HistoriaClinica|Receta|Personalizada)$")
    private String tipoDocumentoClinico;

    @NotBlank
    @Pattern(regexp = "^(PDF|Word)$")
    private String formatoDeArchivo = "PDF";

    @NotBlank
    @Size(max = 500)
    private String rutaFisicaDelArchivo;

    @Pattern(regexp = "^(Borrador|Aprobado|Rechazado)$")
    private String estadoDeAprobacion = "Borrador";

    @Min(1)
    @Max(100)
    private Integer numeroDeVersion = 1;

    private Long idClinica;
}
