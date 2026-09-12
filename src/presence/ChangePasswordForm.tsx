import React, { useState } from "react";

export function ChangePasswordForm({ onChangePassword, onBusyChange, onSuccess }) {
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const valid = password.length >= 6 && password === password.trim() && password === confirmation;

  const save = async () => {
    if (!valid || busy) return;
    setBusy(true);
    onBusyChange(true);
    setMessage("");
    try {
      await onChangePassword(password);
      setPassword("");
      setConfirmation("");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "تعذّر تغيير كلمة المرور، حاول مجدداً");
      return;
    } finally {
      setBusy(false);
      onBusyChange(false);
    }
    onSuccess();
  };

  return <fieldset disabled={busy} style={{ border: 0, padding: 0, margin: "12px 0" }}>
    <legend className="field-label">تغيير كلمة المرور</legend>
    <label className="field-label" htmlFor="new-user-password">كلمة المرور الجديدة</label>
    <input id="new-user-password" className="text-input" type="password" autoComplete="new-password" value={password} onChange={e => { setPassword(e.target.value); setMessage(""); }} />
    <p className="char-hint">6 أحرف على الأقل، دون مسافات في البداية أو النهاية.</p>
    <label className="field-label" htmlFor="confirm-user-password">تأكيد كلمة المرور</label>
    <input id="confirm-user-password" className="text-input" type="password" autoComplete="new-password" value={confirmation} onChange={e => { setConfirmation(e.target.value); setMessage(""); }} />
    {confirmation && confirmation !== password && <p className="char-hint" role="alert">كلمتا المرور غير متطابقتين</p>}
    <button type="button" className="chip-btn-outline" disabled={!valid || busy} onClick={save}>{busy ? "جارٍ الحفظ..." : "حفظ كلمة المرور"}</button>
    {message && <p role="status" className="char-hint">{message}</p>}
  </fieldset>;
}
