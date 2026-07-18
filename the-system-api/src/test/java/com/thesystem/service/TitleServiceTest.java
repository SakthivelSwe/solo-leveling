package com.thesystem.service;

import com.thesystem.dto.TitleDTO;
import com.thesystem.entity.Player;
import com.thesystem.entity.PlayerStats;
import com.thesystem.repository.HabitCompletionRepository;
import com.thesystem.repository.HabitRepository;
import com.thesystem.repository.PlayerRepository;
import com.thesystem.repository.PlayerStatsRepository;
import com.thesystem.repository.QuestCompletionRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.when;

/**
 * Verifies the Title unlock rules against a mocked player state.
 */
@ExtendWith(MockitoExtension.class)
class TitleServiceTest {

    @Mock private PlayerRepository playerRepository;
    @Mock private PlayerStatsRepository statsRepository;
    @Mock private QuestCompletionRepository completionRepository;
    @Mock private AchievementService achievementService;
    @Mock private PlayerService playerService;
    @Mock private HabitRepository habitRepository;
    @Mock private HabitCompletionRepository habitCompletionRepository;

    @InjectMocks private TitleService titleService;

    @Test
    void getTitles_unlocksByRankStreakStatsAndQuests() {
        Player p = new Player();
        p.setRankLevel("C");        // rankIdx 2
        p.setLevel(12);
        p.setEquippedTitle("AWAKENED");

        PlayerStats s = new PlayerStats();
        s.setIntelligence(45);      // CODE_HUNTER unlocked
        s.setStrength(10);          // SHADOW_ATHLETE locked
        s.setDis(10);               // DISCIPLINE_LORD locked

        when(playerRepository.findById(1L)).thenReturn(Optional.of(p));
        when(statsRepository.findByPlayerId(1L)).thenReturn(Optional.of(s));
        when(playerService.longestStreak(1L)).thenReturn(8);        // IRON_WILLED unlocked, RELENTLESS locked
        when(completionRepository.countByPlayerId(1L)).thenReturn(30L); // GATE_BREAKER locked (<100)
        when(achievementService.getPlayerAchievements(1L)).thenReturn(List.of()); // DECORATED locked
        when(habitRepository.findByPlayerIdOrderByCreatedAtAsc(1L)).thenReturn(List.of());

        Map<String, TitleDTO> byKey = titleService.getTitles(1L).stream()
                .collect(Collectors.toMap(TitleDTO::key, t -> t));

        assertEquals(17, byKey.size());
        assertTrue(byKey.get("AWAKENED").unlocked());
        assertTrue(byKey.get("AWAKENED").equipped());
        assertTrue(byKey.get("IRON_WILLED").unlocked());
        assertFalse(byKey.get("RELENTLESS").unlocked());
        assertTrue(byKey.get("CODE_HUNTER").unlocked());
        assertFalse(byKey.get("SHADOW_ATHLETE").unlocked());
        assertFalse(byKey.get("DISCIPLINE_LORD").unlocked());
        assertFalse(byKey.get("GATE_BREAKER").unlocked());
        assertFalse(byKey.get("DECORATED").unlocked());
        assertTrue(byKey.get("DAWN_HUNTER").unlocked());   // C-Rank
        assertFalse(byKey.get("ELITE_HUNTER").unlocked()); // needs B-Rank
        assertFalse(byKey.get("SHADOW_MONARCH").unlocked());
        // No habits yet → all habit titles locked
        assertFalse(byKey.get("THE_CONSISTENT").unlocked());
        assertFalse(byKey.get("IRON_DISCIPLINE").unlocked());
        assertFalse(byKey.get("IDENTITY_SHIFTER").unlocked());
        assertFalse(byKey.get("KEYSTONE_BEARER").unlocked());
        assertFalse(byKey.get("ONE_PERCENT").unlocked());
        assertFalse(byKey.get("NEVER_MISS_TWICE").unlocked());
    }
}

