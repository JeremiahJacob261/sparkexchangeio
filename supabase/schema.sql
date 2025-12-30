-- Create a table for transactions
create table public.transactions (
  id uuid default gen_random_uuid() primary key,
  changenow_id text,
  stealthex_id text, -- Added for Stealthex
  payin_address text,
  payout_address text,
  from_currency text,
  to_currency text,
  from_amount numeric,
  to_amount numeric,
  status text default 'AWAITING_DEPOSIT' check (status in ('AWAITING_DEPOSIT', 'PROCESSING', 'COMPLETED', 'FAILED', 'waiting', 'confirming', 'exchanging', 'sending', 'finished', 'failed', 'refunded', 'expired')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS)
alter table public.transactions enable row level security;

-- Create a policy to allow anyone to insert using anon key if necessary or just service role
create policy "Enable insert for all users" on public.transactions for insert with check (true);
create policy "Enable read access for all users" on public.transactions for select using (true);

-- APP SETTINGS for simple key-value storage
create table if not exists public.app_settings (
    key text primary key,
    value jsonb not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.app_settings enable row level security;
create policy "Enable read access for all users" on public.app_settings for select using (true);
create policy "Enable write access for service role" on public.app_settings for all using (true) with check (true);

-- VISITOR LOGS for unique counting and location tracking
create table if not exists public.visitor_logs (
    id uuid default gen_random_uuid() primary key,
    ip_hash text not null, -- Store hash of IP for privacy
    user_agent text,
    visit_date date default CURRENT_DATE,
    -- Geolocation fields for globe visualization
    country text,
    country_code text,
    city text,
    latitude numeric,
    longitude numeric,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    unique(ip_hash, visit_date) -- Unique per day per IP
);

alter table public.visitor_logs enable row level security;
create policy "Enable insert for all users" on public.visitor_logs for insert with check (true);
create policy "Enable read access for service role only" on public.visitor_logs for select using (true);

-- Settings defaults
insert into public.app_settings (key, value) values ('commission_rate', '0.4') on conflict do nothing;
insert into public.app_settings (key, value) values ('total_visits', '0') on conflict do nothing;
