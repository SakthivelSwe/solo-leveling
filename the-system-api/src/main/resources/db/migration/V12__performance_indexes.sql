-- Performance indexes for hot read paths.
-- These are the indexes NOT already covered by existing unique constraints:
--   * dopamine_logs / health_logs already have UNIQUE(player_id, log_date)
--   * habit_completions already declares idx_hc_player_date / idx_hc_habit_date
--   * quest_completions only has UNIQUE(player_id, quest_id, completed_at) which
--     does NOT serve range scans on completed_at (heatmap / monthly report / stats).
--   * ai_memory had no index at all.
--   * quests is filtered by (player_id, is_active) on every "today's quests" load.

CREATE INDEX IF NOT EXISTS idx_quest_completions_player_date
    ON quest_completions (player_id, completed_at);

CREATE INDEX IF NOT EXISTS idx_ai_memory_player_week
    ON ai_memory (player_id, week_start);

CREATE INDEX IF NOT EXISTS idx_quests_player_active
    ON quests (player_id, is_active);
