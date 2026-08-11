-- V10: Fix NULL values in quests.is_active
-- Previous migrations (V1, V2, V9) did not set a default value for is_active,
-- causing it to be NULL for seeded quests. This causes Hibernate to throw 
-- IllegalArgumentException when mapping to the primitive boolean 'active' field.

UPDATE quests SET is_active = true WHERE is_active IS NULL;

ALTER TABLE quests 
    ALTER COLUMN is_active SET DEFAULT true,
    ALTER COLUMN is_active SET NOT NULL;
