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
            // DAILY - LORE ACCURATE (Dynamically Scaled)
            build("COURAGE_OF_THE_WEAK", "[DAILY] Secret Quest: Courage of the Weak (10 Push-ups, 10 Sit-ups, 10 Squats, 1km Walk)", QuestCategory.DAILY, 50, "{\"STR\":3,\"VIT\":3,\"AGI\":2}", null, 10, true, 50, false),

            // DAILY Foundational Habits
            build("BREAKFAST", "[DAILY] Eat breakfast before 10:00 AM", QuestCategory.DAILY, 40, "{\"VIT\":2}", null, 2, false, 5, false),
            build("WATER", "[DAILY] Drink 2 bottles of water", QuestCategory.DAILY, 30, "{\"VIT\":2}", null, 2, false, 5, false),
            build("EXERCISE", "[DAILY] 20-min exercise or walk outside", QuestCategory.DAILY, 80, "{\"STR\":4,\"HOR\":5}", null, 5, true, 30, false),
            build("SLEEP", "[DAILY] Slept before 11:30 PM last night", QuestCategory.DAILY, 50, "{\"VIT\":3,\"HOR\":6}", null, 5, true, 10, false),
            build("NO_REELS", "[DAILY] No reels or screens after 11 PM", QuestCategory.DAILY, 90, "{\"AGI\":1,\"INT\":1}", null, 4, false, 25, false),

            // SKILL
            build("CODE_NO_AI", "[SKILL] 1 hour coding WITHOUT AI or Copilot", QuestCategory.SKILL, 150, "{\"INT\":5,\"PER\":3}", "{\"Java + Spring Boot\":3,\"Angular / JavaScript\":2}", 5, true, 80, false),
            build("LEETCODE", "[SKILL] Solve 1 LeetCode problem", QuestCategory.SKILL, 120, "{\"INT\":4,\"PER\":4}", "{\"DSA / LeetCode\":4}", 5, true, 50, false),
            build("ENGLISH", "[SKILL] 20 min English speaking practice", QuestCategory.SKILL, 100, "{\"AGI\":6}", "{\"English Speaking\":5}", 5, true, 40, false),
            build("TECH_LEARN", "[SKILL] Tech learning session — tutorial or docs", QuestCategory.SKILL, 70, "{\"INT\":3}", "{\"Java + Spring Boot\":1,\"Angular / JavaScript\":1}", 3, false, 15, false),
            build("SELF_DEBUG", "[SKILL] Debug something yourself (no AI first)", QuestCategory.SKILL, 100, "{\"PER\":5,\"INT\":2}", "{\"DSA / LeetCode\":2}", 4, false, 25, false),
            build("SYSTEM_DESIGN", "[SKILL] Read 1 System Design concept", QuestCategory.SKILL, 90, "{\"INT\":3,\"PER\":4}", "{\"System Design\":3}", 4, false, 45, false),
            build("ANGULAR_BUILD", "[SKILL] Build Angular component (30 min)", QuestCategory.SKILL, 80, "{\"INT\":2}", "{\"Angular / JavaScript\":3}", 4, false, 35, false),
            build("MOCK_INTERVIEW", "[SKILL] Do a mock interview", QuestCategory.SKILL, 150, "{\"AGI\":4,\"PER\":3}", "{\"English Speaking\":2}", 5, false, 60, false),
            build("LINKEDIN_UPDATE", "[SKILL] Post/update LinkedIn or apply to 1 job", QuestCategory.SKILL, 100, "{\"AGI\":2}", "{\"Career\":2}", 3, false, 20, false),
            build("READ_NO_SCROLL", "[SKILL] Read tech article 20 min (no reels)", QuestCategory.SKILL, 70, "{\"INT\":2}", "{\"Java + Spring Boot\":1}", 3, false, 15, true),

            // TESTOSTERONE
            build("MORNING_SUN", "[TESTOSTERONE] 20 min morning sunlight before 10 AM", QuestCategory.TESTOSTERONE, 70, "{\"STR\":2,\"VIT\":3,\"HOR\":4}", null, 3, false, 10, true),
            build("COLD_SHOWER", "[TESTOSTERONE] Cold water last 30 sec of shower", QuestCategory.TESTOSTERONE, 60, "{\"STR\":3,\"VIT\":2,\"HOR\":3}", null, 3, false, 15, false),
            build("ZINC_MEAL", "[TESTOSTERONE] Ate eggs / nuts / dhal today", QuestCategory.TESTOSTERONE, 50, "{\"VIT\":3,\"STR\":1,\"HOR\":3}", null, 2, false, 5, false),
            build("NO_SODA", "[TESTOSTERONE] No soft drinks or junk today", QuestCategory.TESTOSTERONE, 50, "{\"VIT\":4,\"HOR\":5}", null, 3, false, 10, false),
            build("BREATHING", "[TESTOSTERONE] 5 min deep breathing — cortisol reset", QuestCategory.TESTOSTERONE, 40, "{\"VIT\":2,\"AGI\":1,\"HOR\":2}", null, 2, false, 5, true),
            build("NO_PORN", "[TESTOSTERONE] No pornography — dopamine reset", QuestCategory.TESTOSTERONE, 80, "{\"STR\":3,\"PER\":4,\"HOR\":4}", null, 4, false, 20, false),

            // SIDE — one-time milestone quests
            build("FIRST_LEETCODE", "[SIDE] Solve your very first LeetCode problem", QuestCategory.SIDE, 200, "{\"INT\":5,\"PER\":5}", null, 1, false, 10, false),
            build("FIRST_COLD", "[SIDE] First cold shower ever", QuestCategory.SIDE, 150, "{\"STR\":5,\"HOR\":5}", null, 1, false, 10, false),
            build("FIRST_ENGLISH", "[SIDE] First mock English interview practice", QuestCategory.SIDE, 200, "{\"AGI\":8}", null, 1, false, 10, false),
            build("FIRST_NO_AI", "[SIDE] First full day coding session without AI", QuestCategory.SIDE, 300, "{\"INT\":8,\"PER\":5}", null, 1, false, 10, false),
            build("FIRST_GYM", "[SIDE] Visit a gym for the first time", QuestCategory.SIDE, 200, "{\"STR\":8}", null, 1, false, 10, false),
            build("FIRST_MEETUP", "[SIDE] Attend first Chennai tech meetup", QuestCategory.SIDE, 250, "{\"AGI\":5,\"INT\":3}", null, 1, false, 10, false),
            build("FIRST_SAVINGS", "[SIDE] Transfer first ₹500 to savings", QuestCategory.SIDE, 200, "{\"VIT\":3}", null, 1, false, 10, false),
            build("FIRST_JOB_APP", "[SIDE] Submit first job application", QuestCategory.SIDE, 300, "{\"INT\":3,\"AGI\":3}", null, 1, false, 10, false),
            build("FIRST_MOCK_INTERVIEW", "[SIDE] Do your first mock interview", QuestCategory.SIDE, 300, "{\"AGI\":6,\"PER\":4}", null, 1, false, 10, false)
        );

        questRepository.saveAll(quests);
    }

    private Quest build(String key, String label, QuestCategory category, int xp,
                        String stats, String skills, int priority, boolean critical,
                        int bossDamage, boolean recovery) {
        Quest q = new Quest(key, label, category, xp, stats, skills);
        q.setPriority(priority);
        q.setCritical(critical);
        q.setBossDamage(bossDamage);
        q.setRecoveryQuest(recovery);
        return q;
    }
}

