package com.thesystem.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Entity
@Table(name = "diet_entries")
@Getter
@Setter
public class DietEntry {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "player_id", nullable = false)
    private Long playerId;

    @Column(name = "food_name", nullable = false)
    private String foodName;

    private String category; // e.g. "Fruit", "Nut", "Seed", "Meat", "Veg"

    @Column(name = "quantity_grams")
    private int quantityGrams;

    @Column(name = "calories")
    private int calories;

    @Column(name = "protein_grams")
    private int proteinGrams;

    @Column(length = 500)
    private String vitamins;

    @Column(name = "consumed_date", nullable = false)
    private LocalDate consumedDate = LocalDate.now();
}
