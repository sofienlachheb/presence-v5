export const WORKBOOK_BEHAVIORS = [
  "كثرة النوم", "العبث بلأجهزة الالكترونية", "مشاركة خارجية", "ضعيف أكاديميًا",
  "لم يحضر الأدوات", "غير مشارك", "لم يحل الواجبات", "كثرة الكلام", "إثارة الفوضى",
  "التأخر عن الحصة", "هروب من الحصة", "متميز", "غير ملتزم بالزي الرياضي",
];

export const classKey = (student) => JSON.stringify([student.class || "", student.section || ""]);
export const classLabel = (student) => `${student.class || "—"} / ${student.section || "—"}`;
export const cellKey = (studentId, period) => JSON.stringify([studentId, period]);

export function buildWorkbookRows(students, periods, attendance, notes, violations, date) {
  const records = new Map(attendance.map((row) => [cellKey(row.studentId, row.period), row]));
  const noteMap = new Map(notes.map((row) => [cellKey(row.student_id, row.period), row.behavior]));
  return students.map((student) => {
    const cells = periods.map((period) => {
      const record = records.get(cellKey(student.id, period));
      const saved = noteMap.get(cellKey(student.id, period));
      const existing = violations.filter((v) => v.studentId === student.id && String(v.date).slice(0, 10) === date && v.period === period).map((v) => v.item).filter(Boolean);
      const behaviors = [...new Set(saved ? [saved, ...existing] : existing)];
      return { period, status: record?.status || "", teacher: record?.teacherName || "", behaviors };
    });
    const present = cells.filter((c) => c.status === "حاضر").length;
    const absent = cells.filter((c) => c.status === "غائب").length;
    const recorded = cells.filter((c) => c.status).length;
    const behaviorCounts = Object.fromEntries(WORKBOOK_BEHAVIORS.map((b) => [b, cells.filter((c) => c.behaviors.includes(b)).length]));
    const behaviors = [...new Set(cells.flatMap((c) => c.behaviors))];
    // The template uses five present periods. Unrecorded lessons are not absences.
    const status = present >= 5 ? "حاضر" : recorded === periods.length && periods.length > 0 ? "غائب" : recorded === 0 ? "لم يسجل" : "غير مكتمل";
    return { student, cells, present, absent, recorded, missing: periods.length - recorded, status, behaviorCounts, behaviors, behaviorCount: behaviors.length };
  });
}

// Follow up recorded absences immediately, independently of the daily threshold.
export function absentWorkbookRows(rows) {
  return rows.filter((row) => row.absent > 0);
}

export function attendanceStatistics(rows, periods) {
  return periods.map((period, index) => {
    const count = (status) => rows.filter((r) => r.cells[index]?.status === status).length;
    const recorded = rows.filter((r) => r.cells[index]?.status).length;
    const present = count("حاضر");
    return { period, present, absent: count("غائب"), late: count("متأخر"), excused: count("معذور"), missing: rows.length - recorded, percent: rows.length && recorded ? Math.round(present / rows.length * 1000) / 10 : null };
  });
}

export function studentMessage(row, date) {
  return [
    `الطالب: ${row.student.name}`, `الصف: ${classLabel(row.student)}`,
    `متابعة الحضور والسلوك ليوم ${date}`,
    ...row.cells.map((cell) => `${cell.period}: ${cell.status || "لم يسجل"}${cell.behaviors.length ? ` — ${cell.behaviors.join("، ")}` : ""}`),
    `حالة الطالب: ${row.status}`, `حصص الحضور: ${row.present} — حصص الغياب المسجلة: ${row.absent}`,
  ].join("\n");
}
