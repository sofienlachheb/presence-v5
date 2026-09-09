import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Users, UserCheck, UserX, Clock, AlertTriangle, BarChart3, Bell,
  Search, Plus, X, Check, ChevronLeft, ChevronRight, Home, FileText,
  Send, ShieldAlert, GraduationCap, CalendarDays, Phone, Activity,
  ClipboardList, TrendingUp, Filter, Eye, Star, PenLine,
  Printer, PlayCircle, History as HistoryIcon, Settings, UserPlus,
  Trash2, Pencil, Lock, Mail, ShieldCheck, Save, Bird, MessageCircle, LogOut
} from "lucide-react";
import { EmptyState } from "./EmptyState";


/* ---------------------------------------------------------------
   إدارة أسماء الحصص
--------------------------------------------------------------- */
export function PeriodManager({ periods, addPeriod, deletePeriod }) {
  const [name, setName] = useState("");

  const submit = () => {
    const cleanName = name.trim();
    if (!cleanName) return;
    addPeriod(cleanName);
    setName("");
  };

  return (
    <div>
      <div className="add-role-row">
        <input
          className="text-input"
          placeholder="اسم الحصة (مثال: الحصة الأولى)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") submit();
          }}
        />
        <button className="chip-btn" onClick={submit} disabled={!name.trim()}>
          <Plus size={15} /> إضافة حصة
        </button>
      </div>

      {periods.length === 0 ? (
        <EmptyState text="لم تتم إضافة حصص بعد" />
      ) : (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 16 }}>
          {periods.map((p) => (
            <div key={p.id} className="role-chip" style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
              <span>{p.name}</span>
              <button className="icon-btn-sm" title="حذف الحصة" onClick={() => deletePeriod(p.id)}>
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
