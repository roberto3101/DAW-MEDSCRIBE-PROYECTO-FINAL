package pe.medscribe.gateway.servicios;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;

import java.time.Duration;
import java.util.HashMap;
import java.util.Map;

/**
 * Cliente para consumir el microservicio de IA (FastAPI en puerto 8000).
 */
@Service
public class ClienteServicioIA {

    private final RestClient restClient;
    private final String urlBase;

    public ClienteServicioIA(@Value("${medscribe.servicio-ia.url}") String urlBase) {
        this.urlBase = urlBase;
        this.restClient = RestClient.builder()
                .baseUrl(urlBase)
                .build();
    }

    public String transcribirAudioATexto(byte[] bytesDelAudio, String formato) {
        MultiValueMap<String, Object> cuerpo = new LinkedMultiValueMap<>();
        ByteArrayResource recurso = new ByteArrayResource(bytesDelAudio) {
            @Override
            public String getFilename() {
                return "audio." + formato;
            }
        };
        cuerpo.add("archivo", recurso);

        ResponseEntity<String> respuesta = restClient.post()
                .uri("/api/ia/transcribir")
                .header(HttpHeaders.CONTENT_TYPE, MediaType.MULTIPART_FORM_DATA_VALUE)
                .body(cuerpo)
                .retrieve()
                .toEntity(String.class);
        return respuesta.getBody() != null ? respuesta.getBody() : "";
    }

    public String procesarTranscripcion(String transcripcion, String especialidad, String tipoDocumento) {
        Map<String, Object> cuerpo = new HashMap<>();
        cuerpo.put("transcripcion", transcripcion);
        cuerpo.put("especialidad", especialidad);
        cuerpo.put("tipo_documento", tipoDocumento);

        ResponseEntity<String> respuesta = restClient.post()
                .uri("/api/ia/procesar")
                .contentType(MediaType.APPLICATION_JSON)
                .body(cuerpo)
                .retrieve()
                .toEntity(String.class);
        return respuesta.getBody() != null ? respuesta.getBody() : "";
    }

    public byte[] generarPdf(String notaClinica, String tipoDocumento) {
        Map<String, Object> cuerpo = new HashMap<>();
        cuerpo.put("nota_clinica", notaClinica);
        cuerpo.put("tipo_documento", tipoDocumento);

        ResponseEntity<byte[]> respuesta = restClient.post()
                .uri("/api/ia/generar-pdf")
                .contentType(MediaType.APPLICATION_JSON)
                .body(cuerpo)
                .retrieve()
                .toEntity(byte[].class);
        return respuesta.getBody() != null ? respuesta.getBody() : new byte[0];
    }

    public byte[] generarWord(String notaClinica, String tipoDocumento) {
        Map<String, Object> cuerpo = new HashMap<>();
        cuerpo.put("nota_clinica", notaClinica);
        cuerpo.put("tipo_documento", tipoDocumento);

        ResponseEntity<byte[]> respuesta = restClient.post()
                .uri("/api/ia/generar-word")
                .contentType(MediaType.APPLICATION_JSON)
                .body(cuerpo)
                .retrieve()
                .toEntity(byte[].class);
        return respuesta.getBody() != null ? respuesta.getBody() : new byte[0];
    }

    @SuppressWarnings("unused")
    private Duration tiempoMaximoEspera = Duration.ofSeconds(120);
}
