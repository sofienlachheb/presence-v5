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

    const logoSrc = "data:image/png;base64,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";
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

    w.document.write(`
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
        <img class="logo" src="${logoSrc}" />
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
        <script>window.onload=()=>setTimeout(()=>window.print(),350);<\/script>
      </body>
      </html>
    `);
    w.document.close();
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
