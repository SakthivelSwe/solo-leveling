package com.thesystem.service;

import com.thesystem.dto.LevelUpDTO;
import com.thesystem.entity.Player;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class LevelService {

    @Value("${thesystem.game.xp-threshold:100}")
    private int xpThreshold;

    /**
     * XP required to reach the next level. Fixed threshold per level (configurable).
     */
    public int xpToNextLevel() {
        return xpThreshold;
    }

    /**
     * Consumes accumulated currentXp and levels the player up as many times as possible.
     * Updates the player's rank accordingly.
     */
    public LevelUpDTO checkLevelUp(Player player) {
        int startLevel = player.getLevel();
        String startRank = player.getRankLevel();

        while (player.getCurrentXp() >= xpThreshold) {
            player.setCurrentXp(player.getCurrentXp() - xpThreshold);
            player.setLevel(player.getLevel() + 1);
        }

        String newRank = rankForLevel(player.getLevel());
        player.setRankLevel(newRank);

        boolean leveledUp = player.getLevel() > startLevel;
        boolean rankChanged = !newRank.equals(startRank);

        return new LevelUpDTO(leveledUp, player.getLevel(), newRank, rankChanged);
    }

    public String rankForLevel(int level) {
        if (level <= 5) return "E";
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

