import test from 'node:test';
import assert from 'node:assert/strict';
import * as XLSX from 'xlsx';
import { validateUserImport, userImportHeaders } from '../src/presence/userImport.js';

const context = { users: [{ email: 'old@example.com' }], roles: ['معلم', 'مشرف سلوكي', 'ولي أمر'], classes: ['10', '11'], sections: ['1', '2'], students: [{ id: 'student-1' }] };
const row = (email = 'new@example.com') => ['أحمد', email, '01234567', 'معلم', '001234', 'نعم', 'الرياضيات', '10/1؛11/2', ''];
test('valid teachers retain passwords and phones and parse assignments', () => {
  const [entry] = validateUserImport([userImportHeaders, row()], context);
  assert.deepEqual(entry.errors, []);
  assert.equal(entry.data.password, '01234567');
  assert.equal(entry.data.phone, '001234');
  assert.deepEqual(entry.data.teachingAssignments, [{ className: '10', sectionName: '1' }, { className: '11', sectionName: '2' }]);
});
test('detects existing and duplicate emails case-insensitively and keeps Excel row numbers', () => {
  const entries = validateUserImport([userImportHeaders, row('OLD@example.com'), [], row(), row('NEW@example.com')], context);
  assert.ok(entries[0].errors.includes('البريد مكرر'));
  assert.equal(entries[1].row, 4);
  assert.ok(entries[2].errors.includes('البريد مكرر'));
});
test('rejects missing columns and empty files', () => {
  assert.throws(() => validateUserImport([['الاسم']], context), /العمود/);
  assert.throws(() => validateUserImport([userImportHeaders], context), /لا يحتوي/);
});
test('validates teacher assignments, role, active flag and guardian links', () => {
  const teacher = row(); teacher[7] = '99/1'; teacher[5] = 'maybe';
  const guardian = row('parent@example.com'); guardian[3] = 'ولي أمر'; guardian[8] = 'unknown';
  const invalidRole = row('other@example.com'); invalidRole[3] = 'غير موجود';
  const entries = validateUserImport([userImportHeaders, teacher, guardian, invalidRole], context);
  assert.equal(entries[0].errors.length, 2);
  assert.ok(entries[1].errors.includes('معرف أحد الأبناء غير موجود'));
  assert.ok(entries[2].errors.includes('الدور غير موجود'));
});
test('supports visible supervisor role and inactive accounts', () => {
  const input = row(); input[3] = 'مشرف'; input[5] = 'لا';
  const [entry] = validateUserImport([userImportHeaders, input], context);
  assert.equal(entry.data.role, 'مشرف سلوكي');
  assert.equal(entry.data.active, false);
  assert.deepEqual(entry.errors, []);
});
test('reads an actual Excel workbook with text credentials and rejects oversized batches', () => {
  const book = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(book, XLSX.utils.aoa_to_sheet([userImportHeaders, row()]), 'المستخدمون');
  const loaded = XLSX.read(XLSX.write(book, { type: 'buffer', bookType: 'xlsx' }));
  const matrix = XLSX.utils.sheet_to_json(loaded.Sheets[loaded.SheetNames[0]], { header: 1, raw: false, defval: '' });
  const [entry] = validateUserImport(matrix, context);
  assert.equal(entry.data.password, '01234567');
  assert.deepEqual(entry.errors, []);
  assert.throws(() => validateUserImport([userImportHeaders, ...Array.from({ length: 201 }, (_, i) => row(`user${i}@example.com`))], context), /200/);
});
