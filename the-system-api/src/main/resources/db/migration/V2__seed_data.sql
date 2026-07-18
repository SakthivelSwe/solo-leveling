-- 1. COURAGE_OF_THE_WEAK
INSERT INTO quests (quest_key, label, category, xp_reward, priority, is_critical, boss_damage, is_recovery_quest, time_type, is_custom) VALUES
('COURAGE_OF_THE_WEAK', '[DAILY] Secret Quest: Courage of the Weak (10 Push-ups, 10 Sit-ups, 10 Squats, 1km Walk)', 'DAILY', 50, 10, true, 50, false, 'DAILY', false);
INSERT INTO quest_stat_boosts (quest_id, stat_name, boost_value) VALUES ((SELECT id FROM quests WHERE quest_key = 'COURAGE_OF_THE_WEAK'), 'STR', 3), ((SELECT id FROM quests WHERE quest_key = 'COURAGE_OF_THE_WEAK'), 'VIT', 3), ((SELECT id FROM quests WHERE quest_key = 'COURAGE_OF_THE_WEAK'), 'AGI', 2);

-- 2. BREAKFAST
INSERT INTO quests (quest_key, label, category, xp_reward, priority, is_critical, boss_damage, is_recovery_quest, time_type, is_custom) VALUES
('BREAKFAST', '[DAILY] Eat breakfast before 9:30 AM', 'DAILY', 40, 2, false, 5, false, 'DAILY', false);
INSERT INTO quest_stat_boosts (quest_id, stat_name, boost_value) VALUES ((SELECT id FROM quests WHERE quest_key = 'BREAKFAST'), 'VIT', 2);

-- 3. WATER
INSERT INTO quests (quest_key, label, category, xp_reward, priority, is_critical, boss_damage, is_recovery_quest, time_type, is_custom) VALUES
('WATER', '[DAILY] Drink 2 bottles of water', 'DAILY', 30, 2, false, 5, false, 'DAILY', false);
INSERT INTO quest_stat_boosts (quest_id, stat_name, boost_value) VALUES ((SELECT id FROM quests WHERE quest_key = 'WATER'), 'VIT', 2);

-- 4. EXERCISE
INSERT INTO quests (quest_key, label, category, xp_reward, priority, is_critical, boss_damage, is_recovery_quest, time_type, is_custom) VALUES
('EXERCISE', '[DAILY] 20-min exercise or walk outside', 'DAILY', 80, 5, true, 30, false, 'DAILY', false);
INSERT INTO quest_stat_boosts (quest_id, stat_name, boost_value) VALUES ((SELECT id FROM quests WHERE quest_key = 'EXERCISE'), 'STR', 4), ((SELECT id FROM quests WHERE quest_key = 'EXERCISE'), 'DIS', 5);

-- 5. SLEEP
INSERT INTO quests (quest_key, label, category, xp_reward, priority, is_critical, boss_damage, is_recovery_quest, time_type, is_custom) VALUES
('SLEEP', '[DAILY] Slept before 11:30 PM last night', 'DAILY', 50, 5, true, 10, false, 'DAILY', false);
INSERT INTO quest_stat_boosts (quest_id, stat_name, boost_value) VALUES ((SELECT id FROM quests WHERE quest_key = 'SLEEP'), 'VIT', 3), ((SELECT id FROM quests WHERE quest_key = 'SLEEP'), 'DIS', 6);

-- 6. NO_REELS
INSERT INTO quests (quest_key, label, category, xp_reward, priority, is_critical, boss_damage, is_recovery_quest, time_type, is_custom) VALUES
('NO_REELS', '[DAILY] No reels or screens after 11 PM', 'DAILY', 90, 4, false, 25, false, 'DAILY', false);
INSERT INTO quest_stat_boosts (quest_id, stat_name, boost_value) VALUES ((SELECT id FROM quests WHERE quest_key = 'NO_REELS'), 'AGI', 1), ((SELECT id FROM quests WHERE quest_key = 'NO_REELS'), 'INT', 1);

