ALTER TABLE bulletins
  ADD COLUMN IF NOT EXISTS squad_signal_meta JSONB;

COMMENT ON COLUMN bulletins.squad_signal_meta IS
  'Populated only when category = ''squad_signal''. Contains parent_collab_id, parent_collab_title, and roles array.';
