import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Users, UserCheck, UserX, Clock, AlertTriangle, BarChart3, Bell,
  Search, Plus, X, Check, ChevronLeft, ChevronRight, Home, FileText,
  Send, ShieldAlert, GraduationCap, CalendarDays, Phone, Activity,
  ClipboardList, TrendingUp, Filter, Eye, Star, PenLine,
  Printer, PlayCircle, History as HistoryIcon, Settings, UserPlus,
  Trash2, Pencil, Lock, Mail, ShieldCheck, Save, Bird, MessageCircle, LogOut
} from "lucide-react";
import { buildEarlyWarningData } from "./shared";
import { EmptyState } from "./EmptyState";


export function EarlyWarningCenter({
  students,
  attendance,
  violations,
  evaluations,
  periodicEvaluations,
  caseFollowups,
  guardianContacts,
  currentUser,
  onOpenStudent,
  onReferToCounselor,
}) {
  const [levelFilter, setLevelFilter] = useState("الكل");
  const [classFilter, setClassFilter] = useState("الكل");
  const [search, setSearch] = useState("");

  const alerts = useMemo(
    () =>
      buildEarlyWarningData({
        students,
        attendance,
        violations,
        evaluations,
        periodicEvaluations,
        caseFollowups,
        guardianContacts,
      }),
    [students, attendance, violations, evaluations, periodicEvaluations, caseFollowups, guardianContacts]
  );

  const classes = [...new Set<string>((students || []).map((s) => s.class).filter(Boolean))].sort();
  const levels = ["أولوية عالية", "يحتاج تدخل", "يحتاج متابعة", "مستقر"];

  const filtered = alerts.filter((x) => {
    const q = search.trim();
    return (
      (levelFilter === "الكل" || x.level === levelFilter) &&
      (classFilter === "الكل" || x.student.class === classFilter) &&
      (!q ||
        String(x.student.name || "").includes(q) ||
        String(x.student.studentNumber || "").includes(q))
    );
  });

  const counts = Object.fromEntries(levels.map((l) => [l, alerts.filter((x) => x.level === l).length]));
  const tone = (level) =>
    level === "أولوية عالية" ? "#C7433F" :
    level === "يحتاج تدخل" ? "#E07B39" :
    level === "يحتاج متابعة" ? "#D9A62E" : "#2F9E6E";

  if (currentUser?.role !== "مدير النظام") return <EmptyState text="مركز الإنذار المبكر متاح لمدير النظام فقط" />;

  return (
    <div className="view-stack">
      <section className="card">
        <div className="card-head">
          <h3><AlertTriangle size={18}/> التنبيهات الذكية والإنذار المبكر</h3>
          <span className="att-sub">تحليل مؤشرات الحضور والمخالفات والتقييمات والمتابعات</span>
        </div>
        <div className="audit-note">
          <ShieldCheck size={16}/>
          <span>هذه المؤشرات للمساعدة في الاكتشاف المبكر وليست قرارًا تأديبيًا. القرار والإجراء النهائي يبقيان بيد المدرسة.</span>
        </div>
      </section>

      <div className="early-kpi-grid">
        {levels.map((l) => (
          <button key={l} className="early-kpi" onClick={() => setLevelFilter(l)}>
            <span className="early-kpi-dot" style={{background:tone(l)}}/>
            <b>{counts[l]}</b>
            <span>{l}</span>
          </button>
        ))}
      </div>

      <section className="card">
        <div className="report-filter-grid">
          <div>
            <div className="field-label">بحث عن طالب</div>
            <input className="text-input" value={search} onChange={(e)=>setSearch(e.target.value)} placeholder="الاسم أو الرقم..." />
          </div>
          <div>
            <div className="field-label">الصف</div>
            <select className="select-input" value={classFilter} onChange={(e)=>setClassFilter(e.target.value)}>
              <option value="الكل">كل الصفوف</option>
              {classes.map((c)=><option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <div className="field-label">مستوى التنبيه</div>
            <select className="select-input" value={levelFilter} onChange={(e)=>setLevelFilter(e.target.value)}>
              <option value="الكل">كل المستويات</option>
              {levels.map((l)=><option key={l}>{l}</option>)}
            </select>
          </div>
        </div>
      </section>

      <section className="card">
        <div className="card-head">
          <h3><Activity size={17}/> الحالات المكتشفة</h3>
          <span className="count-chip" style={{background:"#1E2A4A"}}>{filtered.length} طالب</span>
        </div>
        <div className="early-alert-list">
          {filtered.map((x) => (
            <div className="early-alert-card" key={x.student.id}>
              <div className="early-alert-head">
                <div>
                  <b>{x.student.name}</b>
                  <span>الصف {x.student.class}{x.student.section ? ` / ${x.student.section}` : ""}</span>
                </div>
                <span className="early-level" style={{background:tone(x.level)}}>{x.level}</span>
              </div>

              <div className="early-metrics">
                <span>غياب 7 أيام <b>{x.abs7}</b></span>
                <span>تأخر 14 يومًا <b>{x.late14}</b></span>
                <span>مخالفات 30 يومًا <b>{x.violations30}</b></span>
                <span>متابعات متأخرة <b>{x.overdue}</b></span>
              </div>

              {x.reasons.length > 0 && (
                <div className="early-reasons">
                  <b>لماذا ظهر التنبيه؟</b>
                  {x.reasons.map((r, i)=><span key={i}>• {r.text}</span>)}
                </div>
              )}

              <div className="early-actions">
                <button className="chip-btn" onClick={() => onOpenStudent(x.student.id)}>
                  <Eye size={14}/> الملف الموحد للطالب
                </button>
                {x.level !== "مستقر" && (
                  <button
                    className="chip-btn-outline"
                    onClick={() =>
                      onReferToCounselor?.(x.student.id, {
                        referralReason: x.reasons.map((r) => r.text).join(" | "),
                        priority:
                          x.level === "أولوية عالية"
                            ? "عالية"
                            : x.level === "يحتاج تدخل"
                            ? "متوسطة"
                            : "منخفضة",
                        source: "الإنذار المبكر",
                      })
                    }
                  >
                    <Users size={14}/> إحالة لمنسق شؤون الطلاب
                  </button>
                )}
              </div>
            </div>
          ))}
          {!filtered.length && <EmptyState text="لا توجد حالات مطابقة للفلاتر الحالية" />}
        </div>
      </section>
    </div>
  );
}
