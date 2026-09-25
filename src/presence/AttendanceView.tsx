import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Users, UserCheck, UserX, Clock, AlertTriangle, BarChart3, Bell,
  Search, Plus, X, Check, ChevronLeft, ChevronRight, Home, FileText,
  Send, ShieldAlert, GraduationCap, CalendarDays, Phone, Activity,
  ClipboardList, TrendingUp, Filter, Eye, Star, PenLine,
  Printer, PlayCircle, History as HistoryIcon, Settings, UserPlus,
  Trash2, Pencil, Lock, Mail, ShieldCheck, Save, Bird, MessageCircle, LogOut
} from "lucide-react";
import { fmtDate } from "./shared";
import { EmptyState } from "./EmptyState";
import { Avatar } from "./Avatar";
import { HealthDot } from "./HealthDot";
import { AttendanceLogTab } from "./AttendanceLogTab";


/* ---------------------------------------------------------------
   الحضور والغياب
--------------------------------------------------------------- */
/* ---------------------------------------------------------------
   الحضور والغياب — تسجيل حسب الحصة + سجلّ قابل للفلترة والطباعة
--------------------------------------------------------------- */
export function AttendanceView({
  canFilterTeachers = false,
  canRegister = false,
  attClass,
  setAttClass,
  attPeriod,
  setAttPeriod,
  periods,
  studentsByClass,
  todaysAttendance,
  saveAttendanceBatch,
  selectedDate,
  classes,
  users,
  fetchAttendanceLog,
}) {
  const [tab, setTab] = useState(canRegister ? "take" : "log"); // take | log
  const list = studentsByClass[attClass] || [];
  const statuses = ["حاضر", "متأخر", "غائب"];
  const statusColor = { "حاضر": "#2F9E6E", "متأخر": "#D9A62E", "غائب": "#C7433F" };

  // مسودة محلية للتعديلات قبل الحفظ الفعلي
  const [draft, setDraft] = useState({});
  const [saving, setSaving] = useState(false);

  // إعادة تهيئة المسودة عند تغيير الصف/الحصة/التاريخ
  useEffect(() => {
    setDraft({});
  }, [attClass, attPeriod, selectedDate]);

  const getStatus = (studentId) => draft[studentId] ?? todaysAttendance[studentId]?.status ?? null;
  const getTime = (studentId) => todaysAttendance[studentId]?.time;

  const setDraftStatus = (studentId, status) => {
    setDraft((prev) => ({ ...prev, [studentId]: status }));
  };

  const setAllDraftStatuses = (status) => {
    if (!canRegister || !attPeriod || saving || list.length === 0) return;
    setDraft(Object.fromEntries(list.map((student) => [student.id, status])));
  };

  const changedCount = Object.keys(draft).length;

  const handleSave = async () => {
    if (!canRegister || !attPeriod) return;
    setSaving(true);
    const ok = await saveAttendanceBatch(attPeriod, draft);
    setSaving(false);
    if (ok) setDraft({});
  };

  return (
    <div className="view-stack">
      <div className="card">
        <div className="settings-tabs">
          {canRegister && <button className={`settings-tab ${tab === "take" ? "settings-tab-active" : ""}`} onClick={() => setTab("take")}>
            <UserCheck size={15} /> تسجيل الحضور
          </button>}
          <button className={`settings-tab ${tab === "log" ? "settings-tab-active" : ""}`} onClick={() => setTab("log")}>
            <ClipboardList size={15} /> سجلّ الحضور
          </button>
        </div>
      </div>

      {canRegister && tab === "take" && (
        <>
          <div className="card">
            <div className="field-row">
              <div style={{ flex: 1 }}>
                <div className="field-label" style={{ marginTop: 0 }}>الحصة</div>
                <select className="select-input" value={attPeriod} onChange={(e) => setAttPeriod(e.target.value)}>
                  <option value="">-- اختر الحصة --</option>
                  {periods.map((p) => (
                    <option key={p.id} value={p.name}>{p.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="class-tabs">
            {Object.keys(studentsByClass).map((c) => (
              <button
                key={c}
                className={`class-tab ${attClass === c ? "class-tab-active" : ""}`}
                onClick={() => setAttClass(c)}
              >
                {c.includes("||")
                  ? `الصف ${c.split("||")[0]} / شعبة ${c.split("||")[1]}`
                  : `الصف ${c}`}
              </button>
            ))}
          </div>

          <div className="card">
            <div className="card-head">
              <h3><UserCheck size={17} /> تحضير صف {attClass} — {attPeriod || "اختر الحصة أولاً"} — {fmtDate(selectedDate)}</h3>
            </div>

            {!attPeriod ? (
              <EmptyState text="يرجى اختيار الحصة أولاً قبل بدء التحضير" />
            ) : (
              <>
                <div role="group" aria-label="تحديد حالة جميع طلاب الصف" style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
                  {["حاضر", "غائب", "متأخر"].map((status) => (
                    <button
                      key={status}
                      type="button"
                      className="chip-btn-outline"
                      style={{ color: statusColor[status], borderColor: statusColor[status] }}
                      disabled={saving || list.length === 0}
                      onClick={() => setAllDraftStatuses(status)}
                    >
                      {status} للكل
                    </button>
                  ))}
                </div>
                <p style={{ margin: "0 0 12px", fontSize: 12 }}>تُطبّق على طلاب الصف المعروض للحصة المحددة. يمكنك تعديل حالة أي طالب قبل الحفظ.</p>
                <div className="att-table">
                  {list.map((s) => {
                    const status = getStatus(s.id);
                    const time = getTime(s.id);
                    const isDraft = draft[s.id] !== undefined;
                    return (
                      <div key={s.id} className="att-row">
                        <Avatar name={s.name} />
                        <div className="att-info">
                          <div className="att-name">{s.name} <HealthDot tag={s.health} /></div>
                          <div className="att-sub">شعبة {s.section}</div>
                        </div>
                        <div className="att-actions">
                          {statuses.map((st) => (
                            <button
                              key={st}
                              disabled={saving}
                              className={`status-btn ${status === st ? "status-btn-active" : ""}`}
                              style={status === st ? { background: statusColor[st], borderColor: statusColor[st] } : {}}
                              onClick={() => setDraftStatus(s.id, st)}
                            >
                              {st}
                            </button>
                          ))}
                          {isDraft && <span className="unsaved-dot" title="لم يُحفظ بعد" />}
                          {!isDraft && time && <span className="att-time">{time}</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <button className="submit-btn" disabled={changedCount === 0 || saving} onClick={handleSave}>
                  <Save size={16} /> {saving ? "جارٍ الحفظ..." : `حفظ الحضور والغياب${changedCount ? ` (${changedCount} تغييراً)` : ""}`}
                </button>
              </>
            )}
          </div>
        </>
      )}

      {(!canRegister || tab === "log") && (
        <AttendanceLogTab
          canFilterTeachers={canFilterTeachers}
          selectedDate={selectedDate}
          classes={classes}
          users={users}
          fetchAttendanceLog={fetchAttendanceLog}
        />
      )}
    </div>
  );
}
