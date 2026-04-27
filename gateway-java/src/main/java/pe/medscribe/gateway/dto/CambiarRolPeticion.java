package pe.medscribe.gateway.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CambiarRolPeticion {

    @NotNull(message = "El id del rol es obligatorio")
    private Long idRol;
}
