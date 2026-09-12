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
import { HUDHUD_TEMPLATES } from "./shared";


export function HudhudView({ students, hudhudMessages, sendHudhudMessage, currentUser }) {
  const [search, setSearch] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [student, setStudent] = useState(null);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");

  const isTeacher = currentUser?.role === "معلم";

  // للمعلم فقط: نظهر الصفوف المسندة إليه بدون الشعب.
  const teacherClasses = useMemo(
    () =>
      [...new Set<string>(
        (students || [])
          .map((s) => String(s.class || "").trim())
          .filter(Boolean)
      )],
    [students]
  );

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
      setStudent(null);
    }
  }, [isTeacher, teacherClasses, selectedClass]);

  const applyTemplate = (tpl, st = student) => {
    const target = st || student;
    if (!target) {
      setSubject(tpl.subject);
      setBody(tpl.body.replace("{name}", "").replace("{class}", ""));
      return;
    }
    setSubject(tpl.subject);
    setBody(tpl.body.replace("{name}", target.name).replace("{class}", target.class));
  };

  const chooseClass = (cls) => {
    setSelectedClass(cls);
    setSearch("");
    setStudent(null);
    setSubject("");
    setBody("");
  };

  const chooseStudent = (s) => {
    setStudent(s);
    setSubject("");
    setBody("");
  };

  const history = student ? hudhudMessages.filter((m) => m.studentId === student.id) : [];
  const canSend = student && subject.trim() && body.trim();

  const handleSend = () => {
    sendHudhudMessage(student.id, subject.trim(), body.trim());
    setSubject("");
    setBody("");
  };

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
              <div className="field-label" style={{ marginTop: 0 }}>
                ١. اختر الصف
              </div>

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
                  ? "اختر الصف أولاً ثم اختر الطالب لإرسال رسالة هدهد"
                  : "اختر طالباً لإرسال رسالة هدهد إلى ولي أمره"
              }
            />
          ) : (
            <>
              <div className="card-head">
                <h3><Bird size={17} /> رسالة إلى ولي أمر: {student.name}</h3>
              </div>

              <div className="att-sub" style={{ marginBottom: 10 }}>
                الصف {student.class}
                {" · "}
                <Phone size={12} style={{ verticalAlign: "-1px" }} /> {student.guardianPhone || "—"}
              </div>

              <div className="field-label">قوالب جاهزة</div>
              <div className="hudhud-templates">
                {HUDHUD_TEMPLATES.map((t) => (
                  <button key={t.label} className="chip-btn-outline" onClick={() => applyTemplate(t)}>
                    {t.label}
                  </button>
                ))}
              </div>

              <div className="field-label">عنوان الرسالة</div>
              <input
                className="text-input"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="عنوان الرسالة"
              />

              <div className="field-label">نص الرسالة</div>
              <textarea
                className="textarea-input"
                rows={5}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="اكتب نص الرسالة الموجهة لولي الأمر..."
              />

              <button className="submit-btn" disabled={!canSend} onClick={handleSend}>
                <Send size={16} /> إرسال عبر هدهد
              </button>

              {history.length > 0 && (
                <>
                  <div className="field-label" style={{ marginTop: 18 }}>
                    رسائل سابقة لهذا الطالب
                  </div>
                  <ul className="mini-list">
                    {history.map((h) => (
                      <li key={h.id}>
                        <span className="mini-list-name">{h.subject}</span>
                        <span className="mini-list-desc">{h.date} — {h.time}</span>
                        <span className="count-chip" style={{ background: "#8E6FCE" }}>
                          {h.status}
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

      <section className="card">
        <div className="card-head">
          <h3><ClipboardList size={17} /> سجلّ رسائل هدهد ({hudhudMessages.length})</h3>
        </div>

        {hudhudMessages.length === 0 ? (
          <EmptyState text="لم يتم إرسال أي رسائل هدهد بعد" />
        ) : (
          <ul className="mini-list">
            {hudhudMessages.slice(0, 12).map((m) => (
              <li key={m.id}>
                <Avatar name={m.studentName} tone="#8E6FCE" />
                <span className="mini-list-name">{m.studentName}</span>
                <span className="mini-list-desc">
                  {m.subject} — الصف {m.class} — {m.date}
                </span>
                <span className="count-chip" style={{ background: "#8E6FCE" }}>
                  {m.status}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
