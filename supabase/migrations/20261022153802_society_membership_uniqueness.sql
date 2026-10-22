-- The join RPCs serialize per user; this index also enforces the invariant for
-- any future code path or operator action that writes memberships directly.
create unique index if not exists membership_one_current_society
  on public.memberships(user_id,society_id)
  where status in ('active','pending') and effective_to is null;
