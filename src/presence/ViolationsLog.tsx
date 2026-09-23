import { writeSchoolPrint } from "./schoolPrint";
import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Users, UserCheck, UserX, Clock, AlertTriangle, BarChart3, Bell,
  Search, Plus, X, Check, ChevronLeft, ChevronRight, Home, FileText,
  Send, ShieldAlert, GraduationCap, CalendarDays, Phone, Activity,
  ClipboardList, TrendingUp, Filter, Eye, Star, PenLine,
  Printer, PlayCircle, History as HistoryIcon, Settings, UserPlus,
  Trash2, Pencil, Lock, Mail, ShieldCheck, Save, Bird, MessageCircle, LogOut
} from "lucide-react";
import { DEGREES, LOG_PAGE_SIZE, todayISO } from "./shared";
import { EmptyState } from "./EmptyState";
import { SeverityGauge } from "./SeverityGauge";
import { useRecordAuthors } from "./useRecordAuthors";


export function ViolationsLog({ violations, setMsgPreview, classes, currentUser, updateViolationFollowupStatus }) {
  const [filterDegree, setFilterDegree] = useState(0);
  const [filterClass, setFilterClass] = useState("الكل");
  const [filterStatus, setFilterStatus] = useState("الكل");
  const [filterDate, setFilterDate] = useState(
    ["معلم", "مرشد طلابي", "مدير النظام"].includes(currentUser?.role)
      ? todayISO()
      : ""
  );
  const [page, setPage] = useState(1);

  const isTeacher = currentUser?.role === "معلم";
  const isSupervisor = currentUser?.role === "مشرف سلوكي";
  const { names: authorNames, error: authorsError } = useRecordAuthors(isSupervisor, "violations", violations.map((v) => v.createdBy));
  const authorName = (v) => authorNames[v.createdBy] || (v.teacherName !== "—" && v.teacherName) || "غير متاح";
  const isCounselor = currentUser?.role === "مرشد طلابي";
  const isAdmin = currentUser?.role === "مدير النظام";
  const canUseDatePrint = isTeacher || isCounselor || isAdmin || isSupervisor;
  const statuses = ["مخالفة جديدة", "تمت متابعتها", "محولة إلى الأخصائي الاجتماعي"];

  const filtered = violations.filter(
    (v) =>
      (filterDegree === 0 || v.degree === filterDegree) &&
      (filterClass === "الكل" || v.class === filterClass) &&
      (!filterDate || v.date === filterDate) &&
      (filterStatus === "الكل" || (v.followupStatus || "مخالفة جديدة") === filterStatus)
  );

  // إعادة الصفحة إلى ١ كلما تغيّرت الفلاتر أو تغيّر عدد المخالفات
  useEffect(() => {
    setPage(1);
  }, [filterDegree, filterClass, filterStatus, filterDate, violations.length]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / LOG_PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageItems = filtered.slice((safePage - 1) * LOG_PAGE_SIZE, safePage * LOG_PAGE_SIZE);

  const esc = (value) =>
    String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");

  const repeatCount = (v) =>
    violations.filter((x) => x.studentId === v.studentId && x.item === v.item).length || 1;

  const openPrintWindow = (title, bodyHtml) => {
    const w = window.open("", "_blank", "width=980,height=760");
    if (!w) return;
    writeSchoolPrint(w, `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"/>
      <title>${esc(title)}</title>
      <style>
        @page{size:A4;margin:13mm} *{box-sizing:border-box}
        body{font-family:Tahoma,Arial,sans-serif;color:#111;background:#fff;margin:0;font-size:13px;line-height:1.7}
        .sheet{max-width:190mm;margin:0 auto}.doc-head{border:1.7px solid #111;padding:8px 14px;margin-bottom:7px;position:relative;min-height:92px}
        .school{text-align:center;font-weight:800;font-size:18px;text-decoration:underline}.doc-title{text-align:center;font-size:20px;font-weight:900;margin-top:8px}
        .emblem{position:absolute;right:16px;top:14px;width:62px;height:62px;border:2px solid #8d1734;border-radius:50%;display:flex;align-items:center;justify-content:center;text-align:center;font-size:9px;font-weight:800}
        .head-meta{display:flex;justify-content:space-between;margin-top:8px;font-weight:700;font-size:11px}
        table{width:100%;border-collapse:collapse;margin-top:5px}td,th{border:1.2px solid #111;padding:4px 7px;vertical-align:top}th{background:#f4f4f4;font-weight:800}
        .label{font-weight:800;white-space:nowrap}.section{margin:10px 0}.section-title{font-weight:900;margin-bottom:4px}.lines{min-height:82px;line-height:2.05;background:repeating-linear-gradient(to bottom,transparent 0,transparent 25px,#777 26px)}
        .actions td{height:28px}.actions .n{width:42px;text-align:center;font-weight:800}.sign-row{display:flex;justify-content:space-between;gap:25px;margin-top:30px;text-align:center;font-weight:700}.sign{flex:1}.dots{display:block;margin-top:14px;letter-spacing:2px}
        .note{font-size:11px;margin-top:10px}.check{font-size:16px}.strong{font-weight:900}.center{text-align:center}
        @media print{body{font-size:12px}.sheet{max-width:none}.no-print{display:none!important}}
      </style></head><body><div class="sheet">${bodyHtml}</div></body></html>`);

  };

  const printIncidentReport = (v) => {
    const count = repeatCount(v);
    openPrintWindow("إثبات واقعة", `
      <div class="doc-head">
        
        <div class="school">مدرسة عمر بن عبد العزيز الثانوية للبنين</div>
        <div class="doc-title">إثبات واقعة</div>
        <div class="head-meta"><span>رقم الواقعة: ${esc(v.id)}</span><span>التاريخ: ${esc(v.date)}</span></div>
      </div>
      <table>
        <tr><td class="label">اسم الطالب</td><td>${esc(v.studentName)}</td><td class="label">الصف / الشعبة</td><td>${esc(v.class)} / ${esc(v.section)}</td></tr>
        <tr><td class="label">المخالفة</td><td colspan="3">${esc(v.item)}</td></tr>
        <tr><td class="label">الحصة / الفترة</td><td>${esc(v.period || "—")}</td><td class="label">الدرجة</td><td>${esc(DEGREES[v.degree]?.label || v.degree)}</td></tr>
      </table>
      <div class="section"><span class="label">عدد مرات تكرار المخالفة: </span><span class="strong">${count}</span></div>
      <div class="section"><div class="section-title">خلفية الموضوع:</div><div>${esc(v.description || v.item)}</div></div>
      <div class="section"><div class="section-title">الإجراءات الأولية التي تمت:</div><div class="lines">${esc(v.action || "")}</div></div>
      <div class="section center strong">إخطار ولي الأمر بالواقعة والإجراء التالي لما بعد الواقعة: تم ( <span class="check">✓</span> ) &nbsp;&nbsp; لم يتم ( &nbsp; )</div>
      <div class="sign-row"><div class="sign">اسم الطالب<br/>${esc(v.studentName)}<span class="dots">............................</span></div><div class="sign">المعلم / محرر الواقعة<span class="dots">............................</span></div><div class="sign">منسق شؤون الطلاب<span class="dots">............................</span></div></div>
    `);
  };

  const printSocialWorkerReferral = (v) => {
    const count = repeatCount(v);
    const actions = ["عمل إثبات واقعة", "التنبيه الشفوي", "تنبيه كتابي", "إشعار ولي الأمر", "استدعاء ولي الأمر", "تحويل إلى الأخصائي الاجتماعي"];
    openPrintWindow("تحويل إلى الأخصائي الاجتماعي", `
      <div class="doc-head">
        
        <div class="school">مدرسة عمر بن عبد العزيز الثانوية للبنين</div>
        <div class="doc-title" style="font-size:16px">تحويل من منسق شؤون الطلاب إلى الأخصائي الاجتماعي</div>
        <div class="head-meta"><span>رقم المخالفة: ${esc(v.id)}</span><span>التاريخ: ${esc(v.date)}</span></div>
      </div>
      <table>
        <tr><td class="label">اسم الطالب</td><td>${esc(v.studentName)}</td><td class="label">الصف / الشعبة</td><td>${esc(v.class)} / ${esc(v.section)}</td></tr>
        <tr><td class="label">المخالفة</td><td colspan="3">${esc(v.item)}</td></tr>
        <tr><td class="label">الحصة / الفترة</td><td>${esc(v.period || "—")}</td><td class="label">الدرجة</td><td>${esc(DEGREES[v.degree]?.label || v.degree)}</td></tr>
      </table>
      <div class="section"><span class="label">عدد مرات تكرار المخالفة: </span><span class="strong">${count}</span></div>
      <div class="section"><div class="section-title">خلفية الموضوع:</div><div>${esc(v.description || v.item)}</div></div>
      <table class="actions"><tr><th>الإجراء الذي تم</th><th class="n">م</th><th>إجراء الأخصائي الاجتماعي</th></tr>${actions.map((a,i)=>`<tr><td>${esc(a)}${a === v.action ? " ✓" : ""}</td><td class="n">${i+1}</td><td></td></tr>`).join("")}</table>
      <div class="sign-row"><div class="sign">منسق شؤون الطلاب<span class="dots">............................</span></div><div class="sign">الأخصائي الاجتماعي<span class="dots">............................</span></div><div class="sign">منسق شؤون الطلاب<span class="dots">............................</span></div></div>
    `);
  };


  const printFilteredViolations = () => {
    const dateTitle = filterDate
      ? `تاريخ: ${esc(filterDate)}`
      : "جميع التواريخ";

    const classTitle =
      filterClass === "الكل" ? "كل الصفوف" : `الصف ${esc(filterClass)}`;

    const degreeTitle =
      filterDegree === 0 ? "كل الدرجات" : esc(DEGREES[filterDegree]?.label || filterDegree);

    const rowsHtml = filtered.length
      ? filtered.map((v, index) => `
          <tr>
            <td class="center">${index + 1}</td>
            <td>${esc(v.date)}</td>
            <td>${esc(v.studentName || "—")}</td>
            <td>${esc(v.class || "—")}</td>
            <td>${esc(DEGREES[v.degree]?.label || v.degree)}</td>
            <td>${esc(v.item || "—")}</td>
            <td>${esc(v.period || "—")}</td>
            <td>${esc(v.action || "—")}</td>
            ${isSupervisor ? `<td>${esc(authorName(v))}</td>` : ""}
          </tr>
        `).join("")
      : `<tr><td colspan="${isSupervisor ? 9 : 8}" class="center">لا توجد مخالفات مطابقة للفلاتر المحددة</td></tr>`;

    openPrintWindow("سجل المخالفات", `
      <div class="doc-head">
        
        <div class="school">مدرسة عمر بن عبد العزيز الثانوية للبنين</div>
        <div class="doc-title">سجل المخالفات</div>
        <div class="head-meta">
          <span>${dateTitle}</span>
          <span>${classTitle}</span>
          <span>${degreeTitle}</span>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>م</th>
            <th>التاريخ</th>
            <th>اسم الطالب</th>
            <th>الصف</th>
            <th>الدرجة</th>
            <th>المخالفة</th>
            <th>الحصة</th>
            <th>الإجراء</th>
            ${isSupervisor ? "<th>سجّل المخالفة</th>" : ""}
          </tr>
        </thead>
        <tbody>${rowsHtml}</tbody>
      </table>

      <div class="note">
        عدد السجلات: <span class="strong">${filtered.length}</span>
      </div>
    `);
  };

  return (
    <div className="view-stack">
      <div className="card">
        <div className="card-head">
          <h3><ClipboardList size={17} /> سجلّ المخالفات ({filtered.length})</h3>
          <div className="filters">
            <Filter size={15} />
            <select className="select-input select-inline" value={filterDegree} onChange={(e) => setFilterDegree(Number(e.target.value))}>
              <option value={0}>كل الدرجات</option>
              {[1, 2, 3, 4].map((d) => <option key={d} value={d}>{DEGREES[d].label}</option>)}
            </select>
            <select className="select-input select-inline" value={filterClass} onChange={(e) => setFilterClass(e.target.value)}>
              <option value="الكل">كل الصفوف</option>
              {classes.map((c) => <option key={c} value={c}>الصف {c}</option>)}
            </select>

            {canUseDatePrint && (
              <>
                <input
                  type="date"
                  className="text-input select-inline"
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                  title="فلترة المخالفات حسب اليوم"
                  style={{ minWidth: 150 }}
                />
                <button
                  type="button"
                  className="chip-btn-outline"
                  onClick={() => setFilterDate(todayISO())}
                >
                  اليوم
                </button>
                <button
                  type="button"
                  className="chip-btn-outline"
                  onClick={() => setFilterDate("")}
                >
                  كل الأيام
                </button>
                <button
                  type="button"
                  className="chip-btn"
                  onClick={printFilteredViolations}
                  style={{ background: "#1E2A4A" }}
                  title="طباعة السجلات الظاهرة"
                >
                  <Printer size={14} /> طباعة السجل
                </button>
              </>
            )}

            {isCounselor && (
              <select className="select-input select-inline" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                <option value="الكل">كل حالات المتابعة</option>
                {statuses.map((st) => <option key={st} value={st}>{st}</option>)}
              </select>
            )}
          </div>
        </div>

        {authorsError && <p role="alert">{authorsError}</p>}
        {filtered.length === 0 ? <EmptyState text="لا توجد مخالفات مطابقة" /> : (
          <>
            <div className="log-list">
              {pageItems.map((v) => {
                const currentStatus = v.followupStatus || "مخالفة جديدة";
                return (
                  <div key={v.id} className="log-card" style={{ borderInlineStartColor: DEGREES[v.degree].color }}>
                    <div className="log-top">
                      <SeverityGauge degree={v.degree} />
                      <div className="log-title"><b>{v.studentName}</b> — الصف {v.class} / {v.section}</div>
                      <div className="log-date">{v.date} · {v.time}</div>
                    </div>
                    <div className="log-item">{v.item}</div>
                    <div className="log-desc">{v.description}</div>
                    {isSupervisor && <div className="log-desc"><b>سجّل المخالفة:</b> {authorName(v)}</div>}
                    <div className="log-bottom">
                      <span className="log-action">الإجراء: {v.action}</span>
                      {v.notified && <button className="notified-chip" onClick={() => setMsgPreview(v)}><Bell size={13} /> تم إبلاغ ولي الأمر <Eye size={13} /></button>}
                    </div>

                    {isCounselor && (
                      <div style={{ marginTop: 12, borderTop: "1px solid #ecefea", paddingTop: 12 }}>
                        <div style={{ fontSize: 12, fontWeight: 800, marginBottom: 8 }}>حالة المتابعة الحالية: <span>{currentStatus}</span></div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
                          <button onClick={() => updateViolationFollowupStatus(v.id, "مخالفة جديدة")} style={{ border: 0, borderRadius: 8, padding: "8px 12px", cursor: "pointer", fontWeight: 800, background: "#dc2626", color: "#fff", opacity: currentStatus === "مخالفة جديدة" ? 1 : .7 }}>مخالفة جديدة</button>
                          <button onClick={() => updateViolationFollowupStatus(v.id, "تمت متابعتها")} style={{ border: 0, borderRadius: 8, padding: "8px 12px", cursor: "pointer", fontWeight: 800, background: "#16a34a", color: "#fff", opacity: currentStatus === "تمت متابعتها" ? 1 : .7 }}>تمت متابعتها</button>
                          <button onClick={() => updateViolationFollowupStatus(v.id, "محولة إلى الأخصائي الاجتماعي")} style={{ border: 0, borderRadius: 8, padding: "8px 12px", cursor: "pointer", fontWeight: 800, background: "#f59e0b", color: "#fff", opacity: currentStatus === "محولة إلى الأخصائي الاجتماعي" ? 1 : .7 }}>محولة إلى الأخصائي الاجتماعي</button>
                          <button onClick={() => printSocialWorkerReferral(v)} style={{ border: 0, borderRadius: 8, padding: "8px 12px", cursor: "pointer", fontWeight: 800, background: "#2563eb", color: "#fff", display: "inline-flex", alignItems: "center", gap: 5 }}><Printer size={14}/> طباعة التحويل</button>
                          <button onClick={() => printIncidentReport(v)} style={{ border: 0, borderRadius: 8, padding: "8px 12px", cursor: "pointer", fontWeight: 800, background: "#475569", color: "#fff", display: "inline-flex", alignItems: "center", gap: 5 }}><Printer size={14}/> طباعة إثبات واقعة</button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {totalPages > 1 && (
              <div className="log-pagination">
                <button
                  className="page-nav-btn"
                  disabled={safePage <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  <ChevronRight size={15} /> السابق
                </button>

                <div className="page-numbers">
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter((n) => n === 1 || n === totalPages || Math.abs(n - safePage) <= 1)
                    .reduce((acc, n, idx, arr) => {
                      if (idx > 0 && n - arr[idx - 1] > 1) acc.push("...");
                      acc.push(n);
                      return acc;
                    }, [])
                    .map((n, i) =>
                      n === "..." ? (
                        <span key={`gap-${i}`} className="page-gap">…</span>
                      ) : (
                        <button
                          key={n}
                          className={`page-num-btn ${n === safePage ? "page-num-btn-active" : ""}`}
                          onClick={() => setPage(n)}
                        >
                          {n}
                        </button>
                      )
                    )}
                </div>

                <button
                  className="page-nav-btn"
                  disabled={safePage >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  التالي <ChevronLeft size={15} />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
