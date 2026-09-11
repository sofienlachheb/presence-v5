-- Apply after 20260909_phase21_edit_lesson_points.sql.
-- Cancellation retains the audit trail and excludes points from totals.
begin;
create function public.delete_lesson_point(p_id uuid, p_revision integer)
returns public.lesson_points language plpgsql security definer set search_path = '' as $$
declare result public.lesson_points;
begin
 if not exists (select 1 from public.profiles where id = auth.uid() and role = 'معلم' and active is not false) then
   raise exception 'Teacher access required';
 end if;
 select * into result from public.lesson_points where id = p_id and teacher_id = auth.uid() for update;
 if result.id is null then raise exception 'Operation unavailable'; end if;
 if result.voided_at is not null then raise exception 'Operation already cancelled'; end if;
 if p_revision is null or result.revision <> p_revision then raise exception 'Operation changed; reload first'; end if;
 update public.lesson_points set voided_at = now() where id = result.id returning * into result;
 return result;
end;
$$;
revoke all on function public.delete_lesson_point(uuid, integer) from public;
grant execute on function public.delete_lesson_point(uuid, integer) to authenticated;
commit;
