package pe.medscribe.gateway.servicios;

import jakarta.persistence.EntityNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import pe.medscribe.gateway.dto.RegistrarClinicaPeticion;
import pe.medscribe.gateway.modelos.Clinica;
import pe.medscribe.gateway.modelos.RolSistema;
import pe.medscribe.gateway.modelos.Usuario;
import pe.medscribe.gateway.repositorios.ClinicaRepositorio;
import pe.medscribe.gateway.repositorios.UsuarioRepositorio;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class ClinicaServicio {

    private final ClinicaRepositorio clinicaRepositorio;
    private final UsuarioRepositorio usuarioRepositorio;
    private final PasswordEncoder passwordEncoder;

    public ClinicaServicio(ClinicaRepositorio clinicaRepositorio,
                           UsuarioRepositorio usuarioRepositorio,
                           PasswordEncoder passwordEncoder) {
        this.clinicaRepositorio = clinicaRepositorio;
        this.usuarioRepositorio = usuarioRepositorio;
        this.passwordEncoder = passwordEncoder;
    }

    public List<Clinica> listar() {
        return clinicaRepositorio.findAll();
    }

    public Clinica buscarPorId(Long id) {
        return clinicaRepositorio.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Clinica no encontrada"));
    }

    @Transactional
    public Clinica registrarClinicaCompleta(RegistrarClinicaPeticion peticion) {
        if (clinicaRepositorio.existsByRucDeLaClinica(peticion.getRuc())) {
            throw new IllegalArgumentException("Ya existe una clinica con ese RUC");
        }

        String slug = generarSlug(peticion.getNombreComercial());
        if (clinicaRepositorio.existsBySlugPublico(slug)) {
            slug = slug + "-" + System.currentTimeMillis();
        }

        Clinica clinica = Clinica.builder()
                .razonSocial(peticion.getRazonSocial())
                .rucDeLaClinica(peticion.getRuc())
                .nombreComercial(peticion.getNombreComercial())
                .correoDeContacto(peticion.getCorreoContacto())
                .slugPublico(slug)
                .colorPrimario("#1a56db")
                .plazoRespuestaDias(15)
                .notificarPorCorreo(true)
                .estaClinicaActiva(true)
                .fechaRegistroEnSistema(LocalDateTime.now())
                .fechaActualizacion(LocalDateTime.now())
                .build();

        Clinica clinicaGuardada = clinicaRepositorio.save(clinica);

        if (usuarioRepositorio.existsByCorreoElectronico(peticion.getCorreoAdmin())) {
            throw new IllegalArgumentException("El correo del administrador ya esta registrado");
        }

        Usuario administrador = Usuario.builder()
                .nombreCompleto(peticion.getNombreAdmin())
                .correoElectronico(peticion.getCorreoAdmin())
                .contrasenaHasheada(passwordEncoder.encode(peticion.getContrasenaAdmin()))
                .rolDelSistema(RolSistema.Administrador)
                .estaCuentaActiva(true)
                .debeCambiarContrasena(false)
                .idClinica(clinicaGuardada.getIdClinica())
                .build();
        usuarioRepositorio.save(administrador);

        return clinicaGuardada;
    }

    private String generarSlug(String nombre) {
        String base = nombre == null ? "clinica" : nombre.toLowerCase().trim();
        base = base.replaceAll("\\s+", "-");
        base = base.replaceAll("[^a-z0-9\\-]", "");
        return base.isEmpty() ? "clinica" : base;
    }
}
