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
import { ClassTabs } from "./ClassTabs";


/* ---------------------------------------------------------------
   تسجيل مخالفة
--------------------------------------------------------------- */
export function ViolationsEntry({ studentsByClass = {}, violStudent, setViolStudent, addViolation, periods, currentUser }) {
  const [search, setSearch] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [degree, setDegree] = useState(null);
  const [item, setItem] = useState("");
  const [period, setPeriod] = useState("");
  const [description, setDescription] = useState("");
  const [action, setAction] = useState("تنبيه شفهي للطالب");

  const isTeacher = currentUser?.role === "معلم";
  // نفس صفوف وشعب تسجيل الحضور، وفق صلاحيات الحساب.
  const availableClasses = useMemo(() => Object.keys(studentsByClass), [studentsByClass]);
  const classStudents = studentsByClass[selectedClass] || [];

  const filtered = classStudents.filter(
    (s) =>
      s.name.includes(search) ||
      String(s.class || "").includes(search)
  );

  useEffect(() => {
    if (!availableClasses.includes(selectedClass)) {
      setSelectedClass(availableClasses[0] || "");
      setViolStudent(null);
    }
  }, [availableClasses, selectedClass, setViolStudent]);

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
      <ClassTabs classes={availableClasses} selectedClass={selectedClass} onSelect={chooseClass} />
      {availableClasses.length === 0 && (
        <EmptyState text={isTeacher ? "لم يتم إسناد أي صف لهذا المعلم بعد" : "لا توجد صفوف متاحة"} />
      )}
      {availableClasses.includes(selectedClass) && (
      <div className="two-col two-col-narrow">
        <section className="card">
          <div className="card-head">
            <h3>
              <Search size={17} />
              اختيار الطالب
            </h3>
          </div>

              <div className="field-label" style={{ marginTop: 0 }}>اختر الطالب</div>

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
                    text="لا يوجد طلاب مطابقون في الصف المحدد"
                  />
                ) : (
                  filtered.map((s) => (
                    <button
                      key={s.id}
                      className={`student-pick ${violStudent?.id === s.id ? "student-pick-active" : ""}`}
                      onClick={() => chooseStudent(s)}
                    >
                      <Avatar name={s.name} />
                      <div>
                        <div className="att-name">{s.name}</div>
                        <div className="att-sub">الصف {s.class}{isTeacher ? ` / شعبة ${s.section}` : ""}</div>
                      </div>
                    </button>
                  ))
                )}
              </div>
        </section>

        <section className="card">
          {!violStudent || !classStudents.some((student) => student.id === violStudent.id) ? (
            <EmptyState
              text="اختر طالباً من القائمة لبدء تسجيل المخالفة"
            />
          ) : (
            <>
              <div className="card-head">
                <h3>
                  <AlertTriangle size={17} /> مخالفة: {violStudent.name}
                </h3>
              </div>

              <div className="att-sub" style={{ marginBottom: 10 }}>
                الصف {violStudent.class}{isTeacher ? ` / شعبة ${violStudent.section}` : ""}
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
      )}
    </div>
  );
}
