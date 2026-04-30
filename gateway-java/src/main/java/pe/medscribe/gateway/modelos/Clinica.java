package pe.medscribe.gateway.modelos;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "Clinicas")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Clinica {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "IdClinica")
    private Long idClinica;

    @Column(name = "RazonSocial", nullable = false, length = 200)
    private String razonSocial;

    @Column(name = "RucDeLaClinica", nullable = false, length = 11, unique = true)
    private String rucDeLaClinica;

    @Column(name = "NombreComercial", length = 200)
    private String nombreComercial;

    @Column(name = "DireccionLegal", length = 300)
    private String direccionLegal;

    @Column(name = "Departamento", length = 50)
    private String departamento;

    @Column(name = "Provincia", length = 50)
    private String provincia;

    @Column(name = "Distrito", length = 50)
    private String distrito;

    @Column(name = "TelefonoPrincipal", length = 20)
    private String telefonoPrincipal;

    @Column(name = "CorreoDeContacto", length = 150)
    private String correoDeContacto;

    @Column(name = "LogoUrl", length = 500)
    private String logoUrl;

    @Column(name = "SlugPublico", nullable = false, length = 100, unique = true)
    private String slugPublico;

    @Column(name = "ColorPrimario", length = 7)
    private String colorPrimario;

    @Column(name = "PlazoRespuestaDias", nullable = false)
    private Integer plazoRespuestaDias;

    @Column(name = "NotificarPorCorreo", nullable = false)
    private Boolean notificarPorCorreo;

    @Column(name = "EstaClinicaActiva", nullable = false)
    private Boolean estaClinicaActiva;

    @Column(name = "FechaRegistroEnSistema", nullable = false)
    private LocalDateTime fechaRegistroEnSistema;

    @Column(name = "FechaActualizacion", nullable = false)
    private LocalDateTime fechaActualizacion;

    @PrePersist
    public void prePersistir() {
        LocalDateTime ahora = LocalDateTime.now();
        if (fechaRegistroEnSistema == null) fechaRegistroEnSistema = ahora;
        if (fechaActualizacion == null) fechaActualizacion = ahora;
        if (estaClinicaActiva == null) estaClinicaActiva = true;
        if (notificarPorCorreo == null) notificarPorCorreo = true;
        if (plazoRespuestaDias == null) plazoRespuestaDias = 15;
        if (colorPrimario == null) colorPrimario = "#1a56db";
    }
}
