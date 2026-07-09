package com.thesystem.dto;

import java.util.List;

public record EvaluationDTO(
        int questionIndex,
        String question,
        int score,
        String feedback,
        List<String> missedPoints,
        List<String> strongPoints
) {}

