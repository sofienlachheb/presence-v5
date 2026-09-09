import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Users, UserCheck, UserX, Clock, AlertTriangle, BarChart3, Bell,
  Search, Plus, X, Check, ChevronLeft, ChevronRight, Home, FileText,
  Send, ShieldAlert, GraduationCap, CalendarDays, Phone, Activity,
  ClipboardList, TrendingUp, Filter, Eye, Star, PenLine,
  Printer, PlayCircle, History as HistoryIcon, Settings, UserPlus,
  Trash2, Pencil, Lock, Mail, ShieldCheck, Save, Bird, MessageCircle, LogOut
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend, Cell
} from "recharts";
import { DEGREES, todayISO } from "./shared";
import { EmptyState } from "./EmptyState";


export function Reports({ violations, students, attendance, classes, users, currentUser }) {
  const isAdmin = currentUser?.role === "مدير النظام";

  // نحافظ على العرض القديم لبقية الأدوار، ونضيف مركز التقارير الكامل لمدير النظام.
  const [reportType, setReportType] = useState("school-summary");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [filterClass, setFilterClass] = useState("الكل");
  const [filterStudent, setFilterStudent] = useState("الكل");
  const [filterViolation, setFilterViolation] = useState("الكل");
  const [reportMonth, setReportMonth] = useState(todayISO().slice(0, 7));

  const esc = (value) =>
    String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");

  const filteredViolations = useMemo(() => {
    return (violations || []).filter((v) =>
      (!fromDate || v.date >= fromDate) &&
      (!toDate || v.date <= toDate) &&
      (filterClass === "الكل" || String(v.class || "") === filterClass) &&
      (filterStudent === "الكل" || v.studentId === filterStudent) &&
      (filterViolation === "الكل" || v.item === filterViolation)
    );
  }, [violations, fromDate, toDate, filterClass, filterStudent, filterViolation]);

  const violationTypes = useMemo(
    () => [...new Set((violations || []).map((v) => v.item).filter(Boolean))].sort(),
    [violations]
  );

  const teacherNames = useMemo(
    () => [...new Set((violations || []).map((v) => v.teacherName).filter((x) => x && x !== "—"))].sort(),
    [violations]
  );

  const reportCards = [
    { id: "school-summary", label: "إحصائية مجمعة لكل المدرسة", icon: BarChart3 },
    { id: "teacher-summary", label: "إحصائية مخالفات مسجلة لكل مدرس", icon: Users },
    { id: "student-summary", label: "إحصائية مخالفات كل طالب", icon: GraduationCap },
    { id: "student-detail", label: "إحصائية مفصلة لمخالفات طالب", icon: FileText },
    { id: "class-summary", label: "إحصائية مخالفات كل صف", icon: ClipboardList },
    { id: "class-repeat", label: "إحصائية تكرار مخالفات الصف", icon: TrendingUp },
    { id: "violation-repeat", label: "تكرار مخالفة محددة بين الطلاب", icon: AlertTriangle },
    { id: "degree-matrix", label: "مصفوفة المخالفات حسب الدرجة والصف", icon: Activity },
    { id: "actions-summary", label: "إحصائية الإجراءات الإدارية", icon: ShieldCheck },
    { id: "monthly-comprehensive", label: "التقرير الشهري الشامل", icon: CalendarDays },
  ];

  const groupCount = (items, keyFn) => {
    const map = {};
    items.forEach((item) => {
      const key = keyFn(item) || "غير محدد";
      map[key] = (map[key] || 0) + 1;
    });
    return Object.entries(map)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  };

  const total = filteredViolations.length || 1;
  const withPercent = (rows) =>
    rows.map((r) => ({
      ...r,
      percent: Math.round((r.count / total) * 1000) / 10,
    }));

  const schoolSummary = withPercent(groupCount(filteredViolations, (v) => v.item));
  const teacherSummary = withPercent(groupCount(filteredViolations, (v) => v.teacherName || "غير محدد"));
  const studentSummary = withPercent(groupCount(filteredViolations, (v) => v.studentName || "غير محدد"));
  const classSummary = withPercent(groupCount(filteredViolations, (v) => v.class || "غير محدد"));
  const actionsSummary = withPercent(groupCount(filteredViolations, (v) => v.action || "غير محدد"));

  const selectedStudent = students.find((s) => s.id === filterStudent) || null;

  const classRepeatRows = useMemo(() => {
    const rows = [];
    classes.forEach((cls) => {
      violationTypes.forEach((item) => {
        const count = filteredViolations.filter((v) => v.class === cls && v.item === item).length;
        if (count > 0) rows.push({ className: cls, item, count });
      });
    });
    return rows.sort((a, b) => b.count - a.count);
  }, [classes, violationTypes, filteredViolations]);

  const violationRepeatRows = useMemo(() => {
    if (filterViolation === "الكل") return [];
    const rows = groupCount(
      filteredViolations.filter((v) => v.item === filterViolation),
      (v) => v.studentName
    );
    const sum = rows.reduce((a, b) => a + b.count, 0) || 1;
    return rows.map((r) => ({
      ...r,
      percent: Math.round((r.count / sum) * 1000) / 10,
    }));
  }, [filteredViolations, filterViolation]);

  const degreeMatrix = useMemo(() => {
    return classes.map((cls) => ({
      className: cls,
      d1: filteredViolations.filter((v) => v.class === cls && v.degree === 1).length,
      d2: filteredViolations.filter((v) => v.class === cls && v.degree === 2).length,
      d3: filteredViolations.filter((v) => v.class === cls && v.degree === 3).length,
      d4: filteredViolations.filter((v) => v.class === cls && v.degree === 4).length,
    }));
  }, [classes, filteredViolations]);

  // التقرير الشهري الشامل: نفس فكرة النماذج الإدارية المرسلة (الدرجة × نوع المخالفة × الصف).
  const monthlyViolations = useMemo(() => {
    return (violations || []).filter((v) =>
      (!reportMonth || String(v.date || "").startsWith(reportMonth)) &&
      (filterClass === "الكل" || String(v.class || "") === filterClass) &&
      (filterStudent === "الكل" || v.studentId === filterStudent) &&
      (filterViolation === "الكل" || v.item === filterViolation)
    );
  }, [violations, reportMonth, filterClass, filterStudent, filterViolation]);

  const monthlyClasses = useMemo(() => {
    const base = filterClass === "الكل" ? classes : classes.filter((c) => c === filterClass);
    return base.filter((c) => monthlyViolations.some((v) => v.class === c));
  }, [classes, filterClass, monthlyViolations]);

  const monthlyDegreeSections = useMemo(() => [1, 2, 3, 4].map((degree) => {
    const degreeItems = DEGREES[degree].items.map((item) => {
      const byClass = {};
      monthlyClasses.forEach((cls) => {
        byClass[cls] = monthlyViolations.filter((v) => v.degree === degree && v.item === item && v.class === cls).length;
      });
      const total = Object.values(byClass).reduce((a, b) => a + Number(b || 0), 0);
      return { item, byClass, total };
    }).filter((r) => r.total > 0 || filterViolation !== "الكل");
    return { degree, rows: degreeItems, total: degreeItems.reduce((a, r) => a + r.total, 0) };
  }), [monthlyViolations, monthlyClasses, filterViolation]);

  const monthlyActionSummary = useMemo(() => {
    const rows = groupCount(monthlyViolations, (v) => v.action || "غير محدد");
    return rows.map((r) => ({ ...r, percent: monthlyViolations.length ? Math.round((r.count / monthlyViolations.length) * 1000) / 10 : 0 }));
  }, [monthlyViolations]);

  const printHtml = (title, body) => {
    const w = window.open("", "_blank", "width=1100,height=850");
    if (!w) return;
    w.document.write(`
      <!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"/>
      <title>${esc(title)}</title>
      <style>
        @page{size:A4 landscape;margin:10mm}
        body{font-family:Tahoma,Arial,sans-serif;color:#111;margin:0;font-size:12px}
        .head{text-align:center;margin-bottom:14px}
        .school{font-size:18px;font-weight:900;text-decoration:underline}
        h1{font-size:21px;margin:8px}
        .meta{display:flex;justify-content:space-between;gap:10px;margin:12px 0;font-weight:700}
        table{width:100%;border-collapse:collapse}
        th,td{border:1px solid #222;padding:6px;text-align:center}
        th{background:#8ec5f4}
        tr:nth-child(even) td{background:#fffdeb}
        .total td{background:#cde7f4!important;font-weight:900}
      </style></head><body>
      <div class="head">
        <div class="school">مدرسة عمر بن عبد العزيز الثانوية للبنين</div>
        <h1>${esc(title)}</h1>
      </div>
      <div class="meta">
        <span>من: ${esc(fromDate || "بداية السجل")}</span>
        <span>إلى: ${esc(toDate || "اليوم")}</span>
        <span>مجموع المخالفات: ${filteredViolations.length}</span>
      </div>
      ${body}
      <script>window.onload=()=>setTimeout(()=>window.print(),200);<\/script>
      </body></html>
    `);
    w.document.close();
  };

  const printCurrentReport = () => {
    let title = "";
    let html = "";

    const simpleTable = (rows, col1) => `
      <table><thead><tr><th>${col1}</th><th>العدد</th><th>النسبة %</th></tr></thead>
      <tbody>
        ${rows.map((r) => `<tr><td>${esc(r.name)}</td><td>${r.count}</td><td>${r.percent}%</td></tr>`).join("")}
        <tr class="total"><td>المجموع</td><td>${rows.reduce((a,b)=>a+b.count,0)}</td><td>100%</td></tr>
      </tbody></table>`;

    if (reportType === "school-summary") {
      title = "إحصائية مجمعة لكل المدرسة";
      html = simpleTable(schoolSummary, "المخالفة");
    } else if (reportType === "teacher-summary") {
      title = "إحصائية مخالفات مسجلة لكل مدرس";
      html = simpleTable(teacherSummary, "اسم المدرس");
    } else if (reportType === "student-summary") {
      title = "إحصائية مخالفات كل طالب";
      html = simpleTable(studentSummary, "اسم الطالب");
    } else if (reportType === "student-detail") {
      title = `إحصائية مفصلة لمخالفات طالب${selectedStudent ? ` — ${selectedStudent.name}` : ""}`;
      const rows = filteredViolations.filter((v) => filterStudent === "الكل" || v.studentId === filterStudent);
      html = `<table><thead><tr><th>التاريخ</th><th>المخالفة</th><th>الدرجة</th><th>الحصة</th><th>الإجراء</th></tr></thead><tbody>
        ${rows.map((v)=>`<tr><td>${esc(v.date)}</td><td>${esc(v.item)}</td><td>${esc(DEGREES[v.degree]?.label)}</td><td>${esc(v.period||"—")}</td><td>${esc(v.action||"—")}</td></tr>`).join("")}
        <tr class="total"><td colspan="4">عدد المخالفات</td><td>${rows.length}</td></tr>
      </tbody></table>`;
    } else if (reportType === "class-summary") {
      title = "إحصائية مخالفات كل صف";
      html = simpleTable(classSummary, "الصف");
    } else if (reportType === "class-repeat") {
      title = "إحصائية تكرار مخالفات الصف";
      html = `<table><thead><tr><th>الصف</th><th>المخالفة</th><th>العدد</th></tr></thead><tbody>
        ${classRepeatRows.map((r)=>`<tr><td>${esc(r.className)}</td><td>${esc(r.item)}</td><td>${r.count}</td></tr>`).join("")}
      </tbody></table>`;
    } else if (reportType === "violation-repeat") {
      title = `إحصائية تكرار المخالفة: ${filterViolation === "الكل" ? "اختر مخالفة" : filterViolation}`;
      html = simpleTable(violationRepeatRows, "اسم الطالب");
    } else if (reportType === "degree-matrix") {
      title = "مصفوفة المخالفات حسب الدرجة والصف";
      html = `<table><thead><tr><th>الصف</th><th>الدرجة الأولى</th><th>الدرجة الثانية</th><th>الدرجة الثالثة</th><th>الدرجة الرابعة</th><th>المجموع</th></tr></thead><tbody>
        ${degreeMatrix.map((r)=>`<tr><td>${esc(r.className)}</td><td>${r.d1}</td><td>${r.d2}</td><td>${r.d3}</td><td>${r.d4}</td><td>${r.d1+r.d2+r.d3+r.d4}</td></tr>`).join("")}
      </tbody></table>`;
    } else if (reportType === "actions-summary") {
      title = "إحصائية الإجراءات الإدارية";
      html = simpleTable(actionsSummary, "الإجراء");
    } else if (reportType === "monthly-comprehensive") {
      title = `التقرير الشهري الشامل — ${reportMonth || ""}`;
      const classHeads = monthlyClasses.map((c) => `<th>${esc(c)}</th>`).join("");
      const sections = monthlyDegreeSections.map((sec) => {
        const rows = sec.rows.length ? sec.rows.map((r) => `<tr><td>${esc(r.item)}</td>${monthlyClasses.map((c)=>`<td>${r.byClass[c] || 0}</td>`).join("")}<td>${r.total}</td></tr>`).join("") : `<tr><td colspan="${monthlyClasses.length + 2}">لا توجد مخالفات من هذه الدرجة خلال الشهر</td></tr>`;
        return `<h2 style="margin:18px 0 7px">${esc(DEGREES[sec.degree].label)}</h2><table><thead><tr><th>المخالفة</th>${classHeads}<th>المجموع</th></tr></thead><tbody>${rows}<tr class="total"><td>مجموع ${esc(DEGREES[sec.degree].label)}</td>${monthlyClasses.map((c)=>`<td>${monthlyViolations.filter((v)=>v.degree===sec.degree && v.class===c).length}</td>`).join("")}<td>${sec.total}</td></tr></tbody></table>`;
      }).join("");
      const actions = `<h2 style="margin:18px 0 7px">الإجراءات الإدارية المتخذة</h2>${simpleTable(monthlyActionSummary, "الإجراء")}`;
      const grand = `<div style="margin-top:16px;border:2px solid #1E2A4A;padding:10px;font-size:16px;font-weight:900;text-align:center">المجموع الكلي للمخالفات خلال الشهر: ${monthlyViolations.length}</div>`;
      html = sections + actions + grand;
    }

    printHtml(title, html);
  };

  if (!isAdmin) {
    const byDegree = [1, 2, 3, 4].map((d) => ({
      name: DEGREES[d].label,
      عدد: violations.filter((v) => v.degree === d).length,
      fill: DEGREES[d].color,
    }));

    const byClass = classes.map((c) => ({
      name: c,
      عدد: violations.filter((v) => v.class === c).length,
    }));

    return (
      <div className="view-stack">
        <div className="two-col">
          <section className="card">
            <div className="card-head"><h3><BarChart3 size={17} /> المخالفات حسب الدرجة</h3></div>
            <ResponsiveContainer width="100%" height={230}>
              <BarChart data={byDegree}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E3E7E4" />
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="عدد" radius={[6, 6, 0, 0]}>
                  {byDegree.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </section>
          <section className="card">
            <div className="card-head"><h3><Activity size={17} /> المخالفات حسب الصف</h3></div>
            <ResponsiveContainer width="100%" height={230}>
              <BarChart data={byClass}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E3E7E4" />
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="عدد" fill="#1E2A4A" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </section>
        </div>
      </div>
    );
  }

  const renderSimpleRows = (rows, label) => (
    <div style={{ overflowX: "auto" }}>
      <table className="perm-table">
        <thead><tr><th>{label}</th><th>العدد</th><th>النسبة %</th></tr></thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.name}><td>{r.name}</td><td style={{ textAlign:"center" }}>{r.count}</td><td style={{ textAlign:"center" }}>{r.percent}%</td></tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="view-stack">
      <section className="card">
        <div className="card-head">
          <h3><BarChart3 size={18} /> مركز تقارير مدير النظام</h3>
          <button className="chip-btn" onClick={printCurrentReport}>
            <Printer size={15} /> طباعة التقرير الحالي
          </button>
        </div>

        <div className="report-center-grid">
          {reportCards.map((r) => (
            <button
              key={r.id}
              className={`report-type-card ${reportType === r.id ? "report-type-card-active" : ""}`}
              onClick={() => setReportType(r.id)}
            >
              <r.icon size={22} />
              <span>{r.label}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="card">
        <div className="card-head"><h3><Filter size={17} /> فلاتر التقرير</h3></div>
        <div className="report-filter-grid">
          {reportType === "monthly-comprehensive" && (
            <div>
              <div className="field-label">الشهر</div>
              <input type="month" className="text-input" value={reportMonth} onChange={(e)=>setReportMonth(e.target.value)} />
            </div>
          )}
          {reportType !== "monthly-comprehensive" && <div>
            <div className="field-label">من تاريخ</div>
            <input type="date" className="text-input" value={fromDate} onChange={(e)=>setFromDate(e.target.value)} />
          </div>}
          {reportType !== "monthly-comprehensive" && <div>
            <div className="field-label">إلى تاريخ</div>
            <input type="date" className="text-input" value={toDate} onChange={(e)=>setToDate(e.target.value)} />
          </div>}
          <div>
            <div className="field-label">الصف</div>
            <select className="select-input" value={filterClass} onChange={(e)=>setFilterClass(e.target.value)}>
              <option value="الكل">كل الصفوف</option>
              {classes.map((c)=><option key={c} value={c}>الصف {c}</option>)}
            </select>
          </div>
          <div>
            <div className="field-label">الطالب</div>
            <select className="select-input" value={filterStudent} onChange={(e)=>setFilterStudent(e.target.value)}>
              <option value="الكل">كل الطلاب</option>
              {students
                .filter((s)=>filterClass==="الكل" || s.class===filterClass)
                .map((s)=><option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <div className="field-label">نوع المخالفة</div>
            <select className="select-input" value={filterViolation} onChange={(e)=>setFilterViolation(e.target.value)}>
              <option value="الكل">كل المخالفات</option>
              {violationTypes.map((v)=><option key={v} value={v}>{v}</option>)}
            </select>
          </div>
        </div>
        <div style={{display:"flex",gap:8,marginTop:12,flexWrap:"wrap"}}>
          {reportType !== "monthly-comprehensive" && <button className="chip-btn-outline" onClick={()=>{setFromDate(todayISO());setToDate(todayISO());}}>اليوم</button>}
          <button className="chip-btn-outline" onClick={()=>{setFromDate("");setToDate("");setFilterClass("الكل");setFilterStudent("الكل");setFilterViolation("الكل");setReportMonth(todayISO().slice(0,7));}}>مسح الفلاتر</button>
          <span className="count-chip" style={{background:"#1E2A4A"}}>السجلات: {reportType === "monthly-comprehensive" ? monthlyViolations.length : filteredViolations.length}</span>
        </div>
      </section>

      <section className="card">
        <div className="card-head">
          <h3><FileText size={17} /> {reportCards.find((r)=>r.id===reportType)?.label}</h3>
        </div>

        {reportType === "school-summary" && renderSimpleRows(schoolSummary, "المخالفة")}
        {reportType === "teacher-summary" && renderSimpleRows(teacherSummary, "اسم المدرس")}
        {reportType === "student-summary" && renderSimpleRows(studentSummary, "اسم الطالب")}
        {reportType === "class-summary" && renderSimpleRows(classSummary, "الصف")}
        {reportType === "actions-summary" && renderSimpleRows(actionsSummary, "الإجراء")}

        {reportType === "student-detail" && (
          filterStudent === "الكل" ? (
            <EmptyState text="اختر طالباً من الفلاتر لعرض التقرير المفصل" />
          ) : (
            <div style={{overflowX:"auto"}}>
              <table className="perm-table">
                <thead><tr><th>التاريخ</th><th>المخالفة</th><th>الدرجة</th><th>الحصة</th><th>الإجراء</th></tr></thead>
                <tbody>
                  {filteredViolations.map((v)=>(
                    <tr key={v.id}>
                      <td>{v.date}</td><td>{v.item}</td><td>{DEGREES[v.degree]?.label}</td><td>{v.period||"—"}</td><td>{v.action||"—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}

        {reportType === "class-repeat" && (
          <div style={{overflowX:"auto"}}>
            <table className="perm-table">
              <thead><tr><th>الصف</th><th>المخالفة</th><th>عدد التكرار</th></tr></thead>
              <tbody>
                {classRepeatRows.map((r,i)=><tr key={`${r.className}-${r.item}-${i}`}><td>{r.className}</td><td>{r.item}</td><td style={{textAlign:"center"}}>{r.count}</td></tr>)}
              </tbody>
            </table>
          </div>
        )}

        {reportType === "violation-repeat" && (
          filterViolation === "الكل" ? (
            <EmptyState text="اختر نوع مخالفة من الفلاتر لعرض الطلاب الأكثر تكراراً لها" />
          ) : renderSimpleRows(violationRepeatRows, "اسم الطالب")
        )}

        {reportType === "degree-matrix" && (
          <div style={{overflowX:"auto"}}>
            <table className="perm-table">
              <thead><tr><th>الصف</th><th>الدرجة الأولى</th><th>الدرجة الثانية</th><th>الدرجة الثالثة</th><th>الدرجة الرابعة</th><th>المجموع</th></tr></thead>
              <tbody>
                {degreeMatrix.map((r)=>(
                  <tr key={r.className}>
                    <td>{r.className}</td><td>{r.d1}</td><td>{r.d2}</td><td>{r.d3}</td><td>{r.d4}</td><td><b>{r.d1+r.d2+r.d3+r.d4}</b></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {reportType === "monthly-comprehensive" && (
          <div className="monthly-report-wrap">
            <div className="monthly-report-title">
              <h2>التقرير الشهري الشامل للمخالفات السلوكية</h2>
              <div>الشهر: <b>{reportMonth || "—"}</b> — مجموع المخالفات: <b>{monthlyViolations.length}</b></div>
            </div>
            {monthlyDegreeSections.map((sec) => (
              <div key={sec.degree} className="monthly-degree-section">
                <div className="monthly-degree-head" style={{borderInlineStartColor: DEGREES[sec.degree].color}}>
                  <b>{DEGREES[sec.degree].label}</b><span>المجموع: {sec.total}</span>
                </div>
                <div style={{overflowX:"auto"}}>
                  <table className="perm-table monthly-matrix">
                    <thead><tr><th>المخالفة</th>{monthlyClasses.map((c)=><th key={c}>الصف {c}</th>)}<th>المجموع</th></tr></thead>
                    <tbody>
                      {sec.rows.length === 0 ? (
                        <tr><td colSpan={monthlyClasses.length + 2} style={{textAlign:"center",color:"#7A8599"}}>لا توجد مخالفات من هذه الدرجة خلال الشهر المحدد</td></tr>
                      ) : sec.rows.map((r)=>(
                        <tr key={r.item}><td>{r.item}</td>{monthlyClasses.map((c)=><td key={c} style={{textAlign:"center"}}>{r.byClass[c] || 0}</td>)}<td style={{textAlign:"center"}}><b>{r.total}</b></td></tr>
                      ))}
                      <tr className="monthly-total-row"><td>مجموع {DEGREES[sec.degree].label}</td>{monthlyClasses.map((c)=><td key={c}>{monthlyViolations.filter((v)=>v.degree===sec.degree && v.class===c).length}</td>)}<td>{sec.total}</td></tr>
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
            <div className="monthly-degree-section">
              <div className="monthly-degree-head"><b>الإجراءات الإدارية المتخذة</b><span>{monthlyActionSummary.reduce((a,r)=>a+r.count,0)} إجراء</span></div>
              {renderSimpleRows(monthlyActionSummary, "الإجراء")}
            </div>
            <div className="monthly-grand-total">المجموع الكلي للمخالفات خلال الشهر: <b>{monthlyViolations.length}</b></div>
          </div>
        )}
      </section>
    </div>
  );
}
