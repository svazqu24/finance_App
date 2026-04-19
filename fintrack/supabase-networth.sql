create table net_worth_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  month text not null,
  accounts jsonb not null default '[]',
  total_assets numeric default 0,
  total_liabilities numeric default 0,
  net_worth numeric default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id, month)
);

alter table net_worth_entries enable row level security;

create policy "Users manage own net worth" on net_worth_entries
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);