package com.thesystem.dto;

public record AuthResponse(
        String accessToken,
        String refreshToken,
        PlayerDTO player
) {}