-- 7. CODE_NO_AI
INSERT INTO quests (quest_key, label, category, xp_reward, priority, is_critical, boss_damage, is_recovery_quest, time_type, is_custom) VALUES
('CODE_NO_AI', '[SKILL] 1 hour coding WITHOUT AI or Copilot', 'SKILL', 150, 5, true, 80, false, 'DAILY', false);
INSERT INTO quest_stat_boosts (quest_id, stat_name, boost_value) VALUES ((SELECT id FROM quests WHERE quest_key = 'CODE_NO_AI'), 'INT', 5), ((SELECT id FROM quests WHERE quest_key = 'CODE_NO_AI'), 'PER', 3);
INSERT INTO quest_skill_boosts (quest_id, skill_name, boost_value) VALUES ((SELECT id FROM quests WHERE quest_key = 'CODE_NO_AI'), 'Java + Spring Boot', 3), ((SELECT id FROM quests WHERE quest_key = 'CODE_NO_AI'), 'Angular / JavaScript', 2);

-- 8. LEETCODE
INSERT INTO quests (quest_key, label, category, xp_reward, priority, is_critical, boss_damage, is_recovery_quest, time_type, is_custom) VALUES
('LEETCODE', '[SKILL] Solve 1 LeetCode problem', 'SKILL', 120, 5, true, 50, false, 'DAILY', false);
INSERT INTO quest_stat_boosts (quest_id, stat_name, boost_value) VALUES ((SELECT id FROM quests WHERE quest_key = 'LEETCODE'), 'INT', 4), ((SELECT id FROM quests WHERE quest_key = 'LEETCODE'), 'PER', 4);
INSERT INTO quest_skill_boosts (quest_id, skill_name, boost_value) VALUES ((SELECT id FROM quests WHERE quest_key = 'LEETCODE'), 'DSA / LeetCode', 4);

-- 9. ENGLISH
INSERT INTO quests (quest_key, label, category, xp_reward, priority, is_critical, boss_damage, is_recovery_quest, time_type, is_custom) VALUES
('ENGLISH', '[SKILL] 20 min English speaking practice', 'SKILL', 100, 5, true, 40, false, 'DAILY', false);
INSERT INTO quest_stat_boosts (quest_id, stat_name, boost_value) VALUES ((SELECT id FROM quests WHERE quest_key = 'ENGLISH'), 'AGI', 6);
INSERT INTO quest_skill_boosts (quest_id, skill_name, boost_value) VALUES ((SELECT id FROM quests WHERE quest_key = 'ENGLISH'), 'English Speaking', 5);

-- 10. TECH_LEARN
INSERT INTO quests (quest_key, label, category, xp_reward, priority, is_critical, boss_damage, is_recovery_quest, time_type, is_custom) VALUES
('TECH_LEARN', '[SKILL] Tech learning session — tutorial or docs', 'SKILL', 70, 3, false, 15, false, 'DAILY', false);
INSERT INTO quest_stat_boosts (quest_id, stat_name, boost_value) VALUES ((SELECT id FROM quests WHERE quest_key = 'TECH_LEARN'), 'INT', 3);
INSERT INTO quest_skill_boosts (quest_id, skill_name, boost_value) VALUES ((SELECT id FROM quests WHERE quest_key = 'TECH_LEARN'), 'Java + Spring Boot', 1), ((SELECT id FROM quests WHERE quest_key = 'TECH_LEARN'), 'Angular / JavaScript', 1);

-- 11. SELF_DEBUG
INSERT INTO quests (quest_key, label, category, xp_reward, priority, is_critical, boss_damage, is_recovery_quest, time_type, is_custom) VALUES
('SELF_DEBUG', '[SKILL] Debug something yourself (no AI first)', 'SKILL', 100, 4, false, 25, false, 'DAILY', false);
INSERT INTO quest_stat_boosts (quest_id, stat_name, boost_value) VALUES ((SELECT id FROM quests WHERE quest_key = 'SELF_DEBUG'), 'PER', 5), ((SELECT id FROM quests WHERE quest_key = 'SELF_DEBUG'), 'INT', 2);
INSERT INTO quest_skill_boosts (quest_id, skill_name, boost_value) VALUES ((SELECT id FROM quests WHERE quest_key = 'SELF_DEBUG'), 'DSA / LeetCode', 2);

