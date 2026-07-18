ALTER TABLE player_stats RENAME COLUMN hor TO dis;

UPDATE quest_stat_boosts SET stat_name = 'DIS' WHERE stat_name = 'HOR';
