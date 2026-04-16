-- ── Add dismissed_subscriptions to user_preferences ──────────────────────────
-- Run in Supabase SQL Editor → New query.
-- Adds column to store dismissed auto-detected subscriptions as JSON array.

ALTER TABLE user_preferences
  ADD COLUMN IF NOT EXISTS dismissed_subscriptions jsonb DEFAULT '[]'::jsonb;

-- Also add onboarding_complete if not exists (for consistency)
ALTER TABLE user_preferences
  ADD COLUMN IF NOT EXISTS onboarding_complete boolean DEFAULT false;

-- Also add category_colors if not exists
ALTER TABLE user_preferences
  ADD COLUMN IF NOT EXISTS category_colors jsonb;