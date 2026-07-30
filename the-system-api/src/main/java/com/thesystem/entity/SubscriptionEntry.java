package com.thesystem.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDate;

@Data
@Entity
@Table(name = "subscription_entries")
public class SubscriptionEntry {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "player_id", nullable = false)
    private Long playerId;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(nullable = false)
    private double amount;

    /** MONTHLY, YEARLY, QUARTERLY */
    @Column(nullable = false, length = 20)
    private String frequency;

    /** ENTERTAINMENT, FITNESS, PRODUCTIVITY, EDUCATION, OTHER */
    @Column(length = 30)
    private String category;

    @Column(name = "is_active")
    private boolean isActive = true;

    @Column(name = "next_billing_date")
    private LocalDate nextBillingDate;
}
