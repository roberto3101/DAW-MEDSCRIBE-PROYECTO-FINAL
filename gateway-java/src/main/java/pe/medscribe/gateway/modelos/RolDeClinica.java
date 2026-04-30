package pe.medscribe.gateway.modelos;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "RolesDeClinica")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RolDeClinica {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "IdRol")
    private Long idRol;

    @Column(name = "IdClinica", nullable = false)
    private Long idClinica;

    @Column(name = "NombreDelRol", nullable = false, length = 50)
    private String nombreDelRol;

    @Column(name = "DescripcionDelRol", length = 200)
    private String descripcionDelRol;

    @Lob
    @Column(name = "PermisosEnFormatoJSON", nullable = false)
    private String permisosEnFormatoJSON;

    @Column(name = "EsRolBase", nullable = false)
    private Boolean esRolBase;

    @Column(name = "FechaCreacion", nullable = false)
    private LocalDateTime fechaCreacion;

    @PrePersist
    public void prePersistir() {
        if (fechaCreacion == null) fechaCreacion = LocalDateTime.now();
        if (esRolBase == null) esRolBase = false;
        if (permisosEnFormatoJSON == null) permisosEnFormatoJSON = "{}";
    }
}
