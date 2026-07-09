package com.thesystem.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

/**
 * Evidence against self-doubt. Auto-generated on skill wins and shown when mood is low.
 */
@Entity
@Table(name = "self_doubt_evidence")
@Getter
@Setter
public class SelfDoubtEvidence {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "player_id", nullable = false)
    private Long playerId;

    @Column(name = "entry_date", nullable = false)
    private LocalDate entryDate = LocalDate.now();

    @Column(nullable = false, length = 1000)
    private String evidence;

    @Column(length = 20)
    private String category; // SKILL, HEALTH, CHARACTER, SOCIAL, CAREER

    public SelfDoubtEvidence() {}

    public SelfDoubtEvidence(Long playerId, String evidence, String category) {
        this.playerId = playerId;
        this.evidence = evidence;
        this.category = category;
    }
}

