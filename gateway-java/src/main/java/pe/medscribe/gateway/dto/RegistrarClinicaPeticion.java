package pe.medscribe.gateway.dto;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RegistrarClinicaPeticion {

    @NotBlank(message = "La razon social es obligatoria")
    @Size(min = 2, max = 200)
    private String razonSocial;

    @NotBlank(message = "El RUC es obligatorio")
    @Pattern(regexp = "^\\d{11}$", message = "El RUC debe tener exactamente 11 digitos")
    private String ruc;

    @NotBlank(message = "El nombre comercial es obligatorio")
    @Size(min = 2, max = 200)
    private String nombreComercial;

    @NotBlank(message = "El correo de contacto es obligatorio")
    @Email(message = "Formato de correo invalido")
    @Size(max = 150)
    private String correoContacto;

    @NotBlank(message = "El nombre del administrador es obligatorio")
    @Size(min = 2, max = 100)
    private String nombreAdmin;

    @NotBlank(message = "El correo del administrador es obligatorio")
    @Email(message = "Formato de correo invalido")
    @Size(max = 150)
    private String correoAdmin;

    @NotBlank(message = "La contrasena del administrador es obligatoria")
    @Size(min = 8, max = 255)
    private String contrasenaAdmin;
}
