package com.thesystem.config;

import com.thesystem.entity.Quest;
import com.thesystem.entity.QuestCategory;
import com.thesystem.repository.QuestRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Seeds THE SYSTEM's 16 default quests on startup if the quests table is empty.
 */
@Component
public class DataSeeder implements CommandLineRunner {

    private final QuestRepository questRepository;

    public DataSeeder(QuestRepository questRepository) {
        this.questRepository = questRepository;
    }

    @Override
    public void run(String... args) {
        if (questRepository.count() > 0) return;

        List<Quest> quests = List.of(
            // DAILY
            new Quest("BREAKFAST", "[DAILY] Eat breakfast before 9:30 AM", QuestCategory.DAILY, 50, "{\"VIT\":2}", null),
            new Quest("WATER", "[DAILY] Drink 2 bottles of water", QuestCategory.DAILY, 50, "{\"VIT\":2}", null),
            new Quest("EXERCISE", "[DAILY] 20-min exercise or walk outside", QuestCategory.DAILY, 80, "{\"STR\":4,\"HOR\":5}", null),
            new Quest("SLEEP", "[DAILY] Slept before 11:30 PM last night", QuestCategory.DAILY, 50, "{\"VIT\":3,\"HOR\":6}", null),
            new Quest("NO_REELS", "[DAILY] No reels or screens after 11 PM", QuestCategory.DAILY, 40, "{\"AGI\":1,\"INT\":1}", null),

            // SKILL
            new Quest("CODE_NO_AI", "[SKILL] 1 hour coding WITHOUT AI or Copilot", QuestCategory.SKILL, 150,
                    "{\"INT\":5,\"PER\":3}", "{\"Java + Spring Boot\":3,\"Angular / JavaScript\":2}"),
            new Quest("LEETCODE", "[SKILL] Solve 1 LeetCode problem", QuestCategory.SKILL, 120,
                    "{\"INT\":4,\"PER\":4}", "{\"DSA / LeetCode\":4}"),
            new Quest("ENGLISH", "[SKILL] 20 min English speaking practice", QuestCategory.SKILL, 80,
                    "{\"AGI\":6}", "{\"English Speaking\":5}"),
            new Quest("TECH_LEARN", "[SKILL] Tech learning session — tutorial or docs", QuestCategory.SKILL, 70,
                    "{\"INT\":3}", "{\"Java + Spring Boot\":1,\"Angular / JavaScript\":1}"),
            new Quest("SELF_DEBUG", "[SKILL] Debug something yourself (no AI first)", QuestCategory.SKILL, 100,
                    "{\"PER\":5,\"INT\":2}", "{\"DSA / LeetCode\":2}"),

            // TESTOSTERONE
            new Quest("MORNING_SUN", "[TESTOSTERONE] 20 min morning sunlight before 10 AM", QuestCategory.TESTOSTERONE, 70, "{\"STR\":2,\"VIT\":3,\"HOR\":4}", null),
            new Quest("COLD_SHOWER", "[TESTOSTERONE] Cold water last 30 sec of shower", QuestCategory.TESTOSTERONE, 60, "{\"STR\":3,\"VIT\":2,\"HOR\":3}", null),
            new Quest("ZINC_MEAL", "[TESTOSTERONE] Ate eggs / nuts / dhal today", QuestCategory.TESTOSTERONE, 50, "{\"VIT\":3,\"STR\":1,\"HOR\":3}", null),
            new Quest("NO_SODA", "[TESTOSTERONE] No soft drinks or junk today", QuestCategory.TESTOSTERONE, 50, "{\"VIT\":4,\"HOR\":5}", null),
            new Quest("BREATHING", "[TESTOSTERONE] 5 min deep breathing — cortisol reset", QuestCategory.TESTOSTERONE, 40, "{\"VIT\":2,\"AGI\":1,\"HOR\":2}", null),
            new Quest("NO_PORN", "[TESTOSTERONE] No pornography — dopamine reset", QuestCategory.TESTOSTERONE, 80, "{\"STR\":3,\"PER\":4,\"HOR\":4}", null),

            // SIDE — one-time milestone quests
            new Quest("FIRST_LEETCODE", "[SIDE] Solve your very first LeetCode problem", QuestCategory.SIDE, 200, "{\"INT\":5,\"PER\":5}", null),
            new Quest("FIRST_COLD", "[SIDE] First cold shower ever", QuestCategory.SIDE, 150, "{\"STR\":5,\"HOR\":5}", null),
            new Quest("FIRST_ENGLISH", "[SIDE] First mock English interview practice", QuestCategory.SIDE, 200, "{\"AGI\":8}", null),
            new Quest("FIRST_NO_AI", "[SIDE] First full day coding session without AI", QuestCategory.SIDE, 300, "{\"INT\":8,\"PER\":5}", null),
            new Quest("FIRST_GYM", "[SIDE] Visit a gym for the first time", QuestCategory.SIDE, 200, "{\"STR\":8}", null),
            new Quest("FIRST_MEETUP", "[SIDE] Attend first Chennai tech meetup", QuestCategory.SIDE, 250, "{\"AGI\":5,\"INT\":3}", null),
            new Quest("FIRST_SAVINGS", "[SIDE] Transfer first ₹500 to savings", QuestCategory.SIDE, 200, "{\"VIT\":3}", null),
            new Quest("FIRST_JOB_APP", "[SIDE] Submit first job application", QuestCategory.SIDE, 300, "{\"INT\":3,\"AGI\":3}", null)
        );

        questRepository.saveAll(quests);
    }
}

