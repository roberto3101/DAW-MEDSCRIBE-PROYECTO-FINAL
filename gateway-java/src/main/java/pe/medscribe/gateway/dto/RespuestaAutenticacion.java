package pe.medscribe.gateway.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RespuestaAutenticacion {
    private String token;
    private String mensaje;
    private UsuarioDTO usuario;
}
