package pe.medscribe.gateway.servicios;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import pe.medscribe.gateway.config.JwtUtil;
import pe.medscribe.gateway.dto.InicioSesionPeticion;
import pe.medscribe.gateway.dto.RegistroUsuarioPeticion;
import pe.medscribe.gateway.dto.RespuestaAutenticacion;
import pe.medscribe.gateway.dto.UsuarioDTO;
import pe.medscribe.gateway.modelos.Medico;
import pe.medscribe.gateway.modelos.RolSistema;
import pe.medscribe.gateway.modelos.Usuario;
import pe.medscribe.gateway.repositorios.MedicoRepositorio;
import pe.medscribe.gateway.repositorios.UsuarioRepositorio;

import java.time.LocalDateTime;

@Service
public class AutenticacionServicio {

    private static final Logger log = LoggerFactory.getLogger(AutenticacionServicio.class);

    private final UsuarioRepositorio usuarioRepositorio;
    private final MedicoRepositorio medicoRepositorio;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    public AutenticacionServicio(UsuarioRepositorio usuarioRepositorio,
                                 MedicoRepositorio medicoRepositorio,
                                 PasswordEncoder passwordEncoder,
                                 JwtUtil jwtUtil) {
        this.usuarioRepositorio = usuarioRepositorio;
        this.medicoRepositorio = medicoRepositorio;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
    }

    public RespuestaAutenticacion iniciarSesion(InicioSesionPeticion peticion) {
        log.info("[LOGIN-DEBUG] Intento con correo={}, contrasenaLen={}",
                peticion.getCorreoElectronico(),
                peticion.getContrasena() == null ? -1 : peticion.getContrasena().length());

        Usuario usuario = usuarioRepositorio.findByCorreoElectronico(peticion.getCorreoElectronico())
                .orElseThrow(() -> {
                    log.warn("[LOGIN-DEBUG] Usuario NO encontrado: {}", peticion.getCorreoElectronico());
                    return new BadCredentialsException("Credenciales incorrectas");
                });

        log.info("[LOGIN-DEBUG] Usuario encontrado: id={}, activo={}, hashLen={}, hashPrefix={}",
                usuario.getIdUsuario(),
                usuario.getEstaCuentaActiva(),
                usuario.getContrasenaHasheada() == null ? -1 : usuario.getContrasenaHasheada().length(),
                usuario.getContrasenaHasheada() == null ? "null" : usuario.getContrasenaHasheada().substring(0, Math.min(7, usuario.getContrasenaHasheada().length())));

        if (!Boolean.TRUE.equals(usuario.getEstaCuentaActiva())) {
            log.warn("[LOGIN-DEBUG] Cuenta desactivada para {}", peticion.getCorreoElectronico());
            throw new BadCredentialsException("La cuenta se encuentra desactivada");
        }

        boolean coincide = passwordEncoder.matches(peticion.getContrasena(), usuario.getContrasenaHasheada());
        log.info("[LOGIN-DEBUG] passwordEncoder.matches() = {}", coincide);
        if (!coincide) {
            throw new BadCredentialsException("Credenciales incorrectas");
        }

        usuario.setUltimoAcceso(LocalDateTime.now());
        usuarioRepositorio.save(usuario);

        String rol = usuario.getRolDelSistema() != null ? usuario.getRolDelSistema().name() : "Medico";
        String token = jwtUtil.generarToken(
                usuario.getCorreoElectronico(),
                rol,
                usuario.getIdUsuario(),
                usuario.getIdClinica()
        );

        UsuarioDTO usuarioDto = UsuarioDTO.builder()
                .idUsuario(usuario.getIdUsuario())
                .idClinica(usuario.getIdClinica())
                .nombreCompleto(usuario.getNombreCompleto())
                .correoElectronico(usuario.getCorreoElectronico())
                .rolDelSistema(rol)
                .estaCuentaActiva(usuario.getEstaCuentaActiva())
                .build();

        return RespuestaAutenticacion.builder()
                .token(token)
                .mensaje("Inicio de sesion exitoso")
                .usuario(usuarioDto)
                .build();
    }

    @Transactional
    public Usuario registrarUsuario(RegistroUsuarioPeticion peticion) {
        if (usuarioRepositorio.existsByCorreoElectronico(peticion.getCorreoElectronico())) {
            throw new IllegalArgumentException("El correo electronico ya esta registrado en el sistema");
        }

        RolSistema rol;
        try {
            rol = RolSistema.valueOf(peticion.getRolDelSistema());
        } catch (IllegalArgumentException ex) {
            throw new IllegalArgumentException("El rol indicado no es valido");
        }

        Usuario nuevoUsuario = Usuario.builder()
                .nombreCompleto(peticion.getNombreCompleto())
                .correoElectronico(peticion.getCorreoElectronico())
                .contrasenaHasheada(passwordEncoder.encode(peticion.getContrasena()))
                .rolDelSistema(rol)
                .estaCuentaActiva(true)
                .debeCambiarContrasena(false)
                .idClinica(peticion.getIdClinica())
                .build();

        Usuario usuarioGuardado = usuarioRepositorio.save(nuevoUsuario);

        if (rol == RolSistema.Medico) {
            if (peticion.getEspecialidadMedica() == null || peticion.getEspecialidadMedica().isBlank() ||
                    peticion.getNumeroColegiaturaDelPeru() == null || peticion.getNumeroColegiaturaDelPeru().isBlank()) {
                throw new IllegalArgumentException("La especialidad y numero de colegiatura son obligatorios para el rol Medico");
            }

            String[] partesNombre = peticion.getNombreCompleto().split(" ", 2);
            String nombreDelMedico = partesNombre[0];
            String apellidoDelMedico = partesNombre.length > 1 ? partesNombre[1] : "";

            Medico nuevoMedico = Medico.builder()
                    .idUsuarioVinculado(usuarioGuardado.getIdUsuario())
                    .idClinica(peticion.getIdClinica())
                    .nombreDelMedico(nombreDelMedico)
                    .apellidoDelMedico(apellidoDelMedico)
                    .especialidadMedica(peticion.getEspecialidadMedica())
                    .numeroColegiaturaDelPeru(peticion.getNumeroColegiaturaDelPeru())
                    .estaMedicoActivo(true)
                    .build();
            medicoRepositorio.save(nuevoMedico);
        }

        return usuarioGuardado;
    }
}
