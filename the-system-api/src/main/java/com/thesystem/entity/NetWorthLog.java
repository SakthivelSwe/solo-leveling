package com.thesystem.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDate;

@Data
@Entity
public class NetWorthLog {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private Long playerId;
    private LocalDate logDate;
    
    private Double totalAssets;
    private Double totalLiabilities;
    private Double netWorth;
    private Double cashRunwayMonths;
}
