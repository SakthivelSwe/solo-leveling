package com.thesystem.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Entity
@Table(name = "course_progress")
@Getter
@Setter
public class CourseProgress {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "player_id", nullable = false)
    private Long playerId;

    @Column(name = "course_name", nullable = false)
    private String courseName;

    @Column(name = "total_topics")
    private int totalTopics = 100;

    @Column(name = "completed_topics")
    private int completedTopics = 0;

    @Column(name = "last_updated")
    private LocalDate lastUpdated = LocalDate.now();
}

