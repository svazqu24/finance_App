-- Run this in your Supabase SQL editor to add custom budget support
alter table budgets add column if not exists is_custom boolean default false;
alter table budgets add column if not exists custom_name text;
alter table budgets add column if not exists custom_emoji text;
alter table budgets add column if not exists match_type text default 'category';
alter table budgets add column if not exists match_value text;
