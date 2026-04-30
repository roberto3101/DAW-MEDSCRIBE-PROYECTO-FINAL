package pe.medscribe.gateway.servicios;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import pe.medscribe.gateway.config.JwtUtil;
import pe.medscribe.gateway.dto.CambiarContrasenaPeticion;
import pe.medscribe.gateway.dto.InicioSesionPeticion;
import pe.medscribe.gateway.dto.RegistroUsuarioPeticion;
import pe.medscribe.gateway.dto.RespuestaAutenticacion;
import pe.medscribe.gateway.dto.UsuarioDTO;
import pe.medscribe.gateway.modelos.Clinica;
import pe.medscribe.gateway.modelos.Medico;
import pe.medscribe.gateway.modelos.RolDeClinica;
import pe.medscribe.gateway.modelos.RolSistema;
import pe.medscribe.gateway.modelos.Usuario;
import pe.medscribe.gateway.modelos.UsuarioDeClinica;
import pe.medscribe.gateway.repositorios.ClinicaRepositorio;
import pe.medscribe.gateway.repositorios.MedicoRepositorio;
import pe.medscribe.gateway.repositorios.RolDeClinicaRepositorio;
import pe.medscribe.gateway.repositorios.UsuarioDeClinicaRepositorio;
import pe.medscribe.gateway.repositorios.UsuarioRepositorio;

import java.time.LocalDateTime;
import java.util.Optional;

@Service
public class AutenticacionServicio {

    private static final Logger log = LoggerFactory.getLogger(AutenticacionServicio.class);

    // Permisos por defecto para cada rol del sistema
    private static final String PERMISOS_ADMINISTRADOR = "{" +
            "\"pacientes\":{\"ver\":true,\"crear\":true,\"editar\":true,\"eliminar\":true}," +
            "\"consultas\":{\"ver\":true,\"crear\":true,\"editar\":true,\"eliminar\":true}," +
            "\"documentos\":{\"ver\":true,\"crear\":true,\"editar\":true,\"eliminar\":true}," +
            "\"configuracion\":{\"ver\":true,\"crear\":true,\"editar\":true,\"eliminar\":true}," +
            "\"usuarios\":{\"ver\":true,\"crear\":true,\"editar\":true,\"eliminar\":true}," +
            "\"roles\":{\"ver\":true,\"crear\":true,\"editar\":true,\"eliminar\":true}" +
            "}";

    private static final String PERMISOS_MEDICO = "{" +
            "\"pacientes\":{\"ver\":true,\"crear\":true,\"editar\":true,\"eliminar\":false}," +
            "\"consultas\":{\"ver\":true,\"crear\":true,\"editar\":true,\"eliminar\":false}," +
            "\"documentos\":{\"ver\":true,\"crear\":true,\"editar\":true,\"eliminar\":false}," +
            "\"configuracion\":{\"ver\":true,\"crear\":false,\"editar\":true,\"eliminar\":false}," +
            "\"usuarios\":{\"ver\":false,\"crear\":false,\"editar\":false,\"eliminar\":false}," +
            "\"roles\":{\"ver\":false,\"crear\":false,\"editar\":false,\"eliminar\":false}" +
            "}";

    private static final String PERMISOS_RECEPCIONISTA = "{" +
            "\"pacientes\":{\"ver\":true,\"crear\":true,\"editar\":true,\"eliminar\":false}," +
            "\"consultas\":{\"ver\":true,\"crear\":false,\"editar\":false,\"eliminar\":false}," +
            "\"documentos\":{\"ver\":true,\"crear\":false,\"editar\":false,\"eliminar\":false}," +
            "\"configuracion\":{\"ver\":false,\"crear\":false,\"editar\":false,\"eliminar\":false}," +
            "\"usuarios\":{\"ver\":false,\"crear\":false,\"editar\":false,\"eliminar\":false}," +
            "\"roles\":{\"ver\":false,\"crear\":false,\"editar\":false,\"eliminar\":false}" +
            "}";

    private final UsuarioRepositorio usuarioRepositorio;
    private final MedicoRepositorio medicoRepositorio;
    private final RolDeClinicaRepositorio rolDeClinicaRepositorio;
    private final UsuarioDeClinicaRepositorio usuarioDeClinicaRepositorio;
    private final ClinicaRepositorio clinicaRepositorio;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    public AutenticacionServicio(UsuarioRepositorio usuarioRepositorio,
                                 MedicoRepositorio medicoRepositorio,
                                 RolDeClinicaRepositorio rolDeClinicaRepositorio,
                                 UsuarioDeClinicaRepositorio usuarioDeClinicaRepositorio,
                                 ClinicaRepositorio clinicaRepositorio,
                                 PasswordEncoder passwordEncoder,
                                 JwtUtil jwtUtil) {
        this.usuarioRepositorio = usuarioRepositorio;
        this.medicoRepositorio = medicoRepositorio;
        this.rolDeClinicaRepositorio = rolDeClinicaRepositorio;
        this.usuarioDeClinicaRepositorio = usuarioDeClinicaRepositorio;
        this.clinicaRepositorio = clinicaRepositorio;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
    }

