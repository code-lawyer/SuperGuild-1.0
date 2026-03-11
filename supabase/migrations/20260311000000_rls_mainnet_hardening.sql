-- ============================================================================
-- SuperGuild Phase 11.5: RLS Mainnet Hardening
-- ============================================================================
-- This migration enables Row Level Security on all core tables.
--
-- JWT context: auth.jwt()->>'wallet_address' is set by /api/auth/wallet.
-- Supabase anon key requests without JWT get NULL wallet_address → blocked.
-- Service role (supabaseAdmin) bypasses RLS entirely.
-- ============================================================================

-- Helper: extract wallet address from JWT (returns lowercase or NULL)
CREATE OR REPLACE FUNCTION auth.wallet_address()
RETURNS TEXT
LANGUAGE sql STABLE
AS $$
  SELECT lower(auth.jwt()->>'wallet_address');
$$;

-- ============================================================================
-- 1. COLLABORATIONS
-- ============================================================================
ALTER TABLE collaborations ENABLE ROW LEVEL SECURITY;

-- Anyone can read (marketplace is public)
CREATE POLICY "collaborations_select_public"
  ON collaborations FOR SELECT USING (true);

-- Only authenticated users can create (as initiator)
CREATE POLICY "collaborations_insert_own"
  ON collaborations FOR INSERT
  WITH CHECK (lower(initiator_id) = auth.wallet_address());

-- Initiator can update own collaborations (status transitions, approve/reject)
CREATE POLICY "collaborations_update_initiator"
  ON collaborations FOR UPDATE
  USING (lower(initiator_id) = auth.wallet_address());

-- Provider can update collaborations they are assigned to
-- (for abandon: sets provider_id to null, status to OPEN)
CREATE POLICY "collaborations_update_provider"
  ON collaborations FOR UPDATE
  USING (lower(provider_id) = auth.wallet_address());

-- Pending provider can update (for apply: sets pending_provider_id)
CREATE POLICY "collaborations_update_pending"
  ON collaborations FOR UPDATE
  USING (
    status = 'OPEN'
    AND auth.wallet_address() IS NOT NULL
  );

-- ============================================================================
-- 2. MILESTONES
-- ============================================================================
ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;

-- Anyone can read milestones
CREATE POLICY "milestones_select_public"
  ON milestones FOR SELECT USING (true);

-- Insert: only when creating a collaboration (initiator inserts milestones)
CREATE POLICY "milestones_insert_by_initiator"
  ON milestones FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM collaborations
      WHERE collaborations.id = collab_id
      AND lower(collaborations.initiator_id) = auth.wallet_address()
    )
  );

-- Update: provider submits proof (INCOMPLETE → SUBMITTED)
-- or initiator confirms (SUBMITTED → CONFIRMED)
CREATE POLICY "milestones_update_by_participants"
  ON milestones FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM collaborations
      WHERE collaborations.id = collab_id
      AND (
        lower(collaborations.initiator_id) = auth.wallet_address()
        OR lower(collaborations.provider_id) = auth.wallet_address()
      )
    )
  );

-- ============================================================================
-- 3. PROOFS (append-only: INSERT only, no UPDATE/DELETE)
-- ============================================================================
ALTER TABLE proofs ENABLE ROW LEVEL SECURITY;

-- Anyone can read proofs (transparency)
CREATE POLICY "proofs_select_public"
  ON proofs FOR SELECT USING (true);

-- Only the submitter can insert, and only for milestones they are provider of
CREATE POLICY "proofs_insert_by_provider"
  ON proofs FOR INSERT
  WITH CHECK (
    lower(submitter_id) = auth.wallet_address()
    AND EXISTS (
      SELECT 1 FROM milestones
      JOIN collaborations ON collaborations.id = milestones.collab_id
      WHERE milestones.id = milestone_id
      AND lower(collaborations.provider_id) = auth.wallet_address()
    )
  );

-- No UPDATE or DELETE policies = proofs are truly immutable

-- ============================================================================
-- 4. COLLABORATION_APPLICATIONS
-- ============================================================================
ALTER TABLE collaboration_applications ENABLE ROW LEVEL SECURITY;

-- Anyone can read applications for public collaborations
CREATE POLICY "applications_select_public"
  ON collaboration_applications FOR SELECT USING (true);

-- Applicant can create their own application
CREATE POLICY "applications_insert_own"
  ON collaboration_applications FOR INSERT
  WITH CHECK (lower(applicant_id) = auth.wallet_address());

-- Initiator of the collaboration can update application status (accept/reject)
CREATE POLICY "applications_update_by_initiator"
  ON collaboration_applications FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM collaborations
      WHERE collaborations.id = collab_id
      AND lower(collaborations.initiator_id) = auth.wallet_address()
    )
  );

-- ============================================================================
-- 5. PIONEER_CODES (only service_role writes — API routes use supabaseAdmin)
-- ============================================================================
ALTER TABLE pioneer_codes ENABLE ROW LEVEL SECURITY;

-- Anyone can read (to check remaining slots)
CREATE POLICY "pioneer_codes_select_public"
  ON pioneer_codes FOR SELECT USING (true);

