-- ============================================================================
-- Allow applicants to withdraw their own PENDING applications
-- ============================================================================
-- Business rule: an applicant may delete their own application only while
-- the collaboration is still OPEN (i.e., before the initiator has selected
-- a provider). Once the collaboration is ACTIVE the application record
-- serves as an audit trail and must not be deleted.
-- ============================================================================

CREATE POLICY "applications_delete_own_pending"
    ON collaboration_applications FOR DELETE
    USING (
        lower(applicant_id) = auth.wallet_address()
        AND EXISTS (
            SELECT 1 FROM collaborations
            WHERE collaborations.id = collab_id
            AND collaborations.status = 'OPEN'
        )
    );
