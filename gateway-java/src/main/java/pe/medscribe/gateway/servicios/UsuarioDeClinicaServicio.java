package pe.medscribe.gateway.servicios;

import jakarta.persistence.EntityNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import pe.medscribe.gateway.dto.CrearUsuarioEnClinicaPeticion;
import pe.medscribe.gateway.modelos.RolSistema;
import pe.medscribe.gateway.modelos.Usuario;
import pe.medscribe.gateway.repositorios.UsuarioRepositorio;

import java.util.List;

@Service
public class UsuarioDeClinicaServicio {

    private final UsuarioRepositorio usuarioRepositorio;
    private final PasswordEncoder passwordEncoder;

    public UsuarioDeClinicaServicio(UsuarioRepositorio usuarioRepositorio, PasswordEncoder passwordEncoder) {
        this.usuarioRepositorio = usuarioRepositorio;
        this.passwordEncoder = passwordEncoder;
    }

    public List<Usuario> listarPorClinica(Long idClinica) {
        if (idClinica == null) {
            return usuarioRepositorio.findAll();
        }
        return usuarioRepositorio.findByIdClinica(idClinica);
    }

    @Transactional
    public Usuario crear(CrearUsuarioEnClinicaPeticion peticion) {
        if (usuarioRepositorio.existsByCorreoElectronico(peticion.getCorreoElectronico())) {
            throw new IllegalArgumentException("El correo electronico ya esta registrado");
        }

        RolSistema rol;
        try {
            rol = RolSistema.valueOf(peticion.getRolDelSistema());
        } catch (IllegalArgumentException ex) {
            throw new IllegalArgumentException("El rol no es valido");
        }

        Usuario usuario = Usuario.builder()
                .nombreCompleto(peticion.getNombreCompleto())
                .correoElectronico(peticion.getCorreoElectronico())
                .contrasenaHasheada(passwordEncoder.encode(peticion.getContrasena()))
                .rolDelSistema(rol)
                .idClinica(peticion.getIdClinica())
                .estaCuentaActiva(true)
                .debeCambiarContrasena(false)
                .build();
        return usuarioRepositorio.save(usuario);
    }

    public Usuario cambiarRol(Long idUsuario, String nuevoRol) {
        Usuario usuario = usuarioRepositorio.findById(idUsuario)
                .orElseThrow(() -> new EntityNotFoundException("Usuario no encontrado"));
        try {
            usuario.setRolDelSistema(RolSistema.valueOf(nuevoRol));
        } catch (IllegalArgumentException ex) {
            throw new IllegalArgumentException("El rol no es valido");
        }
        return usuarioRepositorio.save(usuario);
    }

    public Usuario buscarPorId(Long idUsuario) {
        return usuarioRepositorio.findById(idUsuario)
                .orElseThrow(() -> new EntityNotFoundException("Usuario no encontrado"));
    }
}
