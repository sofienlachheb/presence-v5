-- Apply after phase 22, then assign teacher subjects in user settings.
begin;
alter table public.profiles add column teaching_subject text
 check (teaching_subject is null or length(trim(teaching_subject)) between 1 and 100);
grant update (teaching_subject) on public.profiles to authenticated;
create function public.guard_teaching_subject() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
 if new.teaching_subject is distinct from old.teaching_subject then
   if auth.uid() is not null and not exists (
     select 1 from public.profiles where id = auth.uid() and role = 'مدير النظام' and active is not false
   ) then raise exception 'Administrator access required to assign teacher subject'; end if;
   new.teaching_subject := nullif(trim(new.teaching_subject), '');
 end if;
 return new;
end;
$$;
create trigger profiles_guard_teaching_subject before update on public.profiles
for each row execute function public.guard_teaching_subject();
revoke all on function public.guard_teaching_subject() from public;
-- Use the assigned subject regardless of the submitted value. Existing RLS remains in force.
create function public.assign_teacher_record_subject() returns trigger
language plpgsql security definer set search_path = '' as $$
declare assigned_subject text;
begin
 select trim(teaching_subject) into assigned_subject from public.profiles
 where id = new.teacher_id and role = 'معلم' and active is not false;
 if assigned_subject is null or assigned_subject = '' then
   raise exception 'Teacher subject must be assigned by administrator first';
 end if;
 new.subject := assigned_subject;
 return new;
end;
$$;
create trigger lesson_points_assign_subject before insert on public.lesson_points
for each row execute function public.assign_teacher_record_subject();
create trigger periodic_evaluations_assign_subject before insert on public.periodic_evaluations
for each row execute function public.assign_teacher_record_subject();
revoke all on function public.assign_teacher_record_subject() from public;
commit;
