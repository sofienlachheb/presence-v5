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
import { EVAL_CRITERIA, ratingFor, todayISO } from "./shared";
import { EmptyState } from "./EmptyState";
import { Avatar } from "./Avatar";


/* ---------------------------------------------------------------
   مصفوفة تقييم أداء الطالب من قبل المعلم
--------------------------------------------------------------- */
export function EvaluationView({ students, evaluations, addEvaluation, sendHudhudMessage, currentUser }) {
  const [search, setSearch] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [student, setStudent] = useState(null);
  const [scores, setScores] = useState({});

  // فلاتر سجل التقييمات
  const [logClass, setLogClass] = useState("الكل");
  const [logName, setLogName] = useState("");
  const [logDate, setLogDate] = useState("");
  const [sendingIds, setSendingIds] = useState([]);

  const isTeacher = currentUser?.role === "معلم";
  const canCreateEvaluation = isTeacher;
  const isReadOnlyViewer =
    currentUser?.role === "مدير النظام" ||
    currentUser?.role === "مرشد طلابي";

  const availableClasses = useMemo(
    () =>
      [...new Set(
        (students || [])
          .map((s) => String(s.class || "").trim())
          .filter(Boolean)
      )],
    [students]
  );

  // للمعلم: يختار الصف أولاً ثم الطالب.
  const classStudents = useMemo(() => {
    if (!isTeacher) return students || [];
    if (!selectedClass) return [];

    return (students || []).filter(
      (s) => String(s.class || "").trim() === selectedClass
    );
  }, [students, isTeacher, selectedClass]);

  const filteredStudents = classStudents.filter(
    (s) =>
      s.name.includes(search) ||
      String(s.class || "").includes(search)
  );

  useEffect(() => {
    if (!isTeacher) return;

    if (availableClasses.length === 1 && !selectedClass) {
      setSelectedClass(availableClasses[0]);
    }

    if (selectedClass && !availableClasses.includes(selectedClass)) {
      setSelectedClass("");
      setStudent(null);
    }
  }, [isTeacher, availableClasses, selectedClass]);

  const chooseClass = (cls) => {
    setSelectedClass(cls);
    setSearch("");
    setStudent(null);
    setScores({});
  };

  const chooseStudent = (s) => {
    setStudent(s);
    const init = {};
    EVAL_CRITERIA.forEach((c) => (init[c.key] = 3));
    setScores(init);
  };

  const total = (Object.values(scores) as number[]).reduce((a, b) => a + b, 0);
  const max = EVAL_CRITERIA.length * 5;
  const percent = max ? Math.round((total / max) * 100) : 0;
  const rating = ratingFor(percent);

  const history = student ? evaluations.filter((e) => e.studentId === student.id) : [];

  const filteredEvaluations = useMemo(() => {
    const nameQuery = logName.trim();

    return (evaluations || []).filter((e) =>
      (logClass === "الكل" || String(e.class || "").trim() === logClass) &&
      (!nameQuery || String(e.studentName || "").includes(nameQuery)) &&
      (!logDate || e.date === logDate)
    );
  }, [evaluations, logClass, logName, logDate]);

  const escEval = (value) =>
    String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");

  const printEvaluations = () => {
    const w = window.open("", "_blank", "width=1050,height=800");
    if (!w) return;

    const rows = filteredEvaluations.length
      ? filteredEvaluations.map((e, index) => `
          <tr>
            <td>${index + 1}</td>
            <td>${escEval(e.date)}</td>
            <td>${escEval(e.studentName || "—")}</td>
            <td>${escEval(e.class || "—")}</td>
            <td>${escEval(e.total)}/${escEval(e.max)}</td>
            <td>${escEval(e.percent)}%</td>
            <td>${escEval(e.rating || "—")}</td>
          </tr>
        `).join("")
      : `<tr><td colspan="7">لا توجد تقييمات مطابقة للفلاتر المحددة</td></tr>`;

    writeSchoolPrint(w, `
      <!doctype html>
      <html lang="ar" dir="rtl">
      <head>
        <meta charset="utf-8"/>
        <title>سجل تقييمات الطلاب</title>
        <style>
          @page{size:A4 landscape;margin:12mm}
          body{font-family:Tahoma,Arial,sans-serif;color:#111;margin:0}
          h1,h2,p{text-align:center;margin:5px}
          table{width:100%;border-collapse:collapse;margin-top:18px;font-size:12px}
          th,td{border:1px solid #222;padding:7px;text-align:center}
          th{background:#f2f2f2}
          .meta{display:flex;justify-content:space-between;margin-top:12px;font-size:12px}
        </style>
      </head>
      <body>
        <h2>مدرسة عمر بن عبد العزيز الثانوية للبنين</h2>
        <h1>سجل تقييمات أداء الطلاب</h1>
        <div class="meta">
          <span>${logDate ? `التاريخ: ${escEval(logDate)}` : "جميع التواريخ"}</span>
          <span>${logClass === "الكل" ? "كل الصفوف" : `الصف: ${escEval(logClass)}`}</span>
          <span>عدد التقييمات: ${filteredEvaluations.length}</span>
        </div>
        <table>
          <thead>
            <tr>
              <th>م</th>
              <th>التاريخ</th>
              <th>اسم الطالب</th>
              <th>الصف</th>
              <th>المجموع</th>
              <th>النسبة</th>
              <th>التقدير</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
        
      </body>
      </html>
    `);


  };

  const sendEvaluationToGuardian = async (evaluation) => {
    if (!evaluation?.studentId) return;

    setSendingIds((prev) => [...prev, evaluation.id]);

    const body =
      `نحيطكم علماً بأن تقييم أداء الطالب/ة ${evaluation.studentName || ""} ` +
      `من الصف ${evaluation.class || ""} بتاريخ ${evaluation.date} هو: ` +
      `${evaluation.percent}% — ${evaluation.rating || ""}. ` +
      `المجموع: ${evaluation.total}/${evaluation.max}.`;

    try {
      await sendHudhudMessage(
        evaluation.studentId,
        "تقييم أداء الطالب",
        body
      );
    } finally {
      setSendingIds((prev) => prev.filter((id) => id !== evaluation.id));
    }
  };

  const sendFilteredEvaluations = async () => {
    if (!filteredEvaluations.length) return;

    const ok = window.confirm(
      `سيتم إرسال ${filteredEvaluations.length} تقييمًا إلى أولياء الأمور عبر رسائل هدهد. هل تريد المتابعة؟`
    );
    if (!ok) return;

    for (const evaluation of filteredEvaluations) {
      await sendEvaluationToGuardian(evaluation);
    }
  };

  return (
    <div className="view-stack">
      {canCreateEvaluation && (
      <div className="two-col two-col-narrow">
        <section className="card">
          <div className="card-head">
            <h3>
              <Search size={17} />
              {isTeacher ? "اختيار الصف ثم الطالب" : "اختيار الطالب"}
            </h3>
          </div>

          {isTeacher && (
            <>
              <div className="field-label" style={{ marginTop: 0 }}>
                ١. اختر الصف
              </div>

              {availableClasses.length === 0 ? (
                <EmptyState text="لم يتم إسناد أي صف لهذا المعلم بعد" />
              ) : (
                <div className="class-tabs" style={{ marginBottom: 14 }}>
                  {availableClasses.map((cls) => (
                    <button
                      key={cls}
                      className={`class-tab ${selectedClass === cls ? "class-tab-active" : ""}`}
                      onClick={() => chooseClass(cls)}
                    >
                      الصف {cls}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}

          {(!isTeacher || selectedClass) && (
            <>
              <div className="field-label" style={{ marginTop: isTeacher ? 4 : 0 }}>
                {isTeacher ? "٢. اختر الطالب" : "الطالب"}
              </div>

              <div className="search-box">
                <Search size={16} />
                <input
                  placeholder="ابحث باسم الطالب..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              <div className="student-pick-list">
                {filteredStudents.length === 0 ? (
                  <EmptyState
                    text={
                      isTeacher
                        ? "لا يوجد طلاب في هذا الصف ضمن الصفوف المسندة إليك"
                        : "لا يوجد طلاب مطابقون"
                    }
                  />
                ) : (
                  filteredStudents.slice(0, 80).map((s) => (
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
                  ))
                )}
              </div>
            </>
          )}
        </section>

        <section className="card">
          {!student ? (
            <EmptyState
              text={
                isTeacher && !selectedClass
                  ? "اختر الصف أولاً ثم اختر الطالب لتعبئة تقييم الأداء"
                  : "اختر طالباً لتعبئة مصفوفة تقييم الأداء"
              }
            />
          ) : (
            <>
              <div className="card-head">
                <h3><Star size={17} /> تقييم: {student.name}</h3>
              </div>

              <div className="att-sub" style={{ marginBottom: 10 }}>
                الصف {student.class}
              </div>

              <div className="eval-criteria">
                {EVAL_CRITERIA.map((c) => (
                  <div key={c.key} className="eval-row">
                    <span className="eval-label">{c.label}</span>
                    <div className="eval-stars">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <button
                          key={n}
                          className="star-btn"
                          onClick={() => setScores((prev) => ({ ...prev, [c.key]: n }))}
                        >
                          <Star
                            size={18}
                            fill={n <= (scores[c.key] || 0) ? "#D9A62E" : "none"}
                            color="#D9A62E"
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="eval-result" style={{ borderColor: rating.color }}>
                <div>
                  <div className="eval-result-label">المجموع الكلي</div>
                  <div className="eval-result-value">{total} / {max}</div>
                </div>
                <div className="eval-result-rating" style={{ color: rating.color }}>
                  {percent}% — {rating.label}
                </div>
              </div>

              <button
                className="submit-btn"
                onClick={() => {
                  addEvaluation(student.id, scores);
                  setStudent(null);
                }}
              >
                <Check size={16} /> حفظ التقييم
              </button>

              {history.length > 0 && (
                <>
                  <div className="field-label" style={{ marginTop: 18 }}>
                    تقييمات سابقة لهذا الطالب
                  </div>
                  <ul className="mini-list">
                    {history.map((h) => (
                      <li key={h.id}>
                        <span className="mini-list-name">{h.date}</span>
                        <span className="mini-list-desc">{h.percent}%</span>
                        <span className="count-chip" style={{ background: h.ratingColor }}>
                          {h.rating}
                        </span>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </>
          )}
        </section>
      </div>

      )}

      {isReadOnlyViewer && (
        <section className="card">
          <div className="card-head">
            <h3><Eye size={17} /> عرض تقييمات الطلاب</h3>
          </div>
          <div className="att-sub" style={{ lineHeight: 1.8 }}>
            هذا القسم للعرض والبحث والطباعة وإرسال التقييمات فقط.
            إضافة تقييم جديد متاحة للمعلمين فقط.
          </div>
        </section>
      )}

      <section className="card">
        <div className="card-head">
          <h3>
            <ClipboardList size={17} /> سجلّ تقييمات الأداء ({filteredEvaluations.length})
          </h3>
        </div>

        <div
          className="filters"
          style={{
            marginBottom: 14,
            display: "flex",
            flexWrap: "wrap",
            gap: 8,
          }}
        >
          <Filter size={15} />

          <select
            className="select-input select-inline"
            value={logClass}
            onChange={(e) => setLogClass(e.target.value)}
          >
            <option value="الكل">كل الصفوف</option>
            {availableClasses.map((c) => (
              <option key={c} value={c}>الصف {c}</option>
            ))}
          </select>

          <input
            className="text-input select-inline"
            placeholder="بحث باسم الطالب..."
            value={logName}
            onChange={(e) => setLogName(e.target.value)}
            style={{ minWidth: 180 }}
          />

          <input
            type="date"
            className="text-input select-inline"
            value={logDate}
            onChange={(e) => setLogDate(e.target.value)}
            style={{ minWidth: 150 }}
          />

          <button
            type="button"
            className="chip-btn-outline"
            onClick={() => setLogDate(todayISO())}
          >
            اليوم
          </button>

          <button
            type="button"
            className="chip-btn-outline"
            onClick={() => {
              setLogClass("الكل");
              setLogName("");
              setLogDate("");
            }}
          >
            مسح الفلاتر
          </button>

          <button
            type="button"
            className="chip-btn"
            onClick={printEvaluations}
            style={{ background: "#1E2A4A" }}
          >
            <Printer size={14} /> طباعة التقييمات
          </button>

          <button
            type="button"
            className="chip-btn"
            onClick={sendFilteredEvaluations}
            disabled={!filteredEvaluations.length}
            style={{ background: "#8E6FCE" }}
          >
            <Bird size={14} /> إرسال التقييمات لأولياء الأمور
          </button>
        </div>

        {filteredEvaluations.length === 0 ? (
          <EmptyState text="لا توجد تقييمات مطابقة للفلاتر المحددة" />
        ) : (
          <ul className="mini-list">
            {filteredEvaluations.map((e) => (
              <li key={e.id}>
                <Avatar name={e.studentName || "؟"} />

                <span className="mini-list-name">{e.studentName}</span>

                <span className="mini-list-desc">
                  الصف {e.class} — {e.date} — {e.percent}%
                </span>

                <span
                  className="count-chip"
                  style={{ background: e.ratingColor }}
                >
                  {e.rating}
                </span>

                <button
                  type="button"
                  className="chip-btn-outline"
                  disabled={sendingIds.includes(e.id)}
                  onClick={() => sendEvaluationToGuardian(e)}
                  title="إرسال هذا التقييم إلى ولي الأمر عبر هدهد"
                >
                  <Send size={13} />
                  {sendingIds.includes(e.id) ? "جارٍ الإرسال" : "إرسال لولي الأمر"}
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
