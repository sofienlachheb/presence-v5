import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Users, UserCheck, UserX, Clock, AlertTriangle, BarChart3, Bell,
  Search, Plus, X, Check, ChevronLeft, ChevronRight, Home, FileText,
  Send, ShieldAlert, GraduationCap, CalendarDays, Phone, Activity,
  ClipboardList, TrendingUp, Filter, Eye, Star, PenLine,
  Printer, PlayCircle, History as HistoryIcon, Settings, UserPlus,
  Trash2, Pencil, Lock, Mail, ShieldCheck, Save, Bird, MessageCircle, LogOut
} from "lucide-react";


/* ---------------------------------------------------------------
   شاشة تسجيل الدخول
--------------------------------------------------------------- */
export function LoginScreen({ users, onLogin, error }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [showHint, setShowHint] = useState(false);

  const submit = (e) => {
    e?.preventDefault();
    if (!email.trim() || !password.trim()) return;
    onLogin(email, password);
  };

  return (
    <div className="login-screen">
      <div className="login-box">
        <div className="login-brand">
          <div className="brand-mark">
            <ShieldAlert size={26} />
          </div>
          <div className="login-title">مدرسة عمر بن عبد العزيز الثانوية للبنين</div>
          <div className="login-sub">النظام الإلكتروني لدعم الطالب والمعلم</div>
        </div>

        <form onSubmit={submit}>
          <div className="field-label">البريد الإلكتروني</div>
          <div className="input-with-icon">
            <Mail size={16} />
            <input
              type="text"
              className="text-input"
              placeholder="name@school.qa"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoFocus
            />
          </div>

          <div className="field-label">كلمة المرور</div>
          <div className="input-with-icon">
            <Lock size={16} />
            <input
              type={showPass ? "text" : "password"}
              className="text-input"
              placeholder="••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button type="button" className="show-pass-btn" onClick={() => setShowPass((v) => !v)}>
              <Eye size={15} />
            </button>
          </div>

          {error && <div className="login-error">{error}</div>}

          <button type="submit" className="submit-btn" style={{ marginTop: 14 }} onClick={submit}>
            <LogOut size={16} style={{ transform: "scaleX(-1)" }} /> تسجيل الدخول
          </button>
        </form>


      </div>
    </div>
  );
}
