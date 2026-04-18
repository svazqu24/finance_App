-- Credit Cards table for tracking credit card due dates and balances
-- This is the #1 most-requested Mint replacement feature

create table credit_cards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  name text not null,
  last_four text,
  credit_limit numeric,
  current_balance numeric default 0,
  statement_balance numeric default 0,
  minimum_payment numeric default 0,
  due_day integer not null,
  paid_month text,
  created_at timestamptz default now()
);

-- Enable RLS
alter table credit_cards enable row level security;

-- RLS Policies
create policy "Users can view their own credit cards"
  on credit_cards for select
  using (auth.uid() = user_id);

create policy "Users can insert their own credit cards"
  on credit_cards for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own credit cards"
  on credit_cards for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own credit cards"
  on credit_cards for delete
  using (auth.uid() = user_id);