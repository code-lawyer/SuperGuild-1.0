-- VCP Settlements table — idempotency guard for VCP minting
-- Safe to run multiple times: uses IF NOT EXISTS / ADD COLUMN IF NOT EXISTS

-- Create table if it doesn't exist at all
CREATE TABLE IF NOT EXISTS vcp_settlements (
    id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Add columns if they don't exist (safe for existing tables with different schemas)
ALTER TABLE vcp_settlements ADD COLUMN IF NOT EXISTS settlement_key  TEXT;
ALTER TABLE vcp_settlements ADD COLUMN IF NOT EXISTS worker_address  TEXT;
ALTER TABLE vcp_settlements ADD COLUMN IF NOT EXISTS vcp_amount      NUMERIC;
ALTER TABLE vcp_settlements ADD COLUMN IF NOT EXISTS tx_hash         TEXT;

-- Add unique constraint on settlement_key if not already present
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'vcp_settlements_settlement_key_key'
    ) THEN
        ALTER TABLE vcp_settlements ADD CONSTRAINT vcp_settlements_settlement_key_key UNIQUE (settlement_key);
    END IF;
END $$;

-- Index for fast lookup by worker
CREATE INDEX IF NOT EXISTS idx_vcp_settlements_worker ON vcp_settlements(worker_address);
