-- ── Add onboarding_complete to user_preferences ──────────────────────────────
-- Run in Supabase SQL Editor → New query.

ALTER TABLE user_preferences
  ADD COLUMN IF NOT EXISTS onboarding_complete boolean DEFAULT false;
