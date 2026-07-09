package com.thesystem.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Entity
@Table(name = "vocabulary_log")
@Getter
@Setter
public class VocabularyLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "player_id", nullable = false)
    private Long playerId;

    @Column(nullable = false, length = 100)
    private String word;

    @Column(nullable = false, length = 1000)
    private String meaning;

    @Column(length = 1000)
    private String example;

    @Column(name = "learned_date", nullable = false)
    private LocalDate learnedDate = LocalDate.now();
}

