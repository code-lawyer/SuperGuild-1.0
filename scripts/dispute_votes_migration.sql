-- ============================================
-- SuperGuild: Dispute Votes Table
-- Run in Supabase SQL Editor
-- ============================================

-- Stores on-chain dispute vote records from Hand of Justice holders
CREATE TABLE IF NOT EXISTS dispute_votes (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  collab_id       TEXT NOT NULL,          -- collaboration UUID (references collaborations.id)
  milestone_id    TEXT NOT NULL,          -- milestone UUID (references milestones.id)
  voter_address   TEXT NOT NULL,          -- Hand of Justice NFT holder wallet
  worker_won      BOOLEAN NOT NULL,       -- true = side with worker, false = side with publisher
  reason          TEXT,                   -- optional justification
  created_at      TIMESTAMPTZ DEFAULT NOW(),

  -- One vote per person per milestone dispute
  UNIQUE(milestone_id, voter_address)
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_dispute_votes_collab ON dispute_votes(collab_id);
CREATE INDEX IF NOT EXISTS idx_dispute_votes_milestone ON dispute_votes(milestone_id);

-- RLS: open read/write (anon key, testnet only — tighten before mainnet)
ALTER TABLE dispute_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read dispute votes"
  ON dispute_votes FOR SELECT USING (true);

CREATE POLICY "Anyone can insert dispute votes"
  ON dispute_votes FOR INSERT WITH CHECK (true);
