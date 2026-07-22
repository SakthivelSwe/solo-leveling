ALTER TABLE quests ADD COLUMN min_level INTEGER DEFAULT 1;

-- Level 3 Requirements
UPDATE quests SET min_level = 3 WHERE quest_key IN ('CODE_NO_AI', 'LEETCODE');

-- Level 5 Requirements 
UPDATE quests SET min_level = 5 WHERE quest_key IN ('SYSTEM_DESIGN', 'ANGULAR_BUILD', 'MOCK_INTERVIEW');

-- Level 10 Requirements
UPDATE quests SET min_level = 10 WHERE quest_key IN ('SYSTEM_DESIGN_DOC', 'ANGULAR_MASTERY', 'MOCK_INTERVIEW_DAILY', 'WEEKLY_LEETCODE_5', 'MONTHLY_LEETCODE_20', 'MONTHLY_JOB_APPS');
