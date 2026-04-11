-- Run this once in the Supabase SQL editor.
-- Creates the budgets and goals tables with per-user RLS.

-- ── budgets table ─────────────────────────────────────────────────────────────
-- Stores per-user custom monthly budget limits.
-- Only overrides are stored; categories with no row fall back to the hardcoded default.

CREATE TABLE IF NOT EXISTS budgets (
  id       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id  uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cat      text NOT NULL,
  budget   numeric(10,2) NOT NULL,
  UNIQUE (user_id, cat)
);

ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "budgets_select_own" ON budgets
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "budgets_insert_own" ON budgets
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "budgets_update_own" ON budgets
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "budgets_delete_own" ON budgets
  FOR DELETE USING (auth.uid() = user_id);


-- ── goals table ───────────────────────────────────────────────────────────────
-- Stores savings goals per user.

CREATE TABLE IF NOT EXISTS goals (
  id       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id  uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name     text NOT NULL,
  target   numeric(12,2) NOT NULL,
  saved    numeric(12,2) NOT NULL DEFAULT 0,
  monthly  numeric(10,2) NOT NULL DEFAULT 0,
  color    text NOT NULL DEFAULT '#185FA5',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "goals_select_own" ON goals
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "goals_insert_own" ON goals
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "goals_update_own" ON goals
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "goals_delete_own" ON goals
  FOR DELETE USING (auth.uid() = user_id);