-- 12. SYSTEM_DESIGN (Original + modified for plan)
INSERT INTO quests (quest_key, label, category, xp_reward, priority, is_critical, boss_damage, is_recovery_quest, time_type, is_custom) VALUES
('SYSTEM_DESIGN', '[SKILL] Read 1 System Design concept', 'SKILL', 90, 4, false, 45, false, 'DAILY', false);
INSERT INTO quest_stat_boosts (quest_id, stat_name, boost_value) VALUES ((SELECT id FROM quests WHERE quest_key = 'SYSTEM_DESIGN'), 'INT', 3), ((SELECT id FROM quests WHERE quest_key = 'SYSTEM_DESIGN'), 'PER', 4);
INSERT INTO quest_skill_boosts (quest_id, skill_name, boost_value) VALUES ((SELECT id FROM quests WHERE quest_key = 'SYSTEM_DESIGN'), 'System Design', 3);

-- 13. ANGULAR_BUILD
INSERT INTO quests (quest_key, label, category, xp_reward, priority, is_critical, boss_damage, is_recovery_quest, time_type, is_custom) VALUES
('ANGULAR_BUILD', '[SKILL] Build Angular component (30 min)', 'SKILL', 80, 4, false, 35, false, 'DAILY', false);
INSERT INTO quest_stat_boosts (quest_id, stat_name, boost_value) VALUES ((SELECT id FROM quests WHERE quest_key = 'ANGULAR_BUILD'), 'INT', 2);
INSERT INTO quest_skill_boosts (quest_id, skill_name, boost_value) VALUES ((SELECT id FROM quests WHERE quest_key = 'ANGULAR_BUILD'), 'Angular / JavaScript', 3);

-- 14. MOCK_INTERVIEW (Critical now)
INSERT INTO quests (quest_key, label, category, xp_reward, priority, is_critical, boss_damage, is_recovery_quest, time_type, is_custom) VALUES
('MOCK_INTERVIEW', '[SKILL] Do a mock interview', 'SKILL', 150, 5, true, 60, false, 'DAILY', false);
INSERT INTO quest_stat_boosts (quest_id, stat_name, boost_value) VALUES ((SELECT id FROM quests WHERE quest_key = 'MOCK_INTERVIEW'), 'AGI', 4), ((SELECT id FROM quests WHERE quest_key = 'MOCK_INTERVIEW'), 'PER', 3);
INSERT INTO quest_skill_boosts (quest_id, skill_name, boost_value) VALUES ((SELECT id FROM quests WHERE quest_key = 'MOCK_INTERVIEW'), 'English Speaking', 2), ((SELECT id FROM quests WHERE quest_key = 'MOCK_INTERVIEW'), 'Career', 2);

-- 15. LINKEDIN_UPDATE
INSERT INTO quests (quest_key, label, category, xp_reward, priority, is_critical, boss_damage, is_recovery_quest, time_type, is_custom) VALUES
('LINKEDIN_UPDATE', '[SKILL] Post/update LinkedIn or apply to 1 job', 'SKILL', 100, 3, false, 20, false, 'DAILY', false);
INSERT INTO quest_stat_boosts (quest_id, stat_name, boost_value) VALUES ((SELECT id FROM quests WHERE quest_key = 'LINKEDIN_UPDATE'), 'AGI', 2);
INSERT INTO quest_skill_boosts (quest_id, skill_name, boost_value) VALUES ((SELECT id FROM quests WHERE quest_key = 'LINKEDIN_UPDATE'), 'Career', 2);

-- 16. READ_NO_SCROLL
INSERT INTO quests (quest_key, label, category, xp_reward, priority, is_critical, boss_damage, is_recovery_quest, time_type, is_custom) VALUES
('READ_NO_SCROLL', '[SKILL] Read tech article 20 min (no reels)', 'SKILL', 70, 3, false, 15, true, 'DAILY', false);
INSERT INTO quest_stat_boosts (quest_id, stat_name, boost_value) VALUES ((SELECT id FROM quests WHERE quest_key = 'READ_NO_SCROLL'), 'INT', 2);
INSERT INTO quest_skill_boosts (quest_id, skill_name, boost_value) VALUES ((SELECT id FROM quests WHERE quest_key = 'READ_NO_SCROLL'), 'Java + Spring Boot', 1);

