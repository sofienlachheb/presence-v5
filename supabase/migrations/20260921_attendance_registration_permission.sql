-- Restrict attendance writes without granting any additional access.
begin;
create or replace function public.can_register_attendance() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.profiles p join public.roles r on r.name = p.role
    where p.id = auth.uid() and p.active is true
      and coalesce(r.permissions->>'attendance', 'false') = 'true'
      and coalesce(r.permissions->>'attendance-register',
        case when p.role = 'مدير النظام' then 'false' else r.permissions->>'attendance' end,
        'false') = 'true'
  );
$$;
revoke all on function public.can_register_attendance() from public;
grant execute on function public.can_register_attendance() to authenticated;
alter table public.attendance enable row level security;
create policy attendance_registration_insert on public.attendance
as restrictive for insert to authenticated
with check (public.can_register_attendance());
create policy attendance_registration_update on public.attendance
as restrictive for update to authenticated
using (public.can_register_attendance())
with check (public.can_register_attendance());
commit;
