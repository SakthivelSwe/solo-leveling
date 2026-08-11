-- V12: Add beginner quests for DISCIPLINE and TESTOSTERONE categories
-- To ensure all quest tabs are populated at Level 1, we provide simple beginner-friendly habits.

-- ─────────────────────────────────────────────────────────────────────────
-- 1. TESTOSTERONE / RECOVERY (Min Level 1)
-- ─────────────────────────────────────────────────────────────────────────

-- Eat Eggs / Protein
INSERT INTO quests (quest_key, label, category, xp_reward, priority, is_critical, boss_damage, is_recovery_quest, time_type, is_custom, min_level, max_level)
VALUES ('TESTO_EGGS', '[TESTOSTERONE] Eat 2-3 whole eggs or a handful of nuts', 'TESTOSTERONE', 40, 2, false, 5, true, 'DAILY', false, 1, 999);

INSERT INTO quest_stat_boosts (quest_id, stat_name, boost_value) VALUES
    ((SELECT id FROM quests WHERE quest_key = 'TESTO_EGGS'), 'STR', 2),
    ((SELECT id FROM quests WHERE quest_key = 'TESTO_EGGS'), 'VIT', 2);

-- Morning Sunlight (Recovery Version)
INSERT INTO quests (quest_key, label, category, xp_reward, priority, is_critical, boss_damage, is_recovery_quest, time_type, is_custom, min_level, max_level)
VALUES ('TESTO_SUN', '[TESTOSTERONE] Get 10 mins of direct sunlight on your skin', 'TESTOSTERONE', 30, 2, false, 5, true, 'DAILY', false, 1, 999);

INSERT INTO quest_stat_boosts (quest_id, stat_name, boost_value) VALUES
    ((SELECT id FROM quests WHERE quest_key = 'TESTO_SUN'), 'VIT', 3),
    ((SELECT id FROM quests WHERE quest_key = 'TESTO_SUN'), 'STR', 1);

-- ─────────────────────────────────────────────────────────────────────────
-- 2. DISCIPLINE (Min Level 1)
-- ─────────────────────────────────────────────────────────────────────────

-- Make Bed
INSERT INTO quests (quest_key, label, category, xp_reward, priority, is_critical, boss_damage, is_recovery_quest, time_type, is_custom, min_level, max_level)
VALUES ('DISC_BED', '[DISCIPLINE] Make your bed immediately after waking up', 'DISCIPLINE', 30, 2, false, 5, false, 'DAILY', false, 1, 4);

INSERT INTO quest_stat_boosts (quest_id, stat_name, boost_value) VALUES
    ((SELECT id FROM quests WHERE quest_key = 'DISC_BED'), 'DIS', 2);

-- Drink Water first thing
INSERT INTO quests (quest_key, label, category, xp_reward, priority, is_critical, boss_damage, is_recovery_quest, time_type, is_custom, min_level, max_level)
VALUES ('DISC_WATER', '[DISCIPLINE] Drink a glass of water the moment you wake up', 'DISCIPLINE', 20, 2, false, 5, true, 'DAILY', false, 1, 4);

INSERT INTO quest_stat_boosts (quest_id, stat_name, boost_value) VALUES
    ((SELECT id FROM quests WHERE quest_key = 'DISC_WATER'), 'DIS', 2),
    ((SELECT id FROM quests WHERE quest_key = 'DISC_WATER'), 'VIT', 1);
