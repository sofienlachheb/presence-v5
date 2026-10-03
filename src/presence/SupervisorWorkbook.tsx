import React, { useEffect, useMemo, useState } from "react";
import { ClipboardList, Printer, RefreshCw, Save, Copy, Download } from "lucide-react";
import * as XLSX from "xlsx";
import { supabase } from "../supabaseClient";
import { writeSchoolPrint } from "./schoolPrint";
import { WORKBOOK_BEHAVIORS, classKey, classLabel, buildWorkbookRangeRows, workbookDateRange, absentWorkbookRows, attendanceStatistics, studentMessage } from "./supervisorWorkbookModel";
import "./supervisor-workbook.css";

const tabs = [["daily", "كشف الحضور والسلوك"], ["attendance", "إحصائيات الحضور"], ["behavior", "إحصائيات السلوك"], ["absent", "الطلاب الغائبون"], ["messages", "رسائل أولياء الأمور"], ["roster", "سجل القيد"], ["schedule", "الجدول"]];
const weekdays = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
const escapeHtml = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));

async function loadPages(table, column, value, range = null) {
  const rows = [];
  for (let offset = 0; ; offset += 500) {
    let query = (supabase as any).from(table).select("*");
    if (range) {
      if (range.from) query = query.gte("date", range.from);
      if (range.to) query = query.lte("date", range.to);
    } else query = query.eq(column, value);
    const { data, error } = await query.order("id").range(offset, offset + 499);
    if (error) throw error;
    rows.push(...(data || []));
    if (!data || data.length < 500) return rows;
  }
}

