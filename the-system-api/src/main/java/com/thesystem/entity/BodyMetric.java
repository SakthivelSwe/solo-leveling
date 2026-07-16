package com.thesystem.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

/**
 * Phase 2 — Body Metrics: one weigh-in per day (weight + optional body-fat %).
 * Weight is stored canonically in kilograms; the UI converts to lb for display.
 */
@Entity
@Table(name = "body_metrics", uniqueConstraints = @UniqueConstraint(columnNames = {"player_id", "log_date"}))
@Getter
@Setter
public class BodyMetric {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "player_id", nullable = false)
    private Long playerId;

    @Column(name = "log_date", nullable = false)
    private LocalDate logDate = LocalDate.now();

    /** Body weight in kilograms (canonical unit). */
    @Column(name = "weight_kg")
    private Double weightKg;

    /** Body-fat percentage (0–70), optional. */
    @Column(name = "body_fat_pct")
    private Double bodyFatPct;

    @Column(length = 300)
    private String note;
}

