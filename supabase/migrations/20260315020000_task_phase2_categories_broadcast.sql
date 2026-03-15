-- 1. Category + Tags
ALTER TABLE collaborations
  ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'other',
  ADD COLUMN IF NOT EXISTS tags TEXT[] NOT NULL DEFAULT '{}';

CREATE INDEX IF NOT EXISTS idx_collabs_category ON collaborations(category);
CREATE INDEX IF NOT EXISTS idx_collabs_tags ON collaborations USING GIN(tags);

-- 2. Broadcast (multi-slot) mode
ALTER TABLE collaborations
  ADD COLUMN IF NOT EXISTS slot_budget NUMERIC,
  ADD COLUMN IF NOT EXISTS max_providers INT NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS slots_taken INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS parent_collab_id UUID REFERENCES collaborations(id);

CREATE INDEX IF NOT EXISTS idx_collabs_parent ON collaborations(parent_collab_id);

-- 3. Back-fill existing rows
UPDATE collaborations
SET slot_budget = total_budget
WHERE slot_budget IS NULL;
