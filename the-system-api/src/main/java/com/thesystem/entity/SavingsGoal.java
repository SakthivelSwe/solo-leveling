package com.thesystem.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Entity
@Table(name = "savings_goals")
@Getter
@Setter
public class SavingsGoal {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "player_id", nullable = false)
    private Long playerId;

    @Column(name = "goal_name", nullable = false)
    private String goalName;

    @Column(name = "target_amount", nullable = false)
    private int target;

    @Column(name = "current_amount")
    private int current = 0;

    private LocalDate deadline;

    private boolean achieved = false;

    public SavingsGoal() {}

    public SavingsGoal(Long playerId, String goalName, int target, LocalDate deadline) {
        this.playerId = playerId;
        this.goalName = goalName;
        this.target = target;
        this.deadline = deadline;
    }
}

