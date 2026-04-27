package pe.medscribe.gateway.dto;

import jakarta.validation.constraints.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PacientePeticion {

    @NotBlank(message = "El nombre del paciente es obligatorio")
    @Size(min = 2, max = 100)
    private String nombreDelPaciente;

    @NotBlank(message = "El apellido del paciente es obligatorio")
    @Size(min = 2, max = 100)
    private String apellidoDelPaciente;

    @NotBlank(message = "El numero de documento es obligatorio")
    @Size(min = 8, max = 20)
    @Pattern(regexp = "^[A-Z0-9]{8,20}$", message = "Formato de documento invalido")
    private String numeroDocumentoIdentidad;

    @NotBlank(message = "El tipo de documento es obligatorio")
    @Pattern(regexp = "^(DNI|CE|Pasaporte)$")
    private String tipoDocumentoIdentidad;

    @NotNull(message = "La fecha de nacimiento es obligatoria")
    private LocalDate fechaDeNacimiento;

    @NotBlank(message = "El sexo biologico es obligatorio")
    @Pattern(regexp = "^(Masculino|Femenino)$")
    private String sexoBiologico;

    @Size(max = 20)
    private String telefonoDeContacto;

    @Email(message = "Formato de correo invalido")
    @Size(max = 150)
    private String correoElectronico;

    @Size(max = 300)
    private String direccionDomiciliaria;

    private Long idClinica;
}
