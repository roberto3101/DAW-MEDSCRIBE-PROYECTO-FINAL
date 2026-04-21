package pe.medscribe.gateway.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UsuarioDTO {
    private Long idUsuario;
    private Long idClinica;
    private String nombreCompleto;
    private String correoElectronico;
    private String rolDelSistema;
    private Boolean estaCuentaActiva;
}
