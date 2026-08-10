package com.thesystem.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * SEC-6 FIX: Strengthened password validation.
 * - Min 8 characters (was 4)
 * - Must contain at least one letter and one digit
 * - Username restricted to alphanumeric + underscores
 */
public record RegisterRequest(
        @NotBlank @Size(min = 3, max = 50)
        @Pattern(regexp = "^[a-zA-Z0-9_]+$", message = "Username may only contain letters, numbers, and underscores")
        String username,

        @NotBlank @Email String email,

        @NotBlank @Size(min = 8, message = "Password must be at least 8 characters")
        @Pattern(regexp = "^(?=.*[a-zA-Z])(?=.*\\d).+$", message = "Password must contain at least one letter and one digit")
        String password,

        String displayName
) {}
