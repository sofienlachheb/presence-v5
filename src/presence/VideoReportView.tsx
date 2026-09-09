import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Users, UserCheck, UserX, Clock, AlertTriangle, BarChart3, Bell,
  Search, Plus, X, Check, ChevronLeft, ChevronRight, Home, FileText,
  Send, ShieldAlert, GraduationCap, CalendarDays, Phone, Activity,
  ClipboardList, TrendingUp, Filter, Eye, Video, Star, PenLine,
  Printer, PlayCircle, History as HistoryIcon, Settings, UserPlus,
  Trash2, Pencil, Lock, Mail, ShieldCheck, Save, Bird, MessageCircle, LogOut
} from "lucide-react";
import { StatCard } from "./StatCard";
import { fmtDate } from "./shared";


/* ---------------------------------------------------------------
   برنامج الفيديو التعليمي — متابعة تفعيل العرض اليومي لكل صف
--------------------------------------------------------------- */
export function VideoReportView({ studentsByClass, videoLog, toggleVideo, selectedDate }) {
  const [teacherName, setTeacherName] = useState("");
  const dayRec = videoLog[selectedDate] || {};
  const classes = Object.keys(studentsByClass);
  const activatedCount = classes.filter((c) => dayRec[c]).length;
  const percent = Math.round((activatedCount / classes.length) * 100);

  return (
    <div className="view-stack">
      <div className="stat-grid" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
        <StatCard icon={Video} label="صفوف فعّلت العرض" value={activatedCount} tone="#0F9D8B" />
        <StatCard icon={PlayCircle} label="نسبة التفعيل" value={`${percent || 0}%`} tone="#5B8DEF" />
        <StatCard icon={GraduationCap} label="إجمالي الصفوف" value={classes.length} tone="#1E2A4A" />
      </div>

      <div className="card">
        <div className="card-head">
          <h3><Video size={17} /> برنامج الفيديو التعليمي — {fmtDate(selectedDate)}</h3>
        </div>
        <p className="video-note">
          يعرض فيديو موحّد في جميع الصفوف في الأيام التي لا يكون فيها طابور صباحي، ويشمل فيديو تعليمي وفيديو للسلام الأميري.
          سجّل هنا تفعيل عرض الفيديو في كل صف لتسهيل المتابعة من قبل الإدارة.
        </p>
        <div className="search-box" style={{ maxWidth: 320 }}>
          <input placeholder="اسم المعلّم المفعِّل (اختياري)" value={teacherName} onChange={(e) => setTeacherName(e.target.value)} />
        </div>
        <div className="att-table">
          {classes.map((c) => {
            const rec = dayRec[c];
            return (
              <div key={c} className="att-row">
                <div className="video-class-badge">{c}</div>
                <div className="att-info">
                  <div className="att-name">الصف {c}</div>
                  <div className="att-sub">
                    {rec ? `تم التفعيل — ${rec.teacherName} — ${rec.time}` : "لم يتم التفعيل بعد"}
                  </div>
                </div>
                <button
                  className={`status-btn ${rec ? "status-btn-active" : ""}`}
                  style={rec ? { background: "#0F9D8B", borderColor: "#0F9D8B" } : {}}
                  onClick={() => toggleVideo(c, teacherName)}
                >
                  {rec ? <><Check size={14} /> مفعّل</> : "تفعيل العرض"}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
