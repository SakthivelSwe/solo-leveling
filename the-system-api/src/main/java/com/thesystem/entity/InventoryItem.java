package com.thesystem.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * A virtual item unlocked when the Hunter reaches a milestone.
 * Equipped items provide stat/XP bonuses (e.g., Mechanical Keyboard +10 Coding XP).
 *
 * Catalog (seeded at milestone check time):
 *  PROTEIN_POWDER      — 30-day gym streak    → +5 STR
 *  GYM_GLOVES          — 50 gym sessions      → +2 Motivation
 *  MECHANICAL_KEYBOARD — 100 LeetCode solved  → +10 Focus XP
 *  HEADPHONES          — 7-day deep work      → +15 Focus XP
 *  TECH_BOOK           — 10 tech articles     → +3 INT
 *  DSA_NOTEBOOK        — 30-day LC streak     → +8 INT
 *  COLD_SHOWER_BADGE   — 21-day cold shower   → +5 HOR
 */
@Entity
@Table(name = "inventory_items")
@Getter
@Setter
public class InventoryItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "player_id", nullable = false)
    private Long playerId;

    /** Unique catalog key (e.g., "MECHANICAL_KEYBOARD"). */
    @Column(name = "item_key", nullable = false, length = 50)
    private String itemKey;

    @Column(name = "item_name", nullable = false, length = 100)
    private String itemName;

    /** Emoji icon for the item (displayed in the inventory UI). */
    @Column(name = "item_emoji", length = 10)
    private String itemEmoji;

    /** EQUIPMENT, CONSUMABLE, or COLLECTIBLE. */
    @Column(name = "item_type", length = 20)
    private String itemType = "EQUIPMENT";

    /** Stat key the bonus applies to (STR, INT, VIT, AGI, PER, HOR, FOCUS, CODING). */
    @Column(name = "bonus_type", length = 20)
    private String bonusType;

    /** Numeric bonus value applied when the item is equipped. */
    @Column(name = "bonus_value", nullable = false)
    private int bonusValue = 0;

    /** Whether this item is currently active/equipped. */
    @Column(nullable = false)
    private boolean equipped = false;

    @Column(name = "unlocked_at")
    private LocalDateTime unlockedAt = LocalDateTime.now();

    /** The milestone key that unlocked this item (e.g., "30_DAY_GYM_STREAK"). */
    @Column(name = "unlocked_by_milestone", length = 80)
    private String unlockedByMilestone;
}
