package com.thesystem.dto;

import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * SEC-1 FIX: Added validation constraints to prevent injection and enforce format.
 * Username: 3-50 chars, alphanumeric + underscores only.
 * Display name: max 100 chars.
 */
public record UpdateProfileRequest(
        @Size(max = 100, message = "Display name must be 100 characters or less")
        String displayName,

        @Size(min = 3, max = 50, message = "Username must be 3-50 characters")
        @Pattern(regexp = "^[a-zA-Z0-9_]+$", message = "Username may only contain letters, numbers, and underscores")
        String username
) {}
