package com.thesystem.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "job_applications")
@Getter
@Setter
public class JobApplication {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "player_id", nullable = false)
    private Long playerId;

    @Column(nullable = false)
    private String company;

    @Column(nullable = false)
    private String role;

    @Column(name = "ctc_offered")
    private Integer ctcOffered;

    @Column(length = 20)
    private String status = "APPLIED"; // APPLIED, SCREENING, INTERVIEW, OFFER, REJECTED, GHOSTED

    @Column(name = "applied_date")
    private LocalDate appliedDate = LocalDate.now();

    @Column(length = 2000)
    private String notes;

    @Column(name = "job_url", length = 500)
    private String jobUrl;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt = LocalDateTime.now();
}

