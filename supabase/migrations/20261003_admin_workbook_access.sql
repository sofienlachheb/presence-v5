-- Extend the existing workbook permission to active administrators with dashboard access.
begin;
create or replace function public.can_use_supervisor_workbook() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.profiles p join public.roles r on r.name = p.role
    where p.id = auth.uid() and p.active is true
      and p.role in ('مشرف سلوكي', 'مدير النظام')
      and coalesce(r.permissions->>'dashboard', 'false') = 'true'
  );
$$;
revoke all on function public.can_use_supervisor_workbook() from public, anon;
grant execute on function public.can_use_supervisor_workbook() to authenticated;
commit;