-- No INSERT/UPDATE/DELETE for anon/authenticated — all writes via service_role

-- ============================================================================
-- 6. BULLETINS (public read, service_role write for admin/pioneer posts)
-- ============================================================================
ALTER TABLE bulletins ENABLE ROW LEVEL SECURITY;

-- Anyone can read bulletins
CREATE POLICY "bulletins_select_public"
  ON bulletins FOR SELECT USING (true);

-- No INSERT/UPDATE/DELETE for anon/authenticated — all writes via service_role API routes

-- ============================================================================
-- 7. BULLETIN_ATTACHMENTS
-- ============================================================================
ALTER TABLE bulletin_attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "bulletin_attachments_select_public"
  ON bulletin_attachments FOR SELECT USING (true);

-- No INSERT/UPDATE/DELETE for anon/authenticated — service_role only

-- ============================================================================
-- 8. SERVICES (admin-only writes via service_role)
-- ============================================================================
ALTER TABLE services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "services_select_public"
  ON services FOR SELECT USING (true);

-- No INSERT/UPDATE/DELETE for anon/authenticated — admin API uses service_role

-- ============================================================================
-- 9. SERVICE_ACCESS
-- ============================================================================
ALTER TABLE service_access ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_access_select_own"
  ON service_access FOR SELECT
  USING (lower(user_address) = auth.wallet_address());

-- No INSERT for anon/authenticated — written by payment verification API (service_role)

-- ============================================================================
-- 10. PROFILES
-- ============================================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Anyone can read profiles (public directory)
CREATE POLICY "profiles_select_public"
  ON profiles FOR SELECT USING (true);

-- Users can insert their own profile
CREATE POLICY "profiles_insert_own"
  ON profiles FOR INSERT
  WITH CHECK (lower(wallet_address) = auth.wallet_address());

-- Users can update only their own profile
CREATE POLICY "profiles_update_own"
  ON profiles FOR UPDATE
  USING (lower(wallet_address) = auth.wallet_address());

-- ============================================================================
-- 11. NOTIFICATIONS
-- ============================================================================
-- Drop existing permissive policies and replace with proper ones
DROP POLICY IF EXISTS "Users can read own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can insert notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;

CREATE POLICY "notifications_select_own"
  ON notifications FOR SELECT
  USING (lower(user_address) = auth.wallet_address());

-- INSERT: authenticated users can create notifications (for others)
CREATE POLICY "notifications_insert_authenticated"
  ON notifications FOR INSERT
  WITH CHECK (auth.wallet_address() IS NOT NULL);

-- UPDATE: users can mark their own notifications as read
CREATE POLICY "notifications_update_own"
  ON notifications FOR UPDATE
  USING (lower(user_address) = auth.wallet_address());

-- ============================================================================
-- 12. DISPUTE_VOTES (now handled by API route with NFT gate)
-- ============================================================================
-- Drop existing permissive policies
DROP POLICY IF EXISTS "Anyone can read dispute votes" ON dispute_votes;
DROP POLICY IF EXISTS "Anyone can insert dispute votes" ON dispute_votes;

-- Anyone can read votes (transparency)
CREATE POLICY "dispute_votes_select_public"
  ON dispute_votes FOR SELECT USING (true);

-- No INSERT for anon/authenticated — all writes via service_role API route
-- (which verifies Token #4 NFT before writing)

-- ============================================================================
-- 13. USER_MEDALS (service_role only writes)
-- ============================================================================
ALTER TABLE user_medals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_medals_select_public"
  ON user_medals FOR SELECT USING (true);

-- No INSERT/UPDATE/DELETE — only contract event indexer (service_role) writes

-- ============================================================================
-- 14. VCP_SETTLEMENTS (service_role only writes)
-- ============================================================================
ALTER TABLE vcp_settlements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "vcp_settlements_select_public"
  ON vcp_settlements FOR SELECT USING (true);

-- No INSERT — only AI Oracle backend (service_role) writes

-- ============================================================================
-- 15. PROPOSALS / PROPOSAL_VOTES / PROPOSAL_COSIGNERS
-- ============================================================================
ALTER TABLE proposals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "proposals_select_public"
  ON proposals FOR SELECT USING (true);

CREATE POLICY "proposals_insert_authenticated"
  ON proposals FOR INSERT
  WITH CHECK (lower(proposer_address) = auth.wallet_address());

CREATE POLICY "proposals_update_by_proposer"
  ON proposals FOR UPDATE
  USING (lower(proposer_address) = auth.wallet_address());

-- ---

ALTER TABLE proposal_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "proposal_votes_select_public"
  ON proposal_votes FOR SELECT USING (true);

CREATE POLICY "proposal_votes_insert_own"
  ON proposal_votes FOR INSERT
  WITH CHECK (lower(voter_address) = auth.wallet_address());

-- ---

ALTER TABLE proposal_cosigners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "proposal_cosigners_select_public"
  ON proposal_cosigners FOR SELECT USING (true);

CREATE POLICY "proposal_cosigners_insert_own"
  ON proposal_cosigners FOR INSERT
  WITH CHECK (lower(cosigner_address) = auth.wallet_address());
