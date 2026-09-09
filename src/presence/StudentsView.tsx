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
import { Avatar } from "./Avatar";
import { HealthDot } from "./HealthDot";
import { StudentModal } from "./StudentModal";


/* ---------------------------------------------------------------
   قائمة الطلاب
--------------------------------------------------------------- */
export function StudentsView({
  studentsByClass,
  addStudent,
  bulkImportStudents,
  updateStudent,
  deleteStudent,
  deleteStudentsByClass,
  classes,
  sections,
  addClass,
  deleteClass,
  addSection,
  deleteSection,
  currentUser,
}) {
  const [modal, setModal] = useState(null);
  const [newClassName, setNewClassName] = useState("");
  const [newSectionName, setNewSectionName] = useState("");
  const [importing, setImporting] = useState(false);
  const [importReport, setImportReport] = useState(null);
  const [excelPreview, setExcelPreview] = useState([]);
  const [pendingExcelRows, setPendingExcelRows] = useState([]);
  const [excelFileName, setExcelFileName] = useState("");

  const pickExcelValue = (row, aliases) => {
    for (const key of aliases) {
      if (
        Object.prototype.hasOwnProperty.call(row, key) &&
        row[key] !== undefined &&
        row[key] !== null &&
        String(row[key]).trim() !== ""
      ) {
        return row[key];
      }
    }
    return "";
  };

  const parseSchoolExcel = async (file) => {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: "array" });
    const firstSheetName = workbook.SheetNames[0];

    if (!firstSheetName) throw new Error("ملف Excel لا يحتوي على ورقة عمل.");

    const sheet = workbook.Sheets[firstSheetName];
    const rawRows = XLSX.utils.sheet_to_json(sheet, {
      defval: "",
      raw: true,
    });

    if (!rawRows.length) throw new Error("ملف Excel فارغ.");

    return rawRows.map((r) => ({
      studentNumber: pickExcelValue(r, ["الرقم", "رقم الطالب", "student_number"]),
      name: pickExcelValue(r, ["الاسم", "اسم الطالب", "name"]),
      nationality: pickExcelValue(r, ["الجنسية", "nationality"]),
      className: pickExcelValue(r, ["الصف", "class", "class_name"]),
      sectionName: pickExcelValue(r, ["الشعبة الصفية", "الشعبة", "section", "section_name"]),
      phone: pickExcelValue(r, ["الهاتف", "رقم الهاتف", "phone", "guardian_phone"]),
    }));
  };

  const handleSchoolExcel = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setImportReport(null);
    setExcelPreview([]);
    setPendingExcelRows([]);
    setExcelFileName(file.name);

    try {
      const rows = await parseSchoolExcel(file);
      const preview = rows
        .filter((r) => String(r.name || "").trim())
        .slice(0, 8);

      setPendingExcelRows(rows);
      setExcelPreview(preview);

      const validCount = rows.filter(
        (r) =>
          String(r.name || "").trim() &&
          String(r.className || "").trim() &&
          String(r.sectionName || "").trim()
      ).length;

      const invalidCount = rows.length - validCount;

      setImportReport({
        type: "info",
        text:
          `تمت قراءة ${rows.length} صفاً من الملف. ` +
          `${validCount} طالباً جاهزون للاستيراد` +
          (invalidCount ? `، و${invalidCount} صفاً ناقص البيانات سيتم تجاهله.` : "."),
      });
    } catch (error) {
      console.error("Excel read error:", error);
      setImportReport({
        type: "error",
        text: error?.message || "تعذّر قراءة ملف Excel.",
      });
    }
  };

  const confirmSchoolExcelImport = async () => {
    if (!pendingExcelRows.length) return;

    setImporting(true);
    setImportReport(null);

    try {
      const result = await bulkImportStudents(pendingExcelRows);

      if (!result?.success) {
        setImportReport({
          type: "error",
          text: result?.message || "تعذّر استيراد الطلاب.",
        });
        return;
      }

      const invalidCount = result.invalidRows?.length || 0;

      setImportReport({
        type: "success",
        text:
          `تمت إضافة ${result.inserted || 0} طالباً بنجاح.` +
          (result.skippedDuplicates
            ? ` تم تجاهل ${result.skippedDuplicates} طالباً مكرراً.`
            : "") +
          (invalidCount
            ? ` تم تجاهل ${invalidCount} صفاً ناقص البيانات.`
            : "") +
          ` تم التعرف على ${result.classesFound || 0} صفوف و${result.sectionsFound || 0} شعب.`,
      });

      setPendingExcelRows([]);
      setExcelPreview([]);
      setExcelFileName("");
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="view-stack">
      <section className="card">
        <div className="card-head">
          <h3><Users size={17} /> إدارة الطلاب</h3>
          <button className="chip-btn" onClick={() => setModal("new")}>
            <UserPlus size={15} /> إضافة طالب
          </button>
        </div>
      </section>

      <section className="card">
        <div className="card-head">
          <h3><FileText size={17} /> استيراد قائمة الطلاب من Excel</h3>
        </div>

        <div className="att-sub" style={{ lineHeight: 1.9, marginBottom: 12 }}>
          يقبل Presence ملف المدرسة مباشرة بالأعمدة:
          <b> الرقم، الاسم، الجنسية، الصف، الشعبة الصفية، الهاتف</b>.
          يتم إنشاء الصفوف والشعب غير الموجودة تلقائياً، ثم توزيع الطلاب عليها.
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          <label className="chip-btn" style={{ cursor: importing ? "not-allowed" : "pointer" }}>
            <FileText size={15} />
            اختيار ملف Excel
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleSchoolExcel}
              disabled={importing}
              style={{ display: "none" }}
            />
          </label>

          {excelFileName && (
            <span className="att-sub" style={{ margin: 0 }}>
              الملف: <b>{excelFileName}</b>
            </span>
          )}

          {pendingExcelRows.length > 0 && (
            <button
              type="button"
              className="chip-btn"
              disabled={importing}
              onClick={confirmSchoolExcelImport}
            >
              <Save size={15} />
              {importing ? "جارٍ استيراد الطلاب..." : "تأكيد الاستيراد"}
            </button>
          )}
        </div>

        {excelPreview.length > 0 && (
          <div style={{ overflowX: "auto", marginTop: 14 }}>
            <table className="perm-table">
              <thead>
                <tr>
                  <th>الرقم</th>
                  <th>الاسم</th>
                  <th>الجنسية</th>
                  <th>الصف</th>
                  <th>الشعبة الصفية</th>
                  <th>الهاتف</th>
                </tr>
              </thead>
              <tbody>
                {excelPreview.map((r, i) => (
                  <tr key={`${r.studentNumber}-${i}`}>
                    <td>{r.studentNumber || "—"}</td>
                    <td>{r.name || "—"}</td>
                    <td>{r.nationality || "—"}</td>
                    <td>{r.className || "—"}</td>
                    <td>{r.sectionName || "—"}</td>
                    <td>{r.phone || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {importReport && (
          <div
            style={{
              marginTop: 12,
              padding: "10px 12px",
              borderRadius: 9,
              fontSize: 12.5,
              fontWeight: 700,
              lineHeight: 1.7,
              background:
                importReport.type === "success"
                  ? "#E7F5EF"
                  : importReport.type === "error"
                  ? "#F9E4E3"
                  : "#E9EEFB",
              color:
                importReport.type === "success"
                  ? "#2F9E6E"
                  : importReport.type === "error"
                  ? "#C7433F"
                  : "#1E2A4A",
            }}
          >
            {importReport.text}
          </div>
        )}
      </section>

      <section className="card">
        <div className="card-head"><h3><GraduationCap size={17} /> الصفوف والشعب</h3></div>
        <div className="two-col">
          <div>
            <div className="field-label">الصفوف ({classes.length})</div>
            <ul className="tag-manage-list">
              {classes.map((c) => (
                <li key={c}>
                  <span>{c}</span>
                  <button className="icon-btn-sm" title="حذف الصف" onClick={() => deleteClass(c)}>
                    <Trash2 size={12} />
                  </button>
                </li>
              ))}
            </ul>
            <div className="add-role-row">
              <input
                className="text-input"
                placeholder="اسم صف جديد"
                value={newClassName}
                onChange={(e) => setNewClassName(e.target.value)}
              />
              <button
                className="chip-btn"
                disabled={!newClassName.trim()}
                onClick={() => {
                  addClass(newClassName.trim());
                  setNewClassName("");
                }}
              >
                <Plus size={15} /> إضافة
              </button>
            </div>
          </div>

          <div>
            <div className="field-label">الشعب ({sections.length})</div>
            <ul className="tag-manage-list">
              {sections.map((s) => (
                <li key={s}>
                  <span>{s}</span>
                  <button className="icon-btn-sm" title="حذف الشعبة" onClick={() => deleteSection(s)}>
                    <Trash2 size={12} />
                  </button>
                </li>
              ))}
            </ul>
            <div className="add-role-row">
              <input
                className="text-input"
                placeholder="اسم شعبة جديدة"
                value={newSectionName}
                onChange={(e) => setNewSectionName(e.target.value)}
              />
              <button
                className="chip-btn"
                disabled={!newSectionName.trim()}
                onClick={() => {
                  addSection(newSectionName.trim());
                  setNewSectionName("");
                }}
              >
                <Plus size={15} /> إضافة
              </button>
            </div>
          </div>
        </div>
      </section>

      {(Object.entries(studentsByClass) as [string, any[]][]).map(([cls, list]) => (
        <section className="card" key={cls}>
          <div className="card-head">
            <h3><GraduationCap size={17} /> الصف {cls} ({list.length} طالباً)</h3>

            {currentUser?.role === "مدير النظام" && (
              <button
                type="button"
                className="chip-btn"
                disabled={list.length === 0}
                onClick={() => deleteStudentsByClass(cls)}
                style={{
                  background: "#C7433F",
                  opacity: list.length === 0 ? 0.55 : 1,
                }}
                title={`حذف جميع طلاب الصف ${cls}`}
              >
                <Trash2 size={15} />
                حذف طلاب الصف
              </button>
            )}
          </div>
          <div className="student-grid">
            {list.map((s) => (
              <div className="student-card" key={s.id}>
                <div className="student-card-actions">
                  <button className="icon-btn-sm" title="تعديل" onClick={() => setModal(s)}>
                    <Pencil size={13} />
                  </button>
                  <button className="icon-btn-sm" title="حذف" onClick={() => deleteStudent(s.id)}>
                    <Trash2 size={13} />
                  </button>
                </div>
                <Avatar name={s.name} />
                <div className="att-name">{s.name} <HealthDot tag={s.health} /></div>
                <div className="att-sub">
                  {s.studentNumber ? `رقم: ${s.studentNumber} · ` : ""}
                  شعبة {s.section}
                  {s.nationality ? ` · ${s.nationality}` : ""}
                </div>
                <div className="student-guardian"><Phone size={12} /> {s.guardianPhone || "—"}</div>
              </div>
            ))}
          </div>
        </section>
      ))}

      {modal && (
        <StudentModal
          student={modal === "new" ? null : modal}
          classes={classes}
          sections={sections}
          onClose={() => setModal(null)}
          onSave={(data) => {
            if (modal === "new") addStudent(data);
            else updateStudent(modal.id, data);
            setModal(null);
          }}
        />
      )}
    </div>
  );
}
