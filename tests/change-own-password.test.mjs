import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { test } from 'node:test';
import ts from 'typescript';
const source = readFileSync(new URL('../src/presence/changeOwnPassword.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, {compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
const {changeOwnPassword} = await import('data:text/javascript;base64,' + Buffer.from(compiled).toString('base64'));
test('changes the signed-in account with only a password, for every role',async()=>{
 for (const role of ['مدير النظام','معلم','مشرف','منسق شؤون الطلاب','ولي أمر']) {
  const calls=[]; const auth={updateUser:async(...args)=>{calls.push(args);return {data:{user:{id:'current-user',role}},error:null};}};
  await changeOwnPassword(auth,'new-password');assert.deepEqual(calls,[[{password:'new-password'}]]);
 }
});
test('rejects invalid passwords before contacting Auth',async()=>{let calls=0;const auth={updateUser:async()=>{calls++;}};for(const password of ['', 'short',' trailing ']) await assert.rejects(changeOwnPassword(auth,password));assert.equal(calls,0);});
test('reports expired session and policy errors without leaking server details',async()=>{
 for(const code of ['weak_password','same_password','reauthentication_needed','session_not_found','unknown']) {
 const auth={updateUser:async()=>({data:{user:null},error:{code,message:'private-server-details'}})};
 await assert.rejects(changeOwnPassword(auth,'new-password'),error=>!error.message.includes('private-server-details'));
 }
});
test('does not report success without an authenticated user',async()=>{await assert.rejects(changeOwnPassword({updateUser:async()=>({data:{user:null},error:null})},'new-password'));});
