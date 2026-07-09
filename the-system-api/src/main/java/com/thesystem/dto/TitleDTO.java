package com.thesystem.dto;

public record TitleDTO(
        String key,
        String name,
        String description,
        boolean unlocked,
        boolean equipped
) {}

