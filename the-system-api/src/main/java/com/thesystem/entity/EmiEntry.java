package com.thesystem.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDate;

@Data
@Entity
@Table(name = "emi_entries")
public class EmiEntry {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "player_id", nullable = false)
    private Long playerId;

    @Column(name = "loan_name", nullable = false, length = 100)
    private String loanName;

    @Column(name = "principal_amount", nullable = false)
    private double principalAmount;

    /** Annual interest rate (%) */
    @Column(name = "interest_rate")
    private double interestRate;

    @Column(name = "tenure_months")
    private int tenureMonths;

    /** Monthly EMI amount */
    @Column(name = "emi_amount", nullable = false)
    private double emiAmount;

    @Column(name = "start_date")
    private LocalDate startDate;

    /** Running total of all payments made so far */
    @Column(name = "total_paid")
    private double totalPaid = 0;

    @Column(name = "remaining_amount")
    private double remainingAmount;

    @Column(name = "next_due_date")
    private LocalDate nextDueDate;

    /** ACTIVE, COMPLETED, DEFAULTED */
    @Column(length = 20)
    private String status = "ACTIVE";

    @Column(length = 500)
    private String notes;
}
