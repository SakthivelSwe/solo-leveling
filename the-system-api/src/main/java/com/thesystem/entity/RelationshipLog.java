package com.thesystem.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Entity
@Table(name = "relationship_logs", uniqueConstraints = @UniqueConstraint(columnNames = {"player_id", "log_date"}))
@Getter
@Setter
public class RelationshipLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "player_id", nullable = false)
    private Long playerId;

    @Column(name = "log_date", nullable = false)
    private LocalDate logDate = LocalDate.now();

    @Column(name = "gf_called")
    private boolean gfCalled = false;

    @Column(name = "call_duration_min")
    private int callDurationMin = 0;

    @Column(name = "call_quality")
    private Integer callQuality; // 1-5

    @Column(name = "family_contact")
    private boolean familyContact = false;

    @Column(name = "friend_message")
    private boolean friendMessage = false;

    @Column(name = "friend_name")
    private String friendName;

    @Column(length = 500)
    private String notes;
}

