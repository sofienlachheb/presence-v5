import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Users, UserCheck, UserX, Clock, AlertTriangle, BarChart3, Bell,
  Search, Plus, X, Check, ChevronLeft, ChevronRight, Home, FileText,
  Send, ShieldAlert, GraduationCap, CalendarDays, Phone, Activity,
  ClipboardList, TrendingUp, Filter, Eye, Star, PenLine,
  Printer, PlayCircle, History as HistoryIcon, Settings, UserPlus,
  Trash2, Pencil, Lock, Mail, ShieldCheck, Save, Bird, MessageCircle, LogOut
} from "lucide-react";


export function UserModal({ user, roles, students, classes, sections, onClose, onSave, onResetPassword }) {
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [role, setRole] = useState(user?.role || roles[0] || "");
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
    (!isTeacher || teachingAssignmentKeys.length > 0);

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
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h4><UserPlus size={16} /> {user ? "تعديل مستخدم" : "إضافة مستخدم جديد"}</h4>
          <button className="icon-btn" onClick={onClose}><X size={16} /></button>
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
            <Save size={16} /> حفظ
          </button>
        </div>
      </div>
    </div>
  );
}
