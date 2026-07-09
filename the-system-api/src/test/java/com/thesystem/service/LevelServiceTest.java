package com.thesystem.service;

import com.thesystem.dto.LevelUpDTO;
import com.thesystem.entity.Player;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Pure unit tests for the core progression math — XP thresholds, rank tiers,
 * level-ups and rank demotion. No Spring context required.
 */
class LevelServiceTest {

    private LevelService levelService;

    @BeforeEach
    void setUp() {
        levelService = new LevelService();
        // @Value field isn't injected in a plain unit test — set it manually.
        ReflectionTestUtils.setField(levelService, "xpThreshold", 100);
    }

    @Test
    void rankForLevel_mapsTiersCorrectly() {
        assertEquals("E", levelService.rankForLevel(1));
        assertEquals("E", levelService.rankForLevel(5));
        assertEquals("D", levelService.rankForLevel(6));
        assertEquals("D", levelService.rankForLevel(10));
        assertEquals("C", levelService.rankForLevel(11));
        assertEquals("C", levelService.rankForLevel(15));
        assertEquals("B", levelService.rankForLevel(16));
        assertEquals("B", levelService.rankForLevel(20));
        assertEquals("A", levelService.rankForLevel(21));
        assertEquals("A", levelService.rankForLevel(25));
        assertEquals("S", levelService.rankForLevel(26));
        assertEquals("S", levelService.rankForLevel(100));
    }

    @Test
    void checkLevelUp_consumesXpAndRaisesMultipleLevels() {
        Player p = newPlayer(1, "E", 250);

        LevelUpDTO result = levelService.checkLevelUp(p);

        assertTrue(result.leveledUp());
        assertEquals(3, p.getLevel());          // 250 XP → +2 levels
        assertEquals(50, p.getCurrentXp());      // 50 XP left over
        assertEquals("E", p.getRankLevel());
        assertFalse(result.rankChanged());
    }

    @Test
    void checkLevelUp_flagsRankChangeAtTierBoundary() {
        Player p = newPlayer(5, "E", 100);        // level 5 + 100 XP → level 6 (D-Rank)

        LevelUpDTO result = levelService.checkLevelUp(p);

        assertTrue(result.leveledUp());
        assertEquals(6, p.getLevel());
        assertEquals("D", p.getRankLevel());
        assertTrue(result.rankChanged());
    }

    @Test
    void checkLevelUp_noXp_doesNothing() {
        Player p = newPlayer(4, "E", 40);

        LevelUpDTO result = levelService.checkLevelUp(p);

        assertFalse(result.leveledUp());
        assertEquals(4, p.getLevel());
        assertEquals(40, p.getCurrentXp());
        assertFalse(result.rankChanged());
    }

    @Test
    void demoteRank_dropsToPreviousTierAndResetsXp() {
        Player p = newPlayer(6, "D", 80);         // D-Rank → demote to E-Rank (level 5)

        boolean demoted = levelService.demoteRank(p);

        assertTrue(demoted);
        assertEquals(5, p.getLevel());
        assertEquals("E", p.getRankLevel());
        assertEquals(0, p.getCurrentXp());
    }

    @Test
    void demoteRank_atLowestRank_returnsFalse() {
        Player p = newPlayer(3, "E", 0);

        assertFalse(levelService.demoteRank(p));
        assertEquals(3, p.getLevel());            // unchanged
        assertEquals("E", p.getRankLevel());
    }

    private Player newPlayer(int level, String rank, int currentXp) {
        Player p = new Player();
        p.setLevel(level);
        p.setRankLevel(rank);
        p.setCurrentXp(currentXp);
        return p;
    }
}

