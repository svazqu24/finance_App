-- ── user_preferences table ───────────────────────────────────────────────────
-- One row per user. Upsert on user_id (unique constraint acts as conflict target).
-- Run in Supabase SQL Editor → New query.

CREATE TABLE user_preferences (
  id           uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid    REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  dark_mode    boolean DEFAULT true,
  compact_view boolean DEFAULT false,
  layout_style text    DEFAULT 'single',
  nav_position text    DEFAULT 'top',
  currency     text    DEFAULT 'USD',
  dismissed_subscriptions jsonb DEFAULT '[]'::jsonb,
  updated_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own preferences"
  ON user_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences"
  ON user_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences"
  ON user_preferences FOR UPDATE
  USING (auth.uid() = user_id);
