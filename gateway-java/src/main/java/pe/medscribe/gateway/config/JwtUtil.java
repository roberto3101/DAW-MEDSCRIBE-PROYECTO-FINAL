package pe.medscribe.gateway.config;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.function.Function;

@Component
public class JwtUtil {

    @Value("${medscribe.jwt.secret}")
    private String claveSecreta;

    @Value("${medscribe.jwt.expiracion}")
    private long tiempoExpiracionMs;

    private SecretKey obtenerClaveFirma() {
        byte[] bytesClave = claveSecreta.getBytes(StandardCharsets.UTF_8);
        return Keys.hmacShaKeyFor(bytesClave);
    }

    public String generarToken(String correo, String rol, Long idUsuario, Long idClinica) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("rol", rol);
        claims.put("idUsuario", idUsuario);
        claims.put("idClinica", idClinica);
        return construirToken(claims, correo);
    }

    private String construirToken(Map<String, Object> claims, String subject) {
        Date ahora = new Date();
        Date expiracion = new Date(ahora.getTime() + tiempoExpiracionMs);

        return Jwts.builder()
                .claims(claims)
                .subject(subject)
                .issuedAt(ahora)
                .expiration(expiracion)
                .signWith(obtenerClaveFirma())
                .compact();
    }

    public String extraerCorreo(String token) {
        return extraerClaim(token, Claims::getSubject);
    }

    public String extraerRol(String token) {
        return extraerClaim(token, claims -> claims.get("rol", String.class));
    }

    public Long extraerIdUsuario(String token) {
        return extraerClaim(token, claims -> claims.get("idUsuario", Long.class));
    }

    public Long extraerIdClinica(String token) {
        return extraerClaim(token, claims -> claims.get("idClinica", Long.class));
    }

    public Date extraerExpiracion(String token) {
        return extraerClaim(token, Claims::getExpiration);
    }

    public <T> T extraerClaim(String token, Function<Claims, T> resolver) {
        Claims claims = extraerTodosLosClaims(token);
        return resolver.apply(claims);
    }

    private Claims extraerTodosLosClaims(String token) {
        return Jwts.parser()
                .verifyWith(obtenerClaveFirma())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    public boolean estaExpirado(String token) {
        return extraerExpiracion(token).before(new Date());
    }

    public boolean validarToken(String token, String correoEsperado) {
        try {
            String correo = extraerCorreo(token);
            return correo.equals(correoEsperado) && !estaExpirado(token);
        } catch (Exception excepcion) {
            return false;
        }
    }
}
