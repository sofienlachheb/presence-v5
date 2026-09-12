import fs from 'node:fs';
import ts from 'typescript';
import assert from 'node:assert/strict';
const paths=['App','LessonPointsView','PeriodicEvaluationView','UserModal','SettingsView'];
for(const name of paths){ const s=fs.readFileSync(`src/presence/${name}.tsx`,'utf8');const r=ts.transpileModule(s,{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2022},reportDiagnostics:true});assert.equal(r.diagnostics.length,0,name); }
const lesson=fs.readFileSync('src/presence/LessonPointsView.tsx','utf8');
assert.ok(!lesson.includes('setSubject'));
const subjectFilter=lesson.match(/const records = allRecords.filter\((.*)\);/)[1];
const filter=new Function('allRecords','subject',`return allRecords.filter(${subjectFilter});`);
assert.deepEqual(filter([{subject:'الرياضيات'},{subject:'اللغة العربية'}],'الرياضيات'),[{subject:'الرياضيات'}]);
assert.deepEqual(filter([{subject:'الرياضيات'}],''),[]);
const periodic=fs.readFileSync('src/presence/PeriodicEvaluationView.tsx','utf8');
assert.ok(!periodic.includes('setSubject'));
assert.ok(periodic.includes('e.teacherId === currentUser.id'));
assert.ok(periodic.includes('String(e.subject || "").trim() === subject'));
const app=fs.readFileSync('src/presence/App.tsx','utf8');
assert.ok(app.includes('subject: teacherSubject,'));
assert.ok(app.includes('teachingSubject: p.teaching_subject'));
console.log('PASS: 5 TSX files; assigned subject filtering, missing subject, and automatic save checks');
