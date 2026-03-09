-- Add PENDING_APPROVAL and CANCELLED to collab_status enum if missing
-- These states are used by the dual payment mode flow

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'PENDING_APPROVAL' AND enumtypid = 'collab_status'::regtype) THEN
    ALTER TYPE collab_status ADD VALUE 'PENDING_APPROVAL';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'CANCELLED' AND enumtypid = 'collab_status'::regtype) THEN
    ALTER TYPE collab_status ADD VALUE 'CANCELLED';
  END IF;
END$$;
