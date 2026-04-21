package pe.medscribe.gateway.servicios;

import jakarta.persistence.EntityNotFoundException;
import org.springframework.stereotype.Service;

import pe.medscribe.gateway.dto.PacientePeticion;
import pe.medscribe.gateway.modelos.Paciente;
import pe.medscribe.gateway.repositorios.PacienteRepositorio;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class PacienteServicio {

    private final PacienteRepositorio pacienteRepositorio;

    public PacienteServicio(PacienteRepositorio pacienteRepositorio) {
        this.pacienteRepositorio = pacienteRepositorio;
    }

    public List<Paciente> listarTodosLosActivos() {
        return pacienteRepositorio.findByEstaPacienteActivoTrue();
    }

    public List<Paciente> listarPorClinica(Long idClinica) {
        return pacienteRepositorio.findByIdClinicaAndEstaPacienteActivoTrue(idClinica);
    }

    public Paciente buscarPorId(Long idPaciente) {
        return pacienteRepositorio.findById(idPaciente)
                .orElseThrow(() -> new EntityNotFoundException("Paciente no encontrado"));
    }

    public Optional<Paciente> buscarPorNumeroDocumento(String numero) {
        return pacienteRepositorio.findByNumeroDocumentoIdentidad(numero);
    }

    public Paciente crear(PacientePeticion peticion) {
        if (pacienteRepositorio.findByNumeroDocumentoIdentidad(peticion.getNumeroDocumentoIdentidad()).isPresent()) {
            throw new IllegalArgumentException("Ya existe un paciente con ese numero de documento");
        }

        Paciente paciente = Paciente.builder()
                .nombreDelPaciente(peticion.getNombreDelPaciente())
                .apellidoDelPaciente(peticion.getApellidoDelPaciente())
                .numeroDocumentoIdentidad(peticion.getNumeroDocumentoIdentidad())
                .tipoDocumentoIdentidad(peticion.getTipoDocumentoIdentidad())
                .fechaDeNacimiento(peticion.getFechaDeNacimiento())
                .sexoBiologico(peticion.getSexoBiologico())
                .telefonoDeContacto(peticion.getTelefonoDeContacto())
                .correoElectronico(peticion.getCorreoElectronico())
                .direccionDomiciliaria(peticion.getDireccionDomiciliaria())
                .estaPacienteActivo(true)
                .idClinica(peticion.getIdClinica())
                .fechaRegistroEnSistema(LocalDateTime.now())
                .build();

        return pacienteRepositorio.save(paciente);
    }

    public Paciente actualizar(Long idPaciente, PacientePeticion peticion) {
        Paciente paciente = buscarPorId(idPaciente);

        paciente.setNombreDelPaciente(peticion.getNombreDelPaciente());
        paciente.setApellidoDelPaciente(peticion.getApellidoDelPaciente());
        paciente.setNumeroDocumentoIdentidad(peticion.getNumeroDocumentoIdentidad());
        paciente.setTipoDocumentoIdentidad(peticion.getTipoDocumentoIdentidad());
        paciente.setFechaDeNacimiento(peticion.getFechaDeNacimiento());
        paciente.setSexoBiologico(peticion.getSexoBiologico());
        paciente.setTelefonoDeContacto(peticion.getTelefonoDeContacto());
        paciente.setCorreoElectronico(peticion.getCorreoElectronico());
        paciente.setDireccionDomiciliaria(peticion.getDireccionDomiciliaria());

        return pacienteRepositorio.save(paciente);
    }

    public void desactivar(Long idPaciente) {
        Paciente paciente = buscarPorId(idPaciente);
        paciente.setEstaPacienteActivo(false);
        paciente.setFechaEliminacion(LocalDateTime.now());
        pacienteRepositorio.save(paciente);
    }
}
