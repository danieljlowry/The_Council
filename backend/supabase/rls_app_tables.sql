-- The Council — RLS for council data (run in Supabase SQL Editor).
--
-- Prerequisite: profiles RLS + policies from handle_new_user.sql (select/update own row).
--
-- Model: everything hangs off councils.owner_id = auth.uid().
-- Use AFTER you have run the Prisma migration so these tables exist.
--
-- Who this affects:
--   - Supabase JS client / PostgREST with the user's JWT → policies apply.
--   - Direct Postgres (e.g. Prisma with DATABASE_URL as superuser) → typically bypasses RLS.

-- --- councils ---
alter table public.councils enable row level security;

drop policy if exists "councils_owner_all" on public.councils;
create policy "councils_owner_all"
  on public.councils
  for all
  to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

-- --- council_agents ---
alter table public.council_agents enable row level security;

drop policy if exists "council_agents_via_council" on public.council_agents;
create policy "council_agents_via_council"
  on public.council_agents
  for all
  to authenticated
  using (
    exists (
      select 1
      from public.councils c
      where c.id = council_agents.council_id
        and c.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.councils c
      where c.id = council_agents.council_id
        and c.owner_id = auth.uid()
    )
  );

-- --- council_rounds ---
alter table public.council_rounds enable row level security;

drop policy if exists "council_rounds_via_council" on public.council_rounds;
create policy "council_rounds_via_council"
  on public.council_rounds
  for all
  to authenticated
  using (
    exists (
      select 1
      from public.councils c
      where c.id = council_rounds.council_id
        and c.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.councils c
      where c.id = council_rounds.council_id
        and c.owner_id = auth.uid()
    )
  );

-- --- debate_messages ---
alter table public.debate_messages enable row level security;

drop policy if exists "debate_messages_owner_all" on public.debate_messages;
create policy "debate_messages_owner_all"
  on public.debate_messages
  for all
  to authenticated
  using (
    exists (
      select 1
      from public.councils c
      where c.id = debate_messages.council_id
        and c.owner_id = auth.uid()
    )
    and exists (
      select 1
      from public.council_rounds cr
      where cr.id = debate_messages.round_id
        and cr.council_id = debate_messages.council_id
    )
    and (
      debate_messages.council_agent_id is null
      or exists (
        select 1
        from public.council_agents ca
        where ca.id = debate_messages.council_agent_id
          and ca.council_id = debate_messages.council_id
      )
    )
  )
  with check (
    exists (
      select 1
      from public.councils c
      where c.id = debate_messages.council_id
        and c.owner_id = auth.uid()
    )
    and exists (
      select 1
      from public.council_rounds cr
      where cr.id = debate_messages.round_id
        and cr.council_id = debate_messages.council_id
    )
    and (
      debate_messages.council_agent_id is null
      or exists (
        select 1
        from public.council_agents ca
        where ca.id = debate_messages.council_agent_id
          and ca.council_id = debate_messages.council_id
      )
    )
  );
