import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Users, UserCheck, UserX, Clock, AlertTriangle, BarChart3, Bell,
  Search, Plus, X, Check, ChevronLeft, ChevronRight, Home, FileText,
  Send, ShieldAlert, GraduationCap, CalendarDays, Phone, Activity,
  ClipboardList, TrendingUp, Filter, Eye, Star, PenLine,
  Printer, PlayCircle, History as HistoryIcon, Settings, UserPlus,
  Trash2, Pencil, Lock, Mail, ShieldCheck, Save, Bird, MessageCircle, LogOut
} from "lucide-react";
import { PERIODIC_ACADEMIC_CRITERIA, PERIODIC_BEHAVIOR_CRITERIA, PERIODIC_PERIODS, PERIODIC_RATING_SCALE, periodicRatingFromAverage, todayISO } from "./shared";
import { Avatar } from "./Avatar";
import { EmptyState } from "./EmptyState";



/* ---------------------------------------------------------------
   التقييم الدوري الرسمي للطالب
   منفصل عن تقييم النجوم اليومي
--------------------------------------------------------------- */
export function PeriodicEvaluationView({
  students,
  evaluations,
  addPeriodicEvaluation,
  sendHudhudMessage,
  currentUser,
}) {
  const isTeacher = currentUser?.role === "معلم";
  const isReadOnly =
    currentUser?.role === "مدير النظام" ||
    currentUser?.role === "مرشد طلابي";

  const [selectedClass, setSelectedClass] = useState("");
  const [studentSearch, setStudentSearch] = useState("");
  const [student, setStudent] = useState(null);
  const [subject, setSubject] = useState("");
  const [evaluationPeriod, setEvaluationPeriod] = useState(PERIODIC_PERIODS[0]);
  const [academicScores, setAcademicScores] = useState({});
  const [behaviorScores, setBehaviorScores] = useState({});
  const [teacherNote, setTeacherNote] = useState("");

  const [filterClass, setFilterClass] = useState("الكل");
  const [filterName, setFilterName] = useState("");
  const [filterSubject, setFilterSubject] = useState("");
  const [filterPeriod, setFilterPeriod] = useState("الكل");
  const [filterDate, setFilterDate] = useState("");
  const [sendingId, setSendingId] = useState(null);

  const classes = useMemo(
    () =>
      [...new Set(
        (students || [])
          .map((s) => String(s.class || "").trim())
          .filter(Boolean)
      )],
    [students]
  );

  const subjects = useMemo(
    () =>
      [...new Set(
        (evaluations || [])
          .map((e) => String(e.subject || "").trim())
          .filter(Boolean)
      )],
    [evaluations]
  );

  const studentsForSelectedClass = useMemo(() => {
    if (!isTeacher) return students || [];
    if (!selectedClass) return [];
    return (students || []).filter(
      (s) => String(s.class || "").trim() === selectedClass
    );
  }, [students, selectedClass, isTeacher]);

  const visibleStudents = studentsForSelectedClass.filter((s) =>
    String(s.name || "").includes(studentSearch.trim())
  );

  useEffect(() => {
    if (!isTeacher) return;
    if (classes.length === 1 && !selectedClass) {
      setSelectedClass(classes[0]);
    }
  }, [isTeacher, classes, selectedClass]);

  const chooseStudent = (s) => {
    setStudent(s);
    setAcademicScores({});
    setBehaviorScores({});
    setTeacherNote("");
  };

  const ratingButton = (criterion, value, scores, setter) => {
    const selected = Number(scores[criterion.key]) === value.value;
    return (
      <button
        key={value.value}
        type="button"
        className={`periodic-rating-btn ${selected ? "periodic-rating-btn-active" : ""}`}
        onClick={() =>
          setter((prev) => ({ ...prev, [criterion.key]: value.value }))
        }
      >
        {value.label}
      </button>
    );
  };

  const academicValues = Object.values(academicScores).map(Number);
  const behaviorValues = Object.values(behaviorScores).map(Number);

  const academicAvg = academicValues.length
    ? academicValues.reduce((a, b) => a + b, 0) / PERIODIC_ACADEMIC_CRITERIA.length
    : 0;
  const behaviorAvg = behaviorValues.length
    ? behaviorValues.reduce((a, b) => a + b, 0) / PERIODIC_BEHAVIOR_CRITERIA.length
    : 0;

  const academicRating = academicAvg ? periodicRatingFromAverage(academicAvg) : "—";
  const behaviorRating = behaviorAvg ? periodicRatingFromAverage(behaviorAvg) : "—";
  const overallRating =
    academicAvg && behaviorAvg
      ? periodicRatingFromAverage((academicAvg + behaviorAvg) / 2)
      : "—";

  const canSave =
    isTeacher &&
    student &&
    subject.trim() &&
    evaluationPeriod &&
    academicValues.length === PERIODIC_ACADEMIC_CRITERIA.length &&
    behaviorValues.length === PERIODIC_BEHAVIOR_CRITERIA.length;

  const filteredEvaluations = useMemo(() => {
    const qName = filterName.trim();
    const qSubject = filterSubject.trim();

    return (evaluations || []).filter(
      (e) =>
        (filterClass === "الكل" || String(e.class || "") === filterClass) &&
        (!qName || String(e.studentName || "").includes(qName)) &&
        (!qSubject || String(e.subject || "").includes(qSubject)) &&
        (filterPeriod === "الكل" || e.evaluationPeriod === filterPeriod) &&
        (!filterDate || e.date === filterDate)
    );
  }, [
    evaluations,
    filterClass,
    filterName,
    filterSubject,
    filterPeriod,
    filterDate,
  ]);

  const esc = (value) =>
    String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");

  const criteriaRows = (criteria, scores) =>
    criteria
      .map((c) => {
        const value = Number(scores?.[c.key] || 0);
        const label =
          PERIODIC_RATING_SCALE.find((x) => x.value === value)?.label || "—";
        return `<tr><td>${esc(c.label)}</td><td class="center">${esc(label)}</td></tr>`;
      })
      .join("");

  const printOne = (e) => {
    const w = window.open("", "_blank", "width=1000,height=800");
    if (!w) return;

    w.document.write(`
      <!doctype html>
      <html lang="ar" dir="rtl">
      <head>
        <meta charset="utf-8"/>
        <title>تقرير التقييم الدوري</title>
        <style>
          @page{size:A4;margin:12mm}
          body{font-family:Tahoma,Arial,sans-serif;color:#111;margin:0;font-size:12px}
          .head{border:2px solid #111;padding:12px;text-align:center;margin-bottom:14px}
          .school{font-size:18px;font-weight:900}
          .title{font-size:20px;font-weight:900;margin-top:8px}
          table{width:100%;border-collapse:collapse;margin:10px 0}
          td,th{border:1px solid #222;padding:7px}
          th{background:#f2f2f2}
          .center{text-align:center}
          .section{font-size:16px;font-weight:900;margin-top:18px}
          .summary{display:flex;gap:12px;margin-top:14px}
          .summary div{flex:1;border:1px solid #222;padding:10px;text-align:center;font-weight:800}
          .note{border:1px solid #222;padding:10px;min-height:70px;margin-top:12px}
        </style>
      </head>
      <body>
        <div class="head">
          <div class="school">مدرسة عمر بن عبد العزيز الثانوية للبنين</div>
          <div class="title">تقرير التقييم الدوري للطالب</div>
        </div>

        <table>
          <tr>
            <th>اسم الطالب</th><td>${esc(e.studentName)}</td>
            <th>الصف</th><td>${esc(e.class)}</td>
          </tr>
          <tr>
            <th>المادة</th><td>${esc(e.subject)}</td>
            <th>فترة التقييم</th><td>${esc(e.evaluationPeriod)}</td>
          </tr>
          <tr>
            <th>المعلم</th><td>${esc(e.teacherName)}</td>
            <th>التاريخ</th><td>${esc(e.date)}</td>
          </tr>
        </table>

        <div class="section">الجانب الأكاديمي</div>
        <table>
          <thead><tr><th>المعيار</th><th>التقدير</th></tr></thead>
          <tbody>${criteriaRows(PERIODIC_ACADEMIC_CRITERIA, e.academicScores)}</tbody>
        </table>

        <div class="section">الجانب السلوكي والشخصي</div>
        <table>
          <thead><tr><th>المعيار</th><th>التقدير</th></tr></thead>
          <tbody>${criteriaRows(PERIODIC_BEHAVIOR_CRITERIA, e.behaviorScores)}</tbody>
        </table>

        <div class="summary">
          <div>التقدير الأكاديمي<br/>${esc(e.academicRating)}</div>
          <div>التقدير السلوكي<br/>${esc(e.behaviorRating)}</div>
          <div>التقدير العام<br/>${esc(e.overallRating)}</div>
        </div>

        <div class="section">ملاحظات المعلم</div>
        <div class="note">${esc(e.teacherNote || "لا توجد ملاحظات")}</div>

        <script>window.onload=()=>setTimeout(()=>window.print(),200);<\/script>
      </body>
      </html>
    `);
    w.document.close();
  };

  const printFiltered = () => {
    const w = window.open("", "_blank", "width=1100,height=800");
    if (!w) return;

    const rows = filteredEvaluations.length
      ? filteredEvaluations
          .map(
            (e, i) => `
            <tr>
              <td>${i + 1}</td>
              <td>${esc(e.date)}</td>
              <td>${esc(e.studentName)}</td>
              <td>${esc(e.class)}</td>
              <td>${esc(e.subject)}</td>
              <td>${esc(e.evaluationPeriod)}</td>
              <td>${esc(e.academicRating)}</td>
              <td>${esc(e.behaviorRating)}</td>
              <td>${esc(e.overallRating)}</td>
            </tr>`
          )
          .join("")
      : `<tr><td colspan="9">لا توجد تقييمات مطابقة</td></tr>`;

    w.document.write(`
      <!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"/>
      <title>سجل التقييمات الدورية</title>
      <style>
        @page{size:A4 landscape;margin:10mm}
        body{font-family:Tahoma,Arial,sans-serif}
        h1,h2{text-align:center}
        table{width:100%;border-collapse:collapse;font-size:11px}
        th,td{border:1px solid #222;padding:6px;text-align:center}
        th{background:#f2f2f2}
      </style></head><body>
      <h2>مدرسة عمر بن عبد العزيز الثانوية للبنين</h2>
      <h1>سجل التقييمات الدورية للطلاب</h1>
      <table><thead><tr>
        <th>م</th><th>التاريخ</th><th>الطالب</th><th>الصف</th><th>المادة</th>
        <th>الفترة</th><th>الأكاديمي</th><th>السلوكي</th><th>العام</th>
      </tr></thead><tbody>${rows}</tbody></table>
      <script>window.onload=()=>setTimeout(()=>window.print(),200);<\/script>
      </body></html>
    `);
    w.document.close();
  };

  const sendToGuardian = async (e) => {
    setSendingId(e.id);
    try {
      const body =
        `تقرير ${e.evaluationPeriod} للطالب/ة ${e.studentName} من الصف ${e.class}. ` +
        `المادة: ${e.subject}. ` +
        `التقدير الأكاديمي: ${e.academicRating}، ` +
        `التقدير السلوكي: ${e.behaviorRating}، ` +
        `التقدير العام: ${e.overallRating}.` +
        (e.teacherNote ? ` ملاحظات المعلم: ${e.teacherNote}` : "");

      await sendHudhudMessage(
        e.studentId,
        `التقييم الدوري — ${e.subject}`,
        body
      );
    } finally {
      setSendingId(null);
    }
  };

  return (
    <div className="view-stack">
      {isTeacher && (
        <div className="two-col two-col-narrow">
          <section className="card">
            <div className="card-head">
              <h3><GraduationCap size={17} /> اختيار الصف والطالب</h3>
            </div>

            <div className="field-label" style={{ marginTop: 0 }}>١. الصف</div>
            <div className="class-tabs">
              {classes.map((c) => (
                <button
                  key={c}
                  className={`class-tab ${selectedClass === c ? "class-tab-active" : ""}`}
                  onClick={() => {
                    setSelectedClass(c);
                    setStudent(null);
                    setStudentSearch("");
                  }}
                >
                  الصف {c}
                </button>
              ))}
            </div>

            {selectedClass && (
              <>
                <div className="field-label">٢. الطالب</div>
                <div className="search-box">
                  <Search size={16} />
                  <input
                    placeholder="ابحث باسم الطالب..."
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                  />
                </div>

                <div className="student-pick-list">
                  {visibleStudents.map((s) => (
                    <button
                      key={s.id}
                      className={`student-pick ${student?.id === s.id ? "student-pick-active" : ""}`}
                      onClick={() => chooseStudent(s)}
                    >
                      <Avatar name={s.name} />
                      <div>
                        <div className="att-name">{s.name}</div>
                        <div className="att-sub">الصف {s.class}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </>
            )}
          </section>

          <section className="card">
            {!student ? (
              <EmptyState text="اختر الصف ثم الطالب لبدء التقييم الدوري" />
            ) : (
              <>
                <div className="card-head">
                  <h3><FileText size={17} /> تقييم دوري: {student.name}</h3>
                </div>

                <div className="field-row">
                  <div style={{ flex: 1 }}>
                    <div className="field-label">المادة</div>
                    <input
                      className="text-input"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="مثال: الرياضيات"
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div className="field-label">فترة التقييم</div>
                    <select
                      className="select-input"
                      value={evaluationPeriod}
                      onChange={(e) => setEvaluationPeriod(e.target.value)}
                    >
                      {PERIODIC_PERIODS.map((p) => (
                        <option key={p}>{p}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="periodic-section-title">الجانب الأكاديمي</div>
                {PERIODIC_ACADEMIC_CRITERIA.map((c) => (
                  <div className="periodic-criterion" key={c.key}>
                    <div className="periodic-criterion-label">{c.label}</div>
                    <div className="periodic-rating-row">
                      {PERIODIC_RATING_SCALE.map((v) =>
                        ratingButton(c, v, academicScores, setAcademicScores)
                      )}
                    </div>
                  </div>
                ))}

                <div className="periodic-section-title">الجانب السلوكي والشخصي</div>
                {PERIODIC_BEHAVIOR_CRITERIA.map((c) => (
                  <div className="periodic-criterion" key={c.key}>
                    <div className="periodic-criterion-label">{c.label}</div>
                    <div className="periodic-rating-row">
                      {PERIODIC_RATING_SCALE.map((v) =>
                        ratingButton(c, v, behaviorScores, setBehaviorScores)
                      )}
                    </div>
                  </div>
                ))}

                <div className="periodic-summary">
                  <span>أكاديمي: <b>{academicRating}</b></span>
                  <span>سلوكي: <b>{behaviorRating}</b></span>
                  <span>عام: <b>{overallRating}</b></span>
                </div>

                <div className="field-label">ملاحظات المعلم</div>
                <textarea
                  className="textarea-input"
                  rows={4}
                  value={teacherNote}
                  onChange={(e) => setTeacherNote(e.target.value)}
                  placeholder="نقاط القوة، جوانب التحسين، توصيات المتابعة..."
                />

                <button
                  className="submit-btn"
                  disabled={!canSave}
                  onClick={async () => {
                    const saved = await addPeriodicEvaluation({
                      studentId: student.id,
                      subject,
                      evaluationPeriod,
                      academicScores,
                      behaviorScores,
                      teacherNote,
                    });
                    if (saved) {
                      setStudent(null);
                      setAcademicScores({});
                      setBehaviorScores({});
                      setTeacherNote("");
                    }
                  }}
                >
                  <Save size={16} /> حفظ التقييم الدوري
                </button>
              </>
            )}
          </section>
        </div>
      )}

      {isReadOnly && (
        <section className="card">
          <div className="card-head">
            <h3><Eye size={17} /> الاطلاع على التقييمات الدورية</h3>
          </div>
          <div className="att-sub">
            يمكن لمدير النظام والمرشد الطلابي الاطلاع والبحث والطباعة والإرسال لولي الأمر فقط.
            إضافة تقييم جديد متاحة للمعلمين.
          </div>
        </section>
      )}

      <section className="card">
        <div className="card-head">
          <h3><ClipboardList size={17} /> سجل التقييمات الدورية ({filteredEvaluations.length})</h3>
        </div>

        <div className="filters" style={{ flexWrap: "wrap", marginBottom: 14 }}>
          <Filter size={15} />

          <select
            className="select-input select-inline"
            value={filterClass}
            onChange={(e) => setFilterClass(e.target.value)}
          >
            <option value="الكل">كل الصفوف</option>
            {classes.map((c) => (
              <option key={c} value={c}>الصف {c}</option>
            ))}
          </select>

          <input
            className="text-input select-inline"
            placeholder="اسم الطالب..."
            value={filterName}
            onChange={(e) => setFilterName(e.target.value)}
          />

          <input
            className="text-input select-inline"
            placeholder="المادة..."
            value={filterSubject}
            onChange={(e) => setFilterSubject(e.target.value)}
          />

          <select
            className="select-input select-inline"
            value={filterPeriod}
            onChange={(e) => setFilterPeriod(e.target.value)}
          >
            <option value="الكل">كل فترات التقييم</option>
            {PERIODIC_PERIODS.map((p) => (
              <option key={p}>{p}</option>
            ))}
          </select>

          <input
            type="date"
            className="text-input select-inline"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
          />

          <button className="chip-btn-outline" onClick={() => setFilterDate(todayISO())}>
            اليوم
          </button>

          <button
            className="chip-btn-outline"
            onClick={() => {
              setFilterClass("الكل");
              setFilterName("");
              setFilterSubject("");
              setFilterPeriod("الكل");
              setFilterDate("");
            }}
          >
            مسح الفلاتر
          </button>

          <button className="chip-btn" style={{ background: "#1E2A4A" }} onClick={printFiltered}>
            <Printer size={14} /> طباعة السجل
          </button>
        </div>

        {filteredEvaluations.length === 0 ? (
          <EmptyState text="لا توجد تقييمات دورية مطابقة" />
        ) : (
          <div className="log-list">
            {filteredEvaluations.map((e) => (
              <div key={e.id} className="log-card" style={{ borderInlineStartColor: "#5B8DEF" }}>
                <div className="log-top">
                  <Avatar name={e.studentName || "؟"} tone="#5B8DEF" />
                  <div className="log-title">
                    <b>{e.studentName}</b> — الصف {e.class}
                  </div>
                  <div className="log-date">{e.date}</div>
                </div>

                <div className="log-item">
                  {e.subject} — {e.evaluationPeriod}
                </div>

                <div className="periodic-summary" style={{ marginTop: 8 }}>
                  <span>أكاديمي: <b>{e.academicRating}</b></span>
                  <span>سلوكي: <b>{e.behaviorRating}</b></span>
                  <span>عام: <b>{e.overallRating}</b></span>
                </div>

                <div className="log-desc">
                  المعلم: {e.teacherName}
                  {e.teacherNote ? ` — ${e.teacherNote}` : ""}
                </div>

                <div className="log-bottom" style={{ gap: 8, flexWrap: "wrap" }}>
                  <button className="chip-btn-outline" onClick={() => printOne(e)}>
                    <Printer size={13} /> طباعة التقرير
                  </button>

                  <button
                    className="chip-btn-outline"
                    disabled={sendingId === e.id}
                    onClick={() => sendToGuardian(e)}
                  >
                    <Send size={13} />
                    {sendingId === e.id ? "جارٍ الإرسال" : "إرسال لولي الأمر"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
