import "./user-modal.css";
import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Users, UserCheck, UserX, Clock, AlertTriangle, BarChart3, Bell,
  Search, Plus, X, Check, ChevronLeft, ChevronRight, Home, FileText,
  Send, ShieldAlert, GraduationCap, CalendarDays, Phone, Activity,
  ClipboardList, TrendingUp, Filter, Eye, Star, PenLine,
  Printer, PlayCircle, History as HistoryIcon, Settings, UserPlus,
  Trash2, Pencil, Lock, Mail, ShieldCheck, Save, Bird, MessageCircle, LogOut
} from "lucide-react";


const teachingSubjects = ["اللغة العربية", "اللغة الإنجليزية", "الشرعية", "الحاسوب", "الرياضيات", "الفيزياء", "الكيمياء", "الأحياء", "تاريخ", "جغرافيا", "اجتماعيات", "مهارات حياتية"];

export function UserModal({ user, roles, students, classes, sections, onClose, onSave, onResetPassword }) {
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [role, setRole] = useState(user?.role || roles[0] || "");
  const [teachingSubject, setTeachingSubject] = useState(user?.teachingSubject || "");
  const [customSubject, setCustomSubject] = useState(!!user?.teachingSubject && !teachingSubjects.includes(user.teachingSubject));
  const [active, setActive] = useState(user ? user.active : true);
  const [password, setPassword] = useState("");
  const [childIds, setChildIds] = useState(user?.childStudentIds || []);
  const [childSearch, setChildSearch] = useState("");
  const [teachingAssignmentKeys, setTeachingAssignmentKeys] = useState(
    (user?.teachingAssignments || []).map((a) => `${a.className}|||${a.sectionName}`)
  );

  const isGuardian = role === "ولي أمر";
  const isTeacher = role === "معلم";
  const canSave =
    name.trim() &&
    role &&
    email.trim() &&
    (user || password.trim()) &&
    (!isTeacher || (teachingAssignmentKeys.length > 0 && teachingSubject.trim().length > 0));

  const toggleChild = (id) => {
    setChildIds((prev) => (prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]));
  };

  const toggleTeachingAssignment = (key) => {
    setTeachingAssignmentKeys((prev) =>
      prev.includes(key) ? prev.filter((x) => x !== key) : [...prev, key]
    );
  };

  const filteredStudents = (students || []).filter(
    (s) => s.name.includes(childSearch) || s.class.includes(childSearch)
  );

  return (
    <div className="modal-backdrop user-modal-backdrop" onClick={onClose}>
      <div className="modal-box user-modal" role="dialog" aria-modal="true" aria-labelledby="user-modal-title" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h4 id="user-modal-title"><UserPlus size={16} /> {user ? "تعديل مستخدم" : "إضافة مستخدم جديد"}</h4>
          <button className="icon-btn" aria-label="إغلاق" onClick={onClose}><X size={16} /></button>
        </div>
        <div className="modal-body">
          <div className="field-label">الاسم</div>
          <input className="text-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="اسم المستخدم" />

          <div className="field-label">البريد الإلكتروني (لتسجيل الدخول)</div>
          <input
            className="text-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="example@school.qa"
            disabled={!!user}
          />

          <div className="field-label">رقم الهاتف</div>
          <input className="text-input" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="55XXXXXX" />

          {!user ? (
            <>
              <div className="field-label">كلمة المرور الأولية</div>
              <input
                type="text"
                className="text-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="كلمة مرور الدخول للنظام (6 أحرف على الأقل)"
              />
            </>
          ) : (
            <>
              <div className="field-label">كلمة المرور</div>
              <button type="button" className="chip-btn-outline" onClick={() => onResetPassword(email)}>
                <Lock size={13} /> إرسال رابط إعادة تعيين كلمة المرور
              </button>
            </>
          )}

          <div className="field-label">الدور</div>
          <select className="select-input" value={role} onChange={(e) => setRole(e.target.value)}>
            {roles.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>

          {isTeacher && <div className="user-subject-field">
            <label className="field-label" htmlFor="teacher-subject">المادة التي يدرسها المعلم <span aria-hidden="true">*</span></label>
            <select id="teacher-subject" className="select-input" value={customSubject ? "other" : teachingSubject} onChange={e => { setCustomSubject(e.target.value === "other"); setTeachingSubject(e.target.value === "other" ? "" : e.target.value); }}>
              <option value="">اختر المادة</option>
              {teachingSubjects.map(subject => <option key={subject} value={subject}>{subject}</option>)}
              <option value="other">مادة أخرى</option>
            </select>
            {customSubject && <input className="text-input" aria-label="اسم المادة الأخرى" value={teachingSubject} maxLength={100} onChange={e => setTeachingSubject(e.target.value)} placeholder="اكتب اسم المادة" />}
            <p className="char-hint">تظهر تلقائيًا في التقييم الدوري ونقاط الحصة.</p>
          </div>}
          {isTeacher && (
            <>
              <div className="field-label">
                الصفوف والشعب التي يدرسها المعلم ({teachingAssignmentKeys.length})
              </div>
              <div className="child-pick-list" style={{ maxHeight: 220 }}>
                {(classes || []).flatMap((cls) =>
                  (sections || []).map((section) => {
                    const key = `${cls}|||${section}`;
                    return (
                      <label key={key} className="child-pick-row">
                        <input
                          type="checkbox"
                          checked={teachingAssignmentKeys.includes(key)}
                          onChange={() => toggleTeachingAssignment(key)}
                        />
                        <span>الصف {cls}</span>
                        <span className="att-sub">الشعبة {section}</span>
                      </label>
                    );
                  })
                )}
              </div>
              {teachingAssignmentKeys.length === 0 && (
                <div className="char-hint" style={{ color: "#C7433F" }}>
                  يجب اختيار صف/شعبة واحدة على الأقل للمعلم.
                </div>
              )}
            </>
          )}

          {isGuardian && (
            <>
              <div className="field-label">الأبناء المرتبطون بالحساب ({childIds.length})</div>
              <input
                className="text-input"
                placeholder="ابحث بالاسم أو الصف..."
                value={childSearch}
                onChange={(e) => setChildSearch(e.target.value)}
                style={{ marginBottom: 8 }}
              />
              <div className="child-pick-list">
                {filteredStudents.slice(0, 30).map((s) => (
                  <label key={s.id} className="child-pick-row">
                    <input type="checkbox" checked={childIds.includes(s.id)} onChange={() => toggleChild(s.id)} />
                    <span>{s.name}</span>
                    <span className="att-sub">{s.class} - {s.section}</span>
                  </label>
                ))}
              </div>
            </>
          )}

          {user && (
            <label style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 14, fontSize: 12.5, fontWeight: 700 }}>
              <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
              حساب نشط
            </label>
          )}

        </div>
        <div className="user-modal-footer">
          {!canSave && <p className="char-hint" role="status">أكمل الاسم والبريد الإلكتروني{!user && " وكلمة المرور"}{isTeacher && " وحدد المادة وصفًا/شعبة واحدة على الأقل"} لتفعيل الحفظ.</p>}
          <div className="user-modal-actions">
          <button
            className="submit-btn"
            disabled={!canSave}
            onClick={() =>
              onSave({
                name: name.trim(),
                email: email.trim(),
                phone: phone.trim(),
                role,
                active,
                password: password.trim(),
                teachingSubject: isTeacher ? teachingSubject.trim() : null,
                childStudentIds: isGuardian ? childIds : undefined,
                teachingAssignments: isTeacher
                  ? teachingAssignmentKeys.map((key) => {
                      const [className, sectionName] = key.split("|||");
                      return { className, sectionName };
                    })
                  : undefined,
              })
            }
          >
            <Save size={16} /> {user ? "حفظ التعديلات" : "إضافة مستخدم جديد"}
          </button>
          <button type="button" className="chip-btn-outline" onClick={onClose}>إلغاء</button>
          </div>
        </div>
      </div>
    </div>
  );
}
