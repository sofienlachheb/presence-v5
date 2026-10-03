import test from 'node:test';
import assert from 'node:assert/strict';
import { buildWorkbookRows, buildWorkbookRangeRows, workbookDateRange, absentWorkbookRows, attendanceStatistics, studentMessage, classKey } from '../src/presence/supervisorWorkbookModel.js';
const student = { id: 's1', name: 'طالب تجريبي', class: '10', section: '1', guardianPhone: '123' };
const periods = Array.from({ length: 7 }, (_, i) => `حصة ${i + 1}`);
const date = '2026-10-04';
const rows = (statuses, notes = [], violations = []) => buildWorkbookRows([student], periods, statuses.map((status, i) => ({ studentId: student.id, period: periods[i], status })), notes, violations, date);
test('unrecorded and partial days do not classify students as absent', () => {
  assert.equal(rows([])[0].status, 'لم يسجل');
  const partial = rows(['حاضر', 'غائب'])[0];
  assert.equal(partial.status, 'غير مكتمل');
  assert.equal(partial.absent, 1);
  assert.equal(partial.missing, 5);
});
test('five present periods meet the template daily threshold', () => {
  assert.equal(rows(Array(5).fill('حاضر'))[0].status, 'حاضر');
  const complete = rows(['حاضر','حاضر','حاضر','حاضر','غائب','غائب','معذور'])[0];
  assert.equal(complete.status, 'غائب');
  assert.equal(complete.absent, 2);
  assert.equal(rows(['حاضر','حاضر','حاضر','حاضر','حاضر','متأخر','معذور'])[0].status, 'حاضر');
});
test('counts distinct behavior categories and per-period occurrences without duplicates', () => {
  const notes = [0, 1].map((i) => ({ student_id: 's1', period: periods[i], behavior: 'متميز' }));
  const violations = [{ studentId: 's1', period: periods[0], date, item: 'متميز' }, { studentId: 's1', period: periods[2], date: '2026-10-03', item: 'كثرة النوم' }];
  const row = rows([], notes, violations)[0];
  assert.equal(row.behaviorCounts['متميز'], 2);
  assert.equal(row.behaviorCount, 1);
  assert.deepEqual(row.cells[0].behaviors, ['متميز']);
});
test('statistics distinguish missing data, zero attendance, late and excused', () => {
  assert.equal(attendanceStatistics(rows([]), periods)[0].percent, null);
  assert.equal(attendanceStatistics(rows(['غائب']), periods)[0].percent, 0);
  assert.equal(attendanceStatistics(rows(['معذور']), periods)[0].excused, 1);
  assert.equal(attendanceStatistics(rows(['متأخر']), periods)[0].late, 1);
  assert.equal(attendanceStatistics([], periods)[0].percent, null);
});
test('messages preserve unrecorded status and do not assert delivery', () => {
  const message = studentMessage(rows(['حاضر'])[0], date);
  assert.match(message, /غير مكتمل/);
  assert.match(message, /حصة 7: لم يسجل/);
  assert.doesNotMatch(message, /تم الإرسال/);
});
test('class keys cannot collide on separator characters', () => {
  assert.notEqual(classKey({ class: 'a/b', section: 'c' }), classKey({ class: 'a', section: 'b/c' }));
});

test('absence list includes partial days and daily-present students with recorded absence', () => {
  const partial = rows(['غائب'])[0];
  assert.equal(partial.status, 'غير مكتمل');
  assert.deepEqual(absentWorkbookRows([partial]), [partial]);
  const present = rows(['حاضر', 'حاضر', 'حاضر', 'حاضر', 'حاضر', 'غائب'])[0];
  assert.equal(present.status, 'حاضر');
  assert.deepEqual(absentWorkbookRows([present]), [present]);
});

test('absence list excludes unrecorded, late and excused lessons without recorded absence', () => {
  assert.deepEqual(absentWorkbookRows(rows([])), []);
  assert.deepEqual(absentWorkbookRows(rows(['حاضر', 'متأخر', 'معذور'])), []);
  assert.deepEqual(absentWorkbookRows(rows(Array(7).fill('معذور'))), []);
  assert.deepEqual(absentWorkbookRows([]), []);
});

test('date ranges cover the selected day, leap month, year end and all dates', () => {
  assert.deepEqual(workbookDateRange('day', date, ''), { from: date, to: date });
  assert.deepEqual(workbookDateRange('month', date, '2024-02'), { from: '2024-02-01', to: '2024-02-29' });
  assert.equal(workbookDateRange('month', date, '2026-12').to, '2026-12-31');
  assert.deepEqual(workbookDateRange('all', date, ''), { from: '', to: '' });
});

test('multi-day rows keep attendance and behavior separate for each date', () => {
  const attendance = [
    { studentId: student.id, period: periods[0], status: 'غائب', date: '2026-10-01' },
    { studentId: student.id, period: periods[0], status: 'حاضر', date: '2026-10-02' },
    { studentId: student.id, period: periods[0], status: 'غائب', date: '2026-09-30' },
  ];
  const notes = [{ student_id: student.id, period: periods[0], behavior: 'متميز', date: '2026-10-01' }];
  const result = buildWorkbookRangeRows([student], periods, attendance, notes, [], workbookDateRange('month', date, '2026-10'));
  assert.deepEqual(result.map(r => r.date), ['2026-10-02', '2026-10-01']);
  assert.equal(result[0].present, 1);
  assert.equal(result[0].behaviorCount, 0);
  assert.equal(result[1].absent, 1);
  assert.equal(result[1].behaviorCount, 1);
  assert.equal(absentWorkbookRows(result).length, 1);
  assert.equal(buildWorkbookRangeRows([student], periods, attendance, [], [], { from: '', to: '' }).length, 3);
  assert.equal(buildWorkbookRangeRows([student], periods, [], [], [], { from: '', to: '' }).length, 0);
  assert.equal(buildWorkbookRangeRows([student], periods, [], [], [], { from: date, to: date })[0].status, 'لم يسجل');
});
