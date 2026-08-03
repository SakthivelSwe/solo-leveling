package com.thesystem.entity;

import jakarta.persistence.*;

/**
 * Represents a financial asset purchased by a player from System Gold.
 * Tracks shares, cost per share, and daily gold yield per share.
 */
@Entity
@Table(name = "financial_assets")
public class FinancialAsset {

    public FinancialAsset() {}

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "player_id", nullable = false)
    private Long playerId;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String type; // "INDEX_FUND", "STOCK", "BOND", "REAL_ESTATE", "CRYPTO"

    @Column(name = "daily_gold_yield", nullable = false)
    private int dailyGoldYield = 0;

    @Column(nullable = false)
    private int shares = 1;

    @Column(nullable = false)
    private int cost = 0;

    @Column(nullable = false)
    private int level = 1;

    // ── Getters & Setters ─────────────────────────────────────

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getPlayerId() { return playerId; }
    public void setPlayerId(Long playerId) { this.playerId = playerId; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public int getDailyGoldYield() { return dailyGoldYield; }
    public void setDailyGoldYield(int dailyGoldYield) { this.dailyGoldYield = dailyGoldYield; }

    /**
     * Alias for dailyGoldYield — used by Jackson to serialize as "yield" in JSON response,
     * which matches the frontend FinancialAsset interface.
     */
    public int getYield() { return dailyGoldYield; }
    public void setYield(int yield) { this.dailyGoldYield = yield; }

    public int getShares() { return shares; }
    public void setShares(int shares) { this.shares = shares; }

    public int getCost() { return cost; }
    public void setCost(int cost) { this.cost = cost; }

    public int getLevel() { return level; }
    public void setLevel(int level) { this.level = level; }
}