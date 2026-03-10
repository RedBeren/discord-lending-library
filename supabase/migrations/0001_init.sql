-- Enable fuzzy search extension
create extension if not exists pg_trgm;

-- Members (linked to Supabase auth.users)
create table public.members (
  id uuid primary key references auth.users(id) on delete cascade,
  discord_id text not null unique,
  discord_username text not null
);

alter table public.members enable row level security;

create policy "Members are viewable by authenticated users"
  on public.members for select
  to authenticated
  using (true);

create policy "Members can upsert their own record"
  on public.members for insert
  to authenticated
  with check (id = auth.uid());

create policy "Members can update their own record"
  on public.members for update
  to authenticated
  using (id = auth.uid());

-- Books catalog (shared, not user-specific)
create table public.books (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  author text not null,
  isbn_13 text unique,
  cover_url text,
  avg_rating numeric(3, 1),
  description text,
  year_published int,
  google_id text unique
);

alter table public.books enable row level security;

create policy "Books are viewable by authenticated users"
  on public.books for select
  to authenticated
  using (true);

-- Trigram index for fast fuzzy title search
create index books_title_trgm_idx on public.books using gin (title gin_trgm_ops);

-- Listings (a member offering a specific book)
create table public.listings (
  id uuid primary key default gen_random_uuid(),
  book_id uuid not null references public.books(id) on delete cascade,
  offered_by uuid not null references public.members(id) on delete cascade,
  status text not null default 'available' check (status in ('available', 'claimed', 'completed')),
  created_at timestamptz not null default now(),
  pickup_notes text
);

alter table public.listings enable row level security;

create policy "Listings are viewable by authenticated users"
  on public.listings for select
  to authenticated
  using (true);

create policy "Members can create their own listings"
  on public.listings for insert
  to authenticated
  with check (offered_by = auth.uid());

create policy "Members can update their own listings"
  on public.listings for update
  to authenticated
  using (offered_by = auth.uid());

create index listings_status_idx on public.listings(status);
create index listings_offered_by_idx on public.listings(offered_by);

-- Claims (a member claiming an available listing)
create table public.claims (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  claimant_member_id uuid not null references public.members(id) on delete cascade,
  claimed_at timestamptz not null default now(),
  unique (listing_id) -- one claim per listing
);

alter table public.claims enable row level security;

create policy "Claims are viewable by authenticated users"
  on public.claims for select
  to authenticated
  using (true);

create policy "Members can insert their own claims"
  on public.claims for insert
  to authenticated
  with check (claimant_member_id = auth.uid());

create index claims_listing_id_idx on public.claims(listing_id);
