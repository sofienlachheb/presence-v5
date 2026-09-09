import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Users, UserCheck, UserX, Clock, AlertTriangle, BarChart3, Bell,
  Search, Plus, X, Check, ChevronLeft, ChevronRight, Home, FileText,
  Send, ShieldAlert, GraduationCap, CalendarDays, Phone, Activity,
  ClipboardList, TrendingUp, Filter, Eye, Star, PenLine,
  Printer, PlayCircle, History as HistoryIcon, Settings, UserPlus,
  Trash2, Pencil, Lock, Mail, ShieldCheck, Save, Bird, MessageCircle, LogOut
} from "lucide-react";
import { EmptyState } from "./EmptyState";
import { Avatar } from "./Avatar";
import { ACTIONS_LIST, DEGREES } from "./shared";
import { SeverityGauge } from "./SeverityGauge";


/* ---------------------------------------------------------------
   تسجيل مخالفة
--------------------------------------------------------------- */
export function ViolationsEntry({ students, violStudent, setViolStudent, addViolation, periods, currentUser }) {
  const [search, setSearch] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [degree, setDegree] = useState(null);
  const [item, setItem] = useState("");
  const [period, setPeriod] = useState("");
  const [description, setDescription] = useState("");
  const [action, setAction] = useState("تنبيه شفهي للطالب");

  const isTeacher = currentUser?.role === "معلم";

  // للمعلم فقط: نعرض الصفوف المرتبطة به دون إظهار الشعب.
  // بما أن students الممرّرة للمعلم هي accessibleStudents، فلن تظهر له صفوف خارج تكليفه.
  const teacherClasses = useMemo(
    () =>
      [...new Set(
        (students || [])
          .map((s) => String(s.class || "").trim())
          .filter(Boolean)
      )],
    [students]
  );

  // بعد اختيار الصف، نعرض جميع طلابه الذين يحق للمعلم التعامل معهم،
  // حتى لو كانوا موزعين على أكثر من شعبة، دون إظهار اسم الشعبة في الواجهة.
  const classStudents = useMemo(() => {
    if (!isTeacher) return students || [];
    if (!selectedClass) return [];
    return (students || []).filter(
      (s) => String(s.class || "").trim() === selectedClass
    );
  }, [students, isTeacher, selectedClass]);

  const filtered = classStudents.filter(
    (s) =>
      s.name.includes(search) ||
      String(s.class || "").includes(search)
  );

  useEffect(() => {
    if (!isTeacher) return;

    if (teacherClasses.length === 1 && !selectedClass) {
      setSelectedClass(teacherClasses[0]);
    }

    if (selectedClass && !teacherClasses.includes(selectedClass)) {
      setSelectedClass("");
      setViolStudent(null);
    }
  }, [isTeacher, teacherClasses, selectedClass, setViolStudent]);

  const reset = () => {
    setDegree(null);
    setItem("");
    setPeriod("");
    setDescription("");
    setAction("تنبيه شفهي للطالب");
  };

  const chooseClass = (cls) => {
    setSelectedClass(cls);
    setSearch("");
    setViolStudent(null);
    reset();
  };

  const chooseStudent = (s) => {
    setViolStudent(s);
    reset();
  };

  const canSubmit = degree && item && description.trim().length >= 15;

  return (
    <div className="view-stack">
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
              <div className="field-label" style={{ marginTop: 0 }}>١. اختر الصف</div>

              {teacherClasses.length === 0 ? (
                <EmptyState text="لم يتم إسناد أي صف لهذا المعلم بعد" />
              ) : (
                <div className="class-tabs" style={{ marginBottom: 14 }}>
                  {teacherClasses.map((cls) => (
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
                {filtered.length === 0 ? (
                  <EmptyState
                    text={
                      isTeacher
                        ? "لا يوجد طلاب في هذا الصف ضمن الصفوف المسندة إليك"
                        : "لا يوجد طلاب مطابقون"
                    }
                  />
                ) : (
                  filtered.slice(0, 80).map((s) => (
                    <button
                      key={s.id}
                      className={`student-pick ${violStudent?.id === s.id ? "student-pick-active" : ""}`}
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
          {!violStudent ? (
            <EmptyState
              text={
                isTeacher && !selectedClass
                  ? "اختر الصف أولاً ثم اختر الطالب لتسجيل المخالفة"
                  : "اختر طالباً من القائمة لبدء تسجيل المخالفة"
              }
            />
          ) : (
            <>
              <div className="card-head">
                <h3>
                  <AlertTriangle size={17} /> مخالفة: {violStudent.name}
                </h3>
              </div>

              <div className="att-sub" style={{ marginBottom: 10 }}>
                الصف {violStudent.class}
              </div>

              <div className="field-label">١. اختر درجة المخالفة</div>
              <div className="degree-select">
                {[1, 2, 3, 4].map((d) => (
                  <button
                    key={d}
                    className={`degree-btn ${degree === d ? "degree-btn-active" : ""}`}
                    style={{ "--deg-color": DEGREES[d].color } as React.CSSProperties}
                    onClick={() => {
                      setDegree(d);
                      setItem("");
                    }}
                  >
                    <SeverityGauge degree={d} size="sm" />
                    {DEGREES[d].label}
                  </button>
                ))}
              </div>

              {degree && (
                <>
                  <div className="field-label">٢. نوع المخالفة</div>
                  <select className="select-input" value={item} onChange={(e) => setItem(e.target.value)}>
                    <option value="">-- اختر من القائمة --</option>
                    {DEGREES[degree].items.map((it) => (
                      <option key={it} value={it}>{it}</option>
                    ))}
                  </select>

                  <div className="field-row">
                    <div style={{ flex: 1 }}>
                      <div className="field-label">الحصة</div>
                      <select className="select-input" value={period} onChange={(e) => setPeriod(e.target.value)}>
                        <option value="">-- اختر الحصة --</option>
                        {(periods || []).map((p) => (
                          <option key={p.id} value={p.name}>{p.name}</option>
                        ))}
                      </select>
                    </div>

                    <div style={{ flex: 1 }}>
                      <div className="field-label">الإجراء الأولي</div>
                      <select className="select-input" value={action} onChange={(e) => setAction(e.target.value)}>
                        {ACTIONS_LIST.map((a) => <option key={a}>{a}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="field-label">وصف الواقعة (٥٠ حرفاً على الأقل)</div>
                  <textarea
                    className="textarea-input"
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="اكتب تفاصيل ما حدث بدقة..."
                  />
                  <div className="char-hint">{description.length} / 50 حرف كحد أدنى</div>

                  <button
                    className="submit-btn"
                    disabled={!canSubmit}
                    onClick={() => addViolation(violStudent.id, degree, item, period, description, action)}
                  >
                    <Send size={16} /> تسجيل المخالفة وإبلاغ ولي الأمر
                  </button>
                </>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
}
