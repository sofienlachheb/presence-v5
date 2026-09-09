import React from "react";
import {
  Users, UserCheck, UserX, Clock, AlertTriangle, BarChart3, Bell,
  Search, Plus, X, Check, ChevronLeft, ChevronRight, Home, FileText,
  Send, ShieldAlert, GraduationCap, CalendarDays, Phone, Activity,
  ClipboardList, TrendingUp, Filter, Eye, Star, PenLine,
  Printer, PlayCircle, History as HistoryIcon, Settings, UserPlus,
  Trash2, Pencil, Lock, Mail, ShieldCheck, Save, Bird, MessageCircle, LogOut
} from "lucide-react";


export function PrintPledgeModal({ pledge, violations, onClose }) {
  const related = violations.filter((v) => v.studentId === pledge.studentId && (!pledge.violationRef || v.item === pledge.violationRef));
  const latest = related[0] || null;
  const repeat = latest ? violations.filter((v) => v.studentId === pledge.studentId && v.item === latest.item).length : 0;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-box" style={{ maxWidth: 820 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-head no-print">
          <h4><PenLine size={16} /> {pledge.type === "طالب" ? "تعهد طالب" : "تعهد ولي أمر"}</h4>
          <button className="icon-btn" onClick={onClose}><X size={16} /></button>
        </div>
        <div className="modal-body pledge-print" style={{ direction: "rtl", background: "white", color: "#111" }}>
          <div style={{ border: "2px solid #222", padding: 12, position: "relative", marginBottom: 8 }}>
            <div style={{ position: "absolute", right: 18, top: 12, width: 62, height: 62, border: "2px solid #8d1734", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center", fontSize: 9, fontWeight: 800 }}>شعار<br/>المدرسة</div>
            <div style={{ textAlign: "center", fontSize: 18, fontWeight: 900, textDecoration: "underline" }}>مدرسة عمر بن عبد العزيز الثانوية للبنين</div>
            <div style={{ textAlign: "center", fontSize: 22, fontWeight: 900, marginTop: 9 }}>{pledge.type === "طالب" ? "تعهد طالب" : "تعهد ولي أمر"}</div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 7, fontWeight: 700, fontSize: 12 }}><span>رقم المخالفة: {latest?.id || "—"}</span><span>التاريخ: {pledge.date}</span></div>
          </div>

          <div style={{ border: "1.5px solid #222", padding: 18, lineHeight: 2 }}>
            {latest && <><div><b>المخالفة:</b> {latest.item}</div><div><b>مخالفة من الدرجة:</b> {latest.degree} &nbsp;&nbsp;&nbsp; <b>المخالفة تكررت للمرة:</b> {repeat}</div></>}
            <div><b>اسم الطالب:</b> {pledge.studentName} &nbsp;&nbsp;&nbsp; <b>الصف / الشعبة:</b> {pledge.class} / {pledge.section}</div>
            <div style={{ marginTop: 14, fontWeight: 800 }}>نص التعهد:</div>
            <p style={{ lineHeight: 2.15, margin: "5px 0 12px", minHeight: 105 }}>{pledge.text}</p>
            {latest && <div style={{ fontSize: 12 }}><b>وصف الواقعة:</b> {latest.description}</div>}
            <div style={{ marginTop: 12, fontSize: 12 }}><b>ملاحظة:</b> في حال تكرار المخالفة تتخذ المدرسة الإجراءات التربوية والإدارية المعتمدة وفق لائحة التقويم السلوكي.</div>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", gap: 20, marginTop: 30, textAlign: "center", fontWeight: 700 }}>
            <div style={{ flex: 1 }}>اسم الطالب<br/>{pledge.studentName}<br/><br/>التوقيع: ........................</div>
            <div style={{ flex: 1 }}>{pledge.type === "طالب" ? "ولي الأمر" : "صاحب التعهد"}<br/><br/>التوقيع: ........................</div>
            <div style={{ flex: 1 }}>منسق شؤون الطلاب<br/><br/>التوقيع: ........................</div>
          </div>
        </div>
        <div className="modal-foot no-print">
          <button className="submit-btn" style={{ margin: 0 }} onClick={() => window.print()}><Printer size={15} /> طباعة</button>
        </div>
      </div>
    </div>
  );
}
