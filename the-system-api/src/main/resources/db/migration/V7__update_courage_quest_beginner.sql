-- V7: Update COURAGE_OF_THE_WEAK quest to beginner-friendly exercises.
-- The original quest demanded "10 Push-ups" which is impossible for a true beginner.
-- Wall Push-ups are scientifically the correct starting point for zero-strength beginners.
-- This keeps the same XP/boosts but uses exercises anyone can actually do.

UPDATE quests
SET label = '[DAILY] Beginner Training: 10 Wall Push-ups, 10 Knee Sit-ups, 10 Squats, 10-min Walk (Courage of the Weak)'
WHERE quest_key = 'COURAGE_OF_THE_WEAK';
