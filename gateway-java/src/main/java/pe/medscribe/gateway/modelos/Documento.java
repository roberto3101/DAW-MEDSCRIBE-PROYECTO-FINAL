package pe.medscribe.gateway.modelos;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "Documentos")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Documento {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "IdDocumento")
    private Long idDocumento;

    @Column(name = "IdClinica")
    private Long idClinica;

    @Column(name = "IdConsultaVinculada", nullable = false)
    private Long idConsultaVinculada;

    @Column(name = "TipoDocumentoClinico", nullable = false, length = 50)
    private String tipoDocumentoClinico;

    @Column(name = "FormatoDeArchivo", nullable = false, length = 10)
    private String formatoDeArchivo;

    @Column(name = "RutaFisicaDelArchivo", nullable = false, length = 500)
    private String rutaFisicaDelArchivo;

    @Column(name = "EstadoDeAprobacion", nullable = false, length = 20)
    private String estadoDeAprobacion;

    @Column(name = "NumeroDeVersion", nullable = false)
    private Integer numeroDeVersion;

    @Column(name = "FechaDeGeneracion", nullable = false)
    private LocalDateTime fechaDeGeneracion;

    @Column(name = "FechaEliminacion")
    private LocalDateTime fechaEliminacion;

    @PrePersist
    public void prePersistir() {
        if (fechaDeGeneracion == null) fechaDeGeneracion = LocalDateTime.now();
        if (numeroDeVersion == null) numeroDeVersion = 1;
        if (estadoDeAprobacion == null) estadoDeAprobacion = "Borrador";
        if (formatoDeArchivo == null) formatoDeArchivo = "PDF";
    }
}
