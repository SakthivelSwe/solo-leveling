package com.thesystem.dto;

import java.time.LocalDateTime;

public record FlashcardDTO(
    Long id,
    String frontText,
    String backText,
    String topic,
    int intervalDays,
    int easeFactor,
    LocalDateTime nextReviewDate
) {}
