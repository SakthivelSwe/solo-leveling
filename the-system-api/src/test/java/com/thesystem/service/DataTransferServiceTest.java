package com.thesystem.service;

import com.thesystem.dto.DataTransferRequest;
import com.thesystem.dto.DataTransferResponse;
import com.thesystem.entity.*;
import com.thesystem.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class DataTransferServiceTest {

    @Mock private PlayerRepository playerRepo;
    @Mock private HabitRepository habitRepo;
    @Mock private HabitCompletionRepository habitCompletionRepo;
    @Mock private QuestRepository questRepo;
    @Mock private QuestCompletionRepository questCompletionRepo;
    @Mock private DailyMissionRepository dailyMissionRepo;
    @Mock private PlayerStatsRepository statsRepo;
    @Mock private PlayerConfigRepository configRepo;
    @Mock private PlayerSkillRepository skillRepo;
    @Mock private InventoryItemRepository inventoryRepo;
    @Mock private ShadowRepository shadowRepo;
    @Mock private AchievementRepository achievementRepo;
    @Mock private ExpenseLogRepository expenseRepo;
    @Mock private IncomeLogRepository incomeRepo;
    @Mock private WorkoutEntryRepository workoutRepo;
    @Mock private LeetcodeLogRepository leetcodeRepo;

    @InjectMocks
    private DataTransferService dataTransferService;

    private Player sourcePlayer;
    private Player targetPlayer;

    @BeforeEach
    void setUp() {
        sourcePlayer = new Player();
        sourcePlayer.setId(1L);
        sourcePlayer.setEmail("source@gmail.com");

        targetPlayer = new Player();
        targetPlayer.setId(2L);
        targetPlayer.setEmail("source@gmail.com");
    }

    @Test
    void testTransferData_excludesNoFapAndTestosteroneQuests() {
        // Arrange
        DataTransferRequest req = new DataTransferRequest();
        req.setTargetEmail("source@gmail.com");
        req.setModules(Arrays.asList("QUESTS"));
        req.setTransferMode("COPY");

        when(playerRepo.findById(1L)).thenReturn(Optional.of(sourcePlayer));
        when(playerRepo.findByEmail("source@gmail.com")).thenReturn(Optional.of(targetPlayer));

        Quest q1 = new Quest();
        q1.setId(10L);
        q1.setCategory(QuestCategory.DAILY);
        q1.setQuestKey("daily_quest");

        Quest q2 = new Quest();
        q2.setId(11L);
        q2.setCategory(QuestCategory.DISCIPLINE);
        q2.setQuestKey("nofap_quest");

        Quest q3 = new Quest();
        q3.setId(12L);
        q3.setCategory(QuestCategory.TESTOSTERONE);
        q3.setQuestKey("testosterone_quest");

        when(questRepo.findByOwnerIdAndActiveTrueOrderByIdDesc(1L)).thenReturn(Arrays.asList(q1, q2, q3));

        // Act
        DataTransferResponse response = dataTransferService.transferData(1L, req);

        // Assert
        assertTrue(response.isSuccess());
        assertEquals(2, response.getTransferStats().get("Quests"));

        ArgumentCaptor<Quest> questCaptor = ArgumentCaptor.forClass(Quest.class);
        verify(questRepo, times(2)).save(questCaptor.capture());

        Quest savedQuest = questCaptor.getValue();
        assertEquals(QuestCategory.DISCIPLINE, savedQuest.getCategory());
        assertEquals(2L, savedQuest.getOwnerId());
        assertTrue(savedQuest.getQuestKey().startsWith("nofap_quest_clone_"));
    }
}
