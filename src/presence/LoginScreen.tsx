import React, { useRef, useState } from "react";
import { ArrowLeft, Eye, EyeOff, LockKeyhole, Mail, GraduationCap, LoaderCircle, ShieldCheck } from "lucide-react";
import schoolLogo from "../assets/school-logo.png";
import schoolCampus from "../assets/school-campus.png";
import "./login.css";

export function LoginScreen({ users, onLogin, error }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [pending, setPending] = useState(false);
  const [localError, setLocalError] = useState("");
  const submitting = useRef(false);
  const submit = async (event) => {
    event.preventDefault();
    if (submitting.current || !email.trim() || !password) return;
    submitting.current = true; setPending(true); setLocalError("");
    try { await onLogin(email.trim(), password); }
    catch { setLocalError("تعذّر الاتصال. يرجى المحاولة مرة أخرى."); }
    finally { submitting.current = false; setPending(false); }
  };
  const message = localError || error;
  return <main className="school-login" dir="rtl">
    <header className="school-login-header"><img src={schoolLogo} alt="مدرسة عمر بن عبد العزيز الثانوية للبنين — وزارة التربية والتعليم والتعليم العالي"/><span>النظام الإلكتروني لدعم الطالب والمعلم</span></header>
    <div className="school-login-layout">
      <section className="school-login-form-panel" aria-labelledby="login-heading">
        <div className="school-login-form-content">
          <div className="school-login-mark"><GraduationCap size={29}/></div>
          <span className="school-login-eyebrow">بوابتك إلى مجتمع المدرسة</span>
          <h1 id="login-heading">أهلًا بعودتك</h1>
          <p className="school-login-intro">سجّل دخولك لمتابعة يومك الدراسي،<br/>ودعم رحلة الطالب نحو النجاح.</p>
          <form onSubmit={submit} aria-busy={pending}>
            <label htmlFor="school-login-email">البريد الإلكتروني</label>
            <div className="school-login-input"><Mail size={19} aria-hidden="true"/><input id="school-login-email" name="email" type="email" dir="ltr" autoComplete="username" autoCapitalize="none" spellCheck={false} placeholder="name@school.qa" required value={email} onChange={e=>setEmail(e.target.value)} disabled={pending}/></div>
            <label htmlFor="school-login-password">كلمة المرور</label>
            <div className="school-login-input"><LockKeyhole size={19} aria-hidden="true"/><input id="school-login-password" name="password" type={showPass ? "text" : "password"} autoComplete="current-password" placeholder="أدخل كلمة المرور" required value={password} onChange={e=>setPassword(e.target.value)} disabled={pending} aria-describedby={message ? "school-login-error" : undefined}/><button type="button" className="school-login-eye" aria-label={showPass ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"} aria-pressed={showPass} onClick={()=>setShowPass(v=>!v)}>{showPass ? <EyeOff size={19}/> : <Eye size={19}/>}</button></div>
            {message && <div id="school-login-error" className="school-login-error" role="alert">{message}</div>}
            <button className="school-login-submit" type="submit" disabled={pending}>{pending ? <><LoaderCircle className="school-login-spinner" size={20}/>جارٍ تسجيل الدخول…</> : <>تسجيل الدخول<ArrowLeft size={20}/></>}</button>
          </form>
          <p className="school-login-help">تحتاج مساعدة في الدخول؟ <span>تواصل مع مسؤول النظام في المدرسة.</span></p>
          <div className="school-login-private"><ShieldCheck size={16}/><span>حسابك المدرسي، في مكان واحد</span></div>
        </div>
      </section>
      <aside className="school-login-visual" aria-label="المجتمع المدرسي">
        <img src={schoolCampus} alt="صورة توضيحية لحرم مدرسي بباحة واسعة وأشجار نخيل" fetchPriority="high"/>
        <div className="school-login-visual-shade"/>
        <div className="school-login-visual-top"><span>Presence</span><span>حضور يصنع أثرًا</span></div>
        <div className="school-login-visual-copy"><span className="school-login-pill">نتعلّم · نشارك · نرتقي</span><h2>كل يوم دراسي،<br/>فرصة لأثر أجمل.</h2><p>مدرسة عمر بن عبد العزيز<br/>الثانوية للبنين</p></div>
        
      </aside>
    </div>
    <footer className="school-login-footer"><span>مدرسة عمر بن عبد العزيز الثانوية للبنين</span><span>معًا لدعم الطالب والمعلم</span></footer>
  </main>;
}
