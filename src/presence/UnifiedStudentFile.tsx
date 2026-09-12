import React from "react";
import {
  User, Users, UserCheck, UserX, Clock, AlertTriangle, BarChart3, Bell,
  Search, Plus, X, Check, ChevronLeft, ChevronRight, Home, FileText,
  Send, ShieldAlert, GraduationCap, CalendarDays, Phone, Activity,
  ClipboardList, TrendingUp, Filter, Eye, Star, PenLine,
  Printer, PlayCircle, History as HistoryIcon, Settings, UserPlus,
  Trash2, Pencil, Lock, Mail, ShieldCheck, Save, Bird, MessageCircle, LogOut
} from "lucide-react";
import { EmptyState } from "./EmptyState";
import { buildEarlyWarningData } from "./shared";


export function UnifiedStudentFile({
  studentId,
  students,
  attendance,
  violations,
  evaluations,
  periodicEvaluations,
  caseFollowups,
  guardianContacts,
  onBack,
}) {
  const student = students.find((s) => s.id === studentId);
  if (!student) return <EmptyState text="لم يتم العثور على الطالب" />;

  const alerts = buildEarlyWarningData({
    students:[student],
    attendance,
    violations,
    evaluations,
    periodicEvaluations,
    caseFollowups,
    guardianContacts,
  });
  const alert = alerts[0];

  const sViol = (violations || []).filter((v)=>v.studentId===studentId).sort((a,b)=>String(b.date||"").localeCompare(String(a.date||"")));
  const sEval = (periodicEvaluations || []).filter((e)=>e.studentId===studentId).sort((a,b)=>String(b.date||"").localeCompare(String(a.date||"")));
  const sFollow = (caseFollowups || []).filter((f)=>f.studentId===studentId).sort((a,b)=>String(b.createdAt||"").localeCompare(String(a.createdAt||"")));
  const sContacts = (guardianContacts || []).filter((c)=>c.studentId===studentId).sort((a,b)=>String(b.contactAt||"").localeCompare(String(a.contactAt||"")));

  return (
    <div className="view-stack">
      <section className="card">
        <div className="card-head">
          <h3><User size={18}/> الملف الموحد للطالب</h3>
          <button className="chip-btn-outline" onClick={onBack}>العودة للتنبيهات</button>
        </div>
        <div className="student-file-hero">
          <div>
            <h2>{student.name}</h2>
            <span>الصف {student.class}{student.section ? ` / ${student.section}` : ""}</span>
          </div>
          <span className="early-level" style={{
            background: alert.level==="أولوية عالية"?"#C7433F":alert.level==="يحتاج تدخل"?"#E07B39":alert.level==="يحتاج متابعة"?"#D9A62E":"#2F9E6E"
          }}>{alert.level}</span>
        </div>
      </section>

      <div className="early-kpi-grid">
        <div className="early-kpi"><b>{alert.abs7}</b><span>غياب آخر 7 أيام</span></div>
        <div className="early-kpi"><b>{alert.late14}</b><span>تأخر آخر 14 يومًا</span></div>
        <div className="early-kpi"><b>{sViol.length}</b><span>إجمالي المخالفات</span></div>
        <div className="early-kpi"><b>{sFollow.filter(f=>f.status!=="مغلقة").length}</b><span>متابعات مفتوحة</span></div>
      </div>

      {alert.reasons.length > 0 && (
        <section className="card">
          <div className="card-head"><h3><AlertTriangle size={17}/> أسباب التنبيه الحالي</h3></div>
          <div className="early-reasons">
            {alert.reasons.map((r,i)=><span key={i}>• {r.text}</span>)}
          </div>
        </section>
      )}

      <section className="card">
        <div className="card-head"><h3>آخر المخالفات</h3></div>
        {sViol.slice(0,5).map((v)=><div className="student-file-row" key={v.id}><b>{v.date}</b><span>{v.item}</span><span>الدرجة {v.degree}</span></div>)}
        {!sViol.length && <EmptyState text="لا توجد مخالفات" />}
      </section>

      <section className="card">
        <div className="card-head"><h3>آخر التقييمات الدورية</h3></div>
        {sEval.slice(0,5).map((e)=><div className="student-file-row" key={e.id}><b>{e.date}</b><span>{e.subject || "—"}</span><span>{e.overallRating || e.rating || "—"}</span></div>)}
        {!sEval.length && <EmptyState text="لا توجد تقييمات دورية" />}
      </section>

      <section className="card">
        <div className="card-head"><h3>المتابعات والتواصل مع ولي الأمر</h3></div>
        {sFollow.slice(0,4).map((f)=><div className="student-file-row" key={f.id}><b>{String(f.createdAt||"").slice(0,10)}</b><span>{f.followupType || "متابعة"}</span><span>{f.status || "—"}</span></div>)}
        {sContacts.slice(0,4).map((c)=><div className="student-file-row" key={c.id}><b>{String(c.contactAt||"").slice(0,10)}</b><span>تواصل: {c.channel || "—"}</span><span>{c.outcome || "—"}</span></div>)}
        {!sFollow.length && !sContacts.length && <EmptyState text="لا توجد متابعات أو اتصالات مسجلة" />}
      </section>
    </div>
  );
}
