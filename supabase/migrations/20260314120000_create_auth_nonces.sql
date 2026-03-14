-- auth_nonces: stores used JWT login nonces to prevent replay attacks.
-- Each nonce is a random UUID issued by /api/auth/nonce, consumed on sign-in.
-- Expired rows are safe to prune; the index supports efficient cleanup.

CREATE TABLE IF NOT EXISTS auth_nonces (
    nonce       TEXT PRIMARY KEY,
    expires_at  TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS auth_nonces_expires_at_idx ON auth_nonces (expires_at);
