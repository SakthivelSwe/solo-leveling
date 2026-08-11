-- V9: Add beginner-tier quest templates (Level 1-4 only).
-- These are the "Minimum Viable Quest" versions of hard quests.
-- They give new players achievable, confidence-building tasks that train
-- the same underlying skill as the real quest — just at beginner intensity.
-- Based on Tiny Habits (BJ Fogg): "Start so small it seems almost ridiculous."

-- Also adds onboarding infrastructure:
-- - onboarding_complete flag on players (gates quest display)
-- - onboarding_assessments table (stores survey answers + derived scores)

-- ─────────────────────────────────────────────────────────────────────────
-- 1. BEGINNER QUEST TEMPLATES
-- ─────────────────────────────────────────────────────────────────────────

-- LeetCode intro (Level 1-4 only → replaced by real LEETCODE at Level 7)
INSERT INTO quests (quest_key, label, category, xp_reward, priority, is_critical, boss_damage, is_recovery_quest, time_type, is_custom, min_level, max_level)
VALUES ('LEETCODE_INTRO', '[SKILL] Watch 1 algorithm/DSA explanation video (10 min — YouTube/Neetcode)', 'SKILL', 40, 3, false, 10, false, 'DAILY', false, 1, 6);
INSERT INTO quest_stat_boosts (quest_id, stat_name, boost_value) VALUES
    ((SELECT id FROM quests WHERE quest_key = 'LEETCODE_INTRO'), 'INT', 2),
    ((SELECT id FROM quests WHERE quest_key = 'LEETCODE_INTRO'), 'PER', 1);
INSERT INTO quest_skill_boosts (quest_id, skill_name, boost_value) VALUES
    ((SELECT id FROM quests WHERE quest_key = 'LEETCODE_INTRO'), 'DSA / LeetCode', 2);

-- Coding intro (Level 1-4 only → replaced by CODE_NO_AI at Level 5)
INSERT INTO quests (quest_key, label, category, xp_reward, priority, is_critical, boss_damage, is_recovery_quest, time_type, is_custom, min_level, max_level)
VALUES ('CODE_INTRO', '[SKILL] Follow 1 coding tutorial task without AI (20 min)', 'SKILL', 60, 3, false, 15, false, 'DAILY', false, 1, 4);
INSERT INTO quest_stat_boosts (quest_id, stat_name, boost_value) VALUES
    ((SELECT id FROM quests WHERE quest_key = 'CODE_INTRO'), 'INT', 2),
    ((SELECT id FROM quests WHERE quest_key = 'CODE_INTRO'), 'PER', 1);
INSERT INTO quest_skill_boosts (quest_id, skill_name, boost_value) VALUES
    ((SELECT id FROM quests WHERE quest_key = 'CODE_INTRO'), 'Java + Spring Boot', 2),
    ((SELECT id FROM quests WHERE quest_key = 'CODE_INTRO'), 'Angular / JavaScript', 1);

-- English intro (Level 1-4 only → replaced by ENGLISH at Level 5)
INSERT INTO quests (quest_key, label, category, xp_reward, priority, is_critical, boss_damage, is_recovery_quest, time_type, is_custom, min_level, max_level)
VALUES ('ENGLISH_INTRO', '[SKILL] Speak 10 English sentences aloud (or watch 10 min English video)', 'SKILL', 40, 3, false, 10, false, 'DAILY', false, 1, 4);
INSERT INTO quest_stat_boosts (quest_id, stat_name, boost_value) VALUES
    ((SELECT id FROM quests WHERE quest_key = 'ENGLISH_INTRO'), 'AGI', 2);
INSERT INTO quest_skill_boosts (quest_id, skill_name, boost_value) VALUES
    ((SELECT id FROM quests WHERE quest_key = 'ENGLISH_INTRO'), 'English Speaking', 2);

-- Movement intro (Level 1-2 only → replaced by EXERCISE at Level 3)
INSERT INTO quests (quest_key, label, category, xp_reward, priority, is_critical, boss_damage, is_recovery_quest, time_type, is_custom, min_level, max_level)
VALUES ('MOVE_INTRO', '[DAILY] Move for 5 minutes (walk, stretch, or wall push-ups) — any movement counts', 'DAILY', 30, 3, false, 5, true, 'DAILY', false, 1, 2);
INSERT INTO quest_stat_boosts (quest_id, stat_name, boost_value) VALUES
    ((SELECT id FROM quests WHERE quest_key = 'MOVE_INTRO'), 'STR', 1),
    ((SELECT id FROM quests WHERE quest_key = 'MOVE_INTRO'), 'VIT', 1);

-- ─────────────────────────────────────────────────────────────────────────
-- 2. ADD max_level SUPPORT TO QUEST REPOSITORY
-- ─────────────────────────────────────────────────────────────────────────
-- The column was already added in V8. This migration only inserts the data.

-- ─────────────────────────────────────────────────────────────────────────
-- 3. ONBOARDING INFRASTRUCTURE
-- ─────────────────────────────────────────────────────────────────────────

-- Flag on players: have they completed onboarding?
-- Default false for NEW players, true for EXISTING players (like Sakthi).
-- This prevents breaking the existing account.
ALTER TABLE players ADD COLUMN IF NOT EXISTS onboarding_complete boolean NOT NULL DEFAULT true;

-- New registrations will be set to false in AuthService.register().
-- Existing players (onboarding_complete = true) skip onboarding.

-- Assessment table: stores survey answers and derived domain scores
CREATE TABLE IF NOT EXISTS onboarding_assessments (
    id               BIGSERIAL PRIMARY KEY,
    player_id        BIGINT NOT NULL REFERENCES players(id),
    -- Raw answers (JSON for flexibility — questions may evolve over time)
    answers_json     TEXT,
    -- Derived domain scores (0-100 scale)
    body_score       INTEGER NOT NULL DEFAULT 10,
    mind_score       INTEGER NOT NULL DEFAULT 10,
    career_score     INTEGER NOT NULL DEFAULT 10,
    discipline_score INTEGER NOT NULL DEFAULT 10,
    english_score    INTEGER NOT NULL DEFAULT 10,
    -- Derived context
    available_time_minutes INTEGER NOT NULL DEFAULT 30,
    primary_goal     VARCHAR(100),
    primary_barrier  VARCHAR(200),
    -- Metadata
    completed_at     TIMESTAMP,
    created_at       TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_assessment_player ON onboarding_assessments(player_id);

-- ─────────────────────────────────────────────────────────────────────────
-- 4. QUEST DIFFICULTY FEEDBACK
-- ─────────────────────────────────────────────────────────────────────────

ALTER TABLE quest_completions ADD COLUMN IF NOT EXISTS difficulty_feedback VARCHAR(20);
-- Values: TOO_EASY, JUST_RIGHT, HARD, TOO_HARD, null (not provided)
