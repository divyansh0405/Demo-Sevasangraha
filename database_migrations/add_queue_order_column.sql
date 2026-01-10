-- Add queue_order column to opd_queues table for manual ordering
ALTER TABLE opd_queues 
ADD COLUMN IF NOT EXISTS queue_order INTEGER DEFAULT 0;

-- Update existing records to have a default order based on creation time
WITH ordered_rows AS (
    SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) as rn
    FROM opd_queues
)
UPDATE opd_queues
SET queue_order = ordered_rows.rn
FROM ordered_rows
WHERE opd_queues.id = ordered_rows.id;
