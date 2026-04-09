-- Run this once in the Supabase SQL editor for your project.
-- It adds user_id to the transactions table and enables row-level security
-- so each user can only read and write their own rows.

-- 1. Add user_id column (references the Supabase auth.users table)
ALTER TABLE transactions
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- 2. Enable Row Level Security
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- 3. Policy: users can SELECT only their own rows
CREATE POLICY "select_own_transactions"
  ON transactions
  FOR SELECT
  USING (auth.uid() = user_id);

-- 4. Policy: users can INSERT only rows they own
CREATE POLICY "insert_own_transactions"
  ON transactions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 5. Policy: users can DELETE only their own rows (optional but good to have)
CREATE POLICY "delete_own_transactions"
  ON transactions
  FOR DELETE
  USING (auth.uid() = user_id);
