package com.thesystem.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Entity
@Table(name = "leetcode_log")
@Getter
@Setter
public class LeetcodeLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "player_id", nullable = false)
    private Long playerId;

    @Column(name = "problem_name", nullable = false)
    private String problemName;

    @Column(name = "problem_url", length = 500)
    private String problemUrl;

    @Column(length = 10)
    private String difficulty = "EASY"; // EASY, MEDIUM, HARD

    @Column(name = "solved_date")
    private LocalDate solvedDate = LocalDate.now();

    @Column(name = "time_taken_min")
    private Integer timeTakenMin;

    @Column(name = "solved_without_ai")
    private boolean solvedWithoutAi = false;

    @Column(length = 50)
    private String language = "Java";

    @Column(length = 1000)
    private String notes;

    @Column(length = 100)
    private String topic; // Arrays, Trees, DP, etc.
}

