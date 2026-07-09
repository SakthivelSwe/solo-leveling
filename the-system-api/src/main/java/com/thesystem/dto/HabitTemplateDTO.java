package com.thesystem.dto;

/** Preset habit template offered during onboarding, grouped by identity tag. */
public record HabitTemplateDTO(
        String key,
        String name,
        String identityTag,
        String cue,
        String craving,
        String routine,
        String reward,
        String twoMinuteVersion,
        String cueTime,
        int difficulty,
        boolean keystone,
        String rankHint    // "E", "D" etc. suggesting which rank this suits
) {}