export function SupervisorWorkbook({ students, periods, violations, selectedDate, currentUser, perms, fetchAttendanceLog, setView }) {
  const [dateMode, setDateMode] = useState("day");
  const [filterDate, setFilterDate] = useState(selectedDate);
  const [filterMonth, setFilterMonth] = useState(selectedDate.slice(0, 7));
  useEffect(() => { setFilterDate(selectedDate); setFilterMonth(selectedDate.slice(0, 7)); }, [selectedDate]);
  const range = useMemo(() => workbookDateRange(dateMode, filterDate, filterMonth), [dateMode, filterDate, filterMonth]);
  const multiDay = dateMode !== "day";
  const rangeLabel = dateMode === "all" ? "كل الأيام" : dateMode === "month" ? filterMonth : filterDate;
  const [tab, setTab] = useState("daily");
  const [selectedClass, setSelectedClass] = useState("");
  const [search, setSearch] = useState("");
  const [refresh, setRefresh] = useState(0);
  const [attendance, setAttendance] = useState([]);
  const [notes, setNotes] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [metadataError, setMetadataError] = useState("");
  const [notice, setNotice] = useState("");
  const [edit, setEdit] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState<any>(null);
  const weekday = new Date(`${filterDate}T12:00:00`).getDay();
  const canViewAttendance = perms?.attendance === true;
  const classes = useMemo(() => [...new Map(students.map((s) => [classKey(s), s])).values()].sort((a: any, b: any) => classLabel(a).localeCompare(classLabel(b), "ar", { numeric: true })), [students]);
  const periodNames = useMemo(() => {
    const names = [...new Set([...periods.map((p) => p.name), ...attendance.map((row) => row.period).filter(Boolean)])];
    if (!names.length) return Array.from({ length: 7 }, (_, i) => `الحصة ${i + 1}`);
    return names;
  }, [periods, attendance]);
  useEffect(() => {
    let cancelled = false;
    setLoading(true); setLoadError(""); setMetadataError(""); setNotice("");
    setAttendance([]); setNotes([]); setContacts([]); setSchedule([]); setEdit(null); setPreview(null);
    const load = async () => {
      const results = await Promise.allSettled([
        canViewAttendance ? fetchAttendanceLog({ date: "", dateFrom: range.from, dateTo: range.to, className: "الكل", teacherId: "", studentName: "", status: "" }) : Promise.resolve([]),
        loadPages("supervisor_lesson_notes", "date", filterDate, range),
        loadPages("supervisor_daily_contacts", "date", filterDate, range),
        loadPages("supervisor_weekly_schedule", "weekday", weekday),
      ]);
      if (cancelled) return;
      if (results[0].status === "fulfilled") setAttendance(results[0].value);
      else setLoadError("تعذّر تحميل الحضور. أعد المحاولة قبل الاعتماد على الإحصائيات.");
      const setters = [setNotes, setContacts, setSchedule];
      results.slice(1).forEach((result, index) => {
        if (result.status === "fulfilled") setters[index](result.value);
        else setMetadataError("تعذّر تحميل بيانات متابعة المشرف. تحقق من الاتصال وتفعيل تحديث قاعدة البيانات الخاص بهذه الشاشة، ثم أعد المحاولة.");
      });
      setLoading(false);
    };
    void load();
    return () => { cancelled = true; };
  }, [range, weekday, refresh, fetchAttendanceLog, canViewAttendance, currentUser.id]);

  const visibleStudents = students.filter((s) => (!selectedClass || classKey(s) === selectedClass) && (!search.trim() || `${s.name} ${s.studentNumber || ""}`.includes(search.trim())));
  const rows = buildWorkbookRangeRows(visibleStudents, periodNames, attendance, notes, perms?.log === true ? violations : [], range);
  const contactStatus = (id, date = filterDate) => metadataError ? "غير متاح" : contacts.find((c) => c.student_id === id && c.date === date)?.status || "لم يتم الاتصال";
  const ready = !loading && !loadError;
  const editable = ready && !metadataError && !multiDay;
  const present = rows.filter((r) => r.status === "حاضر").length;
  const absent = rows.filter((r) => r.status === "غائب").length;
  const selectedRoster: any = classes.find((s) => classKey(s) === selectedClass);
  const groups = classes.map((student) => ({ label: classLabel(student), rows: rows.filter((r) => classKey(r.student) === classKey(student)) })).filter((group) => group.rows.length);
  const statisticsGroups = groups.length > 1 ? [...groups, { label: "الإجمالي", rows }] : groups;
  const canExport = ready && !metadataError && (canViewAttendance || ["roster", "schedule", "behavior"].includes(tab));
  const scheduleFor = (student, period) => schedule.find((s) => s.class_name === student.class && s.section_name === (student.section || "") && s.period === period);

  const save = async () => {
    if (!edit || saving || !editable) return;
    setSaving(true); setNotice("");
    try {
      const { table, payload, conflict } = edit;
      const { error } = await supabase.from(table).upsert({ ...payload, updated_by: currentUser.id }, { onConflict: conflict });
      if (error) throw error;
      setEdit(null); setRefresh((r) => r + 1);
    } catch {
      setNotice("تعذّر الحفظ. لم تُحفظ التغييرات، ويمكنك إعادة المحاولة.");
    } finally { setSaving(false); }
  };

  const editBehavior = (row, period) => setEdit({
    title: `سلوك ${row.student.name} — ${period}`, table: "supervisor_lesson_notes", conflict: "student_id,date,period",
    payload: { student_id: row.student.id, date: filterDate, period, behavior: notes.find((n) => n.student_id === row.student.id && n.period === period)?.behavior || "" },
  });
  const editContact = (row) => setEdit({
    title: `متابعة الاتصال — ${row.student.name}`, table: "supervisor_daily_contacts", conflict: "student_id,date",
    payload: { student_id: row.student.id, date: filterDate, status: contactStatus(row.student.id) },
  });
  const editSchedule = (student, period) => {
    const existing = scheduleFor(student, period);
    setEdit({ title: `الجدول — ${classLabel(student)} — ${period}`, table: "supervisor_weekly_schedule", conflict: "class_name,section_name,weekday,period", payload: {
      class_name: student.class, section_name: student.section || "", weekday, period, subject: existing?.subject || "", teacher_name: existing?.teacher_name || "",
    } });
  };

  const tableData = () => {
    if (tab === "roster") return [["الرقم الشخصي", "الاسم", "الهاتف", "الشعبة الصفية"], ...visibleStudents.map((s) => [s.studentNumber, s.name, s.guardianPhone, classLabel(s)])];
    if (tab === "attendance") return [["الشعبة", "الحصة", "الحاضرون", "الغائبون", "متأخر", "معذور", "لم يسجل", "نسبة الحضور %"], ...statisticsGroups.flatMap((group) => attendanceStatistics(group.rows, periodNames).map((s) => [group.label, s.period, s.present, s.absent, s.late, s.excused, s.missing, s.percent ?? "—"]))];
    if (tab === "behavior") return [["الشعبة", "السلوك", ...periodNames, "الإجمالي"], ...statisticsGroups.flatMap((group) => WORKBOOK_BEHAVIORS.map((b) => { const counts = periodNames.map((p, i) => group.rows.filter((r) => r.cells[i].behaviors.includes(b)).length); return [group.label, b, ...counts, counts.reduce((a, c) => a + c, 0)]; }))];
    if (tab === "messages") return [["التاريخ", "الطالب", "الهاتف", "الرسالة", "حالة الاتصال"], ...rows.map((r) => [r.date, r.student.name, r.student.guardianPhone, studentMessage(r, r.date), contactStatus(r.student.id, r.date)])];
    if (tab === "absent") return [["التاريخ", "الرقم الشخصي", "الطالب", "الشعبة", "الهاتف", "حصص الحضور", "حصص الغياب", "حالة الاتصال"], ...absentWorkbookRows(rows).map((r) => [r.date, r.student.studentNumber, r.student.name, classLabel(r.student), r.student.guardianPhone, r.present, r.absent, contactStatus(r.student.id, r.date)])];
    if (tab === "schedule") return [["الشعبة", "اليوم", ...periodNames], ...classes.filter((s) => !selectedClass || classKey(s) === selectedClass).map((s) => [classLabel(s), weekdays[weekday], ...periodNames.map((p) => { const entry = scheduleFor(s, p); return entry ? `${entry.subject}\n${entry.teacher_name}` : "—"; })])];
    return [["التاريخ", "م", "الرقم الشخصي", "الاسم", "رقم الهاتف", "الشعبة", ...periodNames.flatMap((p) => [p, `سلوك الطالب ${p}`]), "حالة الطالب", "حصص الحضور", "حصص الغياب المسجلة", "حصص لم تسجل", ...WORKBOOK_BEHAVIORS, "عدد السلوكيات", "السلوكيات المسجلة"], ...rows.map((r, i) => [r.date, i + 1, r.student.studentNumber, r.student.name, r.student.guardianPhone, classLabel(r.student), ...r.cells.flatMap((c) => [c.status || "لم يسجل", c.behaviors.join("، ")]), r.status, r.present, r.absent, r.missing, ...WORKBOOK_BEHAVIORS.map((b) => r.behaviorCounts[b]), r.behaviorCount, r.behaviors.join("، ")])];
  };
  const exportTable = () => {
    const workbook = XLSX.utils.book_new();
    const sheet = XLSX.utils.aoa_to_sheet(tableData());
    sheet["!cols"] = tableData()[0].map(() => ({ wch: 23 }));
    XLSX.utils.book_append_sheet(workbook, sheet, tabs.find((t) => t[0] === tab)[1].slice(0, 31));
    XLSX.writeFile(workbook, `متابعة-المشرف-${tab}-${rangeLabel}.xlsx`);
  };
  const print = () => {
    const target = window.open("", "_blank", "width=1200,height=800");
    if (!target) { setNotice("يرجى السماح بنافذة الطباعة في المتصفح."); return; }
    const [headers, ...data] = tableData();
    writeSchoolPrint(target, `<!doctype html><html dir="rtl" lang="ar"><head><meta charset="utf-8"><title>متابعة المشرف</title><style>@page{size:A3 landscape;margin:10mm}body{font:11px Tahoma}table{border-collapse:collapse;width:100%}td,th{border:1px solid #aaa;padding:5px;white-space:pre-wrap}th{background:#e9eef3}h1{font-size:20px}</style></head><body><h1>${escapeHtml(tabs.find((t) => t[0] === tab)[1])}</h1><p>${escapeHtml(rangeLabel)} — ${escapeHtml(selectedRoster ? classLabel(selectedRoster) : "جميع الشعب")} — ${escapeHtml(search)}</p><table><thead><tr>${headers.map((h) => `<th>${escapeHtml(h)}</th>`).join("")}</tr></thead><tbody>${data.map((r) => `<tr>${r.map((v) => `<td>${escapeHtml(v)}</td>`).join("")}</tr>`).join("")}</tbody></table></body></html>`);
  };
  const copyMessage = async () => { try { await navigator.clipboard.writeText(studentMessage(preview, preview.date)); setNotice("تم نسخ الرسالة."); } catch { setNotice("تعذّر النسخ التلقائي. يمكنك تحديد نص الرسالة ونسخه يدويًا."); } };
  const statusClass = (status) => status === "حاضر" ? "sw-present" : status === "غائب" ? "sw-absent" : "sw-pending";

  return <section className="sw-workbook view-stack" dir="rtl" aria-label="متابعة المشرف اليومية">
    <div className="card sw-heading"><div><h2><ClipboardList size={24} /> متابعة الحضور والسلوك</h2><p>{rangeLabel} · متابعة الحصص اليومية حسب الشعبة</p></div><div className="sw-actions">
      {canViewAttendance && <button className="chip-btn-outline" onClick={() => setView("attendance")}>الحضور والغياب</button>}
      <button className="chip-btn-outline" onClick={() => setRefresh((r) => r + 1)} disabled={loading || saving}><RefreshCw size={16} /> تحديث</button>
      <button className="chip-btn-outline" onClick={print} disabled={!canExport}><Printer size={16} /> طباعة</button>
      <button className="chip-btn-outline" onClick={exportTable} disabled={!canExport}><Download size={16} /> تصدير Excel</button>
    </div></div>
    <div className="card"><div className="sw-actions" role="group" aria-label="فترة العرض">
      {[["day", "تاريخ محدد"], ["month", "الشهر"], ["all", "كل الأيام"]].map(([mode, label]) => <button key={mode} className={dateMode === mode ? "chip-btn" : "chip-btn-outline"} aria-pressed={dateMode === mode} disabled={saving} onClick={() => { setDateMode(mode); if (mode !== dateMode) setLoading(true); setEdit(null); setPreview(null); }}>{label}</button>)}
    </div><div className="sw-filters">
      {dateMode === "day" && <label>التاريخ<input className="text-input" type="date" value={filterDate} disabled={saving} onChange={(e) => { if (e.target.value) { setFilterDate(e.target.value); setLoading(true); } }} /></label>}
      {dateMode === "month" && <label>الشهر<input className="text-input" type="month" value={filterMonth} disabled={saving} onChange={(e) => { if (e.target.value) { setFilterMonth(e.target.value); setLoading(true); } }} /></label>}
<label>الشعبة<select className="select-input" value={selectedClass} onChange={(e) => setSelectedClass(e.target.value)}><option value="">جميع الشعب</option>{classes.map((s) => <option key={classKey(s)} value={classKey(s)}>{classLabel(s)}</option>)}</select></label><label>اسم الطالب أو رقمه<input className="text-input" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="البحث في سجل القيد" /></label></div></div>
    <div className="sw-summary">{[["عدد الطلاب", visibleStudents.length], ["حاضر (5 حصص فأكثر)", canViewAttendance && ready ? present : "—"], ["غائب بعد اكتمال التحضير", canViewAttendance && ready ? absent : "—"], ["تحضير غير مكتمل", canViewAttendance && ready ? rows.length - present - absent : "—"]].map(([label, value]) => <div className="card" key={label}><span>{label}</span><strong>{value}</strong></div>)}</div>
    <div className="card sw-content"><div className="settings-tabs sw-tabs">{tabs.map(([id, label]) => <button key={id} className={`settings-tab ${tab === id ? "settings-tab-active" : ""}`} onClick={() => setTab(id)} aria-pressed={tab === id}>{label}</button>)}</div>
      {!canViewAttendance && <p role="alert">صلاحية عرض الحضور غير مفعّلة لهذا الحساب. فعّلها من إعدادات الأدوار لعرض حالات الحصص.</p>}
      {loadError && <p role="alert">{loadError}</p>}{metadataError && <p role="alert">{metadataError}</p>}{notice && <p role="status">{notice}</p>}
      <p className="sw-note">الحضور اليومي يتطلب 5 حصص بحالة «حاضر»، كما في النموذج. الحصص غير المسجلة تبقى «لم يسجل» حتى اكتمال التحضير. إحصاءات هذه الشاشة تخص الطلاب المطابقين للتصفية.</p>
      {tab === "absent" && <p className="sw-note">تظهر هنا أسماء الطلاب الذين سُجّل لهم غياب في حصة واحدة على الأقل في الفترة المحددة، دون انتظار اكتمال التحضير. الحصص غير المسجلة لا تُحسب غيابًا.</p>}
      {multiDay && <p className="sw-note">كل صف يمثل طالبًا في يوم مسجّل، والإحصاءات تجمع أيام الفترة. اختر تاريخًا محددًا لتعديل السلوك أو الاتصال. الجدول الأسبوعي يعرض يوم {weekdays[weekday]} الموافق {filterDate}.</p>}
      {loading ? <p role="status">جارٍ تحميل بيانات الفترة…</p> : loadError ? <button className="chip-btn" onClick={() => setRefresh((r) => r + 1)}>إعادة المحاولة</button> : <>
      {tab === "daily" && !multiDay ? <div className="sw-scroll" tabIndex={0} aria-label="جدول الحضور والسلوك قابل للتمرير"><table className="sw-table sw-daily"><thead><tr><th rowSpan={2}>م</th><th rowSpan={2}>الرقم الشخصي</th><th rowSpan={2} className="sw-sticky">الاسم</th><th rowSpan={2}>رقم الهاتف</th><th rowSpan={2}>الشعبة</th>{periodNames.map((p) => <th key={p} colSpan={2}>{p}{selectedRoster && <small>{scheduleFor(selectedRoster, p)?.subject || "المادة غير محددة"}<br />{scheduleFor(selectedRoster, p)?.teacher_name || ""}</small>}</th>)}<th rowSpan={2}>حالة الطالب</th><th rowSpan={2}>حصص الحضور</th><th rowSpan={2}>حصص الغياب</th><th rowSpan={2}>لم يسجل</th><th colSpan={WORKBOOK_BEHAVIORS.length}>السلوك</th><th rowSpan={2}>عدد السلوكيات</th><th rowSpan={2}>السلوكيات المسجلة</th><th rowSpan={2}>الرسالة</th></tr><tr>{periodNames.map((p) => <React.Fragment key={p}><th>حالة الطالب</th><th>سلوك الطالب</th></React.Fragment>)}{WORKBOOK_BEHAVIORS.map((b) => <th key={b}>{b}</th>)}</tr></thead><tbody>{rows.map((r, i) => <tr key={r.student.id}><td>{i + 1}</td><td>{r.student.studentNumber || "—"}</td><th className="sw-sticky" scope="row">{r.student.name}</th><td dir="ltr">{r.student.guardianPhone || "—"}</td><td>{classLabel(r.student)}</td>{r.cells.map((c) => <React.Fragment key={c.period}><td className={statusClass(c.status)} title={c.teacher}>{canViewAttendance ? c.status || "لم يسجل" : "غير متاح"}</td><td><button className="sw-cell-button" disabled={!editable} onClick={() => editBehavior(r, c.period)} aria-label={`تعديل سلوك ${r.student.name} ${c.period}`}>{metadataError ? "غير متاح" : c.behaviors.join("، ") || "إضافة سلوك"}</button></td></React.Fragment>)}<td className={statusClass(r.status)}>{canViewAttendance ? r.status : "غير متاح"}</td><td>{canViewAttendance ? r.present : "—"}</td><td>{canViewAttendance ? r.absent : "—"}</td><td>{canViewAttendance ? r.missing : "—"}</td>{WORKBOOK_BEHAVIORS.map((b) => <td key={b}>{metadataError ? "—" : r.behaviorCounts[b] || "—"}</td>)}<td>{metadataError ? "—" : r.behaviorCount}</td><td>{metadataError ? "غير متاح" : r.behaviors.join("، ") || "—"}</td><td><button className="chip-btn-outline" disabled={!!metadataError || !canViewAttendance} onClick={() => setPreview(r)}>عرض الرسالة</button></td></tr>)}</tbody></table></div>
      : tab === "schedule" ? <div className="sw-scroll"><table className="sw-table"><thead><tr><th>الشعبة</th>{periodNames.map((p) => <th key={p}>{p}</th>)}</tr></thead><tbody>{classes.filter((s) => !selectedClass || classKey(s) === selectedClass).map((s) => <tr key={classKey(s)}><th>{classLabel(s)}</th>{periodNames.map((p) => <td key={p}><button className="sw-cell-button" disabled={!editable} onClick={() => editSchedule(s, p)}>{metadataError ? "غير متاح" : <>{scheduleFor(s, p)?.subject || "تحديد المادة"}<small>{scheduleFor(s, p)?.teacher_name || "معلم المادة"}</small></>}</button></td>)}</tr>)}</tbody></table></div>
      : (tab === "behavior" || tab === "messages") && metadataError ? <p>البيانات غير متاحة حتى نجاح تحميل متابعة المشرف.</p>
      : (tab === "attendance" || tab === "absent" || tab === "messages") && !canViewAttendance ? <p>يتطلب هذا العرض صلاحية الحضور.</p>
      : tab === "messages" && !multiDay ? <div className="sw-scroll"><table className="sw-table"><thead><tr><th>الطالب</th><th>الهاتف</th><th>الرسالة</th><th>حالة الاتصال</th></tr></thead><tbody>{rows.map((r) => <tr key={r.student.id}><th>{r.student.name}</th><td dir="ltr">{r.student.guardianPhone || "—"}</td><td><button className="chip-btn-outline" onClick={() => setPreview(r)}>عرض ونسخ الرسالة</button></td><td><button className="sw-cell-button" disabled={!editable} onClick={() => editContact(r)}>{contactStatus(r.student.id, r.date)}</button></td></tr>)}</tbody></table><p className="sw-note">عرض الرسالة أو نسخها لا يرسلها ولا يغيّر حالة الاتصال.</p></div>
      : <div className="sw-scroll"><table className="sw-table"><thead><tr>{tableData()[0].map((h, i) => <th key={i}>{h}</th>)}</tr></thead><tbody>{tableData().slice(1).map((r, i) => <tr key={i}>{r.map((v, j) => <td key={j}>{v ?? "—"}</td>)}</tr>)}</tbody></table>{tableData().length === 1 && <p>{tab === "absent" ? "لا يوجد غياب مسجّل للطلاب المطابقين للتصفية في الفترة المحددة." : "لا توجد بيانات مطابقة."}</p>}</div>}
      {rows.length === 0 && tab === "daily" && <p>لا يوجد طلاب مطابقون للتصفية.</p>}
      </>}
    </div>
    {edit && <div className="sw-overlay"><div className="sw-dialog card" role="dialog" aria-modal="true" aria-labelledby="sw-edit-title"><h3 id="sw-edit-title">{edit.title}</h3>
      {edit.table === "supervisor_lesson_notes" ? <label>السلوك<select autoFocus className="select-input" value={edit.payload.behavior} onChange={(e) => setEdit({ ...edit, payload: { ...edit.payload, behavior: e.target.value } })}><option value="">بلا ملاحظة إضافية</option>{WORKBOOK_BEHAVIORS.map((b) => <option key={b}>{b}</option>)}</select><small>المخالفات المسجلة في سجل المخالفات تظهر أيضًا ولا تتأثر بهذا التعديل.</small></label>
      : edit.table === "supervisor_daily_contacts" ? <label>حالة الاتصال<select autoFocus className="select-input" value={edit.payload.status} onChange={(e) => setEdit({ ...edit, payload: { ...edit.payload, status: e.target.value } })}>{["لم يتم الاتصال", "تم الاتصال"].map((s) => <option key={s}>{s}</option>)}</select></label>
      : <>{[["subject", "المادة"], ["teacher_name", "معلم المادة"]].map(([key, label]) => <label key={key}>{label}<input className="text-input" maxLength={200} value={edit.payload[key]} onChange={(e) => setEdit({ ...edit, payload: { ...edit.payload, [key]: e.target.value } })} /></label>)}</>}
      {notice && <p role="alert">{notice}</p>}<div className="sw-actions"><button className="chip-btn" disabled={saving} onClick={save}><Save size={16} />{saving ? "جارٍ الحفظ…" : "حفظ"}</button><button className="chip-btn-outline" disabled={saving} onClick={() => setEdit(null)}>إلغاء</button></div>
    </div></div>}
    {preview && <div className="sw-overlay"><div className="sw-dialog card" role="dialog" aria-modal="true" aria-labelledby="sw-message-title"><h3 id="sw-message-title">رسالة ولي أمر {preview.student.name}</h3><textarea aria-label="نص الرسالة" readOnly value={studentMessage(preview, preview.date)} rows={14} /><div className="sw-actions"><button className="chip-btn" onClick={copyMessage}><Copy size={16} /> نسخ الرسالة</button><button className="chip-btn-outline" onClick={() => setPreview(null)}>إغلاق</button></div>{notice && <p role="status">{notice}</p>}</div></div>}
  </section>;
}