    public RespuestaAutenticacion iniciarSesion(InicioSesionPeticion peticion) {
        log.info("[LOGIN] Intento con correo={}", peticion.getCorreoElectronico());

        Usuario usuario = usuarioRepositorio.findByCorreoElectronico(peticion.getCorreoElectronico())
                .orElseThrow(() -> new BadCredentialsException("Credenciales incorrectas"));

        if (!Boolean.TRUE.equals(usuario.getEstaCuentaActiva())) {
            throw new BadCredentialsException("La cuenta se encuentra desactivada");
        }

        if (!passwordEncoder.matches(peticion.getContrasena(), usuario.getContrasenaHasheada())) {
            throw new BadCredentialsException("Credenciales incorrectas");
        }

        usuario.setUltimoAcceso(LocalDateTime.now());
        usuarioRepositorio.save(usuario);

        String rolSistema = usuario.getRolDelSistema() != null ? usuario.getRolDelSistema().name() : "Medico";
        String token = jwtUtil.generarToken(
                usuario.getCorreoElectronico(),
                rolSistema,
                usuario.getIdUsuario(),
                usuario.getIdClinica()
        );

        UsuarioDTO usuarioDto = construirUsuarioDTO(usuario, rolSistema);

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

    @Transactional
    public void cambiarContrasena(CambiarContrasenaPeticion peticion) {
        Usuario usuario = usuarioRepositorio.findById(peticion.getIdUsuario())
                .orElseThrow(() -> new IllegalArgumentException("Usuario no encontrado"));

        if (!passwordEncoder.matches(peticion.getContrasenaActual(), usuario.getContrasenaHasheada())) {
            throw new BadCredentialsException("La contrasena actual no es correcta");
        }
        if (peticion.getContrasenaActual().equals(peticion.getContrasenaNueva())) {
            throw new IllegalArgumentException("La nueva contrasena debe ser diferente a la actual");
        }

        usuario.setContrasenaHasheada(passwordEncoder.encode(peticion.getContrasenaNueva()));
        usuario.setDebeCambiarContrasena(false);
        usuarioRepositorio.save(usuario);
    }

    private UsuarioDTO construirUsuarioDTO(Usuario usuario, String rolSistema) {
        String permisosDelRol = permisosPorDefecto(rolSistema);
        String nombreRol = rolSistema;
        String permisosPersonalizados = "{}";
        String nombreClinica = null;

        if (usuario.getIdRol() != null) {
            Optional<RolDeClinica> rolDeClinicaOpt = rolDeClinicaRepositorio.findById(usuario.getIdRol());
            if (rolDeClinicaOpt.isPresent()) {
                RolDeClinica rol = rolDeClinicaOpt.get();
                if (rol.getPermisosEnFormatoJSON() != null && !rol.getPermisosEnFormatoJSON().isBlank()) {
                    permisosDelRol = rol.getPermisosEnFormatoJSON();
                }
                nombreRol = rol.getNombreDelRol();
            }
        }

        if (usuario.getIdClinica() != null) {
            Optional<UsuarioDeClinica> vinculoOpt =
                    usuarioDeClinicaRepositorio.findByIdUsuarioAndIdClinica(usuario.getIdUsuario(), usuario.getIdClinica());
            if (vinculoOpt.isPresent() && vinculoOpt.get().getPermisosPersonalizadosJSON() != null) {
                permisosPersonalizados = vinculoOpt.get().getPermisosPersonalizadosJSON();
            }

            Optional<Clinica> clinicaOpt = clinicaRepositorio.findById(usuario.getIdClinica());
            if (clinicaOpt.isPresent()) {
                Clinica clinica = clinicaOpt.get();
                nombreClinica = clinica.getNombreComercial() != null && !clinica.getNombreComercial().isBlank()
                        ? clinica.getNombreComercial()
                        : clinica.getRazonSocial();
            }
        }

        return UsuarioDTO.builder()
                .idUsuario(usuario.getIdUsuario())
                .idClinica(usuario.getIdClinica())
                .nombreCompleto(usuario.getNombreCompleto())
                .correoElectronico(usuario.getCorreoElectronico())
                .rolDelSistema(rolSistema)
                .nombreRol(nombreRol)
                .nombreClinica(nombreClinica)
                .permisosDelRol(permisosDelRol)
                .permisosPersonalizados(permisosPersonalizados)
                .estaCuentaActiva(usuario.getEstaCuentaActiva())
                .build();
    }

    private String permisosPorDefecto(String rolSistema) {
        if ("Administrador".equals(rolSistema)) return PERMISOS_ADMINISTRADOR;
        if ("Recepcionista".equals(rolSistema)) return PERMISOS_RECEPCIONISTA;
        return PERMISOS_MEDICO;
    }
}
