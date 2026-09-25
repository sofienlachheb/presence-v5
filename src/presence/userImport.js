export const userImportHeaders = ["الاسم", "البريد الإلكتروني", "كلمة المرور", "الدور", "الهاتف", "نشط", "المادة", "الصفوف والشعب", "معرفات الأبناء"];

export function validateUserImport(matrix, { users, roles, classes, sections, students }) {
  const headers = (matrix[0] || []).map((v) => String(v).trim());
  for (const header of userImportHeaders.slice(0, 4)) {
    if (!headers.includes(header)) throw new Error(`العمود المطلوب غير موجود: ${header}`);
  }
  if (new Set(headers.filter(Boolean)).size !== headers.filter(Boolean).length) throw new Error("توجد أسماء أعمدة مكررة");
  const existing = new Set(users.map((u) => String(u.email || "").trim().toLowerCase()));
  const emails = new Set();
  const entries = [];
  matrix.slice(1).forEach((row, index) => {
    if (!row.some((v) => String(v ?? "").trim())) return;
    const value = (key) => String(row[headers.indexOf(key)] ?? "").trim();
    const email = value("البريد الإلكتروني").toLowerCase();
    const role = ({ "مشرف": "مشرف سلوكي", "مدرس": "معلم", "منسق شؤون الطلاب": "مرشد طلابي" })[value("الدور")] || value("الدور");
    const errors = [];
    const data = { name: value("الاسم"), email, password: String(row[headers.indexOf("كلمة المرور")] ?? ""), role, phone: value("الهاتف"), active: !["لا", "false", "0", "غير نشط"].includes(value("نشط").toLowerCase()), teachingSubject: value("المادة"), teachingAssignments: [], childStudentIds: [] };
    if (!data.name) errors.push("الاسم مطلوب");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push("البريد غير صحيح");
    if (existing.has(email) || emails.has(email)) errors.push("البريد مكرر");
    emails.add(email);
    if (data.password.trim().length < 6) errors.push("كلمة المرور أقل من 6 أحرف");
    if (!roles.includes(role)) errors.push("الدور غير موجود");
    if (!["", "نعم", "لا", "true", "false", "1", "0", "نشط", "غير نشط"].includes(value("نشط").toLowerCase())) errors.push("قيمة نشط غير صحيحة");
    if (role === "معلم") {
      if (!data.teachingSubject) errors.push("المادة مطلوبة للمعلم");
      const assignments = value("الصفوف والشعب").split(/[;؛]/).map((v) => v.trim()).filter(Boolean);
      if (!assignments.length) errors.push("صف وشعبة مطلوبان للمعلم");
      for (const entry of new Set(assignments)) {
        const parts = entry.split("/").map((v) => v.trim());
        if (parts.length !== 2 || !classes.map(String).includes(parts[0]) || !sections.map(String).includes(parts[1])) errors.push(`صف/شعبة غير صالح: ${entry}`);
        else data.teachingAssignments.push({ className: parts[0], sectionName: parts[1] });
      }
    }
    if (role === "ولي أمر") {
      data.childStudentIds = [...new Set(value("معرفات الأبناء").split(/[,;؛]/).map((v) => v.trim()).filter(Boolean))];
      if (data.childStudentIds.some((id) => !students.some((s) => s.id === id))) errors.push("معرف أحد الأبناء غير موجود");
    }
    entries.push({ row: index + 2, data, errors, status: "pending", message: "" });
  });
  if (!entries.length) throw new Error("الملف لا يحتوي على مستخدمين");
  if (entries.length > 200) throw new Error("الحد الأقصى 200 مستخدم لكل ملف");
  return entries;
}
