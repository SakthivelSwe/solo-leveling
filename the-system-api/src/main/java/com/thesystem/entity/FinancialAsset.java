package com.thesystem.entity;

import jakarta.persistence.*;
@Entity
@Table(name = "financial_assets")


public class FinancialAsset {
    public FinancialAsset() {}


    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "player_id")
    private Long playerId;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String type; // "GUILD", "BUSINESS", "REAL_ESTATE"

    @Column(name = "daily_gold_yield")
    private int dailyGoldYield;

    @Transient
    public int getYield() { return dailyGoldYield; }
    
    @Transient
    public void setYield(int yield) { this.dailyGoldYield = yield; }

    @Column(nullable = false)
    private int shares = 1;

    @Column(nullable = false)
    private int cost = 0;

    private int level = 1;
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
    public int getLevel() { return level; }
    public void setLevel(int level) { this.level = level; }
    public int getShares() { return shares; }
    public void setShares(int shares) { this.shares = shares; }
    public int getCost() { return cost; }
    public void setCost(int cost) { this.cost = cost; }

}