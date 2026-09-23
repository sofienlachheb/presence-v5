-- Limited author directory: names only, supervisor only, per-section permission.
begin;
create or replace function public.get_record_authors(record_kind text, author_ids uuid[])
returns table (id uuid, name text)
language plpgsql stable security definer set search_path = '' as $$
declare permission_key text;
begin
  permission_key := case record_kind when 'attendance' then 'attendance' when 'violations' then 'log' end;
  if permission_key is null or not exists (
    select 1 from public.profiles p join public.roles r on r.name = p.role
    where p.id = auth.uid() and p.active is true and p.role = 'مشرف سلوكي'
      and coalesce(r.permissions->>permission_key, 'false') = 'true'
  ) then
    raise exception 'Supervisor access required' using errcode = '42501';
  end if;
  if coalesce(cardinality(author_ids), 0) > 200 then
    raise exception 'Too many authors';
  end if;
  return query select p.id, p.name::text from public.profiles p
    where p.id = any(author_ids) and (
      (record_kind = 'attendance' and exists (select 1 from public.attendance a where a.created_by = p.id))
      or (record_kind = 'violations' and exists (select 1 from public.violations v where v.created_by = p.id))
    );
end;
$$;
revoke all on function public.get_record_authors(text, uuid[]) from public;
revoke all on function public.get_record_authors(text, uuid[]) from anon;
grant execute on function public.get_record_authors(text, uuid[]) to authenticated;
commit;
