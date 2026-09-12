import fs from 'node:fs';
import ts from 'typescript';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import assert from 'node:assert/strict';
const s=fs.readFileSync('src/presence/UserModal.tsx','utf8').replace('import "./user-modal.css";','');
const result=ts.transpileModule(s,{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext},reportDiagnostics:true});
assert.equal(result.diagnostics.length,0);
fs.writeFileSync('tmp/user-modal-render.mjs',result.outputText);
const {UserModal}=await import('./user-modal-render.mjs');
const base={roles:['معلم'],students:[],classes:['10'],sections:['1'],onClose(){},onSave(){},onResetPassword(){}};
for(const user of [null,{name:'teacher2',email:'teacher2@school.com',role:'معلم',teachingSubject:'الرياضيات',teachingAssignments:[{className:'10',sectionName:'1'}]}, {name:'teacher2',email:'teacher2@school.com',role:'معلم',teachingSubject:'التربية البدنية',teachingAssignments:[{className:'10',sectionName:'1'}]}]){
const html=renderToStaticMarkup(React.createElement(UserModal,{...base,user}));
assert.ok(html.includes('id="teacher-subject"'));
assert.ok(html.includes(user?'حفظ التعديلات':'إضافة مستخدم جديد'));
assert.ok(html.includes('user-modal-footer'));
assert.ok(html.includes('إلغاء'));
if(user?.teachingSubject==='التربية البدنية') assert.ok(html.includes('value="التربية البدنية"'));
}
console.log('PASS: TSX syntax and rendered create/edit/custom-subject controls');
