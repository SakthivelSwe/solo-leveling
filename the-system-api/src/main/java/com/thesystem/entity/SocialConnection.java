package com.thesystem.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDate;

@Data
@Entity
public class SocialConnection {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long playerId;
    private String name;
    private String relationType; // FAMILY, FRIEND, MENTOR, PARTNER

    @Column(name = "target_contact_frequency_days")
    private Integer targetContactFrequencyDays;

    @Column(name = "last_contact_date")
    private LocalDate lastContactDate;

    @Column(name = "health_score")
    private Integer healthScore; // 0-100

    /**
     * Phase 2C: Birthday (only month + day used for reminders, year used to compute age).
     * Stored as full date; year is optional (set to 1900 if unknown).
     */
    @Column(name = "birthday")
    private LocalDate birthday;

    /**
     * Phase 2C: Relationship anniversary date (e.g. friendship start, partner anniversary).
     */
    @Column(name = "anniversary")
    private LocalDate anniversary;
}
