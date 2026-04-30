package pe.medscribe.gateway.servicios;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;

import pe.medscribe.gateway.modelos.Usuario;
import pe.medscribe.gateway.repositorios.UsuarioRepositorio;

import java.util.Optional;

/**
 * Obtiene el usuario autenticado desde el SecurityContext (poblado por JwtFiltro).
 * Util para recuperar idClinica / idUsuario sin confiar en el payload del cliente.
 */
@Component
public class UsuarioAutenticadoProveedor {

    private final UsuarioRepositorio usuarioRepositorio;

    public UsuarioAutenticadoProveedor(UsuarioRepositorio usuarioRepositorio) {
        this.usuarioRepositorio = usuarioRepositorio;
    }

    public Optional<Usuario> obtenerUsuarioActual() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) return Optional.empty();
        Object principal = auth.getPrincipal();
        String correo;
        if (principal instanceof UserDetails ud) {
            correo = ud.getUsername();
        } else if (principal instanceof String s) {
            correo = s;
        } else {
            return Optional.empty();
        }
        if (correo == null || correo.isBlank() || "anonymousUser".equals(correo)) {
            return Optional.empty();
        }
        return usuarioRepositorio.findByCorreoElectronico(correo);
    }

    public Long obtenerIdClinicaActual() {
        return obtenerUsuarioActual().map(Usuario::getIdClinica).orElse(null);
    }

    public Long obtenerIdUsuarioActual() {
        return obtenerUsuarioActual().map(Usuario::getIdUsuario).orElse(null);
    }
}