-- 17. MORNING_SUN
INSERT INTO quests (quest_key, label, category, xp_reward, priority, is_critical, boss_damage, is_recovery_quest, time_type, is_custom) VALUES
('MORNING_SUN', '[DISCIPLINE] 20 min morning sunlight before 10 AM', 'DISCIPLINE', 70, 3, false, 10, true, 'DAILY', false);
INSERT INTO quest_stat_boosts (quest_id, stat_name, boost_value) VALUES ((SELECT id FROM quests WHERE quest_key = 'MORNING_SUN'), 'STR', 2), ((SELECT id FROM quests WHERE quest_key = 'MORNING_SUN'), 'VIT', 3), ((SELECT id FROM quests WHERE quest_key = 'MORNING_SUN'), 'DIS', 4);

-- 18. COLD_SHOWER
INSERT INTO quests (quest_key, label, category, xp_reward, priority, is_critical, boss_damage, is_recovery_quest, time_type, is_custom) VALUES
('COLD_SHOWER', '[DISCIPLINE] Cold water last 30 sec of shower', 'DISCIPLINE', 60, 3, false, 15, false, 'DAILY', false);
INSERT INTO quest_stat_boosts (quest_id, stat_name, boost_value) VALUES ((SELECT id FROM quests WHERE quest_key = 'COLD_SHOWER'), 'STR', 3), ((SELECT id FROM quests WHERE quest_key = 'COLD_SHOWER'), 'VIT', 2), ((SELECT id FROM quests WHERE quest_key = 'COLD_SHOWER'), 'DIS', 3);

-- 19. ZINC_MEAL
INSERT INTO quests (quest_key, label, category, xp_reward, priority, is_critical, boss_damage, is_recovery_quest, time_type, is_custom) VALUES
('ZINC_MEAL', '[DISCIPLINE] Ate eggs / nuts / dhal today', 'DISCIPLINE', 50, 2, false, 5, false, 'DAILY', false);
INSERT INTO quest_stat_boosts (quest_id, stat_name, boost_value) VALUES ((SELECT id FROM quests WHERE quest_key = 'ZINC_MEAL'), 'VIT', 3), ((SELECT id FROM quests WHERE quest_key = 'ZINC_MEAL'), 'STR', 1), ((SELECT id FROM quests WHERE quest_key = 'ZINC_MEAL'), 'DIS', 3);

-- 20. NO_SODA
INSERT INTO quests (quest_key, label, category, xp_reward, priority, is_critical, boss_damage, is_recovery_quest, time_type, is_custom) VALUES
('NO_SODA', '[DISCIPLINE] No soft drinks or junk today', 'DISCIPLINE', 50, 3, false, 10, false, 'DAILY', false);
INSERT INTO quest_stat_boosts (quest_id, stat_name, boost_value) VALUES ((SELECT id FROM quests WHERE quest_key = 'NO_SODA'), 'VIT', 4), ((SELECT id FROM quests WHERE quest_key = 'NO_SODA'), 'DIS', 5);

-- 21. BREATHING
INSERT INTO quests (quest_key, label, category, xp_reward, priority, is_critical, boss_damage, is_recovery_quest, time_type, is_custom) VALUES
('BREATHING', '[DISCIPLINE] 5 min deep breathing — cortisol reset', 'DISCIPLINE', 40, 2, false, 5, true, 'DAILY', false);
INSERT INTO quest_stat_boosts (quest_id, stat_name, boost_value) VALUES ((SELECT id FROM quests WHERE quest_key = 'BREATHING'), 'VIT', 2), ((SELECT id FROM quests WHERE quest_key = 'BREATHING'), 'AGI', 1), ((SELECT id FROM quests WHERE quest_key = 'BREATHING'), 'DIS', 2);

