-- Add metadata column for category-specific details
ALTER TABLE ads
  ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

