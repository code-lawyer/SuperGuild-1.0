-- ============================================================================
-- Phase 11.5 Security Hardening: Notifications INSERT → service_role only
-- ============================================================================
-- Problem: The previous policy allowed any authenticated user to INSERT
-- notifications for ANY user (potential spam attack vector).
-- Fix: Remove the authenticated INSERT policy. All notification creation
-- now goes through /api/notifications/create (server-side, service_role).
-- ============================================================================

-- Drop the overly permissive INSERT policy
DROP POLICY IF EXISTS "notifications_insert_authenticated" ON notifications;

-- No replacement INSERT policy for authenticated users — service_role bypasses RLS
-- All notification inserts must go through the server-side API route.
