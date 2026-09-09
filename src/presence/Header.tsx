import React from "react";
import {
  Users, UserCheck, UserX, Clock, AlertTriangle, BarChart3, Bell,
  Search, Plus, X, Check, ChevronLeft, ChevronRight, Home, FileText,
  Send, ShieldAlert, GraduationCap, CalendarDays, Phone, Activity,
  ClipboardList, TrendingUp, Filter, Eye, Star, PenLine,
  Printer, PlayCircle, History as HistoryIcon, Settings, UserPlus,
  Trash2, Pencil, Lock, Mail, ShieldCheck, Save, Bird, MessageCircle, LogOut
} from "lucide-react";
import { fmtDate, todayISO } from "./shared";
import { Avatar } from "./Avatar";


/* ---------------------------------------------------------------
   الرأس
--------------------------------------------------------------- */
export function Header({ selectedDate, setSelectedDate, currentUser, onLogout, notificationCount = 0, onNotifications }) {
  const shift = (n) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + n);
    setSelectedDate(d.toISOString().slice(0, 10));
  };
  return (
    <header className="app-header">
      <div className="brand">
        <div className="brand-mark">
          <ShieldAlert size={22} />
        </div>
        <div>
          <div className="brand-name">مدرسة عمر بن عبد العزيز الثانوية للبنين</div>
          <div className="brand-sub">النظام الإلكتروني لدعم الطالب والمعلم</div>
        </div>
      </div>
      <div className="header-right">
        <div className="date-switcher">
          <button className="icon-btn" onClick={() => shift(1)} aria-label="اليوم التالي">
            <ChevronRight size={18} />
          </button>
          <div className="date-display">
            <CalendarDays size={16} />
            <span>{fmtDate(selectedDate)}</span>
          </div>
          <button className="icon-btn" onClick={() => shift(-1)} aria-label="اليوم السابق">
            <ChevronLeft size={18} />
          </button>
          {selectedDate !== todayISO() && (
            <button className="today-btn" onClick={() => setSelectedDate(todayISO())}>
              اليوم
            </button>
          )}
        </div>
        {currentUser && (
          <>
            <button className="notification-bell" title="الإشعارات والمهام" onClick={onNotifications}>
              <Bell size={19} />
              {notificationCount > 0 && <span>{notificationCount > 99 ? "99+" : notificationCount}</span>}
            </button>
          <div className="user-badge">
            <Avatar name={currentUser.name} tone="#8A1538" />
            <div className="user-badge-info">
              <div className="user-badge-name">{currentUser.name}</div>
              <div className="user-badge-role">{currentUser.role}</div>
            </div>
            <button className="icon-btn" title="تسجيل الخروج" onClick={onLogout}>
              <LogOut size={17} />
            </button>
          </div>
          </>
        )}
      </div>
    </header>
  );
}

