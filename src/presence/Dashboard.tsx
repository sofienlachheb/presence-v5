import type { AttendanceByPeriod } from "./types";
import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  LineChart as LineChartIcon, Users, UserCheck, UserX, Clock, AlertTriangle, BarChart3, Bell,
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
import { StatCard } from "./StatCard";
import { EmptyState } from "./EmptyState";
import { Avatar } from "./Avatar";
import { SeverityGauge } from "./SeverityGauge";


/* ---------------------------------------------------------------
   لوحة المتابعة
--------------------------------------------------------------- */
export function Dashboard({
  stats,
  students,
  violations,
  attendance,
  evaluations,
  periodicEvaluations,
  caseFollowups,
  guardianContacts,
  selectedDate,
  setView,
  setFocusedStudentId,
  completeCaseFollowup,
  perms,
  currentUser,
}) {
  const isAdmin = currentUser?.role === "مدير النظام";

  const topStudents = useMemo(() => {
    const counts: Record<string, number> = {};
    violations.forEach((v) => {
      counts[v.studentId] = (counts[v.studentId] || 0) + 1;
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([id, count]) => ({ student: students.find((s) => s.id === id), count }));
  }, [violations, students]);

  const actionCenter = useMemo(() => {
    if (!isAdmin) return [];

    const items = [];
    const today = todayISO();

    const cut30Date = new Date();
    cut30Date.setHours(0, 0, 0, 0);
    cut30Date.setDate(cut30Date.getDate() - 30);
    const cut30Iso = cut30Date.toISOString().slice(0, 10);

    students.forEach((student) => {
      const sv = violations.filter((v) => v.studentId === student.id);
      const severe = sv.filter((v) => Number(v.degree) >= 3);
      const recent = sv.filter(
        (v) => v.date && String(v.date).slice(0, 10) >= cut30Iso
      );

      let absences = 0;
      let late = 0;
      Object.values(attendance || {}).forEach((periods) => {
        Object.values(periods || {}).forEach((rows) => {
          const rec = rows?.[student.id];
          if (rec?.status === "غائب") absences += 1;
          if (rec?.status === "متأخر") late += 1;
        });
      });

      const studentEvals = evaluations.filter((e) => e.studentId === student.id);
      const avg = studentEvals.length
        ? Math.round(studentEvals.reduce((s, e) => s + Number(e.percent || 0), 0) / studentEvals.length)
        : null;

      const open = caseFollowups
        .filter((f) => f.studentId === student.id && f.status !== "مغلقة")
        .sort((a, b) => String(a.nextActionDate || "9999").localeCompare(String(b.nextActionDate || "9999")));

      if (open.length) {
        open.forEach((f) => {
          items.push({
            id: `follow-${f.id}`,
            followupId: f.id,
            student,
            type: f.followupType || "متابعة حالة",
            reason: f.note || f.nextAction || "متابعة مفتوحة",
            responsible: f.createdByName || "الإدارة",
            dueDate: f.nextActionDate || "",
            overdue: !!f.nextActionDate && f.nextActionDate < today,
            priority: f.nextActionDate && f.nextActionDate < today ? 4 : 2,
            status: f.status || "قيد المتابعة",
          });
        });
        return;
      }

      let type = "";
      let reason = "";
      let priority = 0;

      if (severe.length) {
        type = "تحويل ومتابعة سلوكية";
        reason = `وجود ${severe.length} مخالفة من الدرجة الثالثة/الرابعة`;
        priority = 4;
      } else if (recent.length >= 3) {
        type = "متابعة منسق شؤون الطلاب";
        reason = `تكرار المخالفات خلال آخر 30 يوماً (${recent.length})`;
        priority = 3;
      } else if (absences >= 3) {
        type = "التواصل مع ولي الأمر";
        reason = `تكرار الغياب (${absences})`;
        priority = 3;
      } else if (late >= 3) {
        type = "متابعة الحضور والانضباط";
        reason = `تكرار التأخر (${late})`;
        priority = 2;
      } else if (avg !== null && avg < 70) {
        type = "متابعة أكاديمية";
        reason = `انخفاض متوسط التقييم إلى ${avg}%`;
        priority = 2;
      }

      if (type) {
        items.push({
          id: `suggest-${student.id}`,
          student,
          type,
          reason,
          responsible: "لم يحدد بعد",
          dueDate: "",
          overdue: false,
          priority,
          status: "إجراء مقترح",
        });
      }
    });

    return items.sort((a, b) => b.priority - a.priority || Number(b.overdue) - Number(a.overdue));
  }, [isAdmin, students, violations, attendance, evaluations, caseFollowups]);

  const allowed = (id) => !perms || perms[id] !== false;

  const tasks = [
    { id: "attendance", label: perms?.["attendance-register"] === true ? "أخذ الحضور" : "سجل الحضور", icon: UserCheck, bg: "#E7F5EF", color: "#2F9E6E" },
    { id: "violations", label: "تسجيل مخالفة", icon: Plus, bg: "#F9E4E3", color: "#C7433F" },
    { id: "hudhud", label: "رسائل هدهد", icon: Bird, bg: "#EDE7FA", color: "#8E6FCE" },
    { id: "evaluation", label: "تقييم أداء الطالب", icon: Star, bg: "#FBF3E1", color: "#D9A62E" },
    { id: "periodic-evaluation", label: "التقييم الدوري", icon: FileText, bg: "#E9EEFB", color: "#5B8DEF" },
    { id: "student-profile", label: "الملف الشامل", icon: GraduationCap, bg: "#E7ECF3", color: "#1E2A4A" },
    { id: "case-center", label: "مركز الحالات والمتابعات", icon: ClipboardList, bg: "#FBEAE0", color: "#E07B39", adminOnly: true },
    { id: "counselor-center", label: "لوحة منسق شؤون الطلاب", icon: Users, bg: "#EDE7FA", color: "#8E6FCE", roles: ["مدير النظام", "مرشد طلابي"] },
    { id: "audit-log", label: "سجل العمليات", icon: HistoryIcon, bg: "#E9EEFB", color: "#5B8DEF", adminOnly: true },
    { id: "data-center", label: "النسخ الاحتياطي وإدارة البيانات", icon: Save, bg: "#E7F5EF", color: "#2F9E6E", adminOnly: true },
    { id: "early-warning", label: "التنبيهات الذكية والإنذار المبكر", icon: AlertTriangle, bg: "#FCE8E6", color: "#C7433F", adminOnly: true },
    { id: "parent-ack-center", label: "متابعة إقرارات أولياء الأمور", icon: ShieldCheck, bg: "#E7F5EF", color: "#2F9E6E", adminOnly: true },
    { id: "analytics", label: "التحليلات الذكية", icon: TrendingUp, bg: "#E3F5F2", color: "#0F9D8B", adminOnly: true },
    { id: "reports", label: "عرض التقارير", icon: BarChart3, bg: "#E7ECF3", color: "#1E2A4A" },
  ].filter(
    (t) =>
      allowed(t.id) &&
      (!t.adminOnly || isAdmin) &&
      (!t.roles || t.roles.includes(currentUser?.role))
  );

  // ---------------- Smart admin dashboard ----------------
  const adminIntelligence = useMemo(() => {
    if (!isAdmin) return null;

    const now = new Date();
    const cut30 = new Date();
    cut30.setDate(now.getDate() - 30);
    const cut30Iso = cut30.toISOString().slice(0, 10);

    const studentRisk = students.map((st) => {
      const att = [];
      Object.entries<AttendanceByPeriod>(attendance || {}).forEach(([date, ps]) => {
        Object.entries(ps || {}).forEach(([period, rows]) => {
          const r = rows?.[st.id];
          if (r) att.push({ date, period, ...r });
        });
      });

      const recentAtt = att.filter((a) => String(a.date || "") >= cut30Iso);
      const absences = recentAtt.filter((a) => a.status === "غائب").length;
      const late = recentAtt.filter((a) => a.status === "متأخر").length;

      const recentViolations = violations.filter(
        (v) => v.studentId === st.id && String(v.date || "") >= cut30Iso
      );

      const evs = evaluations.filter((e) => e.studentId === st.id);
      const avg = evs.length
        ? Math.round(evs.reduce((a, e) => a + Number(e.percent || 0), 0) / evs.length)
        : null;

      const latestFollow = (caseFollowups || [])
        .filter((f) => f.studentId === st.id)
        .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))[0];

      let score = 0;
      if (absences >= 3) score += 3;
      else if (absences >= 1) score += 1;

      if (late >= 3) score += 1;

      if (recentViolations.length >= 3) score += 3;
      else if (recentViolations.length >= 1) score += 1;

      if (avg !== null && avg < 60) score += 2;
      else if (avg !== null && avg < 70) score += 1;

      if (latestFollow && latestFollow.status !== "مغلقة") score += 1;

      let level = "منخفض";
      if (score >= 6) level = "مرتفع";
      else if (score >= 3) level = "متوسط";

      return {
        student: st,
        score,
        level,
        absences,
        late,
        violations: recentViolations.length,
        avg,
        latestFollow,
      };
    });

    const atRisk = studentRisk
      .filter((x) => x.score >= 3)
      .sort((a, b) => b.score - a.score);

    const openCases = (caseFollowups || [])
      .filter((f) => f.status !== "مغلقة")
      .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));

    const today = todayISO();
    const overdueContacts = (guardianContacts || [])
      .filter((c) => c.nextContactDate && c.nextContactDate < today)
      .sort((a, b) => String(a.nextContactDate).localeCompare(String(b.nextContactDate)));

    const dueSoonContacts = (guardianContacts || [])
      .filter((c) => c.nextContactDate && c.nextContactDate >= today)
      .sort((a, b) => String(a.nextContactDate).localeCompare(String(b.nextContactDate)))
      .slice(0, 8);

    const degreeCounts = [1, 2, 3, 4].map((d) => ({
      degree: d,
      count: violations.filter(
        (v) => v.degree === d && String(v.date || "") >= cut30Iso
      ).length,
    }));

    const classCounts: Record<string, number> = {};
    violations
      .filter((v) => String(v.date || "") >= cut30Iso)
      .forEach((v) => {
        classCounts[v.class] = (classCounts[v.class] || 0) + 1;
      });

    const topClasses = Object.entries(classCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const periodicCount = periodicEvaluations.filter(
      (e) => String(e.date || "") >= cut30Iso
    ).length;

    return {
      atRisk,
      openCases,
      overdueContacts,
      dueSoonContacts,
      degreeCounts,
      topClasses,
      periodicCount,
    };
  }, [
    isAdmin,
    students,
    attendance,
    violations,
    evaluations,
    periodicEvaluations,
    caseFollowups,
    guardianContacts,
  ]);


  const advancedAdminStats = useMemo(() => {
    if (!isAdmin) return null;

    const iso = (d) => d.toISOString().slice(0, 10);
    const startOfDay = (d) => {
      const x = new Date(d);
      x.setHours(0, 0, 0, 0);
      return x;
    };
    const addDays = (d, n) => {
      const x = new Date(d);
      x.setDate(x.getDate() + n);
      return x;
    };

    const today = startOfDay(new Date());

    // تحويل سجل الحضور إلى قائمة سهلة للتحليل.
    const attendanceEvents = [];
    Object.entries<AttendanceByPeriod>(attendance || {}).forEach(([date, periods]) => {
      Object.entries(periods || {}).forEach(([period, rows]) => {
        Object.entries(rows || {}).forEach(([studentId, rec]) => {
          if (!rec?.status) return;
          const st = students.find((s) => s.id === studentId);
          attendanceEvents.push({
            date: String(date).slice(0, 10),
            period,
            studentId,
            className: st?.class || "غير محدد",
            status: rec.status,
          });
        });
      });
    });

    const inRange = (date, from, to) =>
      date >= iso(from) && date <= iso(to);

    const summarize = (from, to) => {
      const att = attendanceEvents.filter((x) => inRange(x.date, from, to));
      const viol = (violations || []).filter((v) =>
        v.date && inRange(String(v.date).slice(0, 10), from, to)
      );

      const present = att.filter((x) => x.status === "حاضر").length;
      const absent = att.filter((x) => x.status === "غائب").length;
      const late = att.filter((x) => x.status === "متأخر").length;
      const totalAtt = present + absent + late;

      const attendanceRate = totalAtt
        ? Math.round(((present + late) / totalAtt) * 1000) / 10
        : 0;

      return {
        present,
        absent,
        late,
        violations: viol.length,
        attendanceRate,
      };
    };

    const currentWeekFrom = addDays(today, -6);
    const previousWeekFrom = addDays(today, -13);
    const previousWeekTo = addDays(today, -7);

    const currentMonthFrom = addDays(today, -29);
    const previousMonthFrom = addDays(today, -59);
    const previousMonthTo = addDays(today, -30);

    const weekNow = summarize(currentWeekFrom, today);
    const weekPrev = summarize(previousWeekFrom, previousWeekTo);
    const monthNow = summarize(currentMonthFrom, today);
    const monthPrev = summarize(previousMonthFrom, previousMonthTo);

    const changePct = (now, prev) => {
      if (!prev) return now ? 100 : 0;
      return Math.round(((now - prev) / prev) * 1000) / 10;
    };

    const comparisons = {
      week: {
        attendance: changePct(weekNow.attendanceRate, weekPrev.attendanceRate),
        absence: changePct(weekNow.absent, weekPrev.absent),
        late: changePct(weekNow.late, weekPrev.late),
        violations: changePct(weekNow.violations, weekPrev.violations),
      },
      month: {
        attendance: changePct(monthNow.attendanceRate, monthPrev.attendanceRate),
        absence: changePct(monthNow.absent, monthPrev.absent),
        late: changePct(monthNow.late, monthPrev.late),
        violations: changePct(monthNow.violations, monthPrev.violations),
      },
    };

    // مؤشر الانضباط المدرسي لآخر 30 يوماً.
    const last30Att = attendanceEvents.filter((x) =>
      inRange(x.date, currentMonthFrom, today)
    );
    const last30Viol = (violations || []).filter((v) =>
      v.date && inRange(String(v.date).slice(0, 10), currentMonthFrom, today)
    );
    const last30Followups = (caseFollowups || []).filter((f) => {
      const date = String(f.createdAt || "").slice(0, 10);
      return date && inRange(date, currentMonthFrom, today);
    });

    const present30 = last30Att.filter((x) => x.status === "حاضر").length;
    const absent30 = last30Att.filter((x) => x.status === "غائب").length;
    const late30 = last30Att.filter((x) => x.status === "متأخر").length;
    const total30 = present30 + absent30 + late30;

    const attendanceScore = total30
      ? ((present30 + late30) / total30) * 100
      : 100;

    const punctualityBase = present30 + late30;
    const punctualityScore = punctualityBase
      ? (present30 / punctualityBase) * 100
      : 100;

    const weightedViolationPoints = last30Viol.reduce(
      (sum, v) => sum + Math.max(1, Math.min(4, Number(v.degree || 1))),
      0
    );
    const behaviorPenalty = Math.min(
      100,
      (weightedViolationPoints / Math.max(1, students.length)) * 10
    );
    const behaviorScore = Math.max(0, 100 - behaviorPenalty);

    const closedFollowups = last30Followups.filter(
      (f) => f.status === "مغلقة"
    ).length;
    const followupScore = last30Followups.length
      ? (closedFollowups / last30Followups.length) * 100
      : 100;

    const disciplineIndex = Math.round(
      attendanceScore * 0.45 +
      punctualityScore * 0.15 +
      behaviorScore * 0.30 +
      followupScore * 0.10
    );

    // نفس المؤشر للفترة السابقة للمقارنة.
    const previousAtt = attendanceEvents.filter((x) =>
      inRange(x.date, previousMonthFrom, previousMonthTo)
    );
    const previousViol = (violations || []).filter((v) =>
      v.date && inRange(String(v.date).slice(0, 10), previousMonthFrom, previousMonthTo)
    );
    const previousFollowups = (caseFollowups || []).filter((f) => {
      const date = String(f.createdAt || "").slice(0, 10);
      return date && inRange(date, previousMonthFrom, previousMonthTo);
    });

    const pp = previousAtt.filter((x) => x.status === "حاضر").length;
    const pa = previousAtt.filter((x) => x.status === "غائب").length;
    const pl = previousAtt.filter((x) => x.status === "متأخر").length;
    const pt = pp + pa + pl;
    const previousAttendanceScore = pt ? ((pp + pl) / pt) * 100 : 100;
    const previousPunctualityScore = pp + pl ? (pp / (pp + pl)) * 100 : 100;
    const previousWeighted = previousViol.reduce(
      (sum, v) => sum + Math.max(1, Math.min(4, Number(v.degree || 1))),
      0
    );
    const previousBehaviorScore = Math.max(
      0,
      100 - Math.min(100, (previousWeighted / Math.max(1, students.length)) * 10)
    );
    const previousClosed = previousFollowups.filter(
      (f) => f.status === "مغلقة"
    ).length;
    const previousFollowupScore = previousFollowups.length
      ? (previousClosed / previousFollowups.length) * 100
      : 100;

    const previousDisciplineIndex = Math.round(
      previousAttendanceScore * 0.45 +
      previousPunctualityScore * 0.15 +
      previousBehaviorScore * 0.30 +
      previousFollowupScore * 0.10
    );

    const disciplineChange = disciplineIndex - previousDisciplineIndex;

    const disciplineLabel =
      disciplineIndex >= 90 ? "ممتاز" :
      disciplineIndex >= 80 ? "جيد جداً" :
      disciplineIndex >= 70 ? "جيد" :
      disciplineIndex >= 60 ? "مقبول" :
      "يحتاج متابعة";

    // ترتيب الصفوف اعتماداً على الحضور والانضباط والمخالفات.
    const classRanking = [...new Set<string>((students || []).map((s) => s.class).filter(Boolean))]
      .map((className) => {
        const ids = new Set<string>(
          students.filter((s) => s.class === className).map((s) => s.id)
        );

        const att = last30Att.filter((x) => ids.has(x.studentId));
        const viol = last30Viol.filter((v) => ids.has(v.studentId));

        const p = att.filter((x) => x.status === "حاضر").length;
        const a = att.filter((x) => x.status === "غائب").length;
        const l = att.filter((x) => x.status === "متأخر").length;
        const total = p + a + l;

        const attendancePct = total ? ((p + l) / total) * 100 : 100;
        const punctualityPct = p + l ? (p / (p + l)) * 100 : 100;
        const violationPoints = viol.reduce(
          (sum, v) => sum + Math.max(1, Math.min(4, Number(v.degree || 1))),
          0
        );

        const classStudentsCount = Math.max(1, ids.size);
        const behaviorPct = Math.max(
          0,
          100 - Math.min(100, (violationPoints / classStudentsCount) * 12)
        );

        const score = Math.round(
          attendancePct * 0.50 +
          punctualityPct * 0.20 +
          behaviorPct * 0.30
        );

        return {
          className,
          score,
          attendancePct: Math.round(attendancePct),
          absent: a,
          late: l,
          violations: viol.length,
        };
      })
      .sort((a, b) => b.score - a.score);

    // بيانات خطية لآخر 8 أسابيع.
    const weeklyTrend = [];
    for (let i = 7; i >= 0; i--) {
      const to = addDays(today, -(i * 7));
      const from = addDays(to, -6);
      const s = summarize(from, to);
      weeklyTrend.push({
        name: `${from.getDate()}/${from.getMonth() + 1}`,
        غياب: s.absent,
        تأخر: s.late,
        مخالفات: s.violations,
      });
    }

    // مقارنة الصفوف لأفضل 8 صفوف.
    const classChartData = classRanking.slice(0, 8).map((x) => ({
      name: x.className,
      "مؤشر الانضباط": x.score,
      مخالفات: x.violations,
    }));

    return {
      weekNow,
      weekPrev,
      monthNow,
      monthPrev,
      comparisons,
      disciplineIndex,
      previousDisciplineIndex,
      disciplineChange,
      disciplineLabel,
      classRanking,
      weeklyTrend,
      classChartData,
    };
  }, [
    isAdmin,
    students,
    attendance,
    violations,
    caseFollowups,
  ]);

  return (
    <div className="view-stack">
      <div className="stat-grid">
        <StatCard icon={Users} label="إجمالي الطلاب" value={students.length} tone="#1E2A4A" />
        <StatCard icon={UserCheck} label="حاضر اليوم" value={stats.present} tone="#2F9E6E" />
        <StatCard icon={UserX} label="غائب اليوم" value={stats.absent} tone="#C7433F" />
        <StatCard icon={Clock} label="متأخر اليوم" value={stats.late} tone="#D9A62E" />
      </div>

      {isAdmin && adminIntelligence && (
        <>
          {tasks.length > 0 && (
            <section className="card">
              <div className="card-head">
                <h3><ClipboardList size={17} /> المهام الرئيسية</h3>
              </div>
              <div className="task-grid">
                {tasks.map((t) => (
                  <button key={t.id} className="task-tile" onClick={() => setView(t.id)}>
                    <span className="task-tile-icon" style={{ background: t.bg, color: t.color }}>
                      <t.icon size={20} />
                    </span>
                    <span className="task-tile-label">{t.label}</span>
                  </button>
                ))}
              </div>
            </section>
          )}

          <section className="card">
            <div className="card-head">
              <h3><Activity size={17} /> لوحة المؤشرات الذكية لمدير النظام</h3>
              <button className="link-btn" onClick={() => setView("student-profile")}>
                فتح الملف الشامل <ChevronLeft size={14} />
              </button>
            </div>

            <div className="stat-grid">
              <StatCard
                icon={AlertTriangle}
                label="طلاب يحتاجون متابعة"
                value={adminIntelligence.atRisk.length}
                tone="#C7433F"
              />
              <StatCard
                icon={ClipboardList}
                label="حالات مفتوحة"
                value={adminIntelligence.openCases.length}
                tone="#E07B39"
              />
              <StatCard
                icon={Phone}
                label="اتصالات متأخرة"
                value={adminIntelligence.overdueContacts.length}
                tone="#D9A62E"
              />
              <StatCard
                icon={FileText}
                label="تقييمات دورية آخر 30 يوم"
                value={adminIntelligence.periodicCount}
                tone="#5B8DEF"
              />
            </div>
          </section>

          {advancedAdminStats && (
            <>
              <section className="card">
                <div className="card-head">
                  <h3><TrendingUp size={17} /> مؤشر الانضباط والمقارنة الزمنية</h3>
                  <span className="att-sub">آخر 30 يوماً مقارنةً بالـ30 يوماً السابقة</span>
                </div>

                <div className="discipline-overview">
                  <div className="discipline-index-card">
                    <div className="discipline-index-value">
                      {advancedAdminStats.disciplineIndex}
                      <small>/100</small>
                    </div>
                    <div className="discipline-index-label">
                      مؤشر الانضباط المدرسي — {advancedAdminStats.disciplineLabel}
                    </div>
                    <div
                      className={`discipline-change ${
                        advancedAdminStats.disciplineChange >= 0
                          ? "discipline-change-up"
                          : "discipline-change-down"
                      }`}
                    >
                      {advancedAdminStats.disciplineChange >= 0 ? "↑" : "↓"}{" "}
                      {Math.abs(advancedAdminStats.disciplineChange)} نقطة مقارنة بالفترة السابقة
                    </div>
                  </div>

                  <div className="comparison-cards">
                    {[
                      {
                        label: "نسبة الحضور",
                        value: `${advancedAdminStats.monthNow.attendanceRate}%`,
                        change: advancedAdminStats.comparisons.month.attendance,
                        positiveWhenUp: true,
                      },
                      {
                        label: "الغياب",
                        value: advancedAdminStats.monthNow.absent,
                        change: advancedAdminStats.comparisons.month.absence,
                        positiveWhenUp: false,
                      },
                      {
                        label: "التأخر",
                        value: advancedAdminStats.monthNow.late,
                        change: advancedAdminStats.comparisons.month.late,
                        positiveWhenUp: false,
                      },
                      {
                        label: "المخالفات",
                        value: advancedAdminStats.monthNow.violations,
                        change: advancedAdminStats.comparisons.month.violations,
                        positiveWhenUp: false,
                      },
                    ].map((item) => {
                      const improved =
                        item.change === 0 ||
                        (item.positiveWhenUp ? item.change > 0 : item.change < 0);
                      return (
                        <div className="comparison-card" key={item.label}>
                          <span>{item.label}</span>
                          <b>{item.value}</b>
                          <small className={improved ? "metric-good" : "metric-bad"}>
                            {item.change > 0 ? "↑" : item.change < 0 ? "↓" : "—"}{" "}
                            {Math.abs(item.change)}%
                          </small>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </section>

              <div className="two-col">
                <section className="card">
                  <div className="card-head">
                    <h3><LineChartIcon size={17} /> الاتجاه الأسبوعي — آخر 8 أسابيع</h3>
                  </div>
                  <ResponsiveContainer width="100%" height={260}>
                    <LineChart data={advancedAdminStats.weeklyTrend}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E3E7E4" />
                      <XAxis dataKey="name" tick={{ fontFamily: "Tajawal", fontSize: 11 }} />
                      <YAxis allowDecimals={false} tick={{ fontFamily: "Tajawal", fontSize: 11 }} />
                      <Tooltip contentStyle={{ fontFamily: "Tajawal", direction: "rtl" }} />
                      <Legend wrapperStyle={{ fontFamily: "Tajawal", fontSize: 11 }} />
                      <Line type="monotone" dataKey="غياب" stroke="#C7433F" strokeWidth={2.3} dot={{ r: 3 }} />
                      <Line type="monotone" dataKey="تأخر" stroke="#D9A62E" strokeWidth={2.3} dot={{ r: 3 }} />
                      <Line type="monotone" dataKey="مخالفات" stroke="#5B8DEF" strokeWidth={2.3} dot={{ r: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </section>

                <section className="card">
                  <div className="card-head">
                    <h3><BarChart3 size={17} /> ترتيب الصفوف حسب الانضباط</h3>
                  </div>
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={advancedAdminStats.classChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E3E7E4" />
                      <XAxis dataKey="name" tick={{ fontFamily: "Tajawal", fontSize: 11 }} />
                      <YAxis domain={[0, 100]} tick={{ fontFamily: "Tajawal", fontSize: 11 }} />
                      <Tooltip contentStyle={{ fontFamily: "Tajawal", direction: "rtl" }} />
                      <Bar dataKey="مؤشر الانضباط" fill="#1E2A4A" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </section>
              </div>

              <section className="card">
                <div className="card-head">
                  <h3><GraduationCap size={17} /> ترتيب الصفوف — آخر 30 يوماً</h3>
                </div>

                {advancedAdminStats.classRanking.length === 0 ? (
                  <EmptyState text="لا توجد بيانات صفوف كافية للترتيب" />
                ) : (
                  <div className="class-ranking-list">
                    {advancedAdminStats.classRanking.slice(0, 10).map((row, index) => (
                      <div className="class-ranking-row" key={row.className}>
                        <span className="class-rank-number">{index + 1}</span>
                        <div className="class-ranking-name">
                          <b>الصف {row.className}</b>
                          <span>
                            حضور {row.attendancePct}% · غياب {row.absent} · تأخر {row.late} · مخالفات {row.violations}
                          </span>
                        </div>
                        <div className="class-ranking-score">
                          {row.score}
                          <small>/100</small>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <section className="card">
                <div className="card-head">
                  <h3><Activity size={17} /> مقارنة هذا الأسبوع بالأسبوع السابق</h3>
                </div>
                <div className="weekly-comparison-grid">
                  {[
                    ["الحضور", `${advancedAdminStats.weekNow.attendanceRate}%`, advancedAdminStats.comparisons.week.attendance, true],
                    ["الغياب", advancedAdminStats.weekNow.absent, advancedAdminStats.comparisons.week.absence, false],
                    ["التأخر", advancedAdminStats.weekNow.late, advancedAdminStats.comparisons.week.late, false],
                    ["المخالفات", advancedAdminStats.weekNow.violations, advancedAdminStats.comparisons.week.violations, false],
                  ].map(([label, value, change, positiveWhenUp]) => {
                    const improved =
                      change === 0 || (positiveWhenUp ? change > 0 : change < 0);
                    return (
                      <div className="weekly-comparison-item" key={label}>
                        <span>{label}</span>
                        <b>{value}</b>
                        <small className={improved ? "metric-good" : "metric-bad"}>
                          {change > 0 ? "↑" : change < 0 ? "↓" : "—"} {Math.abs(change)}%
                        </small>
                      </div>
                    );
                  })}
                </div>
              </section>
            </>
          )}

          <section className="card">
            <div className="card-head">
              <h3><ClipboardList size={17} /> مركز الإجراءات الذكي للطلاب</h3>
              <span className="count-chip" style={{ background: "#1E2A4A" }}>{actionCenter.length}</span>
            </div>

            {actionCenter.length === 0 ? (
              <EmptyState text="لا توجد إجراءات طلابية مطلوبة حالياً" />
            ) : (
              <div className="smart-action-list">
                {actionCenter.slice(0, 12).map((a) => (
                  <div key={a.id} className={`smart-action-item ${a.overdue ? "smart-action-overdue" : ""}`}>
                    <div className="smart-action-main">
                      <div className="smart-action-title">
                        <b>{a.student.name}</b>
                        <span>{a.student.class}{a.student.section ? ` / ${a.student.section}` : ""}</span>
                      </div>
                      <div className="smart-action-type">{a.type}</div>
                      <div className="att-sub">{a.reason}</div>
                    </div>
                    <div className="smart-action-meta">
                      <span><b>الحالة:</b> {a.status}</span>
                      <span><b>المسؤول:</b> {a.responsible}</span>
                      <span><b>الاستحقاق:</b> {a.dueDate || "غير محدد"}</span>
                    </div>
                    <div className="smart-action-buttons">
                      <button className="chip-btn" onClick={() => {
                        setFocusedStudentId?.(a.student.id);
                        setView("student-profile");
                      }}>
                        <Eye size={14}/> فتح ملف الطالب
                      </button>
                      {a.followupId && (
                        <button className="chip-btn" onClick={() => completeCaseFollowup?.(a.followupId)}>
                          <Check size={14}/> تم الإنجاز
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="card">
            <div className="card-head">
              <h3><Bell size={17} /> التنبيهات والإجراءات المطلوبة</h3>
              <span className="count-chip" style={{ background: "#C7433F" }}>
                {adminIntelligence.atRisk.length + adminIntelligence.overdueContacts.length}
              </span>
            </div>

            {adminIntelligence.atRisk.length === 0 && adminIntelligence.overdueContacts.length === 0 ? (
              <EmptyState text="لا توجد تنبيهات تتطلب إجراءً حالياً" />
            ) : (
              <div className="view-stack">
                {adminIntelligence.atRisk.slice(0, 10).map((r) => {
                  const reasons = [];
                  if (r.absences >= 3) reasons.push(`تكرار الغياب (${r.absences})`);
                  if (r.late >= 3) reasons.push(`تكرار التأخر (${r.late})`);
                  if (r.violations >= 3) reasons.push(`تكرار المخالفات (${r.violations})`);
                  if (r.avg !== null && r.avg < 70) reasons.push(`انخفاض التقييم (${r.avg}%)`);
                  if (r.latestFollow && r.latestFollow.status !== "مغلقة") reasons.push("حالة متابعة مفتوحة");
                  return (
                    <div key={`alert-${r.student.id}`} className="card" style={{ padding: 14, borderRight: `4px solid ${r.level === "مرتفع" ? "#C7433F" : "#D9A62E"}` }}>
                      <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
                        <Avatar name={r.student.name} tone={r.level === "مرتفع" ? "#C7433F" : "#D9A62E"} />
                        <div style={{ flex: 1, minWidth: 220 }}>
                          <div style={{ fontWeight: 800 }}>{r.student.name} · الصف {r.student.class}</div>
                          <div className="mini-list-desc" style={{ marginTop: 4 }}>{reasons.join(" · ") || "مؤشرات تستدعي المتابعة"}</div>
                        </div>
                        <span className="count-chip" style={{ background: r.level === "مرتفع" ? "#C7433F" : "#D9A62E" }}>
                          أولوية {r.level}
                        </span>
                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                          <button className="today-btn" onClick={() => { setFocusedStudentId(r.student.id); setView("student-profile"); }}>ملف الطالب</button>
                          <button className="today-btn" onClick={() => setView("log")}>المخالفات</button>
                          <button className="today-btn" onClick={() => setView("reports")}>التقارير</button>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {adminIntelligence.overdueContacts.slice(0, 6).map((c) => (
                  <div key={`contact-alert-${c.id}`} className="card" style={{ padding: 14, borderRight: "4px solid #8E6FCE" }}>
                    <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
                      <Phone size={20} />
                      <div style={{ flex: 1, minWidth: 220 }}>
                        <div style={{ fontWeight: 800 }}>{c.studentName}</div>
                        <div className="mini-list-desc">موعد التواصل مع ولي الأمر متأخر منذ {c.nextContactDate} · {c.channel}</div>
                      </div>
                      <span className="count-chip" style={{ background: "#8E6FCE" }}>تواصل مطلوب</span>
                      <button className="today-btn" onClick={() => {
                        const target = students.find((s) => s.name === c.studentName);
                        if (target) setFocusedStudentId(target.id);
                        setView("student-profile");
                      }}>فتح الملف</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <div className="two-col">
            <section className="card">
              <div className="card-head">
                <h3><ShieldAlert size={17} /> الطلاب الأعلى احتياجاً للمتابعة</h3>
              </div>

              {adminIntelligence.atRisk.length === 0 ? (
                <EmptyState text="لا توجد حالات مرتفعة أو متوسطة حسب المؤشرات الحالية" />
              ) : (
                <ul className="mini-list">
                  {adminIntelligence.atRisk.slice(0, 8).map((r) => (
                    <li key={r.student.id}>
                      <Avatar name={r.student.name} tone={r.level === "مرتفع" ? "#C7433F" : "#D9A62E"} />
                      <span className="mini-list-name">{r.student.name}</span>
                      <span className="mini-list-desc">
                        الصف {r.student.class} · غياب {r.absences} · تأخر {r.late} · مخالفات {r.violations}
                        {r.avg !== null ? ` · تقييم ${r.avg}%` : ""}
                      </span>
                      <span
                        className="count-chip"
                        style={{ background: r.level === "مرتفع" ? "#C7433F" : "#D9A62E" }}
                      >
                        {r.level}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="card">
              <div className="card-head">
                <h3><Phone size={17} /> مواعيد التواصل مع أولياء الأمور</h3>
              </div>

              {adminIntelligence.overdueContacts.length > 0 && (
                <div style={{ marginBottom: 10 }}>
                  <div className="field-label" style={{ color: "#C7433F" }}>
                    متأخرة ({adminIntelligence.overdueContacts.length})
                  </div>
                  <ul className="mini-list">
                    {adminIntelligence.overdueContacts.slice(0, 5).map((c) => (
                      <li key={c.id}>
                        <span className="mini-list-name">{c.studentName}</span>
                        <span className="mini-list-desc">{c.channel} · {c.outcome}</span>
                        <span className="count-chip" style={{ background: "#C7433F" }}>
                          {c.nextContactDate}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="field-label">القادمة</div>
              {adminIntelligence.dueSoonContacts.length === 0 ? (
                <EmptyState text="لا توجد مواعيد تواصل قادمة" />
              ) : (
                <ul className="mini-list">
                  {adminIntelligence.dueSoonContacts.map((c) => (
                    <li key={c.id}>
                      <span className="mini-list-name">{c.studentName}</span>
                      <span className="mini-list-desc">{c.channel} · {c.outcome}</span>
                      <span className="count-chip" style={{ background: "#5B8DEF" }}>
                        {c.nextContactDate}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>

          <div className="two-col">
            <section className="card">
              <div className="card-head">
                <h3><BarChart3 size={17} /> المخالفات حسب الدرجة — آخر 30 يوم</h3>
              </div>
              <div className="degree-row">
                {adminIntelligence.degreeCounts.map((x) => (
                  <div
                    key={x.degree}
                    className="degree-pill"
                    style={{
                      background: DEGREES[x.degree].soft,
                      color: DEGREES[x.degree].color,
                    }}
                  >
                    <span
                      className="degree-dot"
                      style={{ background: DEGREES[x.degree].color }}
                    />
                    {DEGREES[x.degree].label}
                    <b>{x.count}</b>
                  </div>
                ))}
              </div>
            </section>

            <section className="card">
              <div className="card-head">
                <h3><TrendingUp size={17} /> الصفوف الأكثر مخالفات — آخر 30 يوم</h3>
              </div>
              {adminIntelligence.topClasses.length === 0 ? (
                <EmptyState text="لا توجد مخالفات خلال آخر 30 يوماً" />
              ) : (
                <ul className="mini-list">
                  {adminIntelligence.topClasses.map((x) => (
                    <li key={x.name}>
                      <span className="mini-list-name">الصف {x.name}</span>
                      <span className="mini-list-desc">إجمالي المخالفات</span>
                      <span className="count-chip">{x.count}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        </>
      )}

      {!isAdmin && tasks.length > 0 && (
        <section className="card">
          <div className="card-head"><h3><ClipboardList size={17} /> المهام الرئيسية</h3></div>
          <div className="task-grid">
            {tasks.map((t) => (
              <button key={t.id} className="task-tile" onClick={() => setView(t.id)}>
                <span className="task-tile-icon" style={{ background: t.bg, color: t.color }}>
                  <t.icon size={20} />
                </span>
                <span className="task-tile-label">{t.label}</span>
              </button>
            ))}
          </div>
        </section>
      )}

      <div className="two-col">
        <section className="card">
          <div className="card-head">
            <h3><AlertTriangle size={17} /> مخالفات اليوم حسب الدرجة</h3>
            <button className="link-btn" onClick={() => setView("violations")}>
              تسجيل مخالفة <Plus size={14} />
            </button>
          </div>
          <div className="degree-row">
            {[1, 2, 3, 4].map((d) => (
              <div key={d} className="degree-pill" style={{ background: DEGREES[d].soft, color: DEGREES[d].color }}>
                <span className="degree-dot" style={{ background: DEGREES[d].color }} />
                {DEGREES[d].label}
                <b>{stats.byDegree[d - 1].count}</b>
              </div>
            ))}
          </div>
          {stats.todayViol.length === 0 ? (
            <EmptyState text="لا توجد مخالفات مسجلة اليوم" />
          ) : (
            <ul className="mini-list">
              {stats.todayViol.slice(0, 5).map((v) => (
                <li key={v.id}>
                  <SeverityGauge degree={v.degree} size="sm" />
                  <span className="mini-list-name">{v.studentName}</span>
                  <span className="mini-list-desc">{v.item}</span>
                  <span className="mini-list-time">{v.time}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card">
          <div className="card-head">
            <h3><TrendingUp size={17} /> الطلاب الأكثر تكراراً للمخالفات</h3>
          </div>
          {topStudents.length === 0 ? (
            <EmptyState text="لا توجد بيانات كافية بعد" />
          ) : (
            <ul className="mini-list">
              {topStudents.map(({ student, count }) => (
                <li key={student?.id}>
                  <Avatar name={student?.name || "?"} />
                  <span className="mini-list-name">{student?.name}</span>
                  <span className="mini-list-desc">{student?.class} - {student?.section}</span>
                  <span className="count-chip">{count}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
