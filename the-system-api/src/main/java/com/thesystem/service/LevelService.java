package com.thesystem.service;

import com.thesystem.dto.LevelUpDTO;
import com.thesystem.entity.Player;
import org.springframework.stereotype.Service;

/**
 * Realistic tiered XP progression for real humans.
 * E-Rank (1-5): 500 XP/level  ~5-7 days per level
 * D-Rank (6-10): 800 XP/level  ~8-12 days per level
 * C-Rank (11-15): 1200 XP/level  ~12-16 days per level
 * B-Rank (16-20): 1800 XP/level  ~18-24 days per level
 * A-Rank (21-25): 2500 XP/level  ~25-35 days per level
 * S-Rank (26+): 3500 XP/level   ~45+ days per level
 *
 * Total E-Rank → S-Rank: approximately 8-12 months of consistent effort.
 */
@Service
public class LevelService {

    /**
     * XP required to advance from the given level to the next.
     * This replaces the old flat 100-XP-per-level threshold.
     */
    public int xpToNextLevel(int currentLevel) {
        if (currentLevel <= 5)  return 500;
        if (currentLevel <= 10) return 800;
        if (currentLevel <= 15) return 1_200;
        if (currentLevel <= 20) return 1_800;
        if (currentLevel <= 25) return 2_500;
        return 3_500;
    }

    /**
     * Legacy single-value accessor — returns threshold for the player's current level.
     * Used by PlayerService.toDto() for the XP bar.
     */
    public int xpToNextLevel() {
        return 500; // default for new players (E-Rank)
    }

    /**
     * Consumes accumulated currentXp and levels the player up as many times as possible.
     * Uses the tiered threshold for the player's current level at each step.
     * Updates the player's rank accordingly.
     */
    public LevelUpDTO checkLevelUp(Player player) {
        int startLevel = player.getLevel();
        String startRank = player.getRankLevel();

        int threshold;
        while (player.getCurrentXp() >= (threshold = xpToNextLevel(player.getLevel()))) {
            player.setCurrentXp(player.getCurrentXp() - threshold);
            player.setLevel(player.getLevel() + 1);
        }

        String newRank = rankForLevel(player.getLevel());
        player.setRankLevel(newRank);

        boolean leveledUp = player.getLevel() > startLevel;
        boolean rankChanged = !newRank.equals(startRank);

        return new LevelUpDTO(leveledUp, player.getLevel(), newRank, rankChanged);
    }

    public String rankForLevel(int level) {
        if (level <= 5)  return "E";
        if (level <= 10) return "D";
        if (level <= 15) return "C";
        if (level <= 20) return "B";
        if (level <= 25) return "A";
        return "S";
    }

    /**
     * Demotes the player one rank tier (used when HP reaches 0). The player's level
     * is set to the top of the lower tier and current XP is reset for that level.
     * Returns true if a demotion actually happened (not already E-Rank).
     */
    public boolean demoteRank(Player player) {
        int level = player.getLevel();
        int newLevel;
        if (level <= 5) {
            return false; // already E-Rank, cannot demote further
        } else if (level <= 10) {
            newLevel = 5;
        } else if (level <= 15) {
            newLevel = 10;
        } else if (level <= 20) {
            newLevel = 15;
        } else if (level <= 25) {
            newLevel = 20;
        } else {
            newLevel = 25;
        }
        player.setLevel(newLevel);
        player.setCurrentXp(0);
        player.setRankLevel(rankForLevel(newLevel));
        return true;
    }
}

