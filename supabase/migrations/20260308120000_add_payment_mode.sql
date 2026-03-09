-- Add payment_mode to collaborations
-- 'self_managed': DirectPay contract (MVP default)
-- 'guild_managed': GuildEscrow contract (V2, not yet open)

ALTER TABLE collaborations
  ADD COLUMN IF NOT EXISTS payment_mode TEXT
    NOT NULL DEFAULT 'self_managed'
    CHECK (payment_mode IN ('self_managed', 'guild_managed'));

COMMENT ON COLUMN collaborations.payment_mode IS
  'Payment settlement mode: self_managed (DirectPay, 50% VCP) or guild_managed (GuildEscrow, 100% VCP)';
