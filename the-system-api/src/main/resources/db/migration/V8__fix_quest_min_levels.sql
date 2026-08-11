-- V8: Fix quest min_level values so beginners don't see impossible quests on Day 1.
-- Previously ALL quests had min_level = 1 (default), meaning a brand new player
-- with Level 1 would see LeetCode, Mock Interview, and 1-hr coding — all impossible.
--
-- The correct approach (based on progressive overload + Tiny Habits research):
-- Level 1-2: Only basic daily health habits + beginner learning tasks
-- Level 3-4: Add discipline quests, light learning challenges
-- Level 5-6: Add structured coding practice, LeetCode
-- Level 7+:  Add mock interviews, advanced challenges
--
-- This also adds a max_level column to support beginner-only quests (Level 1-2 only).

ALTER TABLE quests ADD COLUMN IF NOT EXISTS max_level integer DEFAULT 999;

-- ── TIER 1 (Level 1+): Basic health habits — anyone can do these ──
UPDATE quests SET min_level = 1  WHERE quest_key IN (
    'WATER', 'BREAKFAST', 'SLEEP', 'EXERCISE', 'MORNING_SUN'
);

-- ── TIER 2 (Level 3+): Light discipline + early learning ──
UPDATE quests SET min_level = 3  WHERE quest_key IN (
    'COLD_SHOWER', 'NO_REELS', 'COURAGE_OF_THE_WEAK',
    'TECH_LEARN', 'READ_NO_SCROLL', 'LINKEDIN_UPDATE'
);

-- ── TIER 3 (Level 5+): Structured coding + English practice ──
UPDATE quests SET min_level = 5  WHERE quest_key IN (
    'CODE_NO_AI', 'SELF_DEBUG', 'ENGLISH', 'ANGULAR_BUILD', 'SYSTEM_DESIGN'
);

-- ── TIER 4 (Level 7+): LeetCode and advanced skill work ──
UPDATE quests SET min_level = 7  WHERE quest_key IN (
    'LEETCODE', 'NO_PORN'
);

-- ── TIER 5 (Level 10+): High-pressure advanced challenges ──
UPDATE quests SET min_level = 10 WHERE quest_key IN (
    'MOCK_INTERVIEW'
);

-- Testosterone/Recovery quests are available from Level 1 (they are positive habits)
UPDATE quests SET min_level = 1  WHERE category = 'TESTOSTERONE';

-- Set max_level for quests that should only appear for lower-level players
-- (prevents trivial quests from cluttering advanced player dashboards)
-- Currently none — we'll add beginner-only quests in V9.
