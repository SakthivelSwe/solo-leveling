package com.thesystem.dto;

import java.time.LocalDateTime;

public record DevMasteryProgressDTO(
        String topicId,
        String topicTitle,
        String pathSlug,
        Integer xpEarned,
        LocalDateTime timestamp
) {
}
