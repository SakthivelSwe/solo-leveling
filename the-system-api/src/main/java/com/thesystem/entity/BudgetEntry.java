package com.thesystem.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "budget_entries", uniqueConstraints = @UniqueConstraint(columnNames = {"player_id", "entry_month"}))
@Getter
@Setter
public class BudgetEntry {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "player_id", nullable = false)
    private Long playerId;

    @Column(name = "entry_month", nullable = false, length = 7)
    private String entryMonth; // '2025-01'

    private int salary = 40000;

    @Column(name = "pg_rent")
    private int pgRent = 0;

    @Column(name = "food_spend")
    private int foodSpend = 0;

    private int transport = 0;

    @Column(name = "online_orders")
    private int onlineOrders = 0;

    private int misc = 0;

    private int saved = 0;

    @Column(name = "sip_amount")
    private int sipAmount = 0;

    @Column(length = 1000)
    private String notes;
}

