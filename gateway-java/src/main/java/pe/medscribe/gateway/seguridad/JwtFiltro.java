package pe.medscribe.gateway.seguridad;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import pe.medscribe.gateway.config.JwtUtil;

import java.io.IOException;

@Component
public class JwtFiltro extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;
    private final DetallesUsuarioServicio detallesUsuarioServicio;

    public JwtFiltro(JwtUtil jwtUtil, DetallesUsuarioServicio detallesUsuarioServicio) {
        this.jwtUtil = jwtUtil;
        this.detallesUsuarioServicio = detallesUsuarioServicio;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest peticion, HttpServletResponse respuesta, FilterChain cadena)
            throws ServletException, IOException {
        try {
            String token = extraerTokenDeCabecera(peticion);

            if (StringUtils.hasText(token)) {
                String correo = jwtUtil.extraerCorreo(token);

                if (StringUtils.hasText(correo) && SecurityContextHolder.getContext().getAuthentication() == null) {
                    UserDetails detallesUsuario = detallesUsuarioServicio.loadUserByUsername(correo);

                    if (jwtUtil.validarToken(token, detallesUsuario.getUsername())) {
                        UsernamePasswordAuthenticationToken autenticacion =
                                new UsernamePasswordAuthenticationToken(detallesUsuario, null, detallesUsuario.getAuthorities());
                        autenticacion.setDetails(new WebAuthenticationDetailsSource().buildDetails(peticion));
                        SecurityContextHolder.getContext().setAuthentication(autenticacion);
                    }
                }
            }
        } catch (Exception excepcion) {
            logger.warn("No se pudo validar el token JWT: " + excepcion.getMessage());
        }

        cadena.doFilter(peticion, respuesta);
    }

    private String extraerTokenDeCabecera(HttpServletRequest peticion) {
        String cabeceraAutorizacion = peticion.getHeader("Authorization");
        if (StringUtils.hasText(cabeceraAutorizacion) && cabeceraAutorizacion.startsWith("Bearer ")) {
            return cabeceraAutorizacion.substring(7);
        }
        return null;
    }
}
