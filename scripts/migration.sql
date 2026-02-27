-- ============================================
-- SuperGuild Feature Overhaul Migration
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. Extend profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS contact_email TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS contact_telegram TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS portfolio TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS profile_completed BOOLEAN DEFAULT FALSE;

-- 2. Extend collaborations table
ALTER TABLE collaborations ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE collaborations ADD COLUMN IF NOT EXISTS reference_links JSONB DEFAULT '[]'::jsonb;
ALTER TABLE collaborations ADD COLUMN IF NOT EXISTS deadline DATE;
ALTER TABLE collaborations ADD COLUMN IF NOT EXISTS delivery_standard TEXT;
ALTER TABLE collaborations ADD COLUMN IF NOT EXISTS pending_provider_id TEXT;

-- 3. Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_address TEXT NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast notification queries
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_address, is_read, created_at DESC);

-- RLS for notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own notifications"
  ON notifications FOR SELECT
  USING (true);

CREATE POLICY "Users can insert notifications"
  ON notifications FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  USING (true);
