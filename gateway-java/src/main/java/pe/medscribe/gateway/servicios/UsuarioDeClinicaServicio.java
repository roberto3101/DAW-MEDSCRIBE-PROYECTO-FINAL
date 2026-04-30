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
    private final UsuarioAutenticadoProveedor usuarioAutenticadoProveedor;

    public UsuarioDeClinicaServicio(UsuarioRepositorio usuarioRepositorio,
                                    PasswordEncoder passwordEncoder,
                                    UsuarioAutenticadoProveedor usuarioAutenticadoProveedor) {
        this.usuarioRepositorio = usuarioRepositorio;
        this.passwordEncoder = passwordEncoder;
        this.usuarioAutenticadoProveedor = usuarioAutenticadoProveedor;
    }

    public List<Usuario> listarPorClinica(Long idClinica) {
        Long clinica = idClinica != null ? idClinica : usuarioAutenticadoProveedor.obtenerIdClinicaActual();
        if (clinica == null) {
            return usuarioRepositorio.findAll();
        }
        return usuarioRepositorio.findByIdClinica(clinica);
    }

    @Transactional
    public Usuario crear(CrearUsuarioEnClinicaPeticion peticion) {
        if (usuarioRepositorio.existsByCorreoElectronico(peticion.getCorreoElectronico())) {
            throw new IllegalArgumentException("El correo electronico ya esta registrado");
        }

        RolSistema rol = RolSistema.Medico;
        if (peticion.getRolDelSistema() != null && !peticion.getRolDelSistema().isBlank()) {
            try {
                rol = RolSistema.valueOf(peticion.getRolDelSistema());
            } catch (IllegalArgumentException ex) {
                // Cae a Medico por defecto cuando es un rol personalizado de clinica
                rol = RolSistema.Medico;
            }
        }

        Long idClinica = peticion.getIdClinica() != null
                ? peticion.getIdClinica()
                : usuarioAutenticadoProveedor.obtenerIdClinicaActual();

        Usuario usuario = Usuario.builder()
                .nombreCompleto(peticion.getNombreCompleto())
                .correoElectronico(peticion.getCorreoElectronico())
                .contrasenaHasheada(passwordEncoder.encode(peticion.getContrasena()))
                .rolDelSistema(rol)
                .idRol(peticion.getIdRol())
                .idClinica(idClinica)
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

    public Usuario cambiarRolDeClinica(Long idUsuario, Long idRol) {
        Usuario usuario = usuarioRepositorio.findById(idUsuario)
                .orElseThrow(() -> new EntityNotFoundException("Usuario no encontrado"));
        usuario.setIdRol(idRol);
        return usuarioRepositorio.save(usuario);
    }

    public Usuario buscarPorId(Long idUsuario) {
        return usuarioRepositorio.findById(idUsuario)
                .orElseThrow(() -> new EntityNotFoundException("Usuario no encontrado"));
    }
}