-- 22. NO_PORN
INSERT INTO quests (quest_key, label, category, xp_reward, priority, is_critical, boss_damage, is_recovery_quest, time_type, is_custom) VALUES
('NO_PORN', '[DISCIPLINE] No pornography — dopamine reset', 'DISCIPLINE', 80, 4, false, 20, false, 'DAILY', false);
INSERT INTO quest_stat_boosts (quest_id, stat_name, boost_value) VALUES ((SELECT id FROM quests WHERE quest_key = 'NO_PORN'), 'STR', 3), ((SELECT id FROM quests WHERE quest_key = 'NO_PORN'), 'PER', 4), ((SELECT id FROM quests WHERE quest_key = 'NO_PORN'), 'DIS', 4);

-- 23. WEEKLY_LEETCODE_5
INSERT INTO quests (quest_key, label, category, xp_reward, priority, is_critical, boss_damage, is_recovery_quest, time_type, is_custom) VALUES
('WEEKLY_LEETCODE_5', '[WEEKLY] Solve 5 LeetCode problems this week', 'WEEKLY', 400, 4, false, 30, false, 'WEEKLY', false);
INSERT INTO quest_stat_boosts (quest_id, stat_name, boost_value) VALUES ((SELECT id FROM quests WHERE quest_key = 'WEEKLY_LEETCODE_5'), 'INT', 10), ((SELECT id FROM quests WHERE quest_key = 'WEEKLY_LEETCODE_5'), 'PER', 8);
INSERT INTO quest_skill_boosts (quest_id, skill_name, boost_value) VALUES ((SELECT id FROM quests WHERE quest_key = 'WEEKLY_LEETCODE_5'), 'DSA / LeetCode', 8);

-- 24. WEEKLY_CONSISTENCY
INSERT INTO quests (quest_key, label, category, xp_reward, priority, is_critical, boss_damage, is_recovery_quest, time_type, is_custom) VALUES
('WEEKLY_CONSISTENCY', '[WEEKLY] Complete all daily habits for 5 consecutive days', 'WEEKLY', 500, 4, false, 30, false, 'WEEKLY', false);
INSERT INTO quest_stat_boosts (quest_id, stat_name, boost_value) VALUES ((SELECT id FROM quests WHERE quest_key = 'WEEKLY_CONSISTENCY'), 'VIT', 6), ((SELECT id FROM quests WHERE quest_key = 'WEEKLY_CONSISTENCY'), 'STR', 4);

-- 25. WEEKLY_CODE_PURE
INSERT INTO quests (quest_key, label, category, xp_reward, priority, is_critical, boss_damage, is_recovery_quest, time_type, is_custom) VALUES
('WEEKLY_CODE_PURE', '[WEEKLY] 3 full coding sessions without AI (3 hrs total)', 'WEEKLY', 450, 4, false, 30, false, 'WEEKLY', false);
INSERT INTO quest_stat_boosts (quest_id, stat_name, boost_value) VALUES ((SELECT id FROM quests WHERE quest_key = 'WEEKLY_CODE_PURE'), 'INT', 8), ((SELECT id FROM quests WHERE quest_key = 'WEEKLY_CODE_PURE'), 'PER', 6);
INSERT INTO quest_skill_boosts (quest_id, skill_name, boost_value) VALUES ((SELECT id FROM quests WHERE quest_key = 'WEEKLY_CODE_PURE'), 'Java + Spring Boot', 5);

-- 26. WEEKLY_ENGLISH_TALK
INSERT INTO quests (quest_key, label, category, xp_reward, priority, is_critical, boss_damage, is_recovery_quest, time_type, is_custom) VALUES
('WEEKLY_ENGLISH_TALK', '[WEEKLY] 2 English speaking sessions (20 min each)', 'WEEKLY', 300, 4, false, 30, false, 'WEEKLY', false);
INSERT INTO quest_stat_boosts (quest_id, stat_name, boost_value) VALUES ((SELECT id FROM quests WHERE quest_key = 'WEEKLY_ENGLISH_TALK'), 'AGI', 8);
INSERT INTO quest_skill_boosts (quest_id, skill_name, boost_value) VALUES ((SELECT id FROM quests WHERE quest_key = 'WEEKLY_ENGLISH_TALK'), 'English Speaking', 6);

