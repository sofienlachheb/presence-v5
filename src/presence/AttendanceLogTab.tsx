import { writeSchoolPrint } from "./schoolPrint";
import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Users, UserCheck, UserX, Clock, AlertTriangle, BarChart3, Bell,
  Search, Plus, X, Check, ChevronLeft, ChevronRight, Home, FileText,
  Send, ShieldAlert, GraduationCap, CalendarDays, Phone, Activity,
  ClipboardList, TrendingUp, Filter, Eye, Star, PenLine,
  Printer, PlayCircle, History as HistoryIcon, Settings, UserPlus,
  Trash2, Pencil, Lock, Mail, ShieldCheck, Save, Bird, MessageCircle, LogOut
} from "lucide-react";
import { EmptyState } from "./EmptyState";


/* ---------------------------------------------------------------
   تبويب سجلّ الحضور — فلترة حسب التاريخ / الصف / المعلّم / اسم الطالب
--------------------------------------------------------------- */
export function AttendanceLogTab({ selectedDate, classes, users, fetchAttendanceLog }) {
  const [date, setDate] = useState(selectedDate);
  const [className, setClassName] = useState("الكل");
  const [teacherId, setTeacherId] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [refresh, setRefresh] = useState(0);
  const [studentName, setStudentName] = useState("");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);

  const teachers = useMemo(
    () => users.filter((u) => u.role === "معلم").slice().sort((a, b) => a.name.localeCompare(b.name, "ar")),
    [users]
  );

  useEffect(() => {
    setDate(selectedDate);
  }, [selectedDate]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    setRows([]);
    const timer = window.setTimeout(async () => {
      try {
        const result = await fetchAttendanceLog({ date, className, teacherId, status, studentName: studentName.trim() });
        if (!cancelled) setRows(result);
      } catch {
        if (!cancelled) setError("تعذّر تحميل سجلّ الحضور. أعد المحاولة.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 250);
    return () => { cancelled = true; window.clearTimeout(timer); };
  }, [date, className, teacherId, status, studentName, refresh, fetchAttendanceLog]);

  const teacherName = teachers.find((teacher) => teacher.id === teacherId)?.name || "كل المعلمين";
  const absentCount = rows.filter((row) => row.status === "غائب").length;

  const esc = (v) =>
    String(v ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");

  const statusColor = { "حاضر": "#2F9E6E", "متأخر": "#D9A62E", "غائب": "#C7433F" };

  const printAttendanceLog = () => {
    const w = window.open("", "_blank", "width=980,height=760");
    if (!w) return;
    const title = `سجلّ الحضور — ${esc(date || "كل التواريخ")}`;
    const bodyRows = rows
      .map(
        (r) => `<tr>
          <td>${esc(r.date)}</td><td>${esc(r.studentName)}</td>
          <td>${esc(r.class)} / ${esc(r.section)}</td>
          <td>${esc(r.period)}</td>
          <td>${esc(r.status)}</td>
          <td>${esc(r.time)}</td>
          <td>${esc(r.teacherName)}</td>
        </tr>`
      )
      .join("");
    writeSchoolPrint(w, `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"/>
      <title>${title}</title>
      <style>
        @page{size:A4;margin:13mm} *{box-sizing:border-box}
        body{font-family:Tahoma,Arial,sans-serif;color:#111;background:#fff;margin:0;font-size:12.5px}
        .sheet{max-width:190mm;margin:0 auto}
        h1{text-align:center;font-size:18px;margin-bottom:4px}
        .sub{text-align:center;color:#555;margin-bottom:14px;font-size:12px}
        table{width:100%;border-collapse:collapse}
        th,td{border:1px solid #333;padding:6px 8px;text-align:center}
        th{background:#f0f0f0;font-weight:800}
        @media print{.no-print{display:none!important}}
      </style></head><body><div class="sheet">
        <h1>سجلّ الحضور والغياب</h1>
        <div class="sub">التاريخ: ${esc(date || "كل التواريخ")} — المعلم: ${esc(teacherName)} — الحالة: ${esc(status || "كل الحالات")} — عدد السجلات: ${rows.length} — حالات الغياب: ${absentCount}</div>
        <table>
          <thead><tr><th>التاريخ</th><th>الطالب</th><th>الصف/الشعبة</th><th>الحصة</th><th>الحالة</th><th>الوقت</th><th>سجّله</th></tr></thead>
          <tbody>${bodyRows}</tbody>
        </table>
      </div></body></html>`);

  };

  return (
    <div className="card">
      <div className="card-head">
        <h3><ClipboardList size={17} /> سجلّ الحضور ({rows.length})</h3>
        <button className="chip-btn-outline" onClick={printAttendanceLog} disabled={loading || rows.length === 0}>
          <Printer size={14} /> طباعة
        </button>
      </div>

      <div className="attendance-filters">
        <div>
          <div className="field-label" style={{ marginTop: 0 }}>التاريخ</div>
          <input type="date" className="text-input" value={date} onChange={(e) => setDate(e.target.value)} />
          <button className="chip-btn-outline" onClick={() => setDate("")} disabled={!date}>كل التواريخ</button>
        </div>
        <div>
          <div className="field-label" style={{ marginTop: 0 }}>الصف</div>
          <select className="select-input" value={className} onChange={(e) => setClassName(e.target.value)}>
            <option value="الكل">كل الصفوف</option>
            {classes.map((c) => <option key={c} value={c}>الصف {c}</option>)}
          </select>
        </div>
        <div>
          <div className="field-label" style={{ marginTop: 0 }}>المعلم الذي سجّل الحضور</div>
          <select aria-label="المعلم الذي سجّل الحضور" className="select-input" value={teacherId} onChange={(e) => setTeacherId(e.target.value)}>
            <option value="">كل المعلمين</option>
            {teachers.map((teacher) => <option key={teacher.id} value={teacher.id}>{teacher.name}</option>)}
          </select>
        </div>
        <div>
          <div className="field-label" style={{ marginTop: 0 }}>الحالة</div>
          <select aria-label="حالة الحضور" className="select-input" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">كل الحالات</option>
            <option value="غائب">الغياب فقط</option>
            <option value="حاضر">حاضر</option>
            <option value="متأخر">متأخر</option>
          </select>
        </div>
        <div>
          <div className="field-label" style={{ marginTop: 0 }}>اسم الطالب</div>
          <input
            className="text-input"
            placeholder="ابحث بالاسم..."
            value={studentName}
            onChange={(e) => setStudentName(e.target.value)}
          />
        </div>
        <button className="chip-btn" onClick={() => setRefresh((value) => value + 1)} disabled={loading}>
          <Search size={14} /> {loading ? "جارٍ البحث..." : "بحث"}
        </button>
      </div>

      {!loading && !error && <p>{teacherName} — عدد السجلات: {rows.length} — حالات الغياب: {absentCount}</p>}
      {error ? <div role="alert">{error}</div> : rows.length === 0 ? (
        <EmptyState text={loading ? "جارٍ التحميل..." : "لا توجد سجلات مطابقة"} />
      ) : (
        <div className="att-log-table-wrap">
          <table className="perm-table">
            <thead>
              <tr>
                <th>التاريخ</th>
                <th>الطالب</th>
                <th>الصف/الشعبة</th>
                <th>الحصة</th>
                <th>الحالة</th>
                <th>الوقت</th>
                <th>سجّله</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td>{r.date}</td>
                  <td className="perm-section-label">{r.studentName}</td>
                  <td>{r.class} / {r.section}</td>
                  <td>{r.period}</td>
                  <td>
                    <span className="count-chip" style={{ background: statusColor[r.status], margin: 0 }}>{r.status}</span>
                  </td>
                  <td>{r.time}</td>
                  <td>{r.teacherName}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
