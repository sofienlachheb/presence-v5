import { roleLabel } from "./roleLabels";
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
import { Avatar } from "./Avatar";
import { PERMISSION_SECTIONS } from "./shared";
import { PeriodManager } from "./PeriodManager";
import { UserModal } from "./UserModal";
import { UserImportModal } from "./UserImportModal";


/* ---------------------------------------------------------------
   الإعدادات: إدارة المستخدمين وصلاحيات الوصول
--------------------------------------------------------------- */
export function SettingsView({ users, roles, students, addUser, updateUser, deleteUser, togglePermission, addRole, deleteRole, resetUserPassword, periods, addPeriod, deletePeriod, classes, sections }) {
  const [tab, setTab] = useState("users");
  const [userModal, setUserModal] = useState(null); // null | "new" | user object
  const [importOpen, setImportOpen] = useState(false);
  const [newRoleName, setNewRoleName] = useState("");
  const [userPage, setUserPage] = useState(1);
  const [usersPerPage, setUsersPerPage] = useState(10);
  const userPageCount = Math.max(1, Math.ceil(users.length / usersPerPage));
  const currentUserPage = Math.min(userPage, userPageCount);
  const userPageStart = (currentUserPage - 1) * usersPerPage;
  const visibleUsers = users.slice(userPageStart, userPageStart + usersPerPage);
  const userPageNumbers = Array.from(new Set([
    1, currentUserPage - 1, currentUserPage, currentUserPage + 1, userPageCount,
  ])).filter((page) => page >= 1 && page <= userPageCount).sort((a, b) => a - b);

  useEffect(() => {
    setUserPage((page) => Math.min(page, userPageCount));
  }, [userPageCount]);

  const roleNames = Object.keys(roles);

  return (
    <div className="view-stack">
      <section className="card">
        <div className="settings-tabs">
          <button
            className={`settings-tab ${tab === "users" ? "settings-tab-active" : ""}`}
            onClick={() => setTab("users")}
          >
            <Users size={15} /> المستخدمون
          </button>
          <button
            className={`settings-tab ${tab === "permissions" ? "settings-tab-active" : ""}`}
            onClick={() => setTab("permissions")}
          >
            <Lock size={15} /> الأدوار والصلاحيات
          </button>
          <button
            className={`settings-tab ${tab === "periods" ? "settings-tab-active" : ""}`}
            onClick={() => setTab("periods")}
          >
            <Clock size={15} /> الحصص الدراسية
          </button>
        </div>
      </section>

      {tab === "users" && (
        <section className="card">
          <div className="card-head">
            <h3><Users size={17} /> إدارة المستخدمين ({users.length})</h3>
            <button className="chip-btn-outline" onClick={() => setImportOpen(true)}>استيراد مستخدمين من Excel</button>
            <button className="chip-btn" onClick={() => setUserModal("new")}>
              <UserPlus size={15} /> إضافة مستخدم
            </button>
          </div>
          {users.length === 0 ? (
            <EmptyState text="لا يوجد مستخدمون بعد" />
          ) : (
            <ul className="mini-list">
              {visibleUsers.map((u) => (
                <li key={u.id}>
                  <Avatar name={u.name} tone={u.active ? "#1E2A4A" : "#9AA3AF"} />
                  <span className="mini-list-name">{u.name}</span>
                  <span className="mini-list-desc">
                    <Mail size={11} style={{ verticalAlign: "-1px" }} /> {u.email || "—"} &nbsp;·&nbsp; {u.phone || "—"}
                  </span>
                  <span className="count-chip" style={{ background: "#5B8DEF" }}>{roleLabel(u.role)}</span>
                  {u.role === "معلم" && (
                    <span className="count-chip" style={{ background: "#2F9E6E" }}>
                      {u.teachingSubject || "المادة غير محددة"} · {(u.teachingAssignments || []).length} صف/شعبة
                    </span>
                  )}
                  {!u.active && <span className="count-chip" style={{ background: "#9AA3AF" }}>موقوف</span>}
                  <button className="icon-btn" title="تعديل" onClick={() => setUserModal(u)}>
                    <Pencil size={15} />
                  </button>
                  <button className="icon-btn" title="حذف" onClick={() => deleteUser(u.id)}>
                    <Trash2 size={15} />
                  </button>
                </li>
              ))}
            </ul>
          )}
          {users.length > 0 && (
            <nav className="log-pagination users-pagination" aria-label="صفحات المستخدمين" dir="rtl">
              <span className="users-page-summary" role="status">
                عرض {userPageStart + 1}–{Math.min(userPageStart + usersPerPage, users.length)} من {users.length} مستخدم
              </span>
              <label className="users-page-size">
                لكل صفحة
                <select className="select-input" value={usersPerPage} onChange={(event) => {
                  setUsersPerPage(Number(event.target.value));
                  setUserPage(1);
                }}>
                  {[10, 25, 50].map((size) => <option key={size} value={size}>{size}</option>)}
                </select>
              </label>
              <div className="users-page-controls">
                <button type="button" className="page-nav-btn" disabled={currentUserPage === 1} onClick={() => setUserPage(currentUserPage - 1)}>
                  <ChevronRight size={15} /> السابق
                </button>
                <div className="page-numbers">
                  {userPageNumbers.map((page, index) => (
                    <React.Fragment key={page}>
                      {index > 0 && page - userPageNumbers[index - 1] > 1 && <span className="page-gap" aria-hidden="true">…</span>}
                      <button type="button" className={`page-num-btn ${page === currentUserPage ? "page-num-btn-active" : ""}`} aria-label={`الصفحة ${page}`} aria-current={page === currentUserPage ? "page" : undefined} onClick={() => setUserPage(page)}>
                        {page}
                      </button>
                    </React.Fragment>
                  ))}
                </div>
                <button type="button" className="page-nav-btn" disabled={currentUserPage === userPageCount} onClick={() => setUserPage(currentUserPage + 1)}>
                  التالي <ChevronLeft size={15} />
                </button>
              </div>
            </nav>
          )}
        </section>
      )}

      {tab === "permissions" && (
        <section className="card">
          <div className="card-head">
            <h3><ShieldCheck size={17} /> صلاحيات الوصول حسب الدور</h3>
          </div>

          <div className="perm-table-wrap">
            {roleNames.length === 0 ? (
              <EmptyState text="لا توجد أدوار بعد — أضف دوراً جديداً من الأسفل" />
            ) : (
            <table className="perm-table">
              <thead>
                <tr>
                  <th>القسم</th>
                  {roleNames.map((r) => (
                    <th key={r}>
                      <div className="perm-role-head">
                        <span>{roleLabel(r)}</span>
                        {roleNames.length > 1 && (
                          <button className="icon-btn-sm" title="حذف الدور" onClick={() => deleteRole(r)}>
                            <Trash2 size={12} />
                          </button>
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {PERMISSION_SECTIONS.map((s) => (
                  <tr key={s.id}>
                    <td className="perm-section-label">{s.label}</td>
                    {roleNames.map((r) => (
                      <td key={r} style={{ textAlign: "center" }}>
                        <input
                          type="checkbox"
                          className="perm-checkbox"
                          checked={!!roles[r]?.[s.id]}
                          onChange={() => togglePermission(r, s.id)}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            )}
          </div>

          <div className="add-role-row">
            <input
              className="text-input"
              placeholder="اسم دور جديد (مثال: أخصائي اجتماعي)"
              value={newRoleName}
              onChange={(e) => setNewRoleName(e.target.value)}
            />
            <button
              className="chip-btn"
              onClick={() => {
                addRole(newRoleName.trim());
                setNewRoleName("");
              }}
              disabled={!newRoleName.trim()}
            >
              <Plus size={15} /> إضافة دور
            </button>
          </div>
        </section>
      )}

      {tab === "periods" && (
        <section className="card">
          <div className="card-head">
            <h3><Clock size={17} /> إدارة أسماء الحصص</h3>
          </div>
          <PeriodManager periods={periods || []} addPeriod={addPeriod} deletePeriod={deletePeriod} />
        </section>
      )}

      {importOpen && <UserImportModal users={users} roles={roleNames} classes={classes || []} sections={sections || []} students={students || []} addUser={addUser} onClose={() => setImportOpen(false)} />}
      {userModal && (
        <UserModal
          user={userModal === "new" ? null : userModal}
          roles={roleNames}
          students={students}
          classes={classes}
          sections={sections}
          onClose={() => setUserModal(null)}
          onResetPassword={resetUserPassword}
          onSave={(data) => {
            if (userModal === "new") addUser(data);
            else updateUser(userModal.id, data);
            setUserModal(null);
          }}
        />
      )}
    </div>
  );
}