-- 27. WEEKLY_BODY
INSERT INTO quests (quest_key, label, category, xp_reward, priority, is_critical, boss_damage, is_recovery_quest, time_type, is_custom) VALUES
('WEEKLY_BODY', '[WEEKLY] Exercise 4 out of 7 days this week', 'WEEKLY', 350, 4, false, 30, false, 'WEEKLY', false);
INSERT INTO quest_stat_boosts (quest_id, stat_name, boost_value) VALUES ((SELECT id FROM quests WHERE quest_key = 'WEEKLY_BODY'), 'STR', 8), ((SELECT id FROM quests WHERE quest_key = 'WEEKLY_BODY'), 'DIS', 6);

-- 28. MONTHLY_JOB_APPS
INSERT INTO quests (quest_key, label, category, xp_reward, priority, is_critical, boss_damage, is_recovery_quest, time_type, is_custom) VALUES
('MONTHLY_JOB_APPS', '[MONTHLY] Apply to 10 jobs this month', 'MONTHLY', 800, 4, false, 50, false, 'MONTHLY', false);
INSERT INTO quest_stat_boosts (quest_id, stat_name, boost_value) VALUES ((SELECT id FROM quests WHERE quest_key = 'MONTHLY_JOB_APPS'), 'INT', 5), ((SELECT id FROM quests WHERE quest_key = 'MONTHLY_JOB_APPS'), 'AGI', 5);
INSERT INTO quest_skill_boosts (quest_id, skill_name, boost_value) VALUES ((SELECT id FROM quests WHERE quest_key = 'MONTHLY_JOB_APPS'), 'Career', 10);

-- 29. MONTHLY_HABIT_STREAK
INSERT INTO quests (quest_key, label, category, xp_reward, priority, is_critical, boss_damage, is_recovery_quest, time_type, is_custom) VALUES
('MONTHLY_HABIT_STREAK', '[MONTHLY] Maintain a 21-day habit streak this month', 'MONTHLY', 1000, 4, false, 50, false, 'MONTHLY', false);
INSERT INTO quest_stat_boosts (quest_id, stat_name, boost_value) VALUES ((SELECT id FROM quests WHERE quest_key = 'MONTHLY_HABIT_STREAK'), 'VIT', 10), ((SELECT id FROM quests WHERE quest_key = 'MONTHLY_HABIT_STREAK'), 'STR', 5), ((SELECT id FROM quests WHERE quest_key = 'MONTHLY_HABIT_STREAK'), 'DIS', 8);

-- 30. MONTHLY_LEETCODE_20
INSERT INTO quests (quest_key, label, category, xp_reward, priority, is_critical, boss_damage, is_recovery_quest, time_type, is_custom) VALUES
('MONTHLY_LEETCODE_20', '[MONTHLY] Solve 20 LeetCode problems this month', 'MONTHLY', 900, 4, false, 50, false, 'MONTHLY', false);
INSERT INTO quest_stat_boosts (quest_id, stat_name, boost_value) VALUES ((SELECT id FROM quests WHERE quest_key = 'MONTHLY_LEETCODE_20'), 'INT', 12), ((SELECT id FROM quests WHERE quest_key = 'MONTHLY_LEETCODE_20'), 'PER', 10);
INSERT INTO quest_skill_boosts (quest_id, skill_name, boost_value) VALUES ((SELECT id FROM quests WHERE quest_key = 'MONTHLY_LEETCODE_20'), 'DSA / LeetCode', 15);

-- 31. FIRST_LEETCODE
INSERT INTO quests (quest_key, label, category, xp_reward, priority, is_critical, boss_damage, is_recovery_quest, time_type, is_custom) VALUES
('FIRST_LEETCODE', '[MILESTONE] Solve your very first LeetCode problem', 'MILESTONE', 200, 1, false, 10, false, 'ONE_TIME', false);
INSERT INTO quest_stat_boosts (quest_id, stat_name, boost_value) VALUES ((SELECT id FROM quests WHERE quest_key = 'FIRST_LEETCODE'), 'INT', 5), ((SELECT id FROM quests WHERE quest_key = 'FIRST_LEETCODE'), 'PER', 5);

