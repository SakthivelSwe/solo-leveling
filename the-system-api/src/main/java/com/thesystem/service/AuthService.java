package com.thesystem.service;

import com.thesystem.dto.*;
import com.thesystem.entity.Player;
import com.thesystem.entity.PlayerSkill;
import com.thesystem.entity.PlayerStats;
import com.thesystem.exception.ApiException;
import com.thesystem.repository.PlayerRepository;
import com.thesystem.repository.PlayerSkillRepository;
import com.thesystem.repository.PlayerStatsRepository;
import com.thesystem.security.JwtService;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class AuthService {

    private final PlayerRepository playerRepository;
    private final PlayerStatsRepository statsRepository;
    private final PlayerSkillRepository skillRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;
    private final PlayerService playerService;

    public AuthService(PlayerRepository playerRepository,
                       PlayerStatsRepository statsRepository,
                       PlayerSkillRepository skillRepository,
                       PasswordEncoder passwordEncoder,
                       JwtService jwtService,
                       AuthenticationManager authenticationManager,
                       PlayerService playerService) {
        this.playerRepository = playerRepository;
        this.statsRepository = statsRepository;
        this.skillRepository = skillRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.authenticationManager = authenticationManager;
        this.playerService = playerService;
    }

    @Transactional
    public AuthResponse register(RegisterRequest req) {
        // Store username in lowercase so lookups are always case-insensitive
        String username = req.username().trim().toLowerCase();
        if (playerRepository.existsByUsernameIgnoreCase(username)) {
            throw new ApiException("Username already taken", HttpStatus.CONFLICT);
        }
        if (playerRepository.existsByEmail(req.email())) {
            throw new ApiException("Email already registered", HttpStatus.CONFLICT);
        }

        Player player = new Player();
        player.setUsername(username);
        player.setEmail(req.email());
        player.setPassword(passwordEncoder.encode(req.password()));
        player.setDisplayName((req.displayName() == null || req.displayName().isBlank())
                ? username : req.displayName());
        player = playerRepository.save(player);

        // Default stats
        PlayerStats stats = new PlayerStats();
        stats.setPlayerId(player.getId());
        statsRepository.save(stats);

        // Default skills — seeded to reflect actual experience level.
        // Java 62%: 2 yrs professional Spring Boot 3.x, Kafka, Redis, Flyway, AOP, Prometheus.
        // English 27%: already communicates with US teammates daily in English.
        // Starting too low makes progress feel fake and demotivating.
        PlayerSkill javaSkill = new PlayerSkill(player.getId(), "Java + Spring Boot", 62);
        javaSkill.setSkillXp(620);
        javaSkill.recalculateLevelAndRank();

        PlayerSkill dsaSkill = new PlayerSkill(player.getId(), "DSA / LeetCode", 5);

        PlayerSkill angularSkill = new PlayerSkill(player.getId(), "Angular / JavaScript", 30);
        angularSkill.setSkillXp(300);
        angularSkill.recalculateLevelAndRank();

        PlayerSkill englishSkill = new PlayerSkill(player.getId(), "English Speaking", 27);
        englishSkill.setSkillXp(270);
        englishSkill.recalculateLevelAndRank();

        PlayerSkill sdSkill = new PlayerSkill(player.getId(), "System Design", 3);

        skillRepository.saveAll(List.of(javaSkill, dsaSkill, angularSkill, englishSkill, sdSkill));

        return buildResponse(player);
    }

    public AuthResponse login(LoginRequest req) {
        // Normalize username: trim whitespace + lowercase for case-insensitive login
        String username = req.username().trim().toLowerCase();
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(username, req.password()));
        Player player = playerRepository.findByUsernameIgnoreCase(username)
                .orElseThrow(() -> new ApiException("Player not found", HttpStatus.NOT_FOUND));
        return buildResponse(player);
    }

    public AuthResponse refresh(String refreshToken) {
        if (refreshToken == null || refreshToken.isBlank()) {
            throw new ApiException("Refresh token required", HttpStatus.UNAUTHORIZED);
        }
        if (!"refresh".equals(safeType(refreshToken))) {
            throw new ApiException("Invalid refresh token", HttpStatus.UNAUTHORIZED);
        }
        String username = jwtService.extractUsername(refreshToken);
        if (!jwtService.isTokenValid(refreshToken, username)) {
            throw new ApiException("Refresh token expired or invalid", HttpStatus.UNAUTHORIZED);
        }
        Player player = playerRepository.findByUsername(username)
                .orElseThrow(() -> new ApiException("Player not found", HttpStatus.NOT_FOUND));
        return buildResponse(player);
    }

    private String safeType(String token) {
        try { return jwtService.extractType(token); }
        catch (Exception e) { return null; }
    }

    private AuthResponse buildResponse(Player player) {
        String access = jwtService.generateAccessToken(player.getUsername());
        String refresh = jwtService.generateRefreshToken(player.getUsername());
        return new AuthResponse(access, refresh, playerService.toDto(player));
    }
}

