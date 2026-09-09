-- Phase 20. Apply in Supabase SQL editor before using the new screen.
begin;
create table public.lesson_points (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references auth.users(id),
  teacher_name text not null,
  student_id text not null,
  student_name text not null,
  class_name text not null,
  section_name text not null,
  lesson_date date not null default ((now() at time zone 'Asia/Qatar')::date),
  created_at timestamptz not null default now(),
  period text not null,
  subject text not null check (length(trim(subject)) between 1 and 100),
  points smallint not null check (points in (1,2,3)),
  is_star boolean not null default false check (not is_star or points = 1),
  reason text not null check (reason in ('تعزيز سريع','نجمة تميز','مشاركة فعالة','إجابة متميزة','تعاون','إنجاز المهمة','التزام','مبادرة','تحسن ملحوظ')),
  note text not null default '' check (length(note) <= 500),
  voided_at timestamptz
);
create index lesson_points_teacher_time on public.lesson_points(teacher_id, created_at desc);
create index lesson_points_student on public.lesson_points(student_id, lesson_date);
alter table public.lesson_points enable row level security;
revoke all on public.lesson_points from anon, authenticated;
grant select on public.lesson_points to authenticated;
grant insert (teacher_id,teacher_name,student_id,student_name,class_name,section_name,lesson_date,period,subject,points,is_star,reason,note) on public.lesson_points to authenticated;
create policy lesson_points_read on public.lesson_points for select to authenticated using (
 teacher_id = auth.uid() and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'معلم' and p.active is not false)
);
create policy lesson_points_insert on public.lesson_points for insert to authenticated with check (
 teacher_id = auth.uid() and voided_at is null
 and lesson_date = (now() at time zone 'Asia/Qatar')::date
 and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'معلم' and p.active is not false and p.name = teacher_name)
 and exists (select 1 from public.students s join public.teacher_classes tc
   on trim(tc.class_name) = trim(s.class_name) and trim(tc.section_name) = trim(s.section_name)
   where s.id::text = student_id and tc.teacher_id = auth.uid()
   and s.name = student_name and trim(s.class_name) = lesson_points.class_name and trim(s.section_name) = lesson_points.section_name)
 and exists (select 1 from public.periods p where p.name = period and p.active is not false)
);
-- Only this RPC can cancel an entry: ownership, latest operation and date are checked server-side.
create function public.undo_last_lesson_point() returns public.lesson_points
language plpgsql security definer set search_path = '' as $$
declare result public.lesson_points;
begin
 if not exists (select 1 from public.profiles where id = auth.uid() and role = 'معلم' and active is not false) then
   raise exception 'Teacher access required';
 end if;
 perform pg_advisory_xact_lock(hashtext(auth.uid()::text));
 select * into result from public.lesson_points
 where teacher_id = auth.uid() and voided_at is null
 and lesson_date = (now() at time zone 'Asia/Qatar')::date
 order by created_at desc, id limit 1 for update;
 if result.id is null then raise exception 'No operation to undo'; end if;
 update public.lesson_points set voided_at = now() where id = result.id returning * into result;
 return result;
end;
$$;
revoke all on function public.undo_last_lesson_point() from public;
grant execute on function public.undo_last_lesson_point() to authenticated;
commit;
