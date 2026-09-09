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
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend, Cell
} from "recharts";
import { DEGREES, PERIODIC_RATING_SCALE, todayISO } from "./shared";
import { EmptyState } from "./EmptyState";


export function SmartAnalyticsCenter({
  students,
  attendance,
  violations,
  evaluations,
  periodicEvaluations,
  caseFollowups,
  guardianContacts,
  classes,
  currentUser,
}) {
  const today = todayISO();
  const defaultFrom = (() => {
    const d = new Date();
    d.setDate(d.getDate() - 29);
    return d.toISOString().slice(0, 10);
  })();

  const [fromDate, setFromDate] = useState(defaultFrom);
  const [toDate, setToDate] = useState(today);
  const [filterClass, setFilterClass] = useState("الكل");

  const safeDate = (value) => String(value || "").slice(0, 10);
  const inRange = (date, from, to) =>
    !!date && (!from || date >= from) && (!to || date <= to);

  const selectedStudentIds = useMemo(() => {
    return new Set(
      (students || [])
        .filter((s) => filterClass === "الكل" || s.class === filterClass)
        .map((s) => s.id)
    );
  }, [students, filterClass]);

  const attendanceRows = useMemo(() => {
    const rows = [];
    Object.entries(attendance || {}).forEach(([date, periods]) => {
      Object.entries(periods || {}).forEach(([period, byStudent]) => {
        Object.entries(byStudent || {}).forEach(([studentId, rec]) => {
          if (!selectedStudentIds.has(studentId) || !rec?.status) return;
          rows.push({
            date: safeDate(date),
            period,
            studentId,
            status: rec.status,
          });
        });
      });
    });
    return rows;
  }, [attendance, selectedStudentIds]);

  const makeRange = (from, to) => {
    const fromObj = new Date(`${from}T00:00:00`);
    const toObj = new Date(`${to}T00:00:00`);
    const days = Math.max(1, Math.round((toObj - fromObj) / 86400000) + 1);
    const prevToObj = new Date(fromObj);
    prevToObj.setDate(prevToObj.getDate() - 1);
    const prevFromObj = new Date(prevToObj);
    prevFromObj.setDate(prevFromObj.getDate() - days + 1);
    return {
      days,
      prevFrom: prevFromObj.toISOString().slice(0, 10),
      prevTo: prevToObj.toISOString().slice(0, 10),
    };
  };

  const periodMeta = useMemo(
    () => makeRange(fromDate || defaultFrom, toDate || today),
    [fromDate, toDate]
  );

  const summarize = useCallback(
    (from, to) => {
      const att = attendanceRows.filter((x) => inRange(x.date, from, to));
      const vs = (violations || []).filter(
        (v) =>
          selectedStudentIds.has(v.studentId) &&
          inRange(safeDate(v.date), from, to)
      );
      const ev = (evaluations || []).filter(
        (e) =>
          selectedStudentIds.has(e.studentId) &&
          inRange(safeDate(e.date), from, to)
      );
      const pe = (periodicEvaluations || []).filter(
        (e) =>
          selectedStudentIds.has(e.studentId) &&
          inRange(safeDate(e.date), from, to)
      );
      const follows = (caseFollowups || []).filter(
        (f) =>
          selectedStudentIds.has(f.studentId) &&
          inRange(safeDate(f.createdAt), from, to)
      );
      const contacts = (guardianContacts || []).filter(
        (c) =>
          selectedStudentIds.has(c.studentId) &&
          inRange(safeDate(c.contactAt), from, to)
      );

      const present = att.filter((x) => x.status === "حاضر").length;
      const absent = att.filter((x) => x.status === "غائب").length;
      const late = att.filter((x) => x.status === "متأخر").length;
      const totalAtt = present + absent + late;
      const attendanceRate = totalAtt
        ? Math.round(((present + late) / totalAtt) * 1000) / 10
        : 0;

      const evalAvg = ev.length
        ? Math.round(
            ev.reduce((sum, e) => sum + Number(e.percent || 0), 0) /
              ev.length
          )
        : null;

      const starPoints = ev.reduce(
        (sum, e) =>
          sum +
          Object.values(e.scores || {}).reduce(
            (a, b) => a + Number(b || 0),
            0
          ),
        0
      );

      const closedFollowups = follows.filter((f) => f.status === "مغلقة").length;
      const followupClosureRate = follows.length
        ? Math.round((closedFollowups / follows.length) * 100)
        : 100;

      return {
        att,
        vs,
        ev,
        pe,
        follows,
        contacts,
        present,
        absent,
        late,
        attendanceRate,
        evalAvg,
        starPoints,
        followupClosureRate,
      };
    },
    [
      attendanceRows,
      violations,
      evaluations,
      periodicEvaluations,
      caseFollowups,
      guardianContacts,
      selectedStudentIds,
    ]
  );

  const current = useMemo(
    () => summarize(fromDate, toDate),
    [summarize, fromDate, toDate]
  );
  const previous = useMemo(
    () => summarize(periodMeta.prevFrom, periodMeta.prevTo),
    [summarize, periodMeta]
  );

  const changePct = (now, prev) => {
    if (prev === null || prev === undefined) return 0;
    if (Number(prev) === 0) return Number(now) === 0 ? 0 : 100;
    return Math.round(((Number(now) - Number(prev)) / Number(prev)) * 1000) / 10;
  };

  const degreeData = [1, 2, 3, 4].map((degree) => ({
    name: DEGREES[degree].label,
    عدد: current.vs.filter((v) => Number(v.degree) === degree).length,
  }));

  const ratingDistribution = PERIODIC_RATING_SCALE.map((r) => ({
    name: r.label,
    عدد: current.pe.filter((e) => e.overallRating === r.label).length,
  }));

  const trendData = useMemo(() => {
    const from = new Date(`${fromDate}T00:00:00`);
    const to = new Date(`${toDate}T00:00:00`);
    const days = Math.max(1, Math.round((to - from) / 86400000) + 1);
    const bucketDays = days <= 14 ? 1 : 7;
    const result = [];

    for (let offset = 0; offset < days; offset += bucketDays) {
      const bucketFrom = new Date(from);
      bucketFrom.setDate(bucketFrom.getDate() + offset);
      const bucketTo = new Date(bucketFrom);
      bucketTo.setDate(
        bucketTo.getDate() + Math.min(bucketDays - 1, days - offset - 1)
      );
      const bf = bucketFrom.toISOString().slice(0, 10);
      const bt = bucketTo.toISOString().slice(0, 10);
      const s = summarize(bf, bt);
      result.push({
        name:
          bucketDays === 1
            ? bucketFrom.toLocaleDateString("ar-QA", {
                day: "numeric",
                month: "numeric",
              })
            : `${bucketFrom.getDate()}/${bucketFrom.getMonth() + 1}`,
        غياب: s.absent,
        تأخر: s.late,
        مخالفات: s.vs.length,
      });
    }
    return result;
  }, [fromDate, toDate, summarize]);

  const classAnalysis = useMemo(() => {
    const baseClasses =
      filterClass === "الكل"
        ? [...new Set((students || []).map((s) => s.class).filter(Boolean))]
        : [filterClass];

    return baseClasses
      .map((className) => {
        const ids = new Set(
          students.filter((s) => s.class === className).map((s) => s.id)
        );
        const att = current.att.filter((x) => ids.has(x.studentId));
        const vs = current.vs.filter((v) => ids.has(v.studentId));
        const ev = current.ev.filter((e) => ids.has(e.studentId));

        const present = att.filter((x) => x.status === "حاضر").length;
        const absent = att.filter((x) => x.status === "غائب").length;
        const late = att.filter((x) => x.status === "متأخر").length;
        const totalAtt = present + absent + late;
        const attendanceRate = totalAtt
          ? ((present + late) / totalAtt) * 100
          : 100;
        const punctualityRate =
          present + late ? (present / (present + late)) * 100 : 100;
        const weighted = vs.reduce(
          (sum, v) =>
            sum + Math.max(1, Math.min(4, Number(v.degree || 1))),
          0
        );
        const behaviorScore = Math.max(
          0,
          100 -
            Math.min(
              100,
              (weighted / Math.max(1, ids.size)) * 12
            )
        );
        const score = Math.round(
          attendanceRate * 0.5 +
            punctualityRate * 0.2 +
            behaviorScore * 0.3
        );
        const evalAvg = ev.length
          ? Math.round(
              ev.reduce((a, e) => a + Number(e.percent || 0), 0) / ev.length
            )
          : null;

        return {
          className,
          score,
          absent,
          late,
          violations: vs.length,
          evalAvg,
        };
      })
      .sort((a, b) => b.score - a.score);
  }, [students, filterClass, current]);

  const automaticInsights = useMemo(() => {
    const insights = [];

    const attendanceChange = changePct(
      current.attendanceRate,
      previous.attendanceRate
    );
    if (attendanceChange > 1) {
      insights.push({
        kind: "positive",
        text: `ارتفعت نسبة الحضور ${Math.abs(attendanceChange)}% مقارنة بالفترة السابقة.`,
      });
    } else if (attendanceChange < -1) {
      insights.push({
        kind: "warning",
        text: `انخفضت نسبة الحضور ${Math.abs(attendanceChange)}% مقارنة بالفترة السابقة.`,
      });
    }

    const violationChange = changePct(current.vs.length, previous.vs.length);
    if (violationChange < -1) {
      insights.push({
        kind: "positive",
        text: `انخفض عدد المخالفات ${Math.abs(violationChange)}% مقارنة بالفترة السابقة.`,
      });
    } else if (violationChange > 1) {
      insights.push({
        kind: "warning",
        text: `ارتفع عدد المخالفات ${Math.abs(violationChange)}% مقارنة بالفترة السابقة.`,
      });
    }

    if (classAnalysis.length) {
      const best = classAnalysis[0];
      const mostViol = [...classAnalysis].sort(
        (a, b) => b.violations - a.violations
      )[0];
      const mostLate = [...classAnalysis].sort((a, b) => b.late - a.late)[0];

      insights.push({
        kind: "positive",
        text: `الصف ${best.className} يحقق أعلى مؤشر انضباط في الفترة المحددة (${best.score}/100).`,
      });
      if (mostViol?.violations > 0) {
        insights.push({
          kind: "warning",
          text: `الصف ${mostViol.className} لديه أعلى عدد من المخالفات (${mostViol.violations}).`,
        });
      }
      if (mostLate?.late > 0) {
        insights.push({
          kind: "warning",
          text: `الصف ${mostLate.className} يسجل أعلى عدد من حالات التأخر (${mostLate.late}).`,
        });
      }
    }

    const mostDegree = [...degreeData].sort((a, b) => b.عدد - a.عدد)[0];
    if (mostDegree?.عدد > 0) {
      insights.push({
        kind: "neutral",
        text: `${mostDegree.name} هي الأكثر تكراراً خلال الفترة بعدد ${mostDegree.عدد} مخالفة.`,
      });
    }

    if (current.evalAvg !== null) {
      const prevAvg = previous.evalAvg;
      if (prevAvg !== null && current.evalAvg > prevAvg) {
        insights.push({
          kind: "positive",
          text: `تحسن متوسط تقييم الأداء من ${prevAvg}% إلى ${current.evalAvg}%.`,
        });
      } else if (prevAvg !== null && current.evalAvg < prevAvg) {
        insights.push({
          kind: "warning",
          text: `انخفض متوسط تقييم الأداء من ${prevAvg}% إلى ${current.evalAvg}%.`,
        });
      }
    }

    if (current.followupClosureRate < 70) {
      insights.push({
        kind: "warning",
        text: `نسبة إغلاق المتابعات ${current.followupClosureRate}% فقط؛ يوصى بمراجعة الحالات المفتوحة.`,
      });
    } else {
      insights.push({
        kind: "positive",
        text: `نسبة إنجاز وإغلاق المتابعات جيدة (${current.followupClosureRate}%).`,
      });
    }

    return insights;
  }, [current, previous, classAnalysis, degreeData]);

  const printAdministrativeReport = () => {
    const esc = (value) =>
      String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");

    const w = window.open("", "_blank", "width=1100,height=850");
    if (!w) return;

    const classRows = classAnalysis
      .map(
        (r, i) => `
          <tr>
            <td>${i + 1}</td>
            <td>${esc(r.className)}</td>
            <td>${r.score}/100</td>
            <td>${r.absent}</td>
            <td>${r.late}</td>
            <td>${r.violations}</td>
            <td>${r.evalAvg === null ? "—" : `${r.evalAvg}%`}</td>
          </tr>`
      )
      .join("");

    const insightRows = automaticInsights
      .map((x) => `<li>${esc(x.text)}</li>`)
      .join("");

    writeSchoolPrint(w, `
      <!doctype html>
      <html lang="ar" dir="rtl">
      <head>
        <meta charset="utf-8"/>
        <title>التقرير الإحصائي الإداري</title>
        <style>
          @page{size:A4 landscape;margin:10mm}
          body{font-family:Tahoma,Arial,sans-serif;color:#111;font-size:11px;margin:0}
          .logo{width:100%;height:58px;object-fit:contain}
          h1{text-align:center;color:#17264d;margin:8px 0}
          .meta{display:flex;justify-content:space-between;border:1px solid #aaa;padding:8px;margin-bottom:10px}
          .kpis{display:grid;grid-template-columns:repeat(6,1fr);gap:6px;margin:10px 0}
          .kpi{border:1px solid #aaa;text-align:center;padding:7px}
          .kpi b{display:block;font-size:16px;color:#17264d}
          table{width:100%;border-collapse:collapse;margin-top:8px}
          th,td{border:1px solid #999;padding:5px;text-align:center}
          th{background:#dce6f5;color:#17264d}
          .section{background:#17264d;color:#fff;padding:6px 8px;font-weight:bold;margin-top:12px}
          li{margin:5px 0}
          .footer{text-align:center;margin-top:14px;color:#777}
        </style>
      </head>
      <body>

        <h1>التقرير الإحصائي الإداري والتحليلات الذكية</h1>
        <div class="meta">
          <span>الفترة: ${esc(fromDate)} إلى ${esc(toDate)}</span>
          <span>النطاق: ${filterClass === "الكل" ? "كل المدرسة" : `الصف ${esc(filterClass)}`}</span>
          <span>تاريخ الإصدار: ${esc(new Date().toLocaleDateString("ar-QA"))}</span>
        </div>

        <div class="kpis">
          <div class="kpi"><span>الحضور</span><b>${current.attendanceRate}%</b></div>
          <div class="kpi"><span>الغياب</span><b>${current.absent}</b></div>
          <div class="kpi"><span>التأخر</span><b>${current.late}</b></div>
          <div class="kpi"><span>المخالفات</span><b>${current.vs.length}</b></div>
          <div class="kpi"><span>متوسط التقييم</span><b>${current.evalAvg === null ? "—" : `${current.evalAvg}%`}</b></div>
          <div class="kpi"><span>إغلاق المتابعات</span><b>${current.followupClosureRate}%</b></div>
        </div>

        <div class="section">الاستنتاجات الذكية</div>
        <ul>${insightRows || "<li>لا توجد استنتاجات كافية للفترة المحددة.</li>"}</ul>

        <div class="section">ترتيب الصفوف ومؤشرات الأداء</div>
        <table>
          <thead>
            <tr>
              <th>م</th>
              <th>الصف</th>
              <th>مؤشر الانضباط</th>
              <th>الغياب</th>
              <th>التأخر</th>
              <th>المخالفات</th>
              <th>متوسط التقييم</th>
            </tr>
          </thead>
          <tbody>${classRows || '<tr><td colspan="7">لا توجد بيانات</td></tr>'}</tbody>
        </table>

        <div class="section">توزيع المخالفات حسب الدرجة</div>
        <table>
          <tr>
            ${degreeData.map((d) => `<th>${esc(d.name)}</th>`).join("")}
          </tr>
          <tr>
            ${degreeData.map((d) => `<td>${d.عدد}</td>`).join("")}
          </tr>
        </table>

        <div class="footer">مدرسة عمر بن عبد العزيز الثانوية للبنين — تقرير صادر من نظام Presence</div>
        
      </body>
      </html>
    `);

  };

  if (currentUser?.role !== "مدير النظام") {
    return <EmptyState text="هذه الصفحة متاحة لمدير النظام فقط" />;
  }

  return (
    <div className="view-stack">
      <section className="card">
        <div className="card-head">
          <h3><TrendingUp size={18} /> مركز التحليلات الذكية</h3>
          <button className="chip-btn" onClick={printAdministrativeReport}>
            <Printer size={15} /> طباعة التقرير الإداري
          </button>
        </div>

        <div className="report-filter-grid">
          <div>
            <div className="field-label">من تاريخ</div>
            <input
              type="date"
              className="text-input"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
            />
          </div>
          <div>
            <div className="field-label">إلى تاريخ</div>
            <input
              type="date"
              className="text-input"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
            />
          </div>
          <div>
            <div className="field-label">الصف</div>
            <select
              className="select-input"
              value={filterClass}
              onChange={(e) => setFilterClass(e.target.value)}
            >
              <option value="الكل">كل المدرسة</option>
              {classes.map((c) => (
                <option key={c} value={c}>الصف {c}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="analytics-preset-row">
          <button
            className="chip-btn-outline"
            onClick={() => {
              const d = new Date();
              const from = new Date();
              from.setDate(d.getDate() - 6);
              setFromDate(from.toISOString().slice(0, 10));
              setToDate(d.toISOString().slice(0, 10));
            }}
          >
            آخر 7 أيام
          </button>
          <button
            className="chip-btn-outline"
            onClick={() => {
              const d = new Date();
              const from = new Date();
              from.setDate(d.getDate() - 29);
              setFromDate(from.toISOString().slice(0, 10));
              setToDate(d.toISOString().slice(0, 10));
            }}
          >
            آخر 30 يوماً
          </button>
          <button
            className="chip-btn-outline"
            onClick={() => {
              const d = new Date();
              const from = new Date(d.getFullYear(), d.getMonth(), 1);
              setFromDate(from.toISOString().slice(0, 10));
              setToDate(d.toISOString().slice(0, 10));
            }}
          >
            هذا الشهر
          </button>
        </div>
      </section>

      <section className="card">
        <div className="card-head">
          <h3><Activity size={17} /> المؤشرات العامة للفترة</h3>
          <span className="att-sub">
            مقارنة مع الفترة السابقة بنفس عدد الأيام
          </span>
        </div>

        <div className="analytics-kpi-grid">
          {[
            {
              label: "نسبة الحضور",
              value: `${current.attendanceRate}%`,
              change: changePct(current.attendanceRate, previous.attendanceRate),
              goodUp: true,
            },
            {
              label: "الغياب",
              value: current.absent,
              change: changePct(current.absent, previous.absent),
              goodUp: false,
            },
            {
              label: "التأخر",
              value: current.late,
              change: changePct(current.late, previous.late),
              goodUp: false,
            },
            {
              label: "المخالفات",
              value: current.vs.length,
              change: changePct(current.vs.length, previous.vs.length),
              goodUp: false,
            },
            {
              label: "متوسط التقييم",
              value: current.evalAvg === null ? "—" : `${current.evalAvg}%`,
              change:
                current.evalAvg === null || previous.evalAvg === null
                  ? 0
                  : changePct(current.evalAvg, previous.evalAvg),
              goodUp: true,
            },
            {
              label: "نقاط النجوم",
              value: current.starPoints,
              change: changePct(current.starPoints, previous.starPoints),
              goodUp: true,
            },
            {
              label: "إغلاق المتابعات",
              value: `${current.followupClosureRate}%`,
              change: changePct(
                current.followupClosureRate,
                previous.followupClosureRate
              ),
              goodUp: true,
            },
            {
              label: "تواصل ولي الأمر",
              value: current.contacts.length,
              change: changePct(
                current.contacts.length,
                previous.contacts.length
              ),
              goodUp: true,
            },
          ].map((x) => {
            const improved =
              x.change === 0 || (x.goodUp ? x.change > 0 : x.change < 0);
            return (
              <div className="analytics-kpi" key={x.label}>
                <span>{x.label}</span>
                <b>{x.value}</b>
                <small className={improved ? "metric-good" : "metric-bad"}>
                  {x.change > 0 ? "↑" : x.change < 0 ? "↓" : "—"}{" "}
                  {Math.abs(x.change)}%
                </small>
              </div>
            );
          })}
        </div>
      </section>

      <section className="card">
        <div className="card-head">
          <h3><Bell size={17} /> الاستنتاجات الذكية</h3>
        </div>
        <div className="analytics-insights">
          {automaticInsights.length ? (
            automaticInsights.map((x, i) => (
              <div
                key={i}
                className={`analytics-insight analytics-insight-${x.kind}`}
              >
                {x.kind === "positive" ? (
                  <Check size={15} />
                ) : x.kind === "warning" ? (
                  <AlertTriangle size={15} />
                ) : (
                  <Activity size={15} />
                )}
                <span>{x.text}</span>
              </div>
            ))
          ) : (
            <EmptyState text="لا توجد بيانات كافية لاستخراج استنتاجات" />
          )}
        </div>
      </section>

      <div className="two-col">
        <section className="card">
          <div className="card-head">
            <h3><LineChart size={17} /> اتجاه الغياب والتأخر والمخالفات</h3>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E3E7E4" />
              <XAxis dataKey="name" tick={{ fontFamily: "Tajawal", fontSize: 11 }} />
              <YAxis allowDecimals={false} />
              <Tooltip contentStyle={{ fontFamily: "Tajawal", direction: "rtl" }} />
              <Legend wrapperStyle={{ fontFamily: "Tajawal", fontSize: 11 }} />
              <Line type="monotone" dataKey="غياب" stroke="#C7433F" strokeWidth={2.3} />
              <Line type="monotone" dataKey="تأخر" stroke="#D9A62E" strokeWidth={2.3} />
              <Line type="monotone" dataKey="مخالفات" stroke="#5B8DEF" strokeWidth={2.3} />
            </LineChart>
          </ResponsiveContainer>
        </section>

        <section className="card">
          <div className="card-head">
            <h3><BarChart3 size={17} /> المخالفات حسب الدرجة</h3>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={degreeData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E3E7E4" />
              <XAxis dataKey="name" tick={{ fontFamily: "Tajawal", fontSize: 10 }} />
              <YAxis allowDecimals={false} />
              <Tooltip contentStyle={{ fontFamily: "Tajawal", direction: "rtl" }} />
              <Bar dataKey="عدد" fill="#1E2A4A" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </section>
      </div>

      <div className="two-col">
        <section className="card">
          <div className="card-head">
            <h3><GraduationCap size={17} /> تحليل الصفوف</h3>
          </div>
          <div className="analytics-ranking">
            {classAnalysis.map((r, i) => (
              <div className="analytics-rank-row" key={r.className}>
                <span className="class-rank-number">{i + 1}</span>
                <div>
                  <b>الصف {r.className}</b>
                  <span>
                    غياب {r.absent} · تأخر {r.late} · مخالفات {r.violations}
                    {r.evalAvg !== null ? ` · تقييم ${r.evalAvg}%` : ""}
                  </span>
                </div>
                <strong>{r.score}/100</strong>
              </div>
            ))}
          </div>
        </section>

        <section className="card">
          <div className="card-head">
            <h3><Star size={17} /> توزيع التقييم الدوري</h3>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={ratingDistribution}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E3E7E4" />
              <XAxis dataKey="name" tick={{ fontFamily: "Tajawal", fontSize: 11 }} />
              <YAxis allowDecimals={false} />
              <Tooltip contentStyle={{ fontFamily: "Tajawal", direction: "rtl" }} />
              <Bar dataKey="عدد" fill="#0F9D8B" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </section>
      </div>

      <section className="card">
        <div className="card-head">
          <h3><ClipboardList size={17} /> ملخص المتابعة والتواصل</h3>
        </div>
        <div className="analytics-kpi-grid">
          <div className="analytics-kpi">
            <span>الحالات المسجلة</span>
            <b>{current.follows.length}</b>
          </div>
          <div className="analytics-kpi">
            <span>الحالات المغلقة</span>
            <b>{current.follows.filter((f) => f.status === "مغلقة").length}</b>
          </div>
          <div className="analytics-kpi">
            <span>نسبة الإغلاق</span>
            <b>{current.followupClosureRate}%</b>
          </div>
          <div className="analytics-kpi">
            <span>التواصل مع أولياء الأمور</span>
            <b>{current.contacts.length}</b>
          </div>
        </div>
      </section>
    </div>
  );
}
