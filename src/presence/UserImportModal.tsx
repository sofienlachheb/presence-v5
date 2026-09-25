import React, { useRef, useState } from "react";
import * as XLSX from "xlsx";
import { userImportHeaders, validateUserImport } from "./userImport";
import { roleLabel } from "./roleLabels";
import "./user-modal.css";

export function UserImportModal({ users, roles, classes, sections, students, addUser, onClose }) {
  const [rows, setRows] = useState([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [reading, setReading] = useState(false);
  const running = useRef(false);
  const [started, setStarted] = useState(false);
  const ready = rows.filter((row) => row.errors.length === 0 && row.status === "pending");

  const downloadTemplate = () => {
    const book = XLSX.utils.book_new();
    const sheet = XLSX.utils.aoa_to_sheet([userImportHeaders]);
    sheet["!cols"] = userImportHeaders.map(() => ({ wch: 24 }));
    XLSX.utils.book_append_sheet(book, sheet, "المستخدمون");
    XLSX.utils.book_append_sheet(book, XLSX.utils.aoa_to_sheet([
      ["تعليمات"],
      ["الأعمدة الأربعة الأولى مطلوبة. كلمة المرور 6 أحرف على الأقل."],
      ["الأدوار المتاحة", roles.join("، ")],
      ["نشط", "نعم أو لا؛ الافتراضي نعم"],
      ["المعلم", "المادة والصفوف والشعب مطلوبة. الصيغة: صف/شعبة؛صف/شعبة"],
      ["الصفوف المتاحة", classes.join("، ")],
      ["الشعب المتاحة", sections.join("، ")],
      ["ولي الأمر", "معرفات الأبناء اختيارية، مفصولة بفاصلة. يمكن الربط لاحقًا من تعديل المستخدم."],
      ["الهاتف وكلمة المرور", "استخدم تنسيق نص للمحافظة على الأصفار الأولى."],
      ["الحد الأقصى", "200 مستخدم. اقرأ ورقة المستخدمين الأولى فقط."],
    ]), "تعليمات");
    XLSX.writeFile(book, "قالب-استيراد-المستخدمين.xlsx");
  };

  const readFile = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || running.current) return;
    setRows([]); setError(""); setStarted(false); setReading(true);
    try {
      if (!/\.xlsx?$/i.test(file.name)) throw new Error("اختر ملف Excel بصيغة xlsx أو xls");
      if (file.size > 5 * 1024 * 1024) throw new Error("حجم الملف يجب ألا يتجاوز 5 ميجابايت");
      const book = XLSX.read(await file.arrayBuffer(), { type: "array", sheetRows: 1000 });
      const sheet = book.Sheets[book.SheetNames[0]];
      if (!sheet) throw new Error("الملف لا يحتوي على ورقة بيانات");
      if (sheet["!fullref"]) throw new Error("الملف أكبر من الحد المسموح؛ استخدم ملفًا بحد أقصى 200 مستخدم");
      const matrix = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "", raw: false, blankrows: true });
      setRows(validateUserImport(matrix, { users, roles, classes, sections, students }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "تعذّر قراءة ملف Excel");
    } finally { setReading(false); }
  };

  const importUsers = async () => {
    if (running.current || !ready.length || started) return;
    running.current = true; setBusy(true); setStarted(true);
    const update = (number, status, message) => setRows((previous) => previous.map((row) => row.row === number ? { ...row, status, message, data: { ...row.data, password: "" } } : row));
    try {
      for (const row of ready) {
        if (users.some((user) => user.email?.toLowerCase() === row.data.email)) {
          update(row.row, "failed", "البريد موجود بالفعل"); continue;
        }
        try {
          const result = await addUser(row.data, { quiet: true });
          update(row.row, result?.success ? "success" : "failed", result?.message || "تعذّر تأكيد النتيجة؛ راجع قائمة المستخدمين قبل إعادة المحاولة");
        } catch {
          update(row.row, "failed", "تعذّر تأكيد النتيجة؛ راجع قائمة المستخدمين قبل إعادة المحاولة");
        }
      }
    } finally { running.current = false; setBusy(false); }
  };

  return <div className="modal-backdrop user-modal-backdrop">
    <div className="modal-box user-modal" role="dialog" aria-modal="true" aria-labelledby="user-import-title" dir="rtl" style={{ maxWidth: 900, width: "100%" }}>
      <div className="modal-head"><h4 id="user-import-title">استيراد مستخدمين من Excel</h4><button type="button" className="icon-btn" aria-label="إغلاق" disabled={busy || reading} onClick={onClose}>×</button></div>
      <div className="modal-body" style={{ overflowY: "auto" }}>
        <p>حمّل القالب، وأدخل بيانات المستخدمين في الورقة الأولى، ثم ارفع الملف لمراجعتها. لن تُنشأ الحسابات حتى تضغط «إنشاء المستخدمين».</p>
        <button type="button" className="chip-btn-outline" onClick={downloadTemplate}>تنزيل قالب Excel</button>
        <label className="field-label" htmlFor="users-excel-file">ملف المستخدمين (حتى 200 مستخدم)</label>
        <input id="users-excel-file" type="file" accept=".xlsx,.xls" onChange={readFile} disabled={busy || reading} />
        <p>كلمة المرور مطلوبة ولا تظهر في المعاينة. تُتخطّى الصفوف غير الصالحة. للمعلم: المادة والصفوف والشعب مطلوبة بصيغة صف/شعبة؛صف/شعبة.</p>
        {reading && <p role="status">جارٍ قراءة الملف...</p>}
        {error && <p role="alert">{error}</p>}
        {rows.length > 0 && <>
          <p role="status">الإجمالي: {rows.length} — صالح: {rows.filter((r) => !r.errors.length).length} — غير صالح: {rows.filter((r) => r.errors.length).length} — تم: {rows.filter((r) => r.status === "success").length} — تعذّر: {rows.filter((r) => r.status === "failed").length}</p>
          <div style={{ overflowX: "auto" }}><table className="perm-table"><thead><tr><th>الصف</th><th>الاسم</th><th>البريد</th><th>الدور</th><th>النتيجة</th></tr></thead><tbody>
            {rows.map((row) => <tr key={row.row}><td>{row.row}</td><td>{row.data.name}</td><td>{row.data.email}</td><td>{roleLabel(row.data.role)}</td><td>{row.errors.join("، ") || row.message || "جاهز"}</td></tr>)}
          </tbody></table></div>
        </>}
      </div>
      <div className="user-modal-footer" style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        <button type="button" className="chip-btn" disabled={busy || reading || started || !ready.length} onClick={importUsers}>{busy ? "جارٍ إنشاء المستخدمين..." : `إنشاء المستخدمين (${ready.length})`}</button>
        <button type="button" className="chip-btn-outline" disabled={busy || reading} onClick={onClose}>إغلاق</button>
      </div>
    </div>
  </div>;
}
