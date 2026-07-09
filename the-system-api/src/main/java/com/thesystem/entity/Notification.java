package com.thesystem.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * In-app System notification (Notification OS). Since push/Redis are out of scope,
 * scheduled System alerts are persisted and surfaced in the UI notification centre.
 */
@Entity
@Table(name = "notifications")
@Getter
@Setter
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "player_id", nullable = false)
    private Long playerId;

    @Column(nullable = false)
    private String title;

    @Column(length = 500, nullable = false)
    private String message;

    @Column(length = 40)
    private String type = "SYSTEM"; // SYSTEM, ACHIEVEMENT, RANK_DROP, REMINDER

    @Column(name = "is_read")
    private boolean read = false;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();

    public Notification() {}

    public Notification(Long playerId, String title, String message, String type) {
        this.playerId = playerId;
        this.title = title;
        this.message = message;
        this.type = type;
    }
}

