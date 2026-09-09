import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Users, UserCheck, UserX, Clock, AlertTriangle, BarChart3, Bell,
  Search, Plus, X, Check, ChevronLeft, ChevronRight, Home, FileText,
  Send, ShieldAlert, GraduationCap, CalendarDays, Phone, Activity,
  ClipboardList, TrendingUp, Filter, Eye, Star, PenLine,
  Printer, PlayCircle, History as HistoryIcon, Settings, UserPlus,
  Trash2, Pencil, Lock, Mail, ShieldCheck, Save, Bird, MessageCircle, LogOut
} from "lucide-react";


export function StudentModal({ student, classes, sections, onClose, onSave }) {
  const [studentNumber, setStudentNumber] = useState(student?.studentNumber || "");
  const [name, setName] = useState(student?.name || "");
  const [nationality, setNationality] = useState(student?.nationality || "");
  const [cls, setCls] = useState(student?.class || classes[0]);
  const [section, setSection] = useState(student?.section || sections[0]);
  const [guardianName, setGuardianName] = useState(student?.guardianName || "");
  const [guardianPhone, setGuardianPhone] = useState(student?.guardianPhone || "");
  const [health, setHealth] = useState(student?.health || "");

  const canSave = name.trim() && cls && section && guardianPhone.trim();

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h4><GraduationCap size={16} /> {student ? "تعديل بيانات طالب" : "إضافة طالب جديد"}</h4>
          <button className="icon-btn" onClick={onClose}><X size={16} /></button>
        </div>
        <div className="modal-body">
          <div className="field-label">الرقم الطلابي</div>
          <input
            className="text-input"
            value={studentNumber}
            onChange={(e) => setStudentNumber(e.target.value)}
            placeholder="الرقم"
          />

          <div className="field-label">اسم الطالب</div>
          <input className="text-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="اسم الطالب" />

          <div className="field-label">الجنسية</div>
          <input
            className="text-input"
            value={nationality}
            onChange={(e) => setNationality(e.target.value)}
            placeholder="الجنسية"
          />

          <div className="field-label">الصف</div>
          <select className="select-input" value={cls} onChange={(e) => setCls(e.target.value)}>
            {classes.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          <div className="field-label">الشعبة</div>
          <select className="select-input" value={section} onChange={(e) => setSection(e.target.value)}>
            {sections.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          <div className="field-label">اسم ولي الأمر</div>
          <input className="text-input" value={guardianName} onChange={(e) => setGuardianName(e.target.value)} placeholder="اسم ولي الأمر" />

          <div className="field-label">جوال ولي الأمر</div>
          <input className="text-input" value={guardianPhone} onChange={(e) => setGuardianPhone(e.target.value)} placeholder="55XXXXXX" />

          <div className="field-label">ملاحظة صحية (اختياري)</div>
          <select className="select-input" value={health || ""} onChange={(e) => setHealth(e.target.value || null)}>
            <option value="">لا يوجد</option>
            <option value="ربو">ربو</option>
            <option value="سكري">سكري</option>
            <option value="حساسية">حساسية</option>
          </select>

          <button
            className="submit-btn"
            disabled={!canSave}
            onClick={() =>
              onSave({
                studentNumber: studentNumber.trim(),
                name: name.trim(),
                nationality: nationality.trim(),
                class: cls,
                section,
                guardianName: guardianName.trim(),
                guardianPhone: guardianPhone.trim(),
                health: health || null,
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
