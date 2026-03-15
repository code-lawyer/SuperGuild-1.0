-- Atomic RPC for incrementing slots_taken on broadcast collaborations.
-- Applied to Supabase on 2026-03-15; this file is the local copy.
CREATE OR REPLACE FUNCTION increment_collab_slot(p_collab_id UUID, p_max_providers INT)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_new_slots_taken INT;
BEGIN
  UPDATE collaborations
  SET slots_taken = slots_taken + 1
  WHERE id = p_collab_id
    AND slots_taken < p_max_providers
    AND status != 'FULLY_BOOKED'
  RETURNING slots_taken INTO v_new_slots_taken;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'No available slots for this collaboration';
  END IF;

  IF v_new_slots_taken >= p_max_providers THEN
    UPDATE collaborations SET status = 'FULLY_BOOKED' WHERE id = p_collab_id;
  END IF;

  RETURN jsonb_build_object(
    'slots_taken', v_new_slots_taken,
    'is_fully_booked', v_new_slots_taken >= p_max_providers
  );
END;
$$;
