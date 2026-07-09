package com.thesystem.config;

import com.thesystem.security.JwtAuthFilter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.header.writers.ReferrerPolicyHeaderWriter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.ArrayList;
import java.util.List;

@Configuration
public class SecurityConfig {

    private final JwtAuthFilter jwtAuthFilter;

    /** Set to true only in dev (application-local.yml) to expose H2 console + Swagger. */
    @Value("${thesystem.dev-tools-enabled:false}")
    private boolean devToolsEnabled;

    public SecurityConfig(JwtAuthFilter jwtAuthFilter) {
        this.jwtAuthFilter = jwtAuthFilter;
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        // Only /api/auth/** is public by default. H2 console + Swagger are ONLY exposed
        // when thesystem.dev-tools-enabled=true (dev-only) — never in a shipped build.
        List<String> publicPaths = new ArrayList<>();
        publicPaths.add("/api/auth/**");
        if (devToolsEnabled) {
            publicPaths.add("/h2-console/**");
            publicPaths.add("/swagger-ui/**");
            publicPaths.add("/swagger-ui.html");
            publicPaths.add("/v3/api-docs/**");
        }
        String[] publicMatchers = publicPaths.toArray(new String[0]);

        http
            .csrf(AbstractHttpConfigurer::disable)
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .headers(headers -> {
                // H2 console needs frame; otherwise deny to block clickjacking.
                if (devToolsEnabled) {
                    headers.frameOptions(frame -> frame.sameOrigin());
                } else {
                    headers.frameOptions(frame -> frame.deny());
                }
                headers
                    .contentTypeOptions(opts -> {}) // X-Content-Type-Options: nosniff
                    .referrerPolicy(r -> r.policy(
                            ReferrerPolicyHeaderWriter.ReferrerPolicy.NO_REFERRER))
                    .httpStrictTransportSecurity(hsts -> hsts
                            .includeSubDomains(true)
                            .maxAgeInSeconds(31536000));
            })
            .authorizeHttpRequests(auth -> auth
                .requestMatchers(publicMatchers).permitAll()
                .anyRequest().authenticated()
            )
            .sessionManagement(session ->
                    session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        // Angular dev server + the Capacitor Android WebView (origin http://localhost).
        config.setAllowedOriginPatterns(List.of(
                "http://localhost:*",
                "http://localhost",
                "https://localhost",
                "capacitor://localhost",
                "http://10.0.2.2:*"
        ));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }
}

