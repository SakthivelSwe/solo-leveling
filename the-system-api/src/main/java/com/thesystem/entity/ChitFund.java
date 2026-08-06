package com.thesystem.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDate;

/**
 * Chit Fund (Chit / Cheetu) — Tamil traditional rotating savings scheme.
 * A group of N members each contribute monthlyContribution every month.
 * Total chit = totalAmount = N × monthlyContribution.
 * Each month one member receives the prize (total - auction discount).
 * Jewel chit = prize is in gold grams instead of cash.
 */
@Data
@Entity
@Table(name = "chit_funds")
public class ChitFund {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "player_id", nullable = false)
    private Long playerId;

    /** e.g. "1 Lakh Chit - Shriram" */
    @Column(name = "chit_name", nullable = false, length = 200)
    private String chitName;

    /** Total chit value e.g. 100000 */
    @Column(name = "total_amount", nullable = false)
    private double totalAmount;

    /** Monthly installment each member pays e.g. 5000 */
    @Column(name = "monthly_contribution", nullable = false)
    private double monthlyContribution;

    /** Total number of months = totalAmount / monthlyContribution */
    @Column(name = "total_months", nullable = false)
    private int totalMonths;

    /** Number of members in the chit group */
    @Column(name = "group_members")
    private int groupMembers;

    @Column(name = "start_date")
    private LocalDate startDate;

    /** How many months have been paid so far */
    @Column(name = "current_month")
    private int currentMonth = 0;

    /** totalPaid = currentMonth * monthlyContribution */
    @Column(name = "total_paid")
    private double totalPaid = 0;

    /** Has this member received the prize (thallupadi / won the auction)? */
    @Column(name = "prize_received")
    private boolean prizeReceived = false;

    /** Which month the prize was received (1-based) */
    @Column(name = "prize_received_month")
    private Integer prizeReceivedMonth;

    /** Actual cash prize received after auction discount */
    @Column(name = "prize_amount")
    private Double prizeAmount;

    /** Amount discounted at auction (bid amount) */
    @Column(name = "discount_amount")
    private Double discountAmount;

    /**
     * REGULAR = cash prize
     * JEWEL   = gold grams prize (jewel chit)
     */
    @Column(name = "chit_type", length = 20)
    private String chitType = "REGULAR";

    /** For jewel chit: how many grams of gold the prize is worth */
    @Column(name = "jewel_grams")
    private Double jewelGrams;

    /**
     * ACTIVE, COMPLETED, WITHDRAWN
     */
    @Column(name = "status", length = 20)
    private String status = "ACTIVE";

    @Column(name = "chit_company", length = 200)
    private String chitCompany;

    @Column(length = 500)
    private String notes;

    /** Date of last installment payment */
    @Column(name = "last_payment_date")
    private LocalDate lastPaymentDate;
}
