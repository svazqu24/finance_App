-- Add account column to transactions table for account labels
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS account text;