-- 32. FIRST_COLD
INSERT INTO quests (quest_key, label, category, xp_reward, priority, is_critical, boss_damage, is_recovery_quest, time_type, is_custom) VALUES
('FIRST_COLD', '[MILESTONE] First cold shower ever', 'MILESTONE', 150, 1, false, 10, false, 'ONE_TIME', false);
INSERT INTO quest_stat_boosts (quest_id, stat_name, boost_value) VALUES ((SELECT id FROM quests WHERE quest_key = 'FIRST_COLD'), 'STR', 5), ((SELECT id FROM quests WHERE quest_key = 'FIRST_COLD'), 'DIS', 5);

-- 33. FIRST_ENGLISH
INSERT INTO quests (quest_key, label, category, xp_reward, priority, is_critical, boss_damage, is_recovery_quest, time_type, is_custom) VALUES
('FIRST_ENGLISH', '[MILESTONE] First mock English interview practice', 'MILESTONE', 200, 1, false, 10, false, 'ONE_TIME', false);
INSERT INTO quest_stat_boosts (quest_id, stat_name, boost_value) VALUES ((SELECT id FROM quests WHERE quest_key = 'FIRST_ENGLISH'), 'AGI', 8);

-- 34. FIRST_NO_AI
INSERT INTO quests (quest_key, label, category, xp_reward, priority, is_critical, boss_damage, is_recovery_quest, time_type, is_custom) VALUES
('FIRST_NO_AI', '[MILESTONE] First full day coding session without AI', 'MILESTONE', 300, 1, false, 10, false, 'ONE_TIME', false);
INSERT INTO quest_stat_boosts (quest_id, stat_name, boost_value) VALUES ((SELECT id FROM quests WHERE quest_key = 'FIRST_NO_AI'), 'INT', 8), ((SELECT id FROM quests WHERE quest_key = 'FIRST_NO_AI'), 'PER', 5);

-- 35. FIRST_GYM
INSERT INTO quests (quest_key, label, category, xp_reward, priority, is_critical, boss_damage, is_recovery_quest, time_type, is_custom) VALUES
('FIRST_GYM', '[MILESTONE] Visit a gym for the first time', 'MILESTONE', 200, 1, false, 10, false, 'ONE_TIME', false);
INSERT INTO quest_stat_boosts (quest_id, stat_name, boost_value) VALUES ((SELECT id FROM quests WHERE quest_key = 'FIRST_GYM'), 'STR', 8);

-- 36. FIRST_MEETUP
INSERT INTO quests (quest_key, label, category, xp_reward, priority, is_critical, boss_damage, is_recovery_quest, time_type, is_custom) VALUES
('FIRST_MEETUP', '[MILESTONE] Attend first Chennai tech meetup', 'MILESTONE', 250, 1, false, 10, false, 'ONE_TIME', false);
INSERT INTO quest_stat_boosts (quest_id, stat_name, boost_value) VALUES ((SELECT id FROM quests WHERE quest_key = 'FIRST_MEETUP'), 'AGI', 5), ((SELECT id FROM quests WHERE quest_key = 'FIRST_MEETUP'), 'INT', 3);

-- 37. FIRST_SAVINGS
INSERT INTO quests (quest_key, label, category, xp_reward, priority, is_critical, boss_damage, is_recovery_quest, time_type, is_custom) VALUES
('FIRST_SAVINGS', '[MILESTONE] Transfer first ₹500 to savings', 'MILESTONE', 200, 1, false, 10, false, 'ONE_TIME', false);
INSERT INTO quest_stat_boosts (quest_id, stat_name, boost_value) VALUES ((SELECT id FROM quests WHERE quest_key = 'FIRST_SAVINGS'), 'VIT', 3);

-- 38. FIRST_JOB_APP
INSERT INTO quests (quest_key, label, category, xp_reward, priority, is_critical, boss_damage, is_recovery_quest, time_type, is_custom) VALUES
('FIRST_JOB_APP', '[MILESTONE] Submit first job application', 'MILESTONE', 300, 1, false, 10, false, 'ONE_TIME', false);
INSERT INTO quest_stat_boosts (quest_id, stat_name, boost_value) VALUES ((SELECT id FROM quests WHERE quest_key = 'FIRST_JOB_APP'), 'INT', 3), ((SELECT id FROM quests WHERE quest_key = 'FIRST_JOB_APP'), 'AGI', 3);

