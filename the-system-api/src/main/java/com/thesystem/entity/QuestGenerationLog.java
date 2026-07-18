package com.thesystem.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.time.LocalDate;

@Entity
@Table(name = "quest_generation_logs", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"player_id", "generation_date"})
})
@Getter
@Setter
public class QuestGenerationLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "player_id", nullable = false)
    private Long playerId;

    @Column(name = "generation_date", nullable = false)
    private LocalDate generationDate;

    @Column(name = "generated_at", nullable = false)
    private java.time.LocalDateTime generatedAt = java.time.LocalDateTime.now();
    
    public QuestGenerationLog() {}
    
    public QuestGenerationLog(Long playerId, LocalDate generationDate) {
        this.playerId = playerId;
        this.generationDate = generationDate;
    }
}
