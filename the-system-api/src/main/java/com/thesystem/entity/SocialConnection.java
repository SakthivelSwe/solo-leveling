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
    private Integer targetContactFrequencyDays;
    private LocalDate lastContactDate;
    private Integer healthScore; // 0-100
}
