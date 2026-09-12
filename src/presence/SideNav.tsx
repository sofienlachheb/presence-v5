import React from "react";
import {
  Users, UserCheck, UserX, Clock, AlertTriangle, BarChart3, Bell,
  Search, Plus, X, Check, ChevronLeft, ChevronRight, Home, FileText,
  Send, ShieldAlert, GraduationCap, CalendarDays, Phone, Activity,
  ClipboardList, TrendingUp, Filter, Eye, Star, PenLine,
  Printer, PlayCircle, History as HistoryIcon, Settings, UserPlus,
  Trash2, Pencil, Lock, Mail, ShieldCheck, Save, Bird, MessageCircle, LogOut
} from "lucide-react";


/* ---------------------------------------------------------------
   التنقل الجانبي
--------------------------------------------------------------- */
export function SideNav({ view, setView, pendingCount, perms, currentUser }) {
  const items = [
    { id: "dashboard", label: "لوحة المتابعة", icon: Home },
    { id: "attendance", label: "الحضور والغياب", icon: UserCheck },
    { id: "violations", label: "تسجيل مخالفة", icon: Plus },
    { id: "log", label: "سجلّ المخالفات", icon: ClipboardList },
    { id: "pledges", label: "نماذج التعهد", icon: PenLine },
    { id: "lesson-points", label: "نقاط الحصة والتعزيز", icon: Star, roles: ["معلم"] },
    { id: "evaluation", label: "تقييم أداء الطالب", icon: Star },
    { id: "periodic-evaluation", label: "التقييم الدوري للطالب", icon: FileText },
    { id: "student-profile", label: "الملف الشامل للطالب", icon: FileText },
    { id: "case-center", label: "مركز الحالات والمتابعات", icon: ClipboardList, adminOnly: true },
    { id: "notifications", label: "الإشعارات والمهام", icon: Bell },
    { id: "counselor-center", label: "لوحة منسق شؤون الطلاب", icon: Users, roles: ["مدير النظام", "مرشد طلابي"] },
    { id: "audit-log", label: "سجل العمليات", icon: HistoryIcon, adminOnly: true },
    { id: "data-center", label: "النسخ الاحتياطي وإدارة البيانات", icon: Save, adminOnly: true },
    { id: "early-warning", label: "التنبيهات الذكية والإنذار المبكر", icon: AlertTriangle, adminOnly: true },
    { id: "analytics", label: "التحليلات الذكية", icon: TrendingUp, adminOnly: true },
    { id: "reports", label: "الإحصائيات", icon: BarChart3 },
    { id: "students", label: "الطلاب", icon: Users },
    { id: "hudhud", label: "رسائل هدهد", icon: Bird },
    { id: "parent-portal", label: "متابعة أبنائي", icon: GraduationCap },
    { id: "parent-ack-center", label: "متابعة إقرارات أولياء الأمور", icon: ShieldCheck, adminOnly: true },
    { id: "settings", label: "الإعدادات", icon: Settings },
  ].filter(
    (it) =>
      (!it.adminOnly || currentUser?.role === "مدير النظام") &&
      (!it.roles || it.roles.includes(currentUser?.role)) &&
      (!perms || perms[it.id] !== false)
  );
  return (
    <nav className="side-nav">
      {items.map((it) => (
        <button
          key={it.id}
          className={`nav-item ${view === it.id ? "nav-item-active" : ""}`}
          onClick={() => setView(it.id)}
        >
          <it.icon size={18} />
          <span>{it.label}</span>
          {it.id === "attendance" && pendingCount > 0 && (
            <span className="nav-badge">{pendingCount}</span>
          )}
        </button>
      ))}
    </nav>
  );
}
