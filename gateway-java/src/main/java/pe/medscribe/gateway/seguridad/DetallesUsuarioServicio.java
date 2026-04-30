package pe.medscribe.gateway.seguridad;

import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import pe.medscribe.gateway.modelos.Usuario;
import pe.medscribe.gateway.repositorios.UsuarioRepositorio;

import java.util.Collections;

@Service
public class DetallesUsuarioServicio implements UserDetailsService {

    private final UsuarioRepositorio usuarioRepositorio;

    public DetallesUsuarioServicio(UsuarioRepositorio usuarioRepositorio) {
        this.usuarioRepositorio = usuarioRepositorio;
    }

    @Override
    public UserDetails loadUserByUsername(String correo) throws UsernameNotFoundException {
        Usuario usuario = usuarioRepositorio.findByCorreoElectronico(correo)
                .orElseThrow(() -> new UsernameNotFoundException("Usuario no encontrado: " + correo));

        if (!Boolean.TRUE.equals(usuario.getEstaCuentaActiva())) {
            throw new UsernameNotFoundException("La cuenta del usuario se encuentra desactivada");
        }

        String rol = usuario.getRolDelSistema() != null ? usuario.getRolDelSistema().name() : "Medico";

        return new User(
                usuario.getCorreoElectronico(),
                usuario.getContrasenaHasheada(),
                Collections.singletonList(new SimpleGrantedAuthority("ROLE_" + rol))
        );
    }
}
