import React, { useState, useEffect, useMemo, useCallback } from "react";
import * as XLSX from "xlsx";
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


export function DataManagementCenter({
  students,
  attendance,
  violations,
  evaluations,
  periodicEvaluations,
  caseFollowups,
  guardianContacts,
  hudhudMessages,
  pledges,
  users,
  teacherClasses,
  periods,
  currentUser,
}) {
  const [filterClass, setFilterClass] = useState("الكل");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [selectedSets, setSelectedSets] = useState({
    students: true,
    attendance: true,
    violations: true,
    evaluations: true,
    periodicEvaluations: true,
    followups: true,
    contacts: true,
    hudhud: true,
    pledges: true,
    users: true,
    teacherClasses: true,
    periods: true,
  });

  const classes = useMemo(
    () => [...new Set((students || []).map((s) => s.class).filter(Boolean))].sort(),
    [students]
  );

  const inRange = (date) => {
    const d = String(date || "").slice(0, 10);
    if (!d) return true;
    return (!fromDate || d >= fromDate) && (!toDate || d <= toDate);
  };

  const allowedStudentIds = useMemo(
    () =>
      new Set(
        (students || [])
          .filter((s) => filterClass === "الكل" || s.class === filterClass)
          .map((s) => s.id)
      ),
    [students, filterClass]
  );

  const studentName = (id) =>
    students.find((s) => s.id === id)?.name || "—";

  const studentClass = (id) =>
    students.find((s) => s.id === id)?.class || "—";

  const flattenAttendance = () => {
    const rows = [];
    Object.entries(attendance || {}).forEach(([date, periodMap]) => {
      if (!inRange(date)) return;
      Object.entries(periodMap || {}).forEach(([period, studentMap]) => {
        Object.entries(studentMap || {}).forEach(([studentId, rec]) => {
          if (!allowedStudentIds.has(studentId)) return;
          rows.push({
            التاريخ: date,
            الحصة: period,
            "رقم الطالب": students.find((s) => s.id === studentId)?.studentNumber || "",
            الطالب: studentName(studentId),
            الصف: studentClass(studentId),
            الحالة: rec?.status || "",
            الوقت: rec?.time || "",
          });
        });
      });
    });
    return rows;
  };

  const datasets = useMemo(() => {
    const studentRows = (students || [])
      .filter((s) => allowedStudentIds.has(s.id))
      .map((s) => ({
        الرقم: s.studentNumber || "",
        الاسم: s.name,
        الجنسية: s.nationality || "",
        الصف: s.class,
        الشعبة: s.section,
        "ولي الأمر": s.guardianName || "",
        الهاتف: s.guardianPhone || "",
        "ملاحظات صحية": s.health || "",
      }));

    return {
      students: {
        label: "الطلاب",
        sheet: "الطلاب",
        rows: studentRows,
      },
      attendance: {
        label: "الحضور والغياب",
        sheet: "الحضور",
        rows: flattenAttendance(),
      },
      violations: {
        label: "المخالفات",
        sheet: "المخالفات",
        rows: (violations || [])
          .filter((v) => allowedStudentIds.has(v.studentId) && inRange(v.date))
          .map((v) => ({
            التاريخ: v.date,
            الطالب: studentName(v.studentId),
            الصف: studentClass(v.studentId),
            الدرجة: v.degree,
            المخالفة: v.item || "",
            الحصة: v.period || "",
            الوصف: v.description || "",
            الإجراء: v.action || "",
            الحالة: v.followupStatus || "",
          })),
      },
      evaluations: {
        label: "تقييمات النجوم",
        sheet: "تقييمات النجوم",
        rows: (evaluations || [])
          .filter((e) => allowedStudentIds.has(e.studentId) && inRange(e.date))
          .map((e) => ({
            التاريخ: e.date,
            الطالب: studentName(e.studentId),
            الصف: studentClass(e.studentId),
            المجموع: e.total,
            "من": e.max,
            النسبة: e.percent,
            التقدير: e.rating || "",
            التفاصيل: JSON.stringify(e.scores || {}),
          })),
      },
      periodicEvaluations: {
        label: "التقييم الدوري",
        sheet: "التقييم الدوري",
        rows: (periodicEvaluations || [])
          .filter((e) => allowedStudentIds.has(e.studentId) && inRange(e.date))
          .map((e) => ({
            التاريخ: e.date,
            الطالب: studentName(e.studentId),
            الصف: studentClass(e.studentId),
            المادة: e.subject || "",
            التقييم: e.overallRating || "",
            ملاحظات: e.notes || "",
          })),
      },
      followups: {
        label: "متابعة الحالات",
        sheet: "المتابعات",
        rows: (caseFollowups || [])
          .filter((f) => allowedStudentIds.has(f.studentId) && inRange(f.createdAt))
          .map((f) => ({
            التاريخ: String(f.createdAt || "").slice(0, 10),
            الطالب: studentName(f.studentId),
            الصف: studentClass(f.studentId),
            النوع: f.followupType || "",
            الحالة: f.status || "",
            الملاحظة: f.note || "",
            "الإجراء التالي": f.nextAction || "",
            "تاريخ الاستحقاق": f.nextActionDate || "",
            المسؤول: f.createdByName || "",
          })),
      },
      contacts: {
        label: "التواصل مع أولياء الأمور",
        sheet: "تواصل ولي الأمر",
        rows: (guardianContacts || [])
          .filter((c) => allowedStudentIds.has(c.studentId) && inRange(c.contactAt))
          .map((c) => ({
            التاريخ: String(c.contactAt || "").slice(0, 10),
            الطالب: studentName(c.studentId),
            الصف: studentClass(c.studentId),
            القناة: c.channel || "",
            النتيجة: c.outcome || "",
            ملاحظات: c.note || "",
            "تم بواسطة": c.createdByName || "",
          })),
      },
      hudhud: {
        label: "رسائل هدهد",
        sheet: "رسائل هدهد",
        rows: (hudhudMessages || [])
          .filter((m) => allowedStudentIds.has(m.studentId) && inRange(m.date))
          .map((m) => ({
            التاريخ: m.date,
            الطالب: studentName(m.studentId),
            الصف: studentClass(m.studentId),
            الموضوع: m.subject || "",
            الرسالة: m.body || "",
            الحالة: m.status || "",
          })),
      },
      pledges: {
        label: "التعهدات",
        sheet: "التعهدات",
        rows: (pledges || [])
          .filter((p) => allowedStudentIds.has(p.studentId) && inRange(p.date))
          .map((p) => ({
            التاريخ: p.date,
            الطالب: studentName(p.studentId),
            الصف: studentClass(p.studentId),
            النوع: p.type || "",
            المرجع: p.violationRef || "",
            النص: p.text || "",
          })),
      },
      users: {
        label: "المستخدمون",
        sheet: "المستخدمون",
        rows: (users || []).map((u) => ({
          الاسم: u.name || "",
          البريد: u.email || "",
          الهاتف: u.phone || "",
          الدور: u.role || "",
          نشط: u.active ? "نعم" : "لا",
        })),
      },
      teacherClasses: {
        label: "صفوف المعلمين",
        sheet: "صفوف المعلمين",
        rows: (teacherClasses || []).map((x) => ({
          "معرف المعلم": x.teacherId || x.teacher_id || "",
          الصف: x.className || x.class_name || "",
          الشعبة: x.sectionName || x.section_name || "",
        })),
      },
      periods: {
        label: "الحصص",
        sheet: "الحصص",
        rows: (periods || []).map((p) => ({
          الحصة: p.name,
          الترتيب: p.sortOrder ?? p.sort_order ?? "",
          نشطة: p.active ? "نعم" : "لا",
        })),
      },
    };
  }, [
    students, attendance, violations, evaluations, periodicEvaluations,
    caseFollowups, guardianContacts, hudhudMessages, pledges, users,
    teacherClasses, periods, allowedStudentIds, fromDate, toDate
  ]);

  const selectedKeys = Object.keys(selectedSets).filter((k) => selectedSets[k]);

  const makeWorkbook = () => {
    const wb = XLSX.utils.book_new();
    selectedKeys.forEach((key) => {
      const ds = datasets[key];
      const ws = XLSX.utils.json_to_sheet(ds.rows.length ? ds.rows : [{ ملاحظة: "لا توجد بيانات ضمن الفلاتر المحددة" }]);
      ws["!cols"] = Array.from({ length: 12 }, () => ({ wch: 22 }));
      XLSX.utils.book_append_sheet(wb, ws, ds.sheet.slice(0, 31));
    });
    return wb;
  };

  const exportExcel = () => {
    if (!selectedKeys.length) return;
    const wb = makeWorkbook();
    XLSX.writeFile(
      wb,
      `Presence_Backup_${filterClass === "الكل" ? "School" : filterClass}_${todayISO()}.xlsx`
    );
  };

  const exportJson = () => {
    if (!selectedKeys.length) return;
    const payload = {
      generatedAt: new Date().toISOString(),
      scope: {
        class: filterClass,
        fromDate: fromDate || null,
        toDate: toDate || null,
      },
      data: Object.fromEntries(
        selectedKeys.map((key) => [key, datasets[key].rows])
      ),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Presence_Backup_${todayISO()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportSingle = (key) => {
    const ds = datasets[key];
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(
      ds.rows.length ? ds.rows : [{ ملاحظة: "لا توجد بيانات ضمن الفلاتر المحددة" }]
    );
    ws["!cols"] = Array.from({ length: 12 }, () => ({ wch: 22 }));
    XLSX.utils.book_append_sheet(wb, ws, ds.sheet.slice(0, 31));
    XLSX.writeFile(wb, `Presence_${ds.sheet}_${todayISO()}.xlsx`);
  };

  if (currentUser?.role !== "مدير النظام") {
    return <EmptyState text="مركز إدارة البيانات متاح لمدير النظام فقط" />;
  }

  return (
    <div className="view-stack">
      <section className="card">
        <div className="card-head">
          <h3><Save size={18} /> مركز النسخ الاحتياطي وإدارة البيانات</h3>
          <span className="att-sub">
            تصدير نسخة إدارية منظمة من بيانات Presence دون تعديل البيانات الأصلية
          </span>
        </div>
        <div className="audit-note">
          <ShieldCheck size={16} />
          <span>
            التصدير للنسخ الاحتياطي فقط. لا توجد في هذه الصفحة أوامر حذف جماعي أو استعادة تلقائية، حمايةً لبيانات المدرسة.
          </span>
        </div>
      </section>

      <section className="card">
        <div className="card-head">
          <h3><Filter size={17} /> نطاق النسخة الاحتياطية</h3>
        </div>
        <div className="report-filter-grid">
          <div>
            <div className="field-label">الصف</div>
            <select className="select-input" value={filterClass} onChange={(e) => setFilterClass(e.target.value)}>
              <option value="الكل">كل المدرسة</option>
              {classes.map((c) => <option key={c} value={c}>الصف {c}</option>)}
            </select>
          </div>
          <div>
            <div className="field-label">من تاريخ</div>
            <input type="date" className="text-input" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
          </div>
          <div>
            <div className="field-label">إلى تاريخ</div>
            <input type="date" className="text-input" value={toDate} onChange={(e) => setToDate(e.target.value)} />
          </div>
        </div>
      </section>

      <section className="card">
        <div className="card-head">
          <h3><ClipboardList size={17} /> البيانات المراد تضمينها</h3>
          <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
            <button className="chip-btn-outline" onClick={() => setSelectedSets(Object.fromEntries(Object.keys(selectedSets).map((k) => [k, true])))}>تحديد الكل</button>
            <button className="chip-btn-outline" onClick={() => setSelectedSets(Object.fromEntries(Object.keys(selectedSets).map((k) => [k, false])))}>إلغاء الكل</button>
          </div>
        </div>

        <div className="backup-dataset-grid">
          {Object.entries(datasets).map(([key, ds]) => (
            <div className={`backup-dataset ${selectedSets[key] ? "backup-dataset-selected" : ""}`} key={key}>
              <label>
                <input
                  type="checkbox"
                  checked={!!selectedSets[key]}
                  onChange={(e) => setSelectedSets((prev) => ({ ...prev, [key]: e.target.checked }))}
                />
                <span>
                  <b>{ds.label}</b>
                  <small>{ds.rows.length} سجل</small>
                </span>
              </label>
              <button className="chip-btn-outline" onClick={() => exportSingle(key)}>
                <FileText size={13}/> Excel
              </button>
            </div>
          ))}
        </div>
      </section>

      <section className="card">
        <div className="card-head">
          <h3><Save size={17} /> إنشاء النسخة</h3>
        </div>
        <div className="backup-actions">
          <button className="chip-btn" onClick={exportExcel} disabled={!selectedKeys.length}>
            <Save size={15}/> نسخة Excel شاملة
          </button>
          <button className="chip-btn-outline" onClick={exportJson} disabled={!selectedKeys.length}>
            <FileText size={15}/> نسخة JSON احتياطية
          </button>
        </div>
        <div className="att-sub" style={{marginTop:10}}>
          سيتم إنشاء ملف Excel متعدد الأوراق، ورقة مستقلة لكل نوع بيانات تم اختياره.
        </div>
      </section>
    </div>
  );
}
