package pe.medscribe.gateway.modelos;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * Vista logica de la relacion Usuario-Clinica.
 * En el esquema original, los Usuarios ya tienen IdClinica directamente;
 * esta entidad es util para consultas especificas de usuario + rol en clinica.
 */
@Entity
@Table(name = "UsuariosDeClinica")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UsuarioDeClinica {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "IdUsuarioClinica")
    private Long idUsuarioClinica;

    @Column(name = "IdClinica", nullable = false)
    private Long idClinica;

    @Column(name = "IdUsuario", nullable = false)
    private Long idUsuario;

    @Column(name = "IdRol")
    private Long idRol;

    @Lob
    @Column(name = "PermisosPersonalizadosJSON")
    private String permisosPersonalizadosJSON;

    @Column(name = "FechaAsignacion", nullable = false)
    private LocalDateTime fechaAsignacion;

    @PrePersist
    public void prePersistir() {
        if (fechaAsignacion == null) fechaAsignacion = LocalDateTime.now();
    }
}
