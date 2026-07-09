package com.thesystem.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.function.Function;

@Service
public class JwtService {

    /** Sentinel value shipped in application.yml. Boot MUST fail if this is still in use. */
    private static final String DEFAULT_INSECURE_SECRET =
            "TheSystemSoloLevelingSecretKeyChangeMeInProduction1234567890ABCDEF";

    @Value("${thesystem.jwt.secret}")
    private String secret;

    @Value("${thesystem.jwt.access-expiration-ms}")
    private long accessExpirationMs;

    @Value("${thesystem.jwt.refresh-expiration-ms}")
    private long refreshExpirationMs;

    /**
     * Refuses to start if the JWT secret is the public default from application.yml
     * or is too short to be cryptographically safe (HS256 needs ≥ 256 bits = 32 bytes).
     * This closes a critical class of "anyone can forge tokens" attacks.
     */
    @PostConstruct
    void validateSecret() {
        if (secret == null || secret.isBlank()) {
            throw new IllegalStateException(
                "JWT secret is empty. Set JWT_SECRET env var or thesystem.jwt.secret " +
                "in application-local.yml (≥ 32 chars, random).");
        }
        if (DEFAULT_INSECURE_SECRET.equals(secret)) {
            throw new IllegalStateException(
                "Refusing to start with the public default JWT secret. " +
                "Set JWT_SECRET env var or thesystem.jwt.secret in application-local.yml " +
                "to a random ≥ 32-char value.");
        }
        if (secret.getBytes(StandardCharsets.UTF_8).length < 32) {
            throw new IllegalStateException(
                "JWT secret is too short (need ≥ 32 bytes / 256 bits for HS256). " +
                "Generate one with e.g. `openssl rand -base64 48`.");
        }
    }

    private SecretKey key() {
        return Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
    }

    public String generateAccessToken(String username) {
        return buildToken(username, accessExpirationMs, "access");
    }

    public String generateRefreshToken(String username) {
        return buildToken(username, refreshExpirationMs, "refresh");
    }

    private String buildToken(String username, long expiration, String type) {
        Date now = new Date();
        return Jwts.builder()
                .subject(username)
                .claim("type", type)
                .issuedAt(now)
                .expiration(new Date(now.getTime() + expiration))
                .signWith(key())
                .compact();
    }

    public String extractUsername(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    public String extractType(String token) {
        return extractClaim(token, c -> c.get("type", String.class));
    }

    public boolean isTokenValid(String token, String username) {
        try {
            return extractUsername(token).equals(username) && !isExpired(token);
        } catch (Exception e) {
            return false;
        }
    }

    private boolean isExpired(String token) {
        return extractClaim(token, Claims::getExpiration).before(new Date());
    }

    private <T> T extractClaim(String token, Function<Claims, T> resolver) {
        Claims claims = Jwts.parser()
                .verifyWith(key())
                .build()
                .parseSignedClaims(token)
                .getPayload();
        return resolver.apply(claims);
    }
}

