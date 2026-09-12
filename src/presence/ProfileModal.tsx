import React, { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { supabase } from "../supabaseClient";
import { roleLabel } from "./roleLabels";
import { ChangePasswordForm } from "./ChangePasswordForm";
import { changeOwnPassword } from "./changeOwnPassword";
import "./user-modal.css";

export function ProfileModal({ user, onClose }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    dialog.current?.showModal();
    return () => dialog.current?.close();
  }, []);
  return <dialog dir="rtl" ref={dialog} className="modal-box user-modal" aria-labelledby="profile-title" style={{ border: 0, padding: 0, margin: "auto", maxWidth: 480 }} onCancel={event => { event.preventDefault(); if (!busy) onClose(); }}>
    <div className="modal-head">
      <h4 id="profile-title">الملف الشخصي</h4>
      <button type="button" className="icon-btn" aria-label="إغلاق" disabled={busy} onClick={onClose}><X size={18} /></button>
    </div>
    <div className="modal-body">
      <h3>{user.name}</h3>
      <p>{roleLabel(user.role)}</p>
      <p dir="ltr" style={{ overflowWrap: "anywhere" }}>{user.email}</p>
      <ChangePasswordForm onChangePassword={password => changeOwnPassword(supabase.auth, password)} onBusyChange={setBusy} onSuccess={onClose} />
    </div>
  </dialog>;
}
