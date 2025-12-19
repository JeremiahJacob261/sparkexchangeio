-- Create a table for transactions
create table public.transactions (
  id uuid default gen_random_uuid() primary key,
  changenow_id text,
  payin_address text,
  payout_address text,
  from_currency text,
  to_currency text,
  from_amount numeric,
  to_amount numeric,
  status text default 'AWAITING_DEPOSIT' check (status in ('AWAITING_DEPOSIT', 'PROCESSING', 'COMPLETED', 'FAILED')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS)
alter table public.transactions enable row level security;

-- Create a policy to allow anyone to insert (since we are creating txs from public frontend/api)
-- In a real app, you might want to restrict this or use a service role key on the backend
create policy "Enable insert for all users" on public.transactions for insert with check (true);

-- Create a policy to allow reading by ID (for tracking pages)
create policy "Enable read access for all users" on public.transactions for select using (true);
