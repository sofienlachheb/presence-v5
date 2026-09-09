import React, { useEffect, useRef, useState } from "react";
import { supabase } from "../supabaseClient";
import "./lesson-points.css";

const subjects = ["اللغة العربية", "اللغة الإنجليزية", "الشرعية", "الحاسوب", "الرياضيات", "الفيزياء", "الكيمياء", "الأحياء", "تاريخ", "جغرافيا", "اجتماعيات", "مهارات حياتية"];
const reasons = ["مشاركة فعالة", "إجابة متميزة", "تعاون", "إنجاز المهمة", "التزام", "مبادرة", "تحسن ملحوظ"];
const day = (offset = 0) => { const local = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Qatar", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date()); const d = new Date(`${local}T12:00:00Z`); d.setUTCDate(d.getUTCDate() + offset); return d.toISOString().slice(0, 10); };
const groupKey = (c, s) => JSON.stringify([String(c || "").trim(), String(s || "").trim()]);

export function LessonPointsView({ students, assignments, periods, currentUser }) {
  const [group, setGroup] = useState("");
  const [period, setPeriod] = useState("");
  const [subject, setSubject] = useState("");
  const [reason, setReason] = useState("");
  const [note, setNote] = useState("");
  const [search, setSearch] = useState("");
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
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
  const today = classRecords.filter(r => r.lesson_date === day());
  const week = classRecords.filter(r => r.lesson_date >= day(-6) && r.lesson_date <= day());
  const sum = rows => rows.reduce((n, r) => n + r.points, 0);
  const totals = roster.map(s => ({ ...s, total: sum(week.filter(r => String(r.student_id) === String(s.id))) })).sort((a,b) => b.total-a.total);
  const neglected = roster.filter(s => !classRecords.some(r => String(r.student_id) === String(s.id) && r.lesson_date >= day(-13)));
  const latest = records.find(r => !r.voided_at && r.lesson_date === day());
  const ready = !loading && !error && !busy && !!group && subjects.includes(subject) && periods.some(p => p.name === period);
  const mutate = async (student?, points?, star = false) => {
    if (lock.current || currentUser.role !== "معلم" || loading || error) return;
    if (student && (!ready || !ids.has(String(student.id)) || ![1,2,3].includes(points))) return;
    if (!student && !latest) return;
    lock.current = true; setBusy(true); setMessage("");
    try {
      if (student) {
        const { data, error } = await supabase.from("lesson_points").insert({ teacher_id: currentUser.id, teacher_name: currentUser.name, student_id: String(student.id), student_name: student.name, class_name: String(student.class).trim(), section_name: String(student.section || "").trim(), lesson_date: day(), period, subject: subject.trim(), points, is_star: star, reason: reason || (star ? "نجمة تميز" : "تعزيز سريع"), note: note.trim() }).select().single();
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
  const history = selected ? records.filter(r => String(r.student_id) === String(selected.id) && r.lesson_date >= (range === "today" ? day() : range === "week" ? day(-6) : day(-29)) && r.lesson_date <= day()) : today;
  const table = rows => <div className="lp-table"><table><thead><tr>{["التاريخ / الوقت", "الطالب", "المادة", "المدرس", "الحصة", "النقاط", "السبب", "الملاحظة", "الحالة"].map(t => <th key={t}>{t}</th>)}</tr></thead><tbody>{rows.map(r => <tr key={r.id}><td>{r.lesson_date}<br/>{new Date(r.created_at).toLocaleTimeString("ar-QA")}</td><td>{r.student_name}</td><td>{r.subject}</td><td>{r.teacher_name}</td><td>{r.period}</td><td>+{r.points} {r.is_star && "⭐"}</td><td>{r.reason}</td><td>{r.note || "—"}</td><td>{r.voided_at ? "تم التراجع" : "مسجلة"}</td></tr>)}</tbody></table>{!rows.length && <p>لا توجد نقاط في هذه الفترة.</p>}</div>;
  return <div className="view-stack lp" dir="rtl">
    <section className="card"><h2>⭐ نقاط الحصة والتعزيز</h2><p>تعزيز أثناء التدريس، مستقل عن التقييم الدوري والمخالفات. التسجيل بتاريخ اليوم {day()}.</p>
      <div className="lp-controls"><label>الصف والشعبة<select value={group} onChange={e => { setGroup(e.target.value); setSelected(null); setSearch(""); }}><option value="">اختر الصف</option>{groups.map(([key,a]) => <option key={key} value={key}>{a.className} — {a.sectionName}</option>)}</select></label><label>الحصة<select value={period} onChange={e => setPeriod(e.target.value)}><option value="">اختر الحصة</option>{periods.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}</select></label><label>المادة<select value={subject} onChange={e => setSubject(e.target.value)}><option value="">اختر المادة</option>{subjects.map(name => <option key={name} value={name}>{name}</option>)}</select></label><label>السبب الاختياري<select value={reason} onChange={e => setReason(e.target.value)}><option value="">تعزيز سريع</option>{reasons.map(r => <option key={r}>{r}</option>)}</select></label><label>ملاحظة اختيارية<input value={note} maxLength={500} onChange={e => setNote(e.target.value)}/></label></div>
      {!groups.length && <p>لم يتم إسناد صفوف وشعب لهذا المدرس.</p>}
      {loading && <p role="status">جارٍ تحميل السجل…</p>}{error && <p role="alert">{error} <button onClick={() => setReload(n=>n+1)}>إعادة المحاولة</button></p>}
      <p role="status">{message}</p><button disabled={!latest || busy || loading || !!error} onClick={() => mutate()}>تراجع عن آخر تعزيز اليوم{latest ? ` — ${latest.student_name} (+${latest.points})` : ""}</button>
    </section>
    {group && !loading && !error && <>
      <section className="card"><h3>مؤشرات الصف — آخر 7 أيام، خاصة بتعزيزك</h3><div className="lp-stats"><div>نقاط اليوم<strong>{sum(today)}</strong></div><div>نقاط الأسبوع<strong>{sum(week)}</strong></div><div>طلاب حصلوا على تعزيز<strong>{new Set(week.map(r=>r.student_id)).size}</strong></div><div>متوسط نقاط الصف<strong>{roster.length ? (sum(week)/roster.length).toFixed(1) : "0"}</strong></div><div>الأكثر تعزيزًا<strong>{totals[0]?.total > 0 ? totals.filter(s=>s.total === totals[0].total).map(s=>s.name).join("، ") : "—"}</strong></div></div><p>لم يحصلوا على تعزيز منك خلال آخر 14 يومًا: {neglected.map(s=>s.name).join("، ") || "لا يوجد"}</p></section>
      <section className="card"><h3>التعزيز السريع</h3><p>اختر الحصة والمادة لتفعيل الأزرار. ⭐ = نقطة واحدة ونجمة تميز.</p><input aria-label="البحث عن طالب" placeholder="ابحث عن طالب" value={search} onChange={e=>setSearch(e.target.value)}/><div className="lp-roster">{roster.filter(s=>s.name.includes(search)).map(s=><div className="lp-student" key={s.id}><button className="lp-name" onClick={()=>{setSelected(s);setRange("week");}}>{s.name}</button><div>{[1,2,3].map(n=><button key={n} disabled={!ready} aria-label={`منح ${s.name} ${n} نقطة`} onClick={()=>mutate(s,n)}>+{n}</button>)}<button disabled={!ready} aria-label={`منح ${s.name} نجمة ونقطة`} onClick={()=>mutate(s,1,true)}>⭐</button></div></div>)}</div>{!roster.length && <p>لا يوجد طلاب في الصف المختار.</p>}</section>
      <section className="card"><h3>سجل اليوم للصف</h3>{table(today)}</section>
      {selected && <section className="card"><h3>سجل {selected.name} — نقاط مسجلة بواسطتك</h3><select aria-label="فترة سجل الطالب" value={range} onChange={e=>setRange(e.target.value)}><option value="today">اليوم</option><option value="week">آخر 7 أيام</option><option value="month">آخر 30 يومًا</option></select><button onClick={()=>setSelected(null)}>إغلاق السجل</button>{table(history)}</section>}
    </>}
  </div>;
}
