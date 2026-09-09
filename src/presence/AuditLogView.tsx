import { writeSchoolPrint } from "./schoolPrint";
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { supabase } from "../supabaseClient";
import {
  Users, UserCheck, UserX, Clock, AlertTriangle, BarChart3, Bell,
  Search, Plus, X, Check, ChevronLeft, ChevronRight, Home, FileText,
  Send, ShieldAlert, GraduationCap, CalendarDays, Phone, Activity,
  ClipboardList, TrendingUp, Filter, Eye, Star, PenLine,
  Printer, PlayCircle, History as HistoryIcon, Settings, UserPlus,
  Trash2, Pencil, Lock, Mail, ShieldCheck, Save, Bird, MessageCircle, LogOut
} from "lucide-react";
import { todayISO } from "./shared";
import { EmptyState } from "./EmptyState";


export function AuditLogView({ currentUser }) {
  const [logs, setLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [search, setSearch] = useState("");
  const [filterAction, setFilterAction] = useState("الكل");
  const [filterSection, setFilterSection] = useState("الكل");
  const [filterRole, setFilterRole] = useState("الكل");
  const [filterActor, setFilterActor] = useState("الكل");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [expandedId, setExpandedId] = useState(null);

  const fetchLogs = useCallback(async () => {
    if (currentUser?.role !== "مدير النظام") return;
    setLoadingLogs(true);
    setLoadError("");

    const { data, error } = await supabase
      .from("audit_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(2000);

    if (error) {
      console.error("Audit log load error:", error);
      setLoadError(
        error.message?.includes("audit_logs")
          ? "تعذّر تحميل سجل العمليات. تأكد من تنفيذ ملف SQL الخاص بسجل التدقيق في Supabase."
          : `تعذّر تحميل سجل العمليات: ${error.message}`
      );
      setLogs([]);
      setLoadingLogs(false);
      return;
    }

    setLogs(
      (data || []).map((r) => ({
        id: r.id,
        actorId: r.actor_id,
        actorName: r.actor_name || "النظام",
        actorRole: r.actor_role || "—",
        action: r.action,
        section: r.section,
        tableName: r.table_name,
        recordId: r.record_id,
        studentId: r.student_id,
        studentName: r.student_name,
        targetLabel: r.target_label,
        summary: r.summary,
        details: r.details || {},
        createdAt: r.created_at,
      }))
    );
    setLoadingLogs(false);
  }, [currentUser]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const actions = useMemo(
    () => [...new Set(logs.map((x) => x.action).filter(Boolean))].sort(),
    [logs]
  );
  const sections = useMemo(
    () => [...new Set(logs.map((x) => x.section).filter(Boolean))].sort(),
    [logs]
  );
  const roles = useMemo(
    () => [...new Set(logs.map((x) => x.actorRole).filter(Boolean))].sort(),
    [logs]
  );
  const actors = useMemo(
    () => [...new Set(logs.map((x) => x.actorName).filter(Boolean))].sort(),
    [logs]
  );

  const filtered = useMemo(() => {
    const q = search.trim();
    return logs.filter((x) => {
      const date = String(x.createdAt || "").slice(0, 10);
      const matchesSearch =
        !q ||
        String(x.actorName || "").includes(q) ||
        String(x.studentName || "").includes(q) ||
        String(x.targetLabel || "").includes(q) ||
        String(x.summary || "").includes(q) ||
        String(x.section || "").includes(q);

      return (
        matchesSearch &&
        (filterAction === "الكل" || x.action === filterAction) &&
        (filterSection === "الكل" || x.section === filterSection) &&
        (filterRole === "الكل" || x.actorRole === filterRole) &&
        (filterActor === "الكل" || x.actorName === filterActor) &&
        (!fromDate || date >= fromDate) &&
        (!toDate || date <= toDate)
      );
    });
  }, [
    logs,
    search,
    filterAction,
    filterSection,
    filterRole,
    filterActor,
    fromDate,
    toDate,
  ]);

  const fmtDT = (v) =>
    v
      ? new Date(v).toLocaleString("ar-QA", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
        })
      : "—";

  const actionTone = (action) => {
    if (action === "حذف") return "#C7433F";
    if (action === "تعديل") return "#D9A62E";
    if (action === "إضافة") return "#2F9E6E";
    return "#5B8DEF";
  };

  const printAudit = () => {
    const esc = (v) =>
      String(v ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");

    const rows = filtered
      .map(
        (x, i) => `
          <tr>
            <td>${i + 1}</td>
            <td>${esc(fmtDT(x.createdAt))}</td>
            <td>${esc(x.actorName)}</td>
            <td>${esc(x.actorRole)}</td>
            <td>${esc(x.action)}</td>
            <td>${esc(x.section)}</td>
            <td>${esc(x.studentName || x.targetLabel || "—")}</td>
            <td>${esc(x.summary || "—")}</td>
          </tr>`
      )
      .join("");

    const w = window.open("", "_blank", "width=1200,height=850");
    if (!w) return;
    writeSchoolPrint(w, `
      <!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"/>
      <title>سجل العمليات</title>
      <style>
        @page{size:A4 landscape;margin:9mm}
        body{font-family:Tahoma,Arial,sans-serif;font-size:10px}
        h1,h2{text-align:center;color:#17264d}
        table{width:100%;border-collapse:collapse}
        th,td{border:1px solid #999;padding:5px;text-align:center}
        th{background:#dce6f5}
        .meta{display:flex;justify-content:space-between;margin-bottom:10px}
      </style></head><body>
      <h2>مدرسة عمر بن عبد العزيز الثانوية للبنين</h2>
      <h1>سجل العمليات والتدقيق</h1>
      <div class="meta">
        <span>عدد السجلات: ${filtered.length}</span>
        <span>من: ${fromDate || "بداية السجل"}</span>
        <span>إلى: ${toDate || "الآن"}</span>
      </div>
      <table>
        <thead><tr>
          <th>م</th><th>التاريخ والوقت</th><th>المستخدم</th><th>الدور</th>
          <th>العملية</th><th>القسم</th><th>الهدف</th><th>التفاصيل</th>
        </tr></thead>
        <tbody>${rows || '<tr><td colspan="8">لا توجد سجلات</td></tr>'}</tbody>
      </table>
      
      </body></html>
    `);

  };

  const exportCsv = () => {
    const quote = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const header = [
      "التاريخ والوقت",
      "المستخدم",
      "الدور",
      "العملية",
      "القسم",
      "الطالب/الهدف",
      "الملخص",
    ];
    const body = filtered.map((x) => [
      fmtDT(x.createdAt),
      x.actorName,
      x.actorRole,
      x.action,
      x.section,
      x.studentName || x.targetLabel || "",
      x.summary || "",
    ]);
    const csv =
      "\uFEFF" +
      [header, ...body].map((row) => row.map(quote).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `presence-audit-log-${todayISO()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (currentUser?.role !== "مدير النظام") {
    return <EmptyState text="سجل العمليات متاح لمدير النظام فقط" />;
  }

  return (
    <div className="view-stack">
      <section className="card">
        <div className="card-head">
          <h3><ShieldCheck size={18} /> سجل العمليات والتدقيق</h3>
          <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
            <button className="chip-btn-outline" onClick={fetchLogs}>
              <Activity size={14} /> تحديث
            </button>
            <button className="chip-btn-outline" onClick={exportCsv}>
              <FileText size={14} /> تصدير CSV
            </button>
            <button className="chip-btn" onClick={printAudit}>
              <Printer size={14} /> طباعة
            </button>
          </div>
        </div>

        <div className="audit-note">
          <ShieldCheck size={16} />
          <span>
            هذا السجل للقراءة فقط. تُنشأ السجلات تلقائياً من قاعدة البيانات ولا يمكن حذفها أو تعديلها من التطبيق.
          </span>
        </div>
      </section>

      <section className="card">
        <div className="card-head">
          <h3><Filter size={17} /> البحث والفلترة</h3>
          <span className="count-chip" style={{ background: "#1E2A4A" }}>
            {filtered.length} عملية
          </span>
        </div>

        <div className="audit-filter-grid">
          <div>
            <div className="field-label">بحث</div>
            <input
              className="text-input"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="المستخدم، الطالب، العملية..."
            />
          </div>
          <div>
            <div className="field-label">العملية</div>
            <select className="select-input" value={filterAction} onChange={(e) => setFilterAction(e.target.value)}>
              <option value="الكل">كل العمليات</option>
              {actions.map((x) => <option key={x}>{x}</option>)}
            </select>
          </div>
          <div>
            <div className="field-label">القسم</div>
            <select className="select-input" value={filterSection} onChange={(e) => setFilterSection(e.target.value)}>
              <option value="الكل">كل الأقسام</option>
              {sections.map((x) => <option key={x}>{x}</option>)}
            </select>
          </div>
          <div>
            <div className="field-label">الدور</div>
            <select className="select-input" value={filterRole} onChange={(e) => setFilterRole(e.target.value)}>
              <option value="الكل">كل الأدوار</option>
              {roles.map((x) => <option key={x}>{x}</option>)}
            </select>
          </div>
          <div>
            <div className="field-label">المستخدم</div>
            <select className="select-input" value={filterActor} onChange={(e) => setFilterActor(e.target.value)}>
              <option value="الكل">كل المستخدمين</option>
              {actors.map((x) => <option key={x}>{x}</option>)}
            </select>
          </div>
          <div>
            <div className="field-label">من تاريخ</div>
            <input type="date" className="text-input" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
          </div>
          <div>
            <div className="field-label">إلى تاريخ</div>
            <input type="date" className="text-input" value={toDate} onChange={(e) => setToDate(e.target.value)} />
          </div>
        </div>

        <div className="analytics-preset-row">
          <button
            className="chip-btn-outline"
            onClick={() => {
              setSearch("");
              setFilterAction("الكل");
              setFilterSection("الكل");
              setFilterRole("الكل");
              setFilterActor("الكل");
              setFromDate("");
              setToDate("");
            }}
          >
            مسح الفلاتر
          </button>
          <button
            className="chip-btn-outline"
            onClick={() => {
              setFromDate(todayISO());
              setToDate(todayISO());
            }}
          >
            عمليات اليوم
          </button>
        </div>
      </section>

      <section className="card">
        <div className="card-head">
          <h3><HistoryIcon size={17} /> السجل الزمني</h3>
        </div>

        {loadingLogs ? (
          <div className="empty-state">جارٍ تحميل سجل العمليات...</div>
        ) : loadError ? (
          <div className="audit-error">{loadError}</div>
        ) : filtered.length === 0 ? (
          <EmptyState text="لا توجد عمليات مطابقة للفلاتر الحالية" />
        ) : (
          <div className="audit-list">
            {filtered.map((x) => (
              <div key={x.id} className="audit-item">
                <div
                  className="audit-action-dot"
                  style={{ background: actionTone(x.action) }}
                />
                <div className="audit-main">
                  <div className="audit-title">
                    <b>{x.actorName}</b>
                    <span className="count-chip" style={{ background: actionTone(x.action) }}>
                      {x.action}
                    </span>
                    <span className="count-chip" style={{ background: "#5B8DEF" }}>
                      {x.section}
                    </span>
                  </div>
                  <div className="audit-summary">
                    {x.summary || x.targetLabel || "عملية مسجلة"}
                  </div>
                  <div className="audit-meta">
                    <span>{x.actorRole}</span>
                    {x.studentName && <span>الطالب: {x.studentName}</span>}
                    <span>{fmtDT(x.createdAt)}</span>
                  </div>

                  {expandedId === x.id && (
                    <pre className="audit-details">
                      {JSON.stringify(x.details || {}, null, 2)}
                    </pre>
                  )}
                </div>
                <button
                  className="chip-btn-outline"
                  onClick={() =>
                    setExpandedId(expandedId === x.id ? null : x.id)
                  }
                >
                  <Eye size={13} />
                  {expandedId === x.id ? "إخفاء" : "التفاصيل"}
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
