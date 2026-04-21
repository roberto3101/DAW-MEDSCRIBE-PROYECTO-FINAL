package pe.medscribe.gateway.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class InicioSesionPeticion {

    @NotBlank(message = "El correo electronico es obligatorio")
    @Email(message = "El formato del correo electronico no es valido")
    @Size(max = 150)
    private String correoElectronico;

    @NotBlank(message = "La contrasena es obligatoria")
    @Size(min = 8, max = 255, message = "La contrasena debe tener entre 8 y 255 caracteres")
    private String contrasena;
}
