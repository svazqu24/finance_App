-- ── bills table ──────────────────────────────────────────────────────────────
-- Stores recurring bills with per-month paid tracking.
-- paid_month: 'YYYY-MM' string when paid this month, NULL when unpaid.
-- Comparing paid_month to the current 'YYYY-MM' string at render time
-- gives automatic monthly resets with no cron job or database trigger needed.
--
-- Run this in your Supabase SQL editor (Dashboard → SQL Editor → New query).

CREATE TABLE bills (
  id          uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid          NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name        text          NOT NULL,
  amount      numeric(10,2) NOT NULL,
  due_day     smallint      NOT NULL CHECK (due_day BETWEEN 1 AND 31),
  cat         text          NOT NULL DEFAULT 'Utilities',
  paid_month  text,         -- 'YYYY-MM' if paid this month, NULL otherwise
  created_at  timestamptz   NOT NULL DEFAULT now()
);

-- Row-level security: each user can only see and modify their own bills.
ALTER TABLE bills ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own bills"
  ON bills FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own bills"
  ON bills FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own bills"
  ON bills FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own bills"
  ON bills FOR DELETE
  USING (auth.uid() = user_id);
