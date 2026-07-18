package com.thesystem.service;

import com.thesystem.dto.HabitTemplateDTO;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Curated Solo-Leveling-themed habit templates offered during onboarding.
 * Grouped by identity tag & rank hint so the Hunter can start with a matched
 * 3-habit pack that fits their current level.
 */
@Service
public class HabitTemplateService {

    private static final List<HabitTemplateDTO> TEMPLATES = List.of(
        // === IDENTITY: HUNTER (physical / discipline) ===
        new HabitTemplateDTO("H_COLD_SHOWER", "Cold shower", "Hunter",
            "Right after waking, before opening phone",
            "Discipline over comfort — dopamine reset before the world begins",
            "2 minute cold shower, no music, no distraction",
            "Mark the streak flame + drink water and feel alive",
            "Just step in for 10 seconds",
            "06:30", 2, true, "E"),
        new HabitTemplateDTO("H_MORNING_SUN", "Morning sun (10 min)", "Hunter",
            "After cold shower, on the balcony/outside",
            "Testosterone + circadian rhythm reset — the primal cue",
            "10 minutes direct sunlight, phone locked",
            "Deep breathing + first meal after",
            "Step outside for 2 minutes",
            "07:00", 1, false, "E"),
        new HabitTemplateDTO("H_TRAIN", "Train the body (20 min)", "Hunter",
            "6 PM, in the room / gym",
            "The body I want requires the body I work for daily",
            "Pushups + squats + core, 20 min minimum",
            "Protein meal + progress photo weekly",
            "Do 10 pushups",
            "18:00", 3, true, "D"),

        // === IDENTITY: SCHOLAR (mind / skill) ===
        new HabitTemplateDTO("S_LEETCODE", "Solve 1 LeetCode", "Scholar",
            "After dinner, laptop on desk, no phone",
            "Interview-ready mind — every problem is armor",
            "Solve at least 1 problem WITHOUT AI — struggle first",
            "Log solution + mark streak on THE SYSTEM",
            "Just open LeetCode and read one problem",
            "20:30", 3, true, "D"),
        new HabitTemplateDTO("S_READ", "Read 10 pages", "Scholar",
            "Bed made, book on pillow, 10 PM",
            "Books compound — 10 pages a day = 12 books a year",
            "Read 10 physical/kindle pages, phone in another room",
            "Note one insight in journal",
            "Read 1 page",
            "22:00", 1, false, "E"),
        new HabitTemplateDTO("S_ENGLISH", "Speak English 10 min", "Scholar",
            "Morning coffee, mirror or recording",
            "Interview confidence — the tongue must be trained",
            "10 minutes speaking aloud on any topic + record",
            "Play back once, mark improvement",
            "Say 3 sentences out loud",
            "08:00", 2, false, "D"),

        // === IDENTITY: MONK (mind / meditation) ===
        new HabitTemplateDTO("M_MEDITATE", "Meditate 10 min", "Monk",
            "First thing after waking, before phone",
            "The mind is the ultimate weapon — sharpen it in silence",
            "10 min silent breathing or guided",
            "Tea + journal one line",
            "Sit and breathe for 60 seconds",
            "06:00", 1, true, "E"),
        new HabitTemplateDTO("M_JOURNAL", "Evening journal", "Monk",
            "Before bed, journal on nightstand",
            "Clarity compounds — unwrite the day's noise",
            "3 lines: 1 win, 1 lesson, 1 gratitude",
            "Lights out, phone across room",
            "Write one sentence",
            "22:30", 1, false, "E"),

        // === IDENTITY: WARRIOR (money / discipline) ===
        new HabitTemplateDTO("W_NO_JUNK", "No junk food today", "Warrior",
            "Every meal decision moment",
            "Every 'no' compounds into the physique I want",
            "Refuse junk, order clean, drink water instead",
            "Log day + streak flame",
            "Drink a glass of water first",
            "12:00", 2, false, "D"),
        new HabitTemplateDTO("W_TRACK_SPEND", "Log every spend", "Warrior",
            "After every purchase, immediately",
            "Money you don't measure controls you",
            "Log rupee amount + category in Wealth OS",
            "Weekly review Sunday",
            "Open the app after paying",
            "21:00", 1, false, "D"),
        new HabitTemplateDTO("W_NO_PORN", "No PMO today", "Warrior",
            "Trigger moment (bored, alone, urge)",
            "Every 'no' rebuilds the primal energy",
            "Close tab, cold water, 20 pushups",
            "Mark day + reset streak flame",
            "Close the app and stand up",
            "23:00", 4, true, "E")
    );

    public List<HabitTemplateDTO> all() {
        return TEMPLATES;
    }

    public List<HabitTemplateDTO> forRank(String rank) {
        String r = rank == null ? "E" : rank;
        return TEMPLATES.stream()
                .filter(t -> switch (r) {
                    case "E" -> "E".equals(t.rankHint());
                    case "D" -> "E".equals(t.rankHint()) || "D".equals(t.rankHint());
                    default -> true;
                })
                .toList();
    }
}
