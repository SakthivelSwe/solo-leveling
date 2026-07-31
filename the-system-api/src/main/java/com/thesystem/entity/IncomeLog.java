package com.thesystem.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDate;

@Data
@Entity
@Table(name = "income_logs")
public class IncomeLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "player_id", nullable = false)
    private Long playerId;

    @Column(name = "income_date", nullable = false)
    private LocalDate incomeDate;

    @Column(nullable = false)
    private double amount;

    /** SALARY, BUSINESS, INVESTMENT, GIFT, OTHER */
    @Column(nullable = false, length = 30)
    private String category;

    @Column(length = 500)
    private String description;

    /** UPI, CASH, BANK_TRANSFER, CHEQUE */
    @Column(name = "payment_method", length = 30)
    private String paymentMethod;
}
