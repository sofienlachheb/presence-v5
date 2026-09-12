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
import { DEGREES, todayISO } from "./shared";
import { EmptyState } from "./EmptyState";
import { Avatar } from "./Avatar";


/* ---------------------------------------------------------------
   الإحصائيات
--------------------------------------------------------------- */
/* الملف الإلكتروني الشامل للطالب + الإنذار المبكر */
export function StudentComprehensiveProfile({
  students,
  attendance,
  violations,
  evaluations,
  periodicEvaluations,
  pledges,
  hudhudMessages,
  caseFollowups,
  guardianContacts,
  addCaseFollowup,
  addGuardianContact,
  currentUser,
  initialStudentId = "",
}) {
  const [cls, setCls] = useState("الكل");
  const [q, setQ] = useState("");
  const [sid, setSid] = useState(initialStudentId || "");
  const [tab, setTab] = useState("summary");

  useEffect(() => {
    if (initialStudentId && (students || []).some((s) => s.id === initialStudentId)) {
      setSid(initialStudentId);
      setCls("الكل");
      setQ("");
      setTab("summary");
    }
  }, [initialStudentId, students]);

  const [caseStatus, setCaseStatus] = useState("قيد المتابعة");
  const [followupType, setFollowupType] = useState("متابعة سلوكية");
  const [followupNote, setFollowupNote] = useState("");
  const [nextAction, setNextAction] = useState("");
  const [nextActionDate, setNextActionDate] = useState("");

  const [contactChannel, setContactChannel] = useState("اتصال هاتفي");
  const [contactOutcome, setContactOutcome] = useState("تم الرد");
  const [contactSummary, setContactSummary] = useState("");
  const [agreedAction, setAgreedAction] = useState("");
  const [nextContactDate, setNextContactDate] = useState("");

  const canManageFollowup = ["مدير النظام", "مرشد طلابي", "مشرف سلوكي"].includes(currentUser?.role);

  const classes = useMemo(
    () => [...new Set<string>((students || []).map((s) => s.class).filter(Boolean))].sort(),
    [students]
  );

  const list = useMemo(
    () =>
      (students || []).filter(
        (s) =>
          (cls === "الكل" || s.class === cls) &&
          (!q.trim() ||
            String(s.name || "").includes(q.trim()) ||
            String(s.studentNumber || "").includes(q.trim()))
      ),
    [students, cls, q]
  );

  const st = (students || []).find((s) => s.id === sid);

  const d = useMemo(() => {
    if (!st) return null;

    const att = [];
    Object.entries(attendance || {}).forEach(([date, ps]) =>
      Object.entries(ps || {}).forEach(([period, rows]) => {
        const r = rows?.[st.id];
        if (r) att.push({ date, period, ...r });
      })
    );
    att.sort((a, b) => String(b.date).localeCompare(String(a.date)));

    const vs = (violations || [])
      .filter((v) => v.studentId === st.id)
      .sort((a, b) => String(b.date).localeCompare(String(a.date)));

    const es = (evaluations || [])
      .filter((e) => e.studentId === st.id)
      .sort((a, b) => String(b.date).localeCompare(String(a.date)));

    const pes = (periodicEvaluations || [])
      .filter((e) => e.studentId === st.id)
      .sort((a, b) => String(b.date).localeCompare(String(a.date)));

    const ps = (pledges || [])
      .filter((p) => p.studentId === st.id)
      .sort((a, b) => String(b.date).localeCompare(String(a.date)));

    const msgs = (hudhudMessages || [])
      .filter((m) => m.studentId === st.id)
      .sort((a, b) => String(b.date).localeCompare(String(a.date)));

    const follows = (caseFollowups || [])
      .filter((f) => f.studentId === st.id)
      .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));

    const contacts = (guardianContacts || [])
      .filter((c) => c.studentId === st.id)
      .sort((a, b) => String(b.contactAt).localeCompare(String(a.contactAt)));

    const absent = att.filter((a) => a.status === "غائب").length;
    const late = att.filter((a) => a.status === "متأخر").length;
    const avg = es.length
      ? Math.round(es.reduce((x, e) => x + Number(e.percent || 0), 0) / es.length)
      : null;
    const stars = es.reduce(
      (x, e) =>
        x +
        Object.values(e.scores || {}).reduce<number>((a, b) => a + Number(b || 0), 0),
      0
    );

    const dt = new Date();
    dt.setDate(dt.getDate() - 30);
    const cut = dt.toISOString().slice(0, 10);
    const rv = vs.filter((v) => String(v.date || "") >= cut);
    const rep: Record<string, number> = {};
    rv.forEach((v) => {
      if (v.item) rep[v.item] = (rep[v.item] || 0) + 1;
    });

    const warn = [];
    if (absent >= 3) warn.push(`تكرر الغياب ${absent} مرات في السجلات المتاحة`);
    if (rv.length >= 3) warn.push(`سُجلت ${rv.length} مخالفات خلال آخر 30 يوماً`);
    Object.entries(rep)
      .filter(([, n]) => n >= 2)
      .forEach(([x, n]) =>
        warn.push(`تكررت مخالفة «${x}» ${n} مرات خلال آخر 30 يوماً`)
      );
    if (avg !== null && avg < 60) warn.push(`متوسط تقييم الأداء منخفض (${avg}%)`);

    const latestFollow = follows[0] || null;

    const byDegree = [1, 2, 3, 4].map((degree) => ({
      degree,
      count: vs.filter((v) => Number(v.degree) === degree).length,
    }));

    const present = att.filter((a) => a.status === "حاضر").length;
    const attendanceTotal = present + absent + late;
    const attendanceRate = attendanceTotal
      ? Math.round((present / attendanceTotal) * 100)
      : null;

    const latestPeriodic = pes[0] || null;
    const latestEvaluation = es[0] || null;

    const openFollowups = follows.filter((f) => f.status !== "مغلقة");
    const overdueFollowups = follows.filter(
      (f) =>
        f.nextActionDate &&
        f.nextActionDate < todayISO() &&
        f.status !== "مغلقة"
    );

    const overdueContacts = contacts.filter(
      (c) => c.nextContactDate && c.nextContactDate < todayISO()
    );

    let riskScore = 0;
    if (absent >= 3) riskScore += 3;
    else if (absent >= 1) riskScore += 1;

    if (late >= 3) riskScore += 1;

    if (rv.length >= 3) riskScore += 3;
    else if (rv.length >= 1) riskScore += 1;

    if (avg !== null && avg < 60) riskScore += 2;
    else if (avg !== null && avg < 70) riskScore += 1;

    if (openFollowups.length) riskScore += 1;
    if (overdueFollowups.length || overdueContacts.length) riskScore += 1;

    const riskLevel =
      riskScore >= 6 ? "مرتفع" :
      riskScore >= 3 ? "متوسط" :
      "منخفض";

    const positiveSignals = [];
    if (attendanceRate !== null && attendanceRate >= 90) {
      positiveSignals.push(`نسبة حضور جيدة (${attendanceRate}%)`);
    }
    if (avg !== null && avg >= 80) {
      positiveSignals.push(`متوسط تقييم مرتفع (${avg}%)`);
    }
    if (stars >= 25) {
      positiveSignals.push(`تعزيز إيجابي مرتفع (${stars} نقطة نجوم)`);
    }
    if (vs.length === 0) {
      positiveSignals.push("لا توجد مخالفات مسجلة");
    }

    const smartSummaryParts = [];
    if (riskLevel === "مرتفع") {
      smartSummaryParts.push("الحالة تحتاج متابعة إدارية قريبة");
    } else if (riskLevel === "متوسط") {
      smartSummaryParts.push("الحالة تحتاج متابعة منتظمة");
    } else {
      smartSummaryParts.push("لا توجد مؤشرات خطورة مرتفعة حالياً");
    }
    if (absent || late) {
      smartSummaryParts.push(`الحضور: ${absent} غياب و${late} تأخر`);
    }
    if (rv.length) {
      smartSummaryParts.push(`${rv.length} مخالفة خلال آخر 30 يوماً`);
    }
    if (avg !== null) {
      smartSummaryParts.push(`متوسط تقييم الأداء ${avg}%`);
    }
    if (latestPeriodic?.overallRating) {
      smartSummaryParts.push(`آخر تقييم دوري: ${latestPeriodic.overallRating}`);
    }

    return {
      att,
      vs,
      es,
      pes,
      ps,
      msgs,
      follows,
      contacts,
      absent,
      late,
      present,
      attendanceRate,
      avg,
      stars,
      warn,
      byDegree,
      latestFollow,
      latestPeriodic,
      latestEvaluation,
      openFollowups,
      overdueFollowups,
      overdueContacts,
      riskScore,
      riskLevel,
      positiveSignals,
      smartSummary: smartSummaryParts.join("، "),
    };
  }, [
    st,
    attendance,
    violations,
    evaluations,
    periodicEvaluations,
    pledges,
    hudhudMessages,
    caseFollowups,
    guardianContacts,
  ]);

  const esc = (v) =>
    String(v ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

  const fmtDT = (value) => {
    if (!value) return "—";
    try {
      return new Date(value).toLocaleString("ar-QA");
    } catch {
      return String(value);
    }
  };

  const print = () => {
    if (!st || !d) return;

    const recommendations = [];
    if (d.riskLevel === "مرتفع") recommendations.push("متابعة الحالة بصورة عاجلة ووضع خطة متابعة قصيرة المدى.");
    if (d.riskLevel === "متوسط") recommendations.push("الاستمرار في المتابعة المنتظمة ومراجعة المؤشرات خلال الفترة القادمة.");
    if (d.absent >= 3) recommendations.push("متابعة الغياب مع الطالب وولي الأمر والتحقق من أسباب التكرار.");
    if (d.late >= 3) recommendations.push("متابعة التأخر الصباحي وتعزيز الالتزام بالوقت.");
    if (d.vs.length >= 3) recommendations.push("مراجعة المخالفات المتكررة وتحديد السلوك الأكثر تكراراً والإجراء المناسب.");
    if (d.avg !== null && d.avg < 70) recommendations.push("دعم الجانب الأكاديمي ومتابعة مؤشرات تقييم الأداء مع المعلمين.");
    if (d.stars >= 25) recommendations.push("الاستمرار في التعزيز الإيجابي والمحافظة على نقاط القوة لدى الطالب.");
    if (!recommendations.length) recommendations.push("الاستمرار في المتابعة الدورية وتعزيز السلوك والأداء الإيجابي.");

    const rowsOrEmpty = (rows, cols) =>
      rows.length ? rows.join("") : `<tr><td colspan="${cols}" class="empty">لا توجد بيانات مسجلة</td></tr>`;


    const w = window.open("", "_blank", "width=1100,height=850");
    if (!w) return;

    writeSchoolPrint(w, `<!doctype html>
    <html lang="ar" dir="rtl">
    <head>
      <meta charset="utf-8">
      <title>التقرير الشامل للطالب - ${esc(st.name)}</title>
      <style>
        @page{size:A4;margin:9mm}
        *{box-sizing:border-box}
        body{font-family:Tahoma,Arial,sans-serif;color:#111;margin:0;font-size:11px;line-height:1.55}
        .header{border-bottom:2px solid #17264d;padding-bottom:7px;margin-bottom:8px}
        .logo{width:100%;height:58px;object-fit:contain;object-position:center}
        .title{text-align:center;font-size:21px;font-weight:800;color:#17264d;margin:7px 0 2px}
        .subtitle{text-align:center;font-size:11px;color:#555;margin-bottom:7px}
        .section-title{background:#17264d;color:#fff;padding:6px 9px;font-size:12px;font-weight:700;margin:10px 0 5px}
        .grid{display:grid;grid-template-columns:repeat(4,1fr);gap:5px}
        .box{border:1px solid #b8c0ce;padding:6px;background:#fff}
        .box span{display:block;color:#697386;font-size:9px}
        .box b{font-size:11px}
        .risk{font-weight:800}
        .risk-low{color:#24865b}.risk-mid{color:#a77400}.risk-high{color:#b92f2b}
        .summary{border:1px solid #aebbd1;background:#f2f5fb;padding:8px;margin-top:6px}
        .positive{border:1px solid #b9dcca;background:#f0faf5;padding:7px;margin-top:5px}
        table{width:100%;border-collapse:collapse;margin-top:4px;page-break-inside:auto}
        tr{page-break-inside:avoid}
        th,td{border:1px solid #9ca6b5;padding:4px 5px;vertical-align:top;text-align:center}
        th{background:#dce6f5;color:#17264d;font-weight:800}
        .empty{color:#777;padding:10px}
        .degree-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:5px}
        .degree{border:1px solid #b8c0ce;padding:7px;text-align:center}
        .degree b{font-size:17px;display:block}
        ul{margin:4px 18px 4px 0;padding:0}
        .signatures{display:grid;grid-template-columns:repeat(3,1fr);gap:20px;margin-top:24px;text-align:center}
        .sign{padding-top:4px}.line{border-bottom:1px dotted #555;height:28px}
        .footer{text-align:center;color:#777;font-size:9px;margin-top:10px}
        .no-break{page-break-inside:avoid}
        @media print{.no-print{display:none}}
      </style>
    </head>
    <body>


      <div class="title">التقرير الشامل للطالب</div>
      <div class="subtitle">مدرسة عمر بن عبد العزيز الثانوية للبنين — تاريخ إصدار التقرير: ${esc(new Date().toLocaleDateString("ar-QA"))}</div>

      <div class="section-title">أولاً: بيانات الطالب والحالة العامة</div>
      <div class="grid">
        <div class="box"><span>اسم الطالب</span><b>${esc(st.name)}</b></div>
        <div class="box"><span>الصف</span><b>${esc(st.class)}</b></div>
        <div class="box"><span>الشعبة</span><b>${esc(st.section || "—")}</b></div>
        <div class="box"><span>رقم الطالب</span><b>${esc(st.studentNumber || "—")}</b></div>
        <div class="box"><span>ولي الأمر</span><b>${esc(st.guardianName || "—")}</b></div>
        <div class="box"><span>هاتف ولي الأمر</span><b>${esc(st.guardianPhone || "—")}</b></div>
        <div class="box"><span>الجنسية</span><b>${esc(st.nationality || "—")}</b></div>
        <div class="box"><span>مستوى الحالة</span><b class="risk ${d.riskLevel === "مرتفع" ? "risk-high" : d.riskLevel === "متوسط" ? "risk-mid" : "risk-low"}">${esc(d.riskLevel)}</b></div>
      </div>
      <div class="summary"><b>الملخص الذكي:</b> ${esc(d.smartSummary)}</div>
      ${d.positiveSignals.length ? `<div class="positive"><b>مؤشرات إيجابية:</b> ${d.positiveSignals.map(esc).join(" • ")}</div>` : ""}

      <div class="section-title">ثانياً: المؤشرات الرئيسية</div>
      <div class="grid">
        <div class="box"><span>نسبة الحضور</span><b>${d.attendanceRate === null ? "—" : `${d.attendanceRate}%`}</b></div>
        <div class="box"><span>الغياب</span><b>${d.absent}</b></div>
        <div class="box"><span>التأخر</span><b>${d.late}</b></div>
        <div class="box"><span>إجمالي المخالفات</span><b>${d.vs.length}</b></div>
        <div class="box"><span>نقاط النجوم</span><b>${d.stars}</b></div>
        <div class="box"><span>متوسط التقييم</span><b>${d.avg === null ? "—" : `${d.avg}%`}</b></div>
        <div class="box"><span>التقييمات الدورية</span><b>${d.pes.length}</b></div>
        <div class="box"><span>التواصل مع ولي الأمر</span><b>${d.contacts.length}</b></div>
      </div>

      <div class="section-title">ثالثاً: المخالفات حسب الدرجة</div>
      <div class="degree-grid">
        ${d.byDegree.map((x) => `<div class="degree"><span>${esc(DEGREES[x.degree]?.label || `الدرجة ${x.degree}`)}</span><b>${x.count}</b></div>`).join("")}
      </div>

      <div class="section-title">رابعاً: سجل الحضور والغياب</div>
      <table>
        <tr><th>التاريخ</th><th>الحصة</th><th>الحالة</th><th>الوقت</th></tr>
        ${rowsOrEmpty(d.att.map((a) => `<tr><td>${esc(a.date)}</td><td>${esc(a.period)}</td><td>${esc(a.status)}</td><td>${esc(a.time || "—")}</td></tr>`), 4)}
      </table>

      <div class="section-title">خامساً: سجل المخالفات</div>
      <table>
        <tr><th>التاريخ</th><th>المخالفة</th><th>الدرجة</th><th>الإجراء</th><th>حالة المتابعة</th></tr>
        ${rowsOrEmpty(d.vs.map((v) => `<tr><td>${esc(v.date)}</td><td>${esc(v.item || v.description || "—")}</td><td>${esc(DEGREES[v.degree]?.label || v.degree)}</td><td>${esc(v.action || "—")}</td><td>${esc(v.followupStatus || "—")}</td></tr>`), 5)}
      </table>

      <div class="section-title">سادساً: التقييمات والتعزيز</div>
      <table>
        <tr><th>النوع</th><th>التاريخ</th><th>المادة / الفترة</th><th>النتيجة</th><th>ملاحظة</th></tr>
        ${rowsOrEmpty([
          ...d.es.map((e) => `<tr><td>تقييم أداء</td><td>${esc(e.date)}</td><td>—</td><td>${esc(e.percent ?? "—")}% ${esc(e.rating || "")}</td><td>—</td></tr>`),
          ...d.pes.map((e) => `<tr><td>تقييم دوري</td><td>${esc(e.date)}</td><td>${esc(e.subject || "—")} / ${esc(e.evaluationPeriod || "—")}</td><td>${esc(e.overallRating || "—")}</td><td>${esc(e.teacherNote || "—")}</td></tr>`)
        ], 5)}
      </table>

      <div class="section-title">سابعاً: سجل متابعة الحالة</div>
      <table>
        <tr><th>التاريخ</th><th>الحالة</th><th>نوع المتابعة</th><th>الملاحظة</th><th>الإجراء التالي</th><th>الموظف</th></tr>
        ${rowsOrEmpty(d.follows.map((f) => `<tr><td>${esc(fmtDT(f.createdAt))}</td><td>${esc(f.status || "—")}</td><td>${esc(f.followupType || "—")}</td><td>${esc(f.note || "—")}</td><td>${esc(f.nextAction || "—")}${f.nextActionDate ? `<br>${esc(f.nextActionDate)}` : ""}</td><td>${esc(f.createdByName || "—")}</td></tr>`), 6)}
      </table>

      <div class="section-title">ثامناً: التواصل مع ولي الأمر</div>
      <table>
        <tr><th>التاريخ</th><th>الوسيلة</th><th>النتيجة</th><th>ملخص التواصل</th><th>الإجراء المتفق عليه</th><th>الموظف</th></tr>
        ${rowsOrEmpty(d.contacts.map((c) => `<tr><td>${esc(fmtDT(c.contactAt))}</td><td>${esc(c.channel || "—")}</td><td>${esc(c.outcome || "—")}</td><td>${esc(c.summary || "—")}</td><td>${esc(c.agreedAction || "—")}${c.nextContactDate ? `<br>التواصل القادم: ${esc(c.nextContactDate)}` : ""}</td><td>${esc(c.createdByName || "—")}</td></tr>`), 6)}
      </table>

      <div class="section-title">تاسعاً: الإنذار المبكر والتوصيات</div>
      <div class="no-break">
        <b>مؤشرات الإنذار:</b>
        <ul>${d.warn.length ? d.warn.map((x) => `<li>${esc(x)}</li>`).join("") : "<li>لا توجد مؤشرات إنذار وفق القواعد الحالية.</li>"}</ul>
        <b>التوصيات المقترحة:</b>
        <ul>${recommendations.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>
      </div>

      <div class="signatures no-break">
        <div class="sign"><b>منسق شؤون الطلاب</b><div class="line"></div>التوقيع</div>
        <div class="sign"><b>النائب الإداري</b><div class="line"></div>التوقيع</div>
        <div class="sign"><b>مدير المدرسة</b><div class="line"></div>التوقيع</div>
      </div>

      <div class="footer">تقرير صادر من نظام Presence — مدرسة عمر بن عبد العزيز الثانوية للبنين</div>
    </body></html>`);



  };
  const T = ({ h, r }) => (
    <div style={{ overflowX: "auto" }}>
      <table className="perm-table">
        <thead>
          <tr>{h.map((x) => <th key={x}>{x}</th>)}</tr>
        </thead>
        <tbody>
          {r.length ? (
            r.map((x, i) => (
              <tr key={i}>{x.map((c, j) => <td key={j}>{c}</td>)}</tr>
            ))
          ) : (
            <tr>
              <td colSpan={h.length} style={{ textAlign: "center" }}>لا توجد بيانات</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );

  const saveFollowup = async () => {
    if (!st || !followupType) return;
    const saved = await addCaseFollowup(st.id, {
      status: caseStatus,
      followupType,
      note: followupNote,
      nextAction,
      nextActionDate,
    });
    if (saved) {
      setFollowupNote("");
      setNextAction("");
      setNextActionDate("");
    }
  };

  const saveContact = async () => {
    if (!st || !contactChannel || !contactOutcome) return;
    const saved = await addGuardianContact(st.id, {
      channel: contactChannel,
      outcome: contactOutcome,
      summary: contactSummary,
      agreedAction,
      nextContactDate,
    });
    if (saved) {
      setContactSummary("");
      setAgreedAction("");
      setNextContactDate("");
    }
  };

  return (
    <div className="view-stack">
      <section className="card">
        <div className="card-head">
          <h3><FileText size={18}/> الملف الإلكتروني الشامل للطالب</h3>
          {st && (
            <button className="chip-btn" onClick={print}>
              <Printer size={15}/> طباعة التقرير الشامل
            </button>
          )}
        </div>

        <div className="report-filter-grid">
          <div>
            <div className="field-label">الصف</div>
            <select
              className="text-input"
              value={cls}
              onChange={(e) => {
                setCls(e.target.value);
                setSid("");
              }}
            >
              <option>الكل</option>
              {classes.map((x) => <option key={x}>{x}</option>)}
            </select>
          </div>

          <div>
            <div className="field-label">بحث</div>
            <input
              className="text-input"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="الاسم أو الرقم"
            />
          </div>

          <div>
            <div className="field-label">الطالب</div>
            <select
              className="text-input"
              value={sid}
              onChange={(e) => setSid(e.target.value)}
            >
              <option value="">اختر الطالب</option>
              {list.map((x) => (
                <option key={x.id} value={x.id}>{x.name} — {x.class}</option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {!st || !d ? (
        <EmptyState text="اختر الطالب لعرض ملفه الشامل"/>
      ) : (
        <>
          <section className="card student-profile-hero">
            <div className="student-profile-head">
              <div style={{ display: "flex", gap: 14, alignItems: "center", minWidth: 0 }}>
                <Avatar
                  name={st.name}
                  tone={
                    d.riskLevel === "مرتفع"
                      ? "#C7433F"
                      : d.riskLevel === "متوسط"
                      ? "#D9A62E"
                      : "#2F9E6E"
                  }
                />
                <div style={{ minWidth: 0 }}>
                  <h2 style={{ margin: 0, color: "#1E2A4A" }}>{st.name}</h2>
                  <div className="att-sub" style={{ marginTop: 4 }}>
                    الصف {st.class} {st.section ? `· الشعبة ${st.section}` : ""}
                    {st.studentNumber ? ` · رقم الطالب ${st.studentNumber}` : ""}
                  </div>
                </div>
              </div>

              <div className="student-profile-status">
                <span
                  className="count-chip"
                  style={{
                    background:
                      d.riskLevel === "مرتفع"
                        ? "#C7433F"
                        : d.riskLevel === "متوسط"
                        ? "#D9A62E"
                        : "#2F9E6E",
                  }}
                >
                  مستوى الحالة: {d.riskLevel}
                </span>
                {d.latestFollow?.status && (
                  <span className="count-chip" style={{ background: "#5B8DEF" }}>
                    المتابعة: {d.latestFollow.status}
                  </span>
                )}
              </div>
            </div>

            <div className="student-smart-summary">
              <Activity size={16} />
              <div>
                <b>الملخص الذكي:</b> {d.smartSummary}
              </div>
            </div>

            {d.positiveSignals.length > 0 && (
              <div className="student-positive-signals">
                {d.positiveSignals.map((x) => (
                  <span key={x}>
                    <Check size={13} /> {x}
                  </span>
                ))}
              </div>
            )}
          </section>

          <section className="card">
            <div className="card-head">
              <h3><BarChart3 size={17} /> المؤشرات الرئيسية</h3>
            </div>

            <div className="student-kpi-grid">
              <div className="student-kpi">
                <UserCheck size={18} />
                <div>
                  <strong>{d.attendanceRate === null ? "—" : `${d.attendanceRate}%`}</strong>
                  <span>نسبة الحضور</span>
                </div>
              </div>
              <div className="student-kpi">
                <UserX size={18} />
                <div><strong>{d.absent}</strong><span>الغياب</span></div>
              </div>
              <div className="student-kpi">
                <Clock size={18} />
                <div><strong>{d.late}</strong><span>التأخر</span></div>
              </div>
              <div className="student-kpi">
                <AlertTriangle size={18} />
                <div><strong>{d.vs.length}</strong><span>المخالفات</span></div>
              </div>
              <div className="student-kpi">
                <Star size={18} />
                <div><strong>{d.stars}</strong><span>نقاط النجوم</span></div>
              </div>
              <div className="student-kpi">
                <Activity size={18} />
                <div><strong>{d.avg === null ? "—" : `${d.avg}%`}</strong><span>متوسط التقييم</span></div>
              </div>
              <div className="student-kpi">
                <FileText size={18} />
                <div><strong>{d.pes.length}</strong><span>تقييمات دورية</span></div>
              </div>
              <div className="student-kpi">
                <Phone size={18} />
                <div><strong>{d.contacts.length}</strong><span>تواصل ولي الأمر</span></div>
              </div>
            </div>
          </section>

          <div className="two-col">
            <section className="card">
              <div className="card-head">
                <h3><AlertTriangle size={17} /> المخالفات حسب الدرجة</h3>
              </div>
              <div className="degree-row">
                {d.byDegree.map((x) => (
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
                <h3><GraduationCap size={17} /> بيانات الطالب وولي الأمر</h3>
              </div>
              <div className="student-info-grid">
                <div><span>الجنسية</span><b>{st.nationality || "—"}</b></div>
                <div><span>ولي الأمر</span><b>{st.guardianName || "—"}</b></div>
                <div><span>الهاتف</span><b>{st.guardianPhone || "—"}</b></div>
                <div><span>الحالة الصحية</span><b>{st.health || "لا توجد ملاحظات"}</b></div>
              </div>
            </section>
          </div>

          <section className="card">
            <div className="card-head">
              <h3><ShieldAlert size={17}/> الإنذار المبكر والمتابعة المطلوبة</h3>
            </div>

            {d.warn.length ? (
              <div className="student-warning-grid">
                {d.warn.map((x, i) => (
                  <div key={i} className="student-warning-item">
                    <AlertTriangle size={15} />
                    <span>{x}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="student-success-message">
                <Check size={15}/> لا توجد مؤشرات إنذار وفق القواعد الحالية.
              </div>
            )}

            {(d.overdueFollowups.length > 0 || d.overdueContacts.length > 0) && (
              <div className="student-overdue-box">
                {d.overdueFollowups.length > 0 && (
                  <div>
                    <b>إجراءات متابعة متأخرة:</b> {d.overdueFollowups.length}
                  </div>
                )}
                {d.overdueContacts.length > 0 && (
                  <div>
                    <b>تواصل متأخر مع ولي الأمر:</b> {d.overdueContacts.length}
                  </div>
                )}
              </div>
            )}
          </section>

          <section className="card">
            <div className="student-profile-tabs">
              {[
                ["summary", "الملخص"],
                ["attendance", "الحضور والغياب"],
                ["violations", "المخالفات"],
                ["evaluations", "التقييمات"],
                ["followup", "المتابعة والتواصل"],
              ].map(([a, b]) => (
                <button
                  key={a}
                  className={`settings-tab ${tab === a ? "settings-tab-active" : ""}`}
                  onClick={() => setTab(a)}
                >
                  {b}
                </button>
              ))}
            </div>
          </section>

          {tab === "summary" && (
            <div className="two-col">
              <section className="card">
                <div className="card-head">
                  <h3><Star size={17} /> الأداء والتعزيز</h3>
                </div>
                <div className="student-summary-list">
                  <div><span>مجموع نقاط النجوم</span><b>{d.stars}</b></div>
                  <div>
                    <span>آخر تقييم أداء</span>
                    <b>
                      {d.latestEvaluation
                        ? `${d.latestEvaluation.percent}% — ${d.latestEvaluation.rating || ""}`
                        : "—"}
                    </b>
                  </div>
                  <div>
                    <span>آخر تقييم دوري</span>
                    <b>
                      {d.latestPeriodic
                        ? `${d.latestPeriodic.subject || "—"} — ${d.latestPeriodic.overallRating || "—"}`
                        : "—"}
                    </b>
                  </div>
                </div>
              </section>

              <section className="card">
                <div className="card-head">
                  <h3><HistoryIcon size={17} /> المتابعة الحالية</h3>
                </div>
                <div className="student-summary-list">
                  <div><span>عدد المتابعات</span><b>{d.follows.length}</b></div>
                  <div><span>الحالات المفتوحة</span><b>{d.openFollowups.length}</b></div>
                  <div><span>التعهدات</span><b>{d.ps.length}</b></div>
                  <div><span>رسائل هدهد</span><b>{d.msgs.length}</b></div>
                </div>
              </section>
            </div>
          )}

          {tab === "attendance" && (
            <section className="card">
              <div className="card-head">
                <h3><UserCheck size={17} /> سجل الحضور والغياب</h3>
              </div>
              <T
                h={["التاريخ", "الحصة", "الحالة", "الوقت"]}
                r={d.att.map((a) => [a.date, a.period, a.status, a.time || "—"])}
              />
            </section>
          )}

          {tab === "violations" && (
            <section className="card">
              <div className="card-head">
                <h3><ClipboardList size={17} /> سجل المخالفات</h3>
              </div>
              <T
                h={["التاريخ", "المخالفة", "الدرجة", "الإجراء", "الحالة"]}
                r={d.vs.map((v) => [
                  v.date,
                  v.item,
                  DEGREES[v.degree]?.label || v.degree,
                  v.action || "—",
                  v.followupStatus || "—",
                ])}
              />
            </section>
          )}

          {tab === "evaluations" && (
            <div className="view-stack">
              <section className="card">
                <div className="card-head">
                  <h3><Star size={17} /> تقييم النجوم أثناء الحصة</h3>
                </div>
                <T
                  h={["التاريخ", "النسبة", "التقدير"]}
                  r={d.es.map((e) => [
                    e.date,
                    (e.percent ?? "—") + "%",
                    e.rating || "—",
                  ])}
                />
              </section>

              <section className="card">
                <div className="card-head">
                  <h3><FileText size={17} /> التقييم الدوري الرسمي</h3>
                </div>
                <T
                  h={["التاريخ", "المادة", "الفترة", "التقييم العام", "ملاحظة المعلم"]}
                  r={d.pes.map((e) => [
                    e.date,
                    e.subject || "—",
                    e.evaluationPeriod || "—",
                    e.overallRating || "—",
                    e.teacherNote || "—",
                  ])}
                />
              </section>
            </div>
          )}

          {tab === "followup" && (
            <div className="view-stack">
              {canManageFollowup && (
                <div className="two-col">
                  <section className="card">
                    <div className="card-head">
                      <h3><HistoryIcon size={16}/> إضافة متابعة للحالة</h3>
                    </div>

                    <div className="field-row">
                      <div style={{ flex: 1 }}>
                        <div className="field-label">حالة الملف</div>
                        <select
                          className="select-input"
                          value={caseStatus}
                          onChange={(e) => setCaseStatus(e.target.value)}
                        >
                          <option>جديدة</option>
                          <option>قيد المتابعة</option>
                          <option>تم التواصل مع ولي الأمر</option>
                          <option>محولة للأخصائي الاجتماعي</option>
                          <option value="محولة للمرشد">محولة لمنسق شؤون الطلاب</option>
                          <option>مغلقة</option>
                        </select>
                      </div>

                      <div style={{ flex: 1 }}>
                        <div className="field-label">نوع المتابعة</div>
                        <select
                          className="select-input"
                          value={followupType}
                          onChange={(e) => setFollowupType(e.target.value)}
                        >
                          <option>متابعة سلوكية</option>
                          <option>متابعة غياب وتأخر</option>
                          <option>متابعة أكاديمية</option>
                          <option>متابعة تعهد</option>
                          <option>متابعة بعد تحويل</option>
                          <option>متابعة عامة</option>
                        </select>
                      </div>
                    </div>

                    <div className="field-label">ملاحظات المتابعة</div>
                    <textarea
                      className="textarea-input"
                      rows={4}
                      value={followupNote}
                      onChange={(e) => setFollowupNote(e.target.value)}
                      placeholder="ما الذي تمت متابعته؟ وما النتيجة؟"
                    />

                    <div className="field-label">الإجراء التالي</div>
                    <input
                      className="text-input"
                      value={nextAction}
                      onChange={(e) => setNextAction(e.target.value)}
                      placeholder="مثال: مقابلة الطالب، استدعاء ولي الأمر..."
                    />

                    <div className="field-label">تاريخ الإجراء التالي</div>
                    <input
                      type="date"
                      className="text-input"
                      value={nextActionDate}
                      onChange={(e) => setNextActionDate(e.target.value)}
                    />

                    <button className="submit-btn" onClick={saveFollowup}>
                      <Save size={15}/> حفظ متابعة الحالة
                    </button>
                  </section>

                  <section className="card">
                    <div className="card-head">
                      <h3><Phone size={16}/> توثيق التواصل مع ولي الأمر</h3>
                    </div>

                    <div className="field-row">
                      <div style={{ flex: 1 }}>
                        <div className="field-label">وسيلة التواصل</div>
                        <select
                          className="select-input"
                          value={contactChannel}
                          onChange={(e) => setContactChannel(e.target.value)}
                        >
                          <option>اتصال هاتفي</option>
                          <option>اجتماع حضوري</option>
                          <option>رسالة هدهد</option>
                          <option>رسالة نصية</option>
                          <option>بريد إلكتروني</option>
                          <option>أخرى</option>
                        </select>
                      </div>

                      <div style={{ flex: 1 }}>
                        <div className="field-label">نتيجة التواصل</div>
                        <select
                          className="select-input"
                          value={contactOutcome}
                          onChange={(e) => setContactOutcome(e.target.value)}
                        >
                          <option>تم الرد</option>
                          <option>لم يتم الرد</option>
                          <option>تم تحديد موعد</option>
                          <option>تم الاتفاق على إجراء</option>
                          <option>تم الحضور للمدرسة</option>
                        </select>
                      </div>
                    </div>

                    <div className="field-label">ملخص التواصل</div>
                    <textarea
                      className="textarea-input"
                      rows={4}
                      value={contactSummary}
                      onChange={(e) => setContactSummary(e.target.value)}
                      placeholder="ملخص ما دار مع ولي الأمر..."
                    />

                    <div className="field-label">الإجراء المتفق عليه</div>
                    <input
                      className="text-input"
                      value={agreedAction}
                      onChange={(e) => setAgreedAction(e.target.value)}
                      placeholder="مثال: متابعة يومية لمدة أسبوع"
                    />

                    <div className="field-label">موعد التواصل القادم</div>
                    <input
                      type="date"
                      className="text-input"
                      value={nextContactDate}
                      onChange={(e) => setNextContactDate(e.target.value)}
                    />

                    <button className="submit-btn" onClick={saveContact}>
                      <Save size={15}/> حفظ سجل التواصل
                    </button>
                  </section>
                </div>
              )}

              <section className="card">
                <div className="card-head">
                  <h3><HistoryIcon size={17} /> سجل متابعة الحالة</h3>
                </div>
                <T
                  h={["التاريخ والوقت", "الحالة", "نوع المتابعة", "الملاحظة", "الإجراء التالي", "تاريخه", "الموظف"]}
                  r={d.follows.map((f) => [
                    fmtDT(f.createdAt),
                    f.status || "—",
                    f.followupType || "—",
                    f.note || "—",
                    f.nextAction || "—",
                    f.nextActionDate || "—",
                    f.createdByName || "—",
                  ])}
                />
              </section>

              <section className="card">
                <div className="card-head">
                  <h3><Phone size={17} /> توثيق التواصل مع ولي الأمر</h3>
                </div>
                <T
                  h={["التاريخ والوقت", "الوسيلة", "النتيجة", "الملخص", "الإجراء المتفق عليه", "التواصل القادم", "الموظف"]}
                  r={d.contacts.map((c) => [
                    fmtDT(c.contactAt),
                    c.channel || "—",
                    c.outcome || "—",
                    c.summary || "—",
                    c.agreedAction || "—",
                    c.nextContactDate || "—",
                    c.createdByName || "—",
                  ])}
                />
              </section>

              <div className="two-col">
                <section className="card">
                  <div className="card-head">
                    <h3><PenLine size={17} /> التعهدات</h3>
                  </div>
                  <T
                    h={["التاريخ", "النوع", "المخالفة"]}
                    r={d.ps.map((p) => [p.date, p.type, p.violationRef || "—"])}
                  />
                </section>

                <section className="card">
                  <div className="card-head">
                    <h3><Bird size={17} /> رسائل هدهد</h3>
                  </div>
                  <T
                    h={["التاريخ", "الموضوع", "الحالة"]}
                    r={d.msgs.map((m) => [m.date, m.subject || "—", m.status || "—"])}
                  />
                </section>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
