import React, { useEffect, useRef, useState } from "react";
import { supabase } from "../supabaseClient";
import "./lesson-points.css";

const subjects = ["اللغة العربية", "اللغة الإنجليزية", "الشرعية", "الحاسوب", "الرياضيات", "الفيزياء", "الكيمياء", "الأحياء", "تاريخ", "جغرافيا", "اجتماعيات", "مهارات حياتية"];
const reasons = ["مشاركة فعالة", "إجابة متميزة", "تعاون", "إنجاز المهمة", "التزام", "مبادرة", "تحسن ملحوظ"];
const day = (offset = 0) => { const local = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Qatar", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date()); const d = new Date(`${local}T12:00:00Z`); d.setUTCDate(d.getUTCDate() + offset); return d.toISOString().slice(0, 10); };
const shiftDate = (value, offset) => { const d = new Date(`${value}T12:00:00Z`); d.setUTCDate(d.getUTCDate() + offset); return d.toISOString().slice(0, 10); };
const groupKey = (c, s) => JSON.stringify([String(c || "").trim(), String(s || "").trim()]);

export function LessonPointsView({ students, assignments, periods, currentUser }) {
  const [lessonDate, setLessonDate] = useState(day());
  const [editing, setEditing] = useState<any>(null);
  const [group, setGroup] = useState("");
  const [period, setPeriod] = useState("");
  const [subject, setSubject] = useState("");
  const [reason, setReason] = useState("");
  const [note, setNote] = useState("");
  const [search, setSearch] = useState("");
  const [historySearch, setHistorySearch] = useState("");
  const [historyScope, setHistoryScope] = useState("day");
  const [historyFrom, setHistoryFrom] = useState("");
  const [historyTo, setHistoryTo] = useState("");
  const [historyStatus, setHistoryStatus] = useState("active");
  const [historyLimit, setHistoryLimit] = useState(20);
  const [deleting, setDeleting] = useState<any>(null);
  useEffect(() => setHistoryLimit(20), [historySearch, historyScope, historyFrom, historyTo, historyStatus, group, lessonDate]);
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const editPanel = useRef<HTMLElement>(null);
  const deletePanel = useRef<HTMLElement>(null);
  useEffect(() => { if (deleting) { deletePanel.current?.scrollIntoView({ behavior: "smooth", block: "center" }); deletePanel.current?.focus({ preventScroll: true }); } }, [deleting?.id]);
  useEffect(() => { if (editing) editPanel.current?.scrollIntoView({ behavior: "smooth", block: "center" }); }, [editing?.id]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<any>(null);
  const [range, setRange] = useState("week");
  const [reload, setReload] = useState(0);
  useEffect(() => {
    let alive = true;
    setLoading(true); setError("");
    (async () => {
      try {
        const all = [];
        for (let offset = 0; ; offset += 1000) {
          const { data, error } = await supabase.from("lesson_points").select("*").eq("teacher_id", currentUser.id).order("created_at", { ascending: false }).order("id").range(offset, offset + 999);
          if (error) throw error;
          all.push(...data);
          if (data.length < 1000) break;
        }
        if (alive) setRecords(all);
      } catch { if (alive) setError("تعذّر تحميل نقاط الحصة. تحقق من الاتصال وتطبيق ترحيل المرحلة 20 في قاعدة البيانات."); }
      finally { if (alive) setLoading(false); }
    })();
    return () => { alive = false; };
  }, [currentUser.id, reload]);
  const groups = Array.from(new Map(assignments.map(a => [groupKey(a.className, a.sectionName), a])).entries()) as [string, any][];
  const roster = students.filter(s => groupKey(s.class, s.section) === group && groups.some(([key]) => key === group));
  const ids = new Set(roster.map(s => String(s.id)));
  const active = records.filter(r => !r.voided_at);
  const classRecords = active.filter(r => ids.has(String(r.student_id)) && groupKey(r.class_name, r.section_name) === group);
  const today = classRecords.filter(r => r.lesson_date === lessonDate);
  const week = classRecords.filter(r => r.lesson_date >= shiftDate(lessonDate, -6) && r.lesson_date <= lessonDate);
  const sum = rows => rows.reduce((n, r) => n + r.points, 0);
  const totals = roster.map(s => ({ ...s, total: sum(week.filter(r => String(r.student_id) === String(s.id))) })).sort((a,b) => b.total-a.total);
  const neglected = roster.filter(s => !classRecords.some(r => String(r.student_id) === String(s.id) && r.lesson_date >= shiftDate(lessonDate, -13) && r.lesson_date <= lessonDate));
  const latest = records.find(r => !r.voided_at && r.lesson_date === day());
  const ready = !loading && !error && !busy && !!lessonDate && lessonDate <= day() && !!group && subjects.includes(subject) && periods.some(p => p.name === period);
  const mutate = async (student?, points?, star = false) => {
    if (lock.current || currentUser.role !== "معلم" || loading || error) return;
    if (student && (!ready || !ids.has(String(student.id)) || ![1,2,3].includes(points))) return;
    if (!student && !latest) return;
    lock.current = true; setBusy(true); setMessage("");
    try {
      if (student) {
        const { data, error } = await supabase.from("lesson_points").insert({ teacher_id: currentUser.id, teacher_name: currentUser.name, student_id: String(student.id), student_name: student.name, class_name: String(student.class).trim(), section_name: String(student.section || "").trim(), lesson_date: lessonDate, period, subject: subject.trim(), points, is_star: star, reason: reason || (star ? "نجمة تميز" : "تعزيز سريع"), note: note.trim() }).select().single();
        if (error) throw error;
        setRecords(prev => [data, ...prev]); setMessage(`تم منح ${student.name} ${points} نقطة${star ? " ونجمة تميز" : ""}`);
      } else {
        const { data, error } = await supabase.rpc("undo_last_lesson_point");
        if (error || !data) throw error || new Error();
        setRecords(prev => prev.map(r => r.id === data.id ? data : r)); setMessage(`تم التراجع عن تعزيز ${data.student_name}`);
      }
    } catch { setMessage("لم يتم تأكيد العملية. أعد تحميل السجل للتحقق قبل المحاولة مجددًا."); setReload(n => n+1); }
    finally { lock.current = false; setBusy(false); }
  };
  const saveEdit = async () => {
    if (lock.current || loading || error || !editing || ![1, 2, 3].includes(editing.points)) return;
    lock.current = true; setBusy(true); setMessage("");
    try {
      const { data, error } = await supabase.rpc("edit_lesson_point", {
        p_id: editing.id, p_revision: editing.revision || 0,
        p_points: editing.points, p_is_star: editing.is_star,
        p_reason: editing.reason, p_note: editing.note.trim()
      });
      if (error || !data) throw error || new Error();
      setRecords(prev => prev.map(r => r.id === data.id ? data : r));
      setEditing(null); setMessage("تم تعديل التعزيز وتحديث المجاميع وحفظ أثر التعديل.");
    } catch {
      setMessage("تعذّر تأكيد التعديل؛ قد تكون العملية تغيّرت أو لم يُطبّق ترحيل التعديل. راجع السجل المحدّث قبل المحاولة مجددًا.");
      setEditing(null); setReload(n => n + 1);
    } finally { lock.current = false; setBusy(false); }
  };
  const deleteRecord = async () => {
    if (lock.current || loading || error || !deleting) return;
    lock.current = true; setBusy(true); setMessage("");
    try {
      const { data, error } = await supabase.rpc("delete_lesson_point", { p_id: deleting.id, p_revision: deleting.revision || 0 });
      if (error || !data) throw error || new Error();
      setRecords(prev => prev.map(r => r.id === data.id ? data : r));
      if (editing?.id === data.id) setEditing(null);
      setMessage(`تم حذف تعزيز ${data.student_name} واستبعاده من المجاميع مع حفظ أثر العملية.`);
    } catch {
      setMessage("تعذّر تأكيد الحذف. تحقق من الاتصال وتطبيق ترحيل المرحلة 22، وراجع السجل المحدّث قبل المحاولة مجددًا.");
      setReload(n => n + 1);
    } finally { setDeleting(null); lock.current = false; setBusy(false); }
  };
  const normalize = value => String(value || "").normalize("NFKD").replace(/[\u064B-\u065F\u0670\u0640]/g, "").replace(/[أإآ]/g, "ا").toLocaleLowerCase().trim();
  const invalidHistoryRange = historyScope === "range" && !!historyFrom && !!historyTo && historyFrom > historyTo;
  const filteredHistory = records.filter(r => {
    if (invalidHistoryRange || (group && groupKey(r.class_name, r.section_name) !== group)) return false;
    if (historyScope === "day" && r.lesson_date !== lessonDate) return false;
    if (historyScope === "range" && ((historyFrom && r.lesson_date < historyFrom) || (historyTo && r.lesson_date > historyTo))) return false;
    if ((historyStatus === "active" && r.voided_at) || (historyStatus === "deleted" && !r.voided_at)) return false;
    return normalize([r.student_name, r.class_name, r.section_name, r.subject, r.period, r.reason, r.note].join(" ")).includes(normalize(historySearch));
  }).sort((a, b) => b.lesson_date.localeCompare(a.lesson_date) || b.created_at.localeCompare(a.created_at) || a.id.localeCompare(b.id));
  const historyDays = [...new Set(filteredHistory.map(r => r.lesson_date))];
  const history = selected ? records.filter(r => String(r.student_id) === String(selected.id) && r.lesson_date >= (range === "today" ? lessonDate : range === "week" ? shiftDate(lessonDate, -6) : shiftDate(lessonDate, -29)) && r.lesson_date <= lessonDate) : today;
  const table = rows => <div className="lp-table"><table><thead><tr>{["التاريخ / الوقت", "الطالب", "المادة", "المدرس", "الحصة", "النقاط", "السبب", "الملاحظة", "الحالة", "إجراءات"].map(t => <th key={t}>{t}</th>)}</tr></thead><tbody>{rows.map(r => <tr key={r.id}><td>{r.lesson_date}<br/>{new Date(r.created_at).toLocaleTimeString("ar-QA", { timeZone: "Asia/Qatar" })}</td><td>{r.student_name}</td><td>{r.subject}</td><td>{r.teacher_name}</td><td>{r.period}</td><td>+{r.points} {r.is_star && "⭐"}</td><td>{r.reason}</td><td>{r.note || "—"}</td><td>{r.voided_at ? "محذوف / تم التراجع" : "مسجلة"}{r.edit_history?.length > 0 && <details><summary>سجل التغييرات ({r.edit_history.length})</summary>{r.edit_history.map((h, i) => <p key={i}>{new Date(h.at).toLocaleString("ar-QA", { timeZone: "Asia/Qatar" })}: {h.before.points} ← {h.after.points} نقطة؛ {h.before.reason} ← {h.after.reason}<br/>النجمة: {h.before.is_star ? "نعم" : "لا"} ← {h.after.is_star ? "نعم" : "لا"}<br/>الملاحظة: {h.before.note || "—"} ← {h.after.note || "—"}{h.after.voided_at && " — تم التراجع"}</p>)}</details>}</td><td><button disabled={busy || loading || !!error || !!r.voided_at || !students.some(s => String(s.id) === String(r.student_id))} onClick={() => setEditing({ ...r })}>تعديل</button><button className="lp-delete" disabled={busy || loading || !!error || !!r.voided_at} onClick={() => setDeleting(r)}>حذف</button></td></tr>)}</tbody></table>{!rows.length && <p>لا توجد نقاط في هذه الفترة.</p>}</div>;
  return <div className="view-stack lp" dir="rtl">
    <section className="card"><h2>⭐ نقاط الحصة والتعزيز</h2><p>تعزيز أثناء التدريس، مستقل عن التقييم الدوري والمخالفات. التسجيل بتاريخ {lessonDate}. يمكنك عرض الأيام السابقة وتسجيل تعزيز لها.</p>
      <div className="lp-controls"><label>تاريخ الحصة<input type="date" value={lessonDate} max={day()} disabled={busy} onChange={e => { if (e.target.value && e.target.value <= day()) { setLessonDate(e.target.value); setEditing(null); } }}/></label><button disabled={busy} onClick={() => { setLessonDate(shiftDate(lessonDate, -1)); setEditing(null); }}>اليوم السابق</button><button disabled={busy || lessonDate >= day()} onClick={() => { setLessonDate(shiftDate(lessonDate, 1)); setEditing(null); }}>اليوم التالي</button><button disabled={busy || lessonDate === day()} onClick={() => { setLessonDate(day()); setEditing(null); }}>اليوم</button><label>الصف والشعبة<select value={group} onChange={e => { setGroup(e.target.value); setEditing(null); setSelected(null); setSearch(""); }}><option value="">اختر الصف</option>{groups.map(([key,a]) => <option key={key} value={key}>{a.className} — {a.sectionName}</option>)}</select></label><label>الحصة<select value={period} onChange={e => setPeriod(e.target.value)}><option value="">اختر الحصة</option>{periods.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}</select></label><label>المادة<select value={subject} onChange={e => setSubject(e.target.value)}><option value="">اختر المادة</option>{subjects.map(name => <option key={name} value={name}>{name}</option>)}</select></label><label>السبب الاختياري<select value={reason} onChange={e => setReason(e.target.value)}><option value="">تعزيز سريع</option>{reasons.map(r => <option key={r}>{r}</option>)}</select></label><label>ملاحظة اختيارية<input value={note} maxLength={500} onChange={e => setNote(e.target.value)}/></label></div>
      {!groups.length && <p>لم يتم إسناد صفوف وشعب لهذا المدرس.</p>}
      {loading && <p role="status">جارٍ تحميل السجل…</p>}{error && <p role="alert">{error} <button onClick={() => setReload(n=>n+1)}>إعادة المحاولة</button></p>}
      <p role="status">{message}</p><button disabled={!latest || busy || loading || !!error} onClick={() => mutate()}>تراجع عن آخر تعزيز اليوم{latest ? ` — ${latest.student_name} (+${latest.points})` : ""}</button>
    </section>
    {deleting && <section ref={deletePanel} tabIndex={-1} className="card lp-delete-confirm" role="alertdialog" aria-label="تأكيد حذف التعزيز"><h3>حذف تعزيز {deleting.student_name}؟</h3><p>{deleting.lesson_date} — {deleting.subject} — {deleting.period} — {deleting.points} نقطة. سيُستبعد من المجاميع مع الاحتفاظ بسجل العملية.</p><button className="lp-delete" disabled={busy || loading || !!error} onClick={deleteRecord}>تأكيد الحذف</button><button disabled={busy} onClick={() => setDeleting(null)}>إلغاء</button></section>}
    {editing && <section ref={editPanel} className="card" aria-label="تعديل التعزيز"><h3>تعديل تعزيز {editing.student_name} — {editing.lesson_date}</h3><p>{editing.subject} — {editing.period}</p><div className="lp-controls"><label>النقاط<select value={editing.points} disabled={busy} onChange={e => setEditing({ ...editing, points: Number(e.target.value), is_star: Number(e.target.value) === 1 && editing.is_star })}>{[1,2,3].map(n => <option key={n} value={n}>+{n}</option>)}</select></label><label>نجمة تميز<input type="checkbox" checked={editing.is_star} disabled={busy || editing.points !== 1} onChange={e => setEditing({ ...editing, is_star: e.target.checked })}/></label><label>السبب<select value={editing.reason} disabled={busy} onChange={e => setEditing({ ...editing, reason: e.target.value })}>{["تعزيز سريع", "نجمة تميز", ...reasons].map(r => <option key={r}>{r}</option>)}</select></label><label>الملاحظة<input value={editing.note} maxLength={500} disabled={busy} onChange={e => setEditing({ ...editing, note: e.target.value })}/></label></div><button disabled={busy} onClick={saveEdit}>حفظ التعديل</button><button disabled={busy} onClick={() => setEditing(null)}>إلغاء</button></section>}
    {group && !loading && !error && <>
      <section className="card"><h3>مؤشرات الصف — 7 أيام تنتهي في {lessonDate}، خاصة بتعزيزك</h3><div className="lp-stats"><div>نقاط اليوم المحدد<strong>{sum(today)}</strong></div><div>نقاط الأسبوع<strong>{sum(week)}</strong></div><div>طلاب حصلوا على تعزيز<strong>{new Set(week.map(r=>r.student_id)).size}</strong></div><div>متوسط نقاط الصف<strong>{roster.length ? (sum(week)/roster.length).toFixed(1) : "0"}</strong></div><div>الأكثر تعزيزًا<strong>{totals[0]?.total > 0 ? totals.filter(s=>s.total === totals[0].total).map(s=>s.name).join("، ") : "—"}</strong></div></div><p>لم يحصلوا على تعزيز منك خلال 14 يومًا حتى {lessonDate}: {neglected.map(s=>s.name).join("، ") || "لا يوجد"}</p></section>
      <section className="card"><h3>التعزيز السريع</h3><p>اختر الحصة والمادة لتفعيل الأزرار. ⭐ = نقطة واحدة ونجمة تميز.</p><input aria-label="البحث عن طالب" placeholder="ابحث عن طالب" value={search} onChange={e=>setSearch(e.target.value)}/><div className="lp-roster">{roster.filter(s=>s.name.includes(search)).map(s=><div className="lp-student" key={s.id}><button className="lp-name" onClick={()=>{setSelected(s);setRange("week");}}>{s.name}</button><div>{[1,2,3].map(n=><button key={n} disabled={!ready} aria-label={`منح ${s.name} ${n} نقطة`} onClick={()=>mutate(s,n)}>+{n}</button>)}<button disabled={!ready} aria-label={`منح ${s.name} نجمة ونقطة`} onClick={()=>mutate(s,1,true)}>⭐</button></div></div>)}</div>{!roster.length && <p>لا يوجد طلاب في الصف المختار.</p>}</section>

      {selected && <section className="card"><h3>سجل {selected.name} — نقاط مسجلة بواسطتك</h3><select aria-label="فترة سجل الطالب" value={range} onChange={e=>setRange(e.target.value)}><option value="today">اليوم المحدد</option><option value="week">7 أيام حتى التاريخ المحدد</option><option value="month">30 يومًا حتى التاريخ المحدد</option></select><button onClick={()=>setSelected(null)}>إغلاق السجل</button>{table(history)}</section>}
    </>}
    {!loading && !error && <section className="card" aria-label="سجل التعزيز">
      <h3>سجل التعزيز حسب اليوم</h3><p>{group ? "تعزيز الصف والشعبة المحددين" : "تعزيز جميع صفوفك"} — البحث يشمل اسم الطالب والمادة والحصة والسبب والملاحظة.</p>
      <div className="lp-controls">
        <label>البحث في السجل<input type="search" value={historySearch} placeholder="اسم الطالب أو تفاصيل التعزيز" onChange={e => setHistorySearch(e.target.value)}/></label>
        <label>الفترة<select value={historyScope} onChange={e => setHistoryScope(e.target.value)}><option value="day">اليوم المحدد: {lessonDate}</option><option value="all">كل الأيام السابقة واليوم</option><option value="range">فترة محددة</option></select></label>
        {historyScope === "range" && <><label>من تاريخ<input type="date" max={historyTo || day()} value={historyFrom} onChange={e => setHistoryFrom(e.target.value)}/></label><label>إلى تاريخ<input type="date" min={historyFrom} max={day()} value={historyTo} onChange={e => setHistoryTo(e.target.value)}/></label></>}
        <label>الحالة<select value={historyStatus} onChange={e => setHistoryStatus(e.target.value)}><option value="active">المسجلة</option><option value="all">الكل</option><option value="deleted">المحذوفة / المتراجع عنها</option></select></label>
      </div>
      {invalidHistoryRange ? <p role="alert">يجب أن يكون تاريخ البداية قبل تاريخ النهاية أو مساويًا له.</p> : <>
        <p role="status">{filteredHistory.length} عملية في {historyDays.length} يوم — {sum(filteredHistory.filter(r => !r.voided_at))} نقطة مسجلة</p>
        {!filteredHistory.length && <p>لا توجد عمليات تطابق البحث والفترة المحددة.</p>}
        {historyDays.slice(0, historyLimit).map(date => { const rows = filteredHistory.filter(r => r.lesson_date === date); return <section className="lp-history-day" key={date}><h4>{new Date(`${date}T12:00:00Z`).toLocaleDateString("ar-QA", { weekday: "long", year: "numeric", month: "long", day: "numeric", timeZone: "Asia/Qatar" })} — {date}</h4><p>{rows.length} عملية · {sum(rows.filter(r => !r.voided_at))} نقطة مسجلة</p>{table(rows)}</section>; })}
        {historyDays.length > historyLimit && <button onClick={() => setHistoryLimit(n => n + 20)}>عرض أيام أقدم ({historyDays.length - historyLimit} متبقية)</button>}
      </>}
    </section>}
  </div>;
}
