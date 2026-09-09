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
  const [teacherName, setTeacherName] = useState("الكل");
  const [studentName, setStudentName] = useState("");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);

  const teacherNames = useMemo(
    () => (Array.from(new Set(users.map((u) => u.name))) as string[]).sort((a, b) => a.localeCompare(b, "ar")),
    [users]
  );

  const runSearch = async () => {
    setLoading(true);
    const result = await fetchAttendanceLog({ date, className, teacherName, studentName: studentName.trim() });
    setRows(result);
    setLoading(false);
  };

  useEffect(() => {
    runSearch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    const title = `سجلّ الحضور — ${esc(date)}`;
    const bodyRows = rows
      .map(
        (r) => `<tr>
          <td>${esc(r.studentName)}</td>
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
        <div class="sub">التاريخ: ${esc(date)} — عدد السجلات: ${rows.length}</div>
        <table>
          <thead><tr><th>الطالب</th><th>الصف/الشعبة</th><th>الحصة</th><th>الحالة</th><th>الوقت</th><th>سجّله</th></tr></thead>
          <tbody>${bodyRows}</tbody>
        </table>
      </div></body></html>`);

  };

  return (
    <div className="card">
      <div className="card-head">
        <h3><ClipboardList size={17} /> سجلّ الحضور ({rows.length})</h3>
        <button className="chip-btn-outline" onClick={printAttendanceLog} disabled={rows.length === 0}>
          <Printer size={14} /> طباعة
        </button>
      </div>

      <div className="attendance-filters">
        <div>
          <div className="field-label" style={{ marginTop: 0 }}>التاريخ</div>
          <input type="date" className="text-input" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div>
          <div className="field-label" style={{ marginTop: 0 }}>الصف</div>
          <select className="select-input" value={className} onChange={(e) => setClassName(e.target.value)}>
            <option value="الكل">كل الصفوف</option>
            {classes.map((c) => <option key={c} value={c}>الصف {c}</option>)}
          </select>
        </div>
        <div>
          <div className="field-label" style={{ marginTop: 0 }}>المدرّس</div>
          <select className="select-input" value={teacherName} onChange={(e) => setTeacherName(e.target.value)}>
            <option value="الكل">الكل</option>
            {teacherNames.map((n) => <option key={n} value={n}>{n}</option>)}
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
        <button className="chip-btn" onClick={runSearch} disabled={loading}>
          <Search size={14} /> {loading ? "جارٍ البحث..." : "بحث"}
        </button>
      </div>

      {rows.length === 0 ? (
        <EmptyState text={loading ? "جارٍ التحميل..." : "لا توجد سجلات مطابقة"} />
      ) : (
        <div className="att-log-table-wrap">
          <table className="perm-table">
            <thead>
              <tr>
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
