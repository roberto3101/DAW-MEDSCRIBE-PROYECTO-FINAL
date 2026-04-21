package pe.medscribe.gateway.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CrearUsuarioEnClinicaPeticion {

    @NotBlank
    @Size(min = 2, max = 100)
    private String nombreCompleto;

    @NotBlank
    @Email
    @Size(max = 150)
    private String correoElectronico;

    @NotBlank
    @Size(min = 8, max = 255)
    private String contrasena;

    @NotBlank
    @Pattern(regexp = "^(Administrador|Medico|Recepcionista)$")
    private String rolDelSistema;

    private Long idClinica;
}
