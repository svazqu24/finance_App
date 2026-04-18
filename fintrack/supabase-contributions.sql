create table goal_contributions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  goal_id uuid references goals(id) on delete cascade,
  amount numeric not null,
  note text,
  date date default current_date,
  created_at timestamptz default now()
);

alter table goal_contributions enable row level security;

create policy "Users manage own contributions" on goal_contributions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
