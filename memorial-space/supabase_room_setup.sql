-- Supabase room/member setup for memorial-space
-- Run this in the Supabase SQL editor after the `rooms` table exists.

create extension if not exists pgcrypto;

drop policy if exists "rooms_select_owner_or_member" on public.rooms;
drop policy if exists "rooms_insert_owner_only" on public.rooms;
drop policy if exists "rooms_update_owner_only" on public.rooms;
drop policy if exists "rooms_delete_owner_only" on public.rooms;
drop policy if exists "room_members_select_owner_or_self" on public.room_members;
drop policy if exists "room_members_insert_owner_or_self" on public.room_members;
drop policy if exists "room_members_update_owner_or_self" on public.room_members;
drop policy if exists "room_members_delete_owner_or_self" on public.room_members;
drop function if exists public.is_room_member(uuid);

create or replace function public.is_room_member(p_room_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.room_members rm
    where rm.room_id = p_room_id
      and (
        rm.user_id = auth.uid()
        or rm.email = auth.email()
      )
  );
$$;

create table if not exists public.room_members (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  email text not null,
  role text not null default 'editor',
  display_name text,
  avatar text,
  onboarded boolean not null default true,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  unique (room_id, email)
);

alter table public.rooms enable row level security;
alter table public.room_members enable row level security;

-- Rooms policies
create policy "rooms_select_owner_or_member"
  on public.rooms
  for select
  to authenticated
  using (
    owner_id = auth.uid()
    or public.is_room_member(public.rooms.id)
  );

create policy "rooms_insert_owner_only"
  on public.rooms
  for insert
  to authenticated
  with check (owner_id = auth.uid());

create policy "rooms_update_owner_only"
  on public.rooms
  for update
  to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

create policy "rooms_delete_owner_only"
  on public.rooms
  for delete
  to authenticated
  using (owner_id = auth.uid());

-- Room members policies
create policy "room_members_select_owner_or_self"
  on public.room_members
  for select
  to authenticated
  using (
    user_id = auth.uid()
    or email = auth.email()
    or exists (
      select 1
      from public.rooms r
      where r.id = public.room_members.room_id
        and r.owner_id = auth.uid()
    )
  );

create policy "room_members_insert_owner_or_self"
  on public.room_members
  for insert
  to authenticated
  with check (
    user_id = auth.uid()
    or email = auth.email()
    or exists (
      select 1
      from public.rooms r
      where r.id = public.room_members.room_id
        and r.owner_id = auth.uid()
    )
  );

create policy "room_members_update_owner_or_self"
  on public.room_members
  for update
  to authenticated
  using (
    user_id = auth.uid()
    or email = auth.email()
    or exists (
      select 1
      from public.rooms r
      where r.id = public.room_members.room_id
        and r.owner_id = auth.uid()
    )
  )
  with check (
    user_id = auth.uid()
    or email = auth.email()
    or exists (
      select 1
      from public.rooms r
      where r.id = public.room_members.room_id
        and r.owner_id = auth.uid()
    )
  );

create policy "room_members_delete_owner_or_self"
  on public.room_members
  for delete
  to authenticated
  using (
    user_id = auth.uid()
    or email = auth.email()
    or exists (
      select 1
      from public.rooms r
      where r.id = public.room_members.room_id
        and r.owner_id = auth.uid()
    )
  );
