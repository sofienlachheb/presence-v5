import fs from 'node:fs';
const p='src/presence/App.tsx';let s=fs.readFileSync(p,'utf8');
const guard='    const teacherSubject = String(currentUser.teachingSubject || "").trim();\n    if (!teacherSubject) { showToast("يرجى تحديد مادة المعلم في إعدادات المستخدمين أولًا"); return null; }\n';
s=s.replace(guard,'');
const start=s.indexOf('  const addPeriodicEvaluation =');const pos=s.indexOf('    const allowed =',start);s=s.slice(0,pos)+guard+s.slice(pos);fs.writeFileSync(p,s);
const v='src/presence/PeriodicEvaluationView.tsx';s=fs.readFileSync(v,'utf8');s=s.replace(/  const subjects = useMemo\([\s\S]*?\n  \);\r?\n/, '');s=s.replace('<div className="view-stack">','<div className="view-stack">\n      {isTeacher && !subject && <p role="alert">لم تُحدد مادتك بعد. يرجى مراجعة مسؤول النظام لتحديدها في إعدادات حسابك.</p>}');fs.writeFileSync(v,s);
