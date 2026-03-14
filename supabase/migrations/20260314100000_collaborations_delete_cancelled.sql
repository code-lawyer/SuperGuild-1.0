-- Allow initiator to DELETE their own CANCELLED collaborations
CREATE POLICY "collaborations_delete_cancelled_initiator"
  ON collaborations FOR DELETE
  USING (
    lower(initiator_id) = lower(auth.jwt()->>'wallet_address')
    AND status = 'CANCELLED'
  );