-- 39. FIRST_MOCK_INTERVIEW
INSERT INTO quests (quest_key, label, category, xp_reward, priority, is_critical, boss_damage, is_recovery_quest, time_type, is_custom) VALUES
('FIRST_MOCK_INTERVIEW', '[MILESTONE] Complete your first mock interview', 'MILESTONE', 300, 1, false, 10, false, 'ONE_TIME', false);
INSERT INTO quest_stat_boosts (quest_id, stat_name, boost_value) VALUES ((SELECT id FROM quests WHERE quest_key = 'FIRST_MOCK_INTERVIEW'), 'AGI', 6), ((SELECT id FROM quests WHERE quest_key = 'FIRST_MOCK_INTERVIEW'), 'PER', 4);

-- 40. NEW: DOPAMINE_DETOX_VICTORY
INSERT INTO quests (quest_key, label, category, xp_reward, priority, is_critical, boss_damage, is_recovery_quest, time_type, is_custom) VALUES
('DOPAMINE_DETOX_VICTORY', '[DAILY] Dopamine Detox: 30 minutes no screens in the morning', 'DAILY', 100, 5, true, 50, false, 'DAILY', false);
INSERT INTO quest_stat_boosts (quest_id, stat_name, boost_value) VALUES ((SELECT id FROM quests WHERE quest_key = 'DOPAMINE_DETOX_VICTORY'), 'PER', 5), ((SELECT id FROM quests WHERE quest_key = 'DOPAMINE_DETOX_VICTORY'), 'DIS', 5);

-- 41. NEW: SYSTEM_DESIGN_DOC
INSERT INTO quests (quest_key, label, category, xp_reward, priority, is_critical, boss_damage, is_recovery_quest, time_type, is_custom) VALUES
('SYSTEM_DESIGN_DOC', '[SKILL] Write one system design doc', 'SKILL', 200, 5, true, 50, false, 'DAILY', false);
INSERT INTO quest_stat_boosts (quest_id, stat_name, boost_value) VALUES ((SELECT id FROM quests WHERE quest_key = 'SYSTEM_DESIGN_DOC'), 'INT', 6), ((SELECT id FROM quests WHERE quest_key = 'SYSTEM_DESIGN_DOC'), 'PER', 4);
INSERT INTO quest_skill_boosts (quest_id, skill_name, boost_value) VALUES ((SELECT id FROM quests WHERE quest_key = 'SYSTEM_DESIGN_DOC'), 'System Design', 5);

-- 42. NEW: ANGULAR_MASTERY
INSERT INTO quests (quest_key, label, category, xp_reward, priority, is_critical, boss_damage, is_recovery_quest, time_type, is_custom) VALUES
('ANGULAR_MASTERY', '[SKILL] Work on production Angular at TVM Infotech', 'SKILL', 150, 5, true, 40, false, 'DAILY', false);
INSERT INTO quest_stat_boosts (quest_id, stat_name, boost_value) VALUES ((SELECT id FROM quests WHERE quest_key = 'ANGULAR_MASTERY'), 'INT', 4), ((SELECT id FROM quests WHERE quest_key = 'ANGULAR_MASTERY'), 'PER', 3);
INSERT INTO quest_skill_boosts (quest_id, skill_name, boost_value) VALUES ((SELECT id FROM quests WHERE quest_key = 'ANGULAR_MASTERY'), 'Angular / JavaScript', 5), ((SELECT id FROM quests WHERE quest_key = 'ANGULAR_MASTERY'), 'Career', 2);

-- 43. NEW: MOCK_INTERVIEW_DAILY
INSERT INTO quests (quest_key, label, category, xp_reward, priority, is_critical, boss_damage, is_recovery_quest, time_type, is_custom) VALUES
('MOCK_INTERVIEW_DAILY', '[DAILY] Mock Interview: Answer 1 behavioral question on video', 'DAILY', 150, 5, true, 40, false, 'DAILY', false);
INSERT INTO quest_stat_boosts (quest_id, stat_name, boost_value) VALUES ((SELECT id FROM quests WHERE quest_key = 'MOCK_INTERVIEW_DAILY'), 'AGI', 5), ((SELECT id FROM quests WHERE quest_key = 'MOCK_INTERVIEW_DAILY'), 'INT', 2);
