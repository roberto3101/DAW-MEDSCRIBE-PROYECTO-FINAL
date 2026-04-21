package pe.medscribe.gateway.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RegistroUsuarioPeticion {

    @NotBlank(message = "El nombre completo es obligatorio")
    @Size(min = 2, max = 100, message = "El nombre debe tener entre 2 y 100 caracteres")
    private String nombreCompleto;

    @NotBlank(message = "El correo electronico es obligatorio")
    @Email(message = "El formato del correo electronico no es valido")
    @Size(max = 150)
    private String correoElectronico;

    @NotBlank(message = "La contrasena es obligatoria")
    @Size(min = 8, max = 255, message = "La contrasena debe tener entre 8 y 255 caracteres")
    private String contrasena;

    @NotBlank(message = "El rol es obligatorio")
    @Pattern(regexp = "^(Administrador|Medico|Recepcionista)$",
            message = "El rol debe ser Administrador, Medico o Recepcionista")
    private String rolDelSistema;

    private String especialidadMedica;

    private String numeroColegiaturaDelPeru;

    private Long idClinica;
}
