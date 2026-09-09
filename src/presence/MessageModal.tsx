import React from "react";
import {
  Users, UserCheck, UserX, Clock, AlertTriangle, BarChart3, Bell,
  Search, Plus, X, Check, ChevronLeft, ChevronRight, Home, FileText,
  Send, ShieldAlert, GraduationCap, CalendarDays, Phone, Activity,
  ClipboardList, TrendingUp, Filter, Eye, Star, PenLine,
  Printer, PlayCircle, History as HistoryIcon, Settings, UserPlus,
  Trash2, Pencil, Lock, Mail, ShieldCheck, Save, Bird, MessageCircle, LogOut
} from "lucide-react";
import { DEGREES } from "./shared";


/* ---------------------------------------------------------------
   نافذة معاينة رسالة الإبلاغ
--------------------------------------------------------------- */
export function MessageModal({ data, onClose }) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h4><Phone size={16} /> معاينة إشعار ولي الأمر</h4>
          <button className="icon-btn" onClick={onClose}><X size={16} /></button>
        </div>
        <div className="modal-body">
          <p>
            عزيزي ولي أمر الطالب/ <b>{data.studentName}</b>،
          </p>
          <p>
            نحيطكم علماً بتسجيل مخالفة سلوكية من <b style={{ color: DEGREES[data.degree].color }}>{DEGREES[data.degree].label}</b> بتاريخ {data.date} خلال {data.period || "اليوم الدراسي"}، تتعلق بـ: «{data.item}».
          </p>
          <p className="modal-desc">تفاصيل الواقعة: {data.description}</p>
          <p>الإجراء المتخذ: {data.action}.</p>
          <p>نأمل التواصل مع إدارة المدرسة لمتابعة الموضوع.</p>
        </div>
        <div className="modal-foot">هذه معاينة توضيحية للرسالة المرسلة، وليست إرسالاً فعلياً.</div>
      </div>
    </div>
  );
}
