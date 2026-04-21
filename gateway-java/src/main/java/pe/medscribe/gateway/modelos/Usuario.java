package pe.medscribe.gateway.modelos;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "Usuarios")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Usuario {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "IdUsuario")
    private Long idUsuario;

    @Column(name = "NombreCompleto", nullable = false, length = 100)
    private String nombreCompleto;

    @Column(name = "CorreoElectronico", nullable = false, length = 150, unique = true)
    private String correoElectronico;

    @Column(name = "ContrasenaHasheada", nullable = false, length = 255)
    private String contrasenaHasheada;

    @Enumerated(EnumType.STRING)
    @Column(name = "RolDelSistema", nullable = false, length = 20)
    private RolSistema rolDelSistema;

    @Column(name = "EstaCuentaActiva", nullable = false)
    private Boolean estaCuentaActiva;

    @Column(name = "DebeCambiarContrasena")
    private Boolean debeCambiarContrasena;

    @Column(name = "IdRol")
    private Long idRol;

    @Column(name = "IdClinica")
    private Long idClinica;

    @Column(name = "FotoPerfilUrl", length = 500)
    private String fotoPerfilUrl;

    @Column(name = "UltimoAcceso")
    private LocalDateTime ultimoAcceso;

    @Column(name = "FechaRegistroEnSistema", nullable = false)
    private LocalDateTime fechaRegistroEnSistema;

    @PrePersist
    public void prePersistir() {
        if (fechaRegistroEnSistema == null) fechaRegistroEnSistema = LocalDateTime.now();
        if (estaCuentaActiva == null) estaCuentaActiva = true;
        if (debeCambiarContrasena == null) debeCambiarContrasena = false;
    }
}
