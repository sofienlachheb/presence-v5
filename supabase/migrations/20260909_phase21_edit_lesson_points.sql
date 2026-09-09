-- Apply after 20260909_phase20_lesson_points.sql.
begin;
alter table public.lesson_points add column revision integer not null default 0;
alter table public.lesson_points add column edit_history jsonb not null default '[]'::jsonb;
drop policy lesson_points_insert on public.lesson_points;
create policy lesson_points_insert on public.lesson_points for insert to authenticated with check (
 teacher_id = auth.uid() and voided_at is null
 and lesson_date <= (now() at time zone 'Asia/Qatar')::date
 and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'معلم' and p.active is not false and p.name = teacher_name)
 and exists (select 1 from public.students s join public.teacher_classes tc
   on trim(tc.class_name) = trim(s.class_name) and trim(tc.section_name) = trim(s.section_name)
   where s.id::text = student_id and tc.teacher_id = auth.uid()
   and s.name = student_name and trim(s.class_name) = lesson_points.class_name and trim(s.section_name) = lesson_points.section_name)
 and exists (select 1 from public.periods p where p.name = period and p.active is not false)
);

-- All updates, including undo, increment the revision and retain the previous values.
create function public.audit_lesson_point_change() returns trigger
language plpgsql set search_path = '' as $$
begin
 new.revision := old.revision + 1;
 new.edit_history := old.edit_history || jsonb_build_array(jsonb_build_object(
   'at', now(), 'actor', auth.uid(),
   'before', jsonb_build_object('points', old.points, 'is_star', old.is_star, 'reason', old.reason, 'note', old.note, 'voided_at', old.voided_at),
   'after', jsonb_build_object('points', new.points, 'is_star', new.is_star, 'reason', new.reason, 'note', new.note, 'voided_at', new.voided_at)
 ));
 return new;
end;
$$;
create trigger lesson_points_change_audit before update on public.lesson_points
for each row execute function public.audit_lesson_point_change();
revoke all on function public.audit_lesson_point_change() from public;

create function public.edit_lesson_point(p_id uuid, p_revision integer, p_points integer, p_is_star boolean, p_reason text, p_note text)
returns public.lesson_points language plpgsql security definer set search_path = '' as $$
declare result public.lesson_points;
begin
 if not exists (select 1 from public.profiles where id = auth.uid() and role = 'معلم' and active is not false) then
   raise exception 'Teacher access required';
 end if;
 select * into result from public.lesson_points where id = p_id and teacher_id = auth.uid() for update;
 if result.id is null then raise exception 'Operation unavailable'; end if;
 if result.voided_at is not null then raise exception 'Cannot edit cancelled operation'; end if;
 if p_revision is null or result.revision <> p_revision then raise exception 'Operation changed; reload first'; end if;
 if result.lesson_date > (now() at time zone 'Asia/Qatar')::date then raise exception 'Future date not allowed'; end if;
 if not exists (
   select 1 from public.students s join public.teacher_classes tc
   on trim(tc.class_name) = trim(s.class_name) and trim(tc.section_name) = trim(s.section_name)
   where s.id::text = result.student_id and tc.teacher_id = auth.uid()
 ) then raise exception 'Student is not assigned to teacher'; end if;
 -- Table constraints validate points, star, reason and note. Direct updates remain forbidden.
 update public.lesson_points set points = p_points, is_star = p_is_star, reason = p_reason, note = trim(p_note)
 where id = result.id returning * into result;
 return result;
end;
$$;
revoke all on function public.edit_lesson_point(uuid, integer, integer, boolean, text, text) from public;
grant execute on function public.edit_lesson_point(uuid, integer, integer, boolean, text, text) to authenticated;
commit;
