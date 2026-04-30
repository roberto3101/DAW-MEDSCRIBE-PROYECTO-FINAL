package pe.medscribe.gateway.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RegistrarConsultaPeticion {
    private Long idMedicoResponsable;
    private Long idPacienteAtendido;
    private String especialidad;
    private String tipoDocumento = "SOAP";
    private String transcripcion = "";
    private String notaClinica = "";
    private Long idClinica;
}
