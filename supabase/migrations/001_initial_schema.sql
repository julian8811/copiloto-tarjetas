-- Copiloto Tarjetas — initial schema with RLS

create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  created_at timestamptz default now()
);

create table if not exists public.cards (
  id text primary key,
  user_id uuid references auth.users on delete cascade not null,
  bank text not null,
  franchise text not null,
  name text,
  last4 text not null,
  limit_amount bigint not null,
  theme text default 'teal',
  cut_day int default 22,
  pay_day int default 7,
  holder text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.transactions (
  id text primary key,
  user_id uuid references auth.users on delete cascade not null,
  card_id text references public.cards(id) on delete cascade,
  name text not null,
  cat text,
  amount bigint not null,
  date date not null,
  cuotas int default 1,
  cuota_num int default 1,
  note text default '',
  created_at timestamptz default now()
);

create table if not exists public.dismissed_alerts (
  user_id uuid references auth.users on delete cascade not null,
  alert_id text not null,
  primary key (user_id, alert_id)
);

alter table public.profiles enable row level security;
alter table public.cards enable row level security;
alter table public.transactions enable row level security;
alter table public.dismissed_alerts enable row level security;

create policy "profiles_select_own" on public.profiles for select using (auth.uid() = id);
create policy "profiles_insert_own" on public.profiles for insert with check (auth.uid() = id);
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id);

create policy "cards_all_own" on public.cards for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "transactions_all_own" on public.transactions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "dismissed_alerts_all_own" on public.dismissed_alerts for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email) values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
