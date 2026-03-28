-- Run once in Supabase: Dashboard → SQL Editor → New query → Paste → Run.
-- Creates a profile row whenever a user signs up (auth.users insert).
--
-- If you already ran an older version, run the ALTER below, then re-run the function + trigger block.

alter table public.profiles
  alter column updated_at set default current_timestamp;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Prisma created updated_at NOT NULL without DEFAULT; must set timestamps here.
  insert into public.profiles (id, email, full_name, created_at, updated_at)
  values (
    new.id,
    new.email,
    nullif(trim(coalesce(new.raw_user_meta_data->>'full_name', '')), ''),
    now(),
    now()
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute procedure public.handle_new_user();

-- Optional: tighten who can read/update profiles (adjust if you use service role from backend only)
alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
  on public.profiles for select
  to authenticated
  using (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- No insert/update/delete policies for anon; inserts come from the trigger (security definer).
