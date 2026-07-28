package com.thesystem.entity;

import jakarta.persistence.*;
import lombok.Data;

@Data
@Entity
public class PlayerConfig {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private Long playerId;
    
    // Health Targets
    private Integer targetProteinGrams = 150;
    private Integer targetCalories = 2200;
    private Integer targetWaterGlasses = 8;
    private Double targetSleepHours = 8.0;
    
    // Wealth Config
    private Double monthlyBaselineExpenses = 50000.0;
}
