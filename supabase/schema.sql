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
  status text default 'AWAITING_DEPOSIT' check (status in ('AWAITING_DEPOSIT', 'PROCESSING', 'COMPLETED', 'FAILED', 'waiting', 'confirming', 'exchanging', 'sending', 'finished', 'failed', 'refunded', 'expired')), -- Added StealthEX statuses
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS)
alter table public.transactions enable row level security;

-- Create a policy to allow anyone to insert (since we are creating txs from public frontend/api)
create policy "Enable insert for all users" on public.transactions for insert with check (true);

-- Create a policy to allow reading by ID (for tracking pages)
create policy "Enable read access for all users" on public.transactions for select using (true);

-- APP SETTINGS
create table if not exists public.app_settings (
    key text primary key,
    value jsonb not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for settings
alter table public.app_settings enable row level security;

-- Allow read access for all (so API can generic read/write using service role mainly, but public read is fine for config if needed)
create policy "Enable read access for all users" on public.app_settings for select using (true);
create policy "Enable write access for service role" on public.app_settings for all using (true) with check (true);

-- Insert default commission
insert into public.app_settings (key, value) values ('commission_rate', '0.4') on conflict do nothing;
