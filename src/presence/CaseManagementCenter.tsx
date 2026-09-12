import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Users, UserCheck, UserX, Clock, AlertTriangle, BarChart3, Bell,
  Search, Plus, X, Check, ChevronLeft, ChevronRight, Home, FileText,
  Send, ShieldAlert, GraduationCap, CalendarDays, Phone, Activity,
  ClipboardList, TrendingUp, Filter, Eye, Star, PenLine,
  Printer, PlayCircle, History as HistoryIcon, Settings, UserPlus,
  Trash2, Pencil, Lock, Mail, ShieldCheck, Save, Bird, MessageCircle, LogOut
} from "lucide-react";
import { todayISO } from "./shared";
import { EmptyState } from "./EmptyState";
import { StatCard } from "./StatCard";
import { Avatar } from "./Avatar";


export function CaseManagementCenter({
  students,
  caseFollowups,
  guardianContacts,
  setFocusedStudentId,
  setView,
  completeCaseFollowup,
  currentUser,
}) {
  const [search, setSearch] = useState("");
  const [filterClass, setFilterClass] = useState("الكل");
  const [filterStatus, setFilterStatus] = useState("الكل");
  const [filterResponsible, setFilterResponsible] = useState("الكل");
  const [filterTiming, setFilterTiming] = useState("الكل");

  const today = todayISO();
  const monthPrefix = today.slice(0, 7);

  const classes = useMemo(
    () => [...new Set<string>((students || []).map((s) => s.class).filter(Boolean))].sort(),
    [students]
  );

  const responsibleNames = useMemo(
    () =>
      [...new Set<string>(
        (caseFollowups || [])
          .map((f) => f.createdByName)
          .filter((x) => x && x !== "—")
      )].sort(),
    [caseFollowups]
  );

  const latestByStudent = useMemo(() => {
    const map = {};
    [...(caseFollowups || [])]
      .sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")))
      .forEach((f) => {
        if (!map[f.studentId]) map[f.studentId] = f;
      });
    return map;
  }, [caseFollowups]);

  const contactByStudent = useMemo(() => {
    const map = {};
    [...(guardianContacts || [])]
      .sort((a, b) => String(b.contactAt || "").localeCompare(String(a.contactAt || "")))
      .forEach((c) => {
        if (!map[c.studentId]) map[c.studentId] = c;
      });
    return map;
  }, [guardianContacts]);

  const rows = useMemo(() => {
    return (caseFollowups || [])
      .map((f) => {
        const st = students.find((s) => s.id === f.studentId);
        const latestContact = contactByStudent[f.studentId];
        const overdue =
          !!f.nextActionDate &&
          f.nextActionDate < today &&
          f.status !== "مغلقة";

        return {
          ...f,
          student: st,
          latestContact,
          overdue,
        };
      })
      .filter((r) => {
        const q = search.trim();
        const matchesSearch =
          !q ||
          String(r.student?.name || "").includes(q) ||
          String(r.student?.studentNumber || "").includes(q) ||
          String(r.followupType || "").includes(q);

        return (
          matchesSearch &&
          (filterClass === "الكل" || r.student?.class === filterClass) &&
          (filterStatus === "الكل" || r.status === filterStatus) &&
          (filterResponsible === "الكل" ||
            r.createdByName === filterResponsible) &&
          (filterTiming === "الكل" ||
            (filterTiming === "متأخرة" && r.overdue) ||
            (filterTiming === "قادمة" &&
              r.nextActionDate &&
              r.nextActionDate >= today &&
              r.status !== "مغلقة"))
        );
      })
      .sort((a, b) => {
        if (a.overdue !== b.overdue) return a.overdue ? -1 : 1;
        return String(b.createdAt || "").localeCompare(String(a.createdAt || ""));
      });
  }, [
    caseFollowups,
    students,
    contactByStudent,
    search,
    filterClass,
    filterStatus,
    filterResponsible,
    filterTiming,
    today,
  ]);

  const openCases = (caseFollowups || []).filter((f) => f.status !== "مغلقة");
  const overdueCases = openCases.filter(
    (f) => f.nextActionDate && f.nextActionDate < today
  );
  const closedThisMonth = (caseFollowups || []).filter(
    (f) =>
      f.status === "مغلقة" &&
      String(f.createdAt || "").slice(0, 7) === monthPrefix
  ).length;
  const closureRate = caseFollowups?.length
    ? Math.round(
        ((caseFollowups || []).filter((f) => f.status === "مغلقة").length /
          caseFollowups.length) *
          100
      )
    : 0;

  const statuses = [
    "جديدة",
    "قيد المتابعة",
    "تم التواصل مع ولي الأمر",
    "محولة للأخصائي الاجتماعي",
    "محولة لمنسق شؤون الطلاب",
    "مغلقة",
  ];

  const openStudent = (studentId) => {
    setFocusedStudentId?.(studentId);
    setView("student-profile");
  };

  if (currentUser?.role !== "مدير النظام") {
    return <EmptyState text="هذه الصفحة متاحة لمدير النظام فقط" />;
  }

  return (
    <div className="view-stack">
      <section className="card">
        <div className="card-head">
          <h3><ClipboardList size={18} /> مركز الحالات والمتابعات</h3>
          <span className="att-sub">
            متابعة الحالات المفتوحة والمتأخرة والمغلقة من مكان واحد
          </span>
        </div>

        <div className="stat-grid">
          <StatCard
            icon={ClipboardList}
            label="الحالات المفتوحة"
            value={openCases.length}
            tone="#E07B39"
          />
          <StatCard
            icon={AlertTriangle}
            label="الحالات المتأخرة"
            value={overdueCases.length}
            tone="#C7433F"
          />
          <StatCard
            icon={Check}
            label="المغلقة هذا الشهر"
            value={closedThisMonth}
            tone="#2F9E6E"
          />
          <StatCard
            icon={Activity}
            label="نسبة إغلاق الحالات"
            value={`${closureRate}%`}
            tone="#5B8DEF"
          />
        </div>
      </section>

      <section className="card">
        <div className="card-head">
          <h3><Filter size={17} /> البحث والفلترة</h3>
          <span className="count-chip" style={{ background: "#1E2A4A" }}>
            {rows.length} سجل
          </span>
        </div>

        <div className="case-filter-grid">
          <div>
            <div className="field-label">بحث</div>
            <input
              className="text-input"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="اسم الطالب، الرقم، نوع المتابعة..."
            />
          </div>

          <div>
            <div className="field-label">الصف</div>
            <select
              className="select-input"
              value={filterClass}
              onChange={(e) => setFilterClass(e.target.value)}
            >
              <option value="الكل">كل الصفوف</option>
              {classes.map((c) => (
                <option key={c} value={c}>الصف {c}</option>
              ))}
            </select>
          </div>

          <div>
            <div className="field-label">الحالة</div>
            <select
              className="select-input"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="الكل">كل الحالات</option>
              {statuses.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div>
            <div className="field-label">المسؤول</div>
            <select
              className="select-input"
              value={filterResponsible}
              onChange={(e) => setFilterResponsible(e.target.value)}
            >
              <option value="الكل">كل المسؤولين</option>
              {responsibleNames.map((x) => (
                <option key={x} value={x}>{x}</option>
              ))}
            </select>
          </div>

          <div>
            <div className="field-label">الاستحقاق</div>
            <select
              className="select-input"
              value={filterTiming}
              onChange={(e) => setFilterTiming(e.target.value)}
            >
              <option value="الكل">الكل</option>
              <option value="متأخرة">متأخرة</option>
              <option value="قادمة">قادمة</option>
            </select>
          </div>
        </div>

        <div className="analytics-preset-row">
          <button
            className="chip-btn-outline"
            onClick={() => {
              setSearch("");
              setFilterClass("الكل");
              setFilterStatus("الكل");
              setFilterResponsible("الكل");
              setFilterTiming("الكل");
            }}
          >
            مسح الفلاتر
          </button>
          <button
            className="chip-btn-outline"
            onClick={() => setFilterTiming("متأخرة")}
          >
            عرض المتأخرة فقط
          </button>
          <button
            className="chip-btn-outline"
            onClick={() => setFilterStatus("قيد المتابعة")}
          >
            قيد المتابعة
          </button>
          <button
            className="chip-btn-outline"
            onClick={() => setFilterStatus("مغلقة")}
          >
            المغلقة
          </button>
        </div>
      </section>

      <section className="card">
        <div className="card-head">
          <h3><HistoryIcon size={17} /> سجل الحالات</h3>
        </div>

        {rows.length === 0 ? (
          <EmptyState text="لا توجد حالات مطابقة للفلاتر الحالية" />
        ) : (
          <div className="case-center-list">
            {rows.map((r) => (
              <div
                key={r.id}
                className={`case-center-card ${
                  r.overdue ? "case-center-card-overdue" : ""
                }`}
              >
                <div className="case-center-head">
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <Avatar
                      name={r.student?.name || "؟"}
                      tone={r.overdue ? "#C7433F" : "#1E2A4A"}
                    />
                    <div>
                      <div className="case-center-student">
                        {r.student?.name || "طالب غير معروف"}
                      </div>
                      <div className="att-sub">
                        الصف {r.student?.class || "—"}
                        {r.student?.section ? ` / ${r.student.section}` : ""}
                        {r.student?.studentNumber
                          ? ` · رقم ${r.student.studentNumber}`
                          : ""}
                      </div>
                    </div>
                  </div>

                  <div className="case-center-badges">
                    <span
                      className="count-chip"
                      style={{
                        background:
                          r.status === "مغلقة"
                            ? "#2F9E6E"
                            : r.overdue
                            ? "#C7433F"
                            : "#5B8DEF",
                      }}
                    >
                      {r.status}
                    </span>
                    {r.overdue && (
                      <span className="count-chip" style={{ background: "#C7433F" }}>
                        متأخرة
                      </span>
                    )}
                  </div>
                </div>

                <div className="case-center-grid">
                  <div>
                    <span>نوع المتابعة</span>
                    <b>{r.followupType || "—"}</b>
                  </div>
                  <div>
                    <span>المسؤول</span>
                    <b>{r.createdByName || "—"}</b>
                  </div>
                  <div>
                    <span>الإجراء التالي</span>
                    <b>{r.nextAction || "—"}</b>
                  </div>
                  <div>
                    <span>تاريخ الاستحقاق</span>
                    <b>{r.nextActionDate || "غير محدد"}</b>
                  </div>
                </div>

                {r.note && (
                  <div className="case-center-note">
                    <b>ملاحظة المتابعة:</b> {r.note}
                  </div>
                )}

                {r.latestContact && (
                  <div className="case-center-contact">
                    <Phone size={14} />
                    <span>
                      آخر تواصل مع ولي الأمر: {r.latestContact.channel || "—"} —{" "}
                      {r.latestContact.outcome || "—"}
                      {r.latestContact.contactAt
                        ? ` · ${new Date(r.latestContact.contactAt).toLocaleDateString("ar-QA")}`
                        : ""}
                    </span>
                  </div>
                )}

                <div className="case-center-actions">
                  <button
                    className="chip-btn"
                    onClick={() => openStudent(r.studentId)}
                  >
                    <Eye size={14} /> فتح ملف الطالب
                  </button>

                  {r.status !== "مغلقة" && (
                    <button
                      className="chip-btn"
                      style={{ background: "#2F9E6E" }}
                      onClick={() => completeCaseFollowup?.(r.id)}
                    >
                      <Check size={14} /> إغلاق الحالة
                    </button>
                  )}

                  <button
                    className="chip-btn-outline"
                    onClick={() => openStudent(r.studentId)}
                  >
                    <HistoryIcon size={14} /> إضافة متابعة
                  </button>

                  <button
                    className="chip-btn-outline"
                    onClick={() => openStudent(r.studentId)}
                  >
                    <Phone size={14} /> توثيق تواصل
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
