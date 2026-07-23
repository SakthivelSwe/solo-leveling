ALTER TABLE learning_logs 
  ADD COLUMN IF NOT EXISTS devmastery_topic_id varchar(36),
  ADD COLUMN IF NOT EXISTS platform_name varchar(100);
