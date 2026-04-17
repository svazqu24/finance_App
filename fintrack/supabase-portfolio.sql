-- ── Watchlist ──────────────────────────────────────────────────────────────────
create table if not exists watchlist (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid references auth.users(id) on delete cascade not null,
  symbol       text not null,
  company_name text,
  created_at   timestamptz default now()
);

-- Prevent duplicate tickers per user
create unique index if not exists watchlist_user_symbol
  on watchlist (user_id, symbol);

-- RLS
alter table watchlist enable row level security;

create policy "Users can read own watchlist"
  on watchlist for select using (auth.uid() = user_id);

create policy "Users can insert own watchlist"
  on watchlist for insert with check (auth.uid() = user_id);

create policy "Users can delete own watchlist"
  on watchlist for delete using (auth.uid() = user_id);

-- ── Holdings ───────────────────────────────────────────────────────────────────
create table if not exists holdings (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid references auth.users(id) on delete cascade not null,
  symbol         text not null,
  company_name   text,
  shares         numeric not null check (shares > 0),
  avg_buy_price  numeric not null check (avg_buy_price >= 0),
  created_at     timestamptz default now()
);

-- RLS
alter table holdings enable row level security;

create policy "Users can read own holdings"
  on holdings for select using (auth.uid() = user_id);

create policy "Users can insert own holdings"
  on holdings for insert with check (auth.uid() = user_id);

create policy "Users can update own holdings"
  on holdings for update using (auth.uid() = user_id);

create policy "Users can delete own holdings"
  on holdings for delete using (auth.uid() = user_id);
