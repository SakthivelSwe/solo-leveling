package com.thesystem.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDate;

@Data
@Entity
@Table(name = "expense_logs")
public class ExpenseLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "player_id", nullable = false)
    private Long playerId;

    @Column(name = "expense_date", nullable = false)
    private LocalDate expenseDate;

    @Column(nullable = false)
    private double amount;

    /** FOOD, TRANSPORT, SHOPPING, ONLINE_ORDER, ENTERTAINMENT, BILLS, HEALTH, EDUCATION, MISC */
    @Column(nullable = false, length = 30)
    private String category;

    @Column(length = 500)
    private String description;

    /** true = NEED (essential), false = WANT (discretionary) */
    @Column(name = "is_essential")
    private boolean isEssential;

    /** UPI, CASH, CARD, WALLET */
    @Column(name = "payment_method", length = 20)
    private String paymentMethod;

    @Column(name = "is_recurring")
    private boolean isRecurring;
}
