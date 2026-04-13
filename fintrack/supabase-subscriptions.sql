-- ── Add subscription support to bills table ───────────────────────────────────
-- Run in Supabase SQL Editor → New query.
-- Uses IF NOT EXISTS so it is safe to run multiple times.

ALTER TABLE bills
  ADD COLUMN IF NOT EXISTS is_subscription boolean DEFAULT false;

ALTER TABLE bills
  ADD COLUMN IF NOT EXISTS frequency text;           -- 'weekly' | 'biweekly' | 'monthly' | 'yearly'

ALTER TABLE bills
  ADD COLUMN IF NOT EXISTS next_due_date date;       -- next billing date for manual subscriptions
