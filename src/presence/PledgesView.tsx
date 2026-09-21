import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Users, UserCheck, UserX, Clock, AlertTriangle, BarChart3, Bell,
  Search, Plus, X, Check, ChevronLeft, ChevronRight, Home, FileText,
  Send, ShieldAlert, GraduationCap, CalendarDays, Phone, Activity,
  ClipboardList, TrendingUp, Filter, Eye, Star, PenLine,
  Printer, PlayCircle, History as HistoryIcon, Settings, UserPlus,
  Trash2, Pencil, Lock, Mail, ShieldCheck, Save, Bird, MessageCircle, LogOut
} from "lucide-react";
import { PLEDGE_TEMPLATES } from "./shared";
import { Avatar } from "./Avatar";
import { EmptyState } from "./EmptyState";

/* ---------------------------------------------------------------
   نماذج التعهد (تعهد الطالب / تعهد ولي الأمر)
--------------------------------------------------------------- */
export function PledgesView({ students, violations, pledges, addPledge, setPrintPledge }) {
  const [selectedClass, setSelectedClass] = useState("");
  const [search, setSearch] = useState("");
  const [student, setStudent] = useState(null);
  const [type, setType] = useState("طالب");
  const [violationRef, setViolationRef] = useState("");
  const [text, setText] = useState("");

  const classes = useMemo(
    () => [...new Set<string>(students.map((s) => s.class).filter(Boolean))],
    [students]
  );
  const filtered = selectedClass
    ? students.filter((s) => s.class === selectedClass && s.name.includes(search.trim()))
    : [];

  const changeClass = (value: string) => {
    setSelectedClass(value);
    setSearch("");
    setStudent(null);
    setViolationRef("");
    setText("");
  };
  const studentViolations = student ? violations.filter((v) => v.studentId === student.id) : [];

  const applyTemplate = (st, vRef, t) => {
    if (!st) return;
    const tpl = PLEDGE_TEMPLATES[t];
    setText(tpl.replace("{name}", st.name).replace("{class}", st.class).replace("{violation}", vRef || "الالتزام بالسلوك المدرسي العام"));
  };

  const chooseStudent = (s) => {
    setStudent(s);
    setViolationRef("");
    applyTemplate(s, "", type);
  };

  const changeType = (t) => {
    setType(t);
    applyTemplate(student, violationRef, t);
  };

  const changeViolationRef = (v) => {
    setViolationRef(v);
    applyTemplate(student, v, type);
  };

  const handleSave = () => {
    const rec = addPledge(student.id, type, violationRef, text);
    setStudent(null);
    setText("");
    setViolationRef("");
    return rec;
  };

  return (
    <div className="view-stack">
      <div className="two-col two-col-narrow">
        <section className="card">
          <div className="card-head"><h3><Search size={17} /> اختيار الطالب</h3></div>
          <label className="field-label" htmlFor="pledge-class">الصف</label>
          <select id="pledge-class" className="select-input" value={selectedClass} onChange={(e) => changeClass(e.target.value)}>
            <option value="">اختر الصف أولاً</option>
            {classes.map((name) => <option key={name} value={name}>{name}</option>)}
          </select>
          <div className="search-box">
            <Search size={16} />
            <input aria-label="البحث عن طالب في الصف" disabled={!selectedClass} placeholder="ابحث باسم الطالب في الصف..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div className="student-pick-list">
            {!selectedClass ? <EmptyState text="اختر الصف لعرض الطلاب" /> : filtered.length === 0 ? <EmptyState text="لا يوجد طلاب مطابقون في هذا الصف" /> : null}
            {filtered.map((s) => (
              <button
                key={s.id}
                className={`student-pick ${student?.id === s.id ? "student-pick-active" : ""}`}
                onClick={() => chooseStudent(s)}
              >
                <Avatar name={s.name} />
                <div>
                  <div className="att-name">{s.name}</div>
                  <div className="att-sub">{s.class} - {s.section}</div>
                </div>
              </button>
            ))}
          </div>
        </section>

        <section className="card">
          {!student ? (
            <EmptyState text="اختر طالباً لإنشاء نموذج تعهد" />
          ) : (
            <>
              <div className="card-head"><h3><PenLine size={17} /> تعهد: {student.name}</h3></div>

              <div className="field-label">نوع التعهد</div>
              <div className="degree-select" style={{ gridTemplateColumns: "1fr 1fr" }}>
                <button className={`class-tab ${type === "طالب" ? "class-tab-active" : ""}`} onClick={() => changeType("طالب")}>تعهد خطي للطالب</button>
                <button className={`class-tab ${type === "ولي أمر" ? "class-tab-active" : ""}`} onClick={() => changeType("ولي أمر")}>تعهد خطي لولي الأمر</button>
              </div>

              {studentViolations.length > 0 && (
                <>
                  <div className="field-label">ربط بمخالفة سابقة (اختياري)</div>
                  <select className="select-input" value={violationRef} onChange={(e) => changeViolationRef(e.target.value)}>
                    <option value="">بدون ربط — التزام عام</option>
                    {studentViolations.map((v) => (
                      <option key={v.id} value={v.item}>{v.date} — {v.item}</option>
                    ))}
                  </select>
                </>
              )}

              <div className="field-label">نص التعهد</div>
              <textarea className="textarea-input" rows={6} value={text} onChange={(e) => setText(e.target.value)} />

              <button className="submit-btn" disabled={!text.trim()} onClick={handleSave}>
                <Check size={16} /> حفظ التعهد
              </button>
            </>
          )}
        </section>
      </div>

      <section className="card">
        <div className="card-head"><h3><HistoryIcon size={17} /> التعهدات المحفوظة ({pledges.length})</h3></div>
        {pledges.length === 0 ? (
          <EmptyState text="لا توجد تعهدات محفوظة بعد" />
        ) : (
          <div className="log-list">
            {pledges.map((p) => (
              <div key={p.id} className="log-card" style={{ borderInlineStartColor: "#5B8DEF" }}>
                <div className="log-top">
                  <PenLine size={16} color="#5B8DEF" />
                  <div className="log-title"><b>{p.studentName}</b> — {p.type === "طالب" ? "تعهد الطالب" : "تعهد ولي الأمر"}</div>
                  <div className="log-date">{p.date}</div>
                </div>
                <div className="log-desc">{p.text}</div>
                <div className="log-bottom">
                  <span className="log-action">الصف {p.class} / {p.section}</span>
                  <button className="notified-chip" onClick={() => setPrintPledge(p)}>
                    <Printer size={13} /> طباعة
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
