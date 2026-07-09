package com.thesystem.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Entity
@Table(name = "interview_rounds")
@Getter
@Setter
public class InterviewRound {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "application_id", nullable = false)
    private Long applicationId;

    @Column(name = "round_number")
    private int roundNumber;

    @Column(name = "round_type", length = 20)
    private String roundType; // HR, TECHNICAL, SYSTEM_DESIGN, ASSIGNMENT, FINAL

    @Column(name = "date_scheduled")
    private LocalDate dateScheduled;

    @Column(length = 20)
    private String result = "PENDING"; // PENDING, PASSED, FAILED, NO_SHOW

    @Column(length = 2000)
    private String notes;

    @Column(length = 2000)
    private String feedback;
}

