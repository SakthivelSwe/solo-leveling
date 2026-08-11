-- V11: Ensure all Player entity columns exist in the players table.
-- This migration was added because the players table was originally created and
-- evolved by Hibernate ddl-auto:update rather than Flyway. This migration
-- explicitly adds any missing columns so we can safely switch to ddl-auto:validate
-- in a future release.
--
-- All ALTER TABLE statements use IF NOT EXISTS to be idempotent.

-- Core player fields (may already exist on older instances)
ALTER TABLE players ADD COLUMN IF NOT EXISTS archetype varchar(100);
ALTER TABLE players ADD COLUMN IF NOT EXISTS current_energy integer NOT NULL DEFAULT 70;
ALTER TABLE players ADD COLUMN IF NOT EXISTS rest_day_active boolean NOT NULL DEFAULT false;
ALTER TABLE players ADD COLUMN IF NOT EXISTS rest_day_dow integer NOT NULL DEFAULT 6;
ALTER TABLE players ADD COLUMN IF NOT EXISTS longest_quest_streak integer NOT NULL DEFAULT 0;
ALTER TABLE players ADD COLUMN IF NOT EXISTS clarity_buff_end timestamp(6);
ALTER TABLE players ADD COLUMN IF NOT EXISTS system_gold integer NOT NULL DEFAULT 0;
ALTER TABLE players ADD COLUMN IF NOT EXISTS onboarding_complete boolean NOT NULL DEFAULT true;
ALTER TABLE players ADD COLUMN IF NOT EXISTS in_penalty_zone boolean DEFAULT false;
ALTER TABLE players ADD COLUMN IF NOT EXISTS penalty_zone_end_time timestamp(6);
ALTER TABLE players ADD COLUMN IF NOT EXISTS consecutive_days_below_threshold integer NOT NULL DEFAULT 0;
ALTER TABLE players ADD COLUMN IF NOT EXISTS equipped_title varchar(40);
ALTER TABLE players ADD COLUMN IF NOT EXISTS display_name varchar(100);
ALTER TABLE players ADD COLUMN IF NOT EXISTS rank_level varchar(10) DEFAULT 'E';

-- Ensure job_change_quests table exists (created by Hibernate on newer deployments)
CREATE TABLE IF NOT EXISTS job_change_quests (
    player_id bigint NOT NULL,
    completed_quests integer NOT NULL DEFAULT 0,
    required_quests integer NOT NULL DEFAULT 30,
    is_active boolean NOT NULL DEFAULT false,
    is_completed boolean NOT NULL DEFAULT false,
    started_at timestamp(6),
    deadline timestamp(6),
    PRIMARY KEY (player_id)
);

-- Fix is_active DEFAULT for quests table (already done in V10 but guarded here too)
ALTER TABLE quests ALTER COLUMN is_active SET DEFAULT true;
UPDATE quests SET is_active = true WHERE is_active IS NULL;
ALTER TABLE quests ALTER COLUMN is_active SET NOT NULL;
