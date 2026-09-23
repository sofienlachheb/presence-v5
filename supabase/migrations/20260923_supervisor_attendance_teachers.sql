-- Expose only teacher IDs and names to an active supervisor with attendance access.
begin;
create or replace function public.get_attendance_teachers()
returns table (id uuid, name text)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not exists (
    select 1 from public.profiles p
    join public.roles r on r.name = p.role
    where p.id = auth.uid() and p.active is true
      and p.role = 'مشرف سلوكي'
      and coalesce(r.permissions->>'attendance', 'false') = 'true'
  ) then
    raise exception 'Attendance supervisor access required' using errcode = '42501';
  end if;

  return query select p.id, p.name::text
    from public.profiles p where p.role = 'معلم'
    order by p.name, p.id;
end;
$$;
revoke all on function public.get_attendance_teachers() from public;
revoke all on function public.get_attendance_teachers() from anon;
grant execute on function public.get_attendance_teachers() to authenticated;
commit;
