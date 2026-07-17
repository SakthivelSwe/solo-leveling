package com.thesystem.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "dev_mastery_progress")
@Getter
@Setter
public class DevMasteryProgress {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "player_id", nullable = false)
    private Long playerId;

    @Column(name = "topic_id", nullable = false)
    private String topicId;

    @Column(name = "topic_title", nullable = false)
    private String topicTitle;

    @Column(name = "path_slug", nullable = false)
    private String pathSlug;

    @Column(name = "xp_earned")
    private Integer xpEarned;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;
}
