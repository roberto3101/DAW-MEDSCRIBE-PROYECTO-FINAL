package pe.medscribe.gateway.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RolPeticion {

    @NotBlank(message = "El nombre del rol es obligatorio")
    @Size(min = 2, max = 100)
    private String nombre;

    private String descripcion = "";

    private String permisosJson = "{}";

    private Long idClinica;
}
