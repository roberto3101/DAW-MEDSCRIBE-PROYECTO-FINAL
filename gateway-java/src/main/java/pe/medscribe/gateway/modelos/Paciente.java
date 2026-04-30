package pe.medscribe.gateway.modelos;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "Pacientes")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Paciente {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "IdPaciente")
    private Long idPaciente;

    @Column(name = "IdClinica")
    private Long idClinica;

    @Column(name = "NombreDelPaciente", nullable = false, length = 100)
    private String nombreDelPaciente;

    @Column(name = "ApellidoDelPaciente", nullable = false, length = 100)
    private String apellidoDelPaciente;

    @Column(name = "NumeroDocumentoIdentidad", nullable = false, length = 20)
    private String numeroDocumentoIdentidad;

    @Column(name = "TipoDocumentoIdentidad", nullable = false, length = 20)
    private String tipoDocumentoIdentidad;

    @Column(name = "FechaDeNacimiento", nullable = false)
    private LocalDate fechaDeNacimiento;

    @Column(name = "SexoBiologico", nullable = false, length = 10)
    private String sexoBiologico;

    @Column(name = "TelefonoDeContacto", length = 20)
    private String telefonoDeContacto;

    @Column(name = "CorreoElectronico", length = 150)
    private String correoElectronico;

    @Column(name = "DireccionDomiciliaria", length = 300)
    private String direccionDomiciliaria;

    @Column(name = "EstaPacienteActivo", nullable = false)
    private Boolean estaPacienteActivo;

    @Column(name = "FechaRegistroEnSistema", nullable = false)
    private LocalDateTime fechaRegistroEnSistema;

    @Column(name = "FechaEliminacion")
    private LocalDateTime fechaEliminacion;

    @PrePersist
    public void prePersistir() {
        if (fechaRegistroEnSistema == null) fechaRegistroEnSistema = LocalDateTime.now();
        if (estaPacienteActivo == null) estaPacienteActivo = true;
        if (tipoDocumentoIdentidad == null) tipoDocumentoIdentidad = "DNI";
    }
}
