package pe.medscribe.gateway.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CambiarContrasenaPeticion {

    @NotNull(message = "El identificador del usuario es obligatorio")
    private Long idUsuario;

    @NotBlank(message = "La contrasena actual es obligatoria")
    private String contrasenaActual;

    @NotBlank(message = "La nueva contrasena es obligatoria")
    @Size(min = 8, max = 50, message = "La nueva contrasena debe tener entre 8 y 50 caracteres")
    private String contrasenaNueva;
}
