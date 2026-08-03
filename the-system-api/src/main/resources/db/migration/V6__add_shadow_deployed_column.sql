-- Add 'deployed' and 'expedition_end_time' columns to shadows table.
-- Hibernate ddl-auto:update tried to add deployed as NOT NULL without a default,
-- causing PSQLException on existing rows. This migration handles it safely.

ALTER TABLE shadows
    ADD COLUMN IF NOT EXISTS deployed BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE shadows
    ADD COLUMN IF NOT EXISTS expedition_end_time TIMESTAMP;
