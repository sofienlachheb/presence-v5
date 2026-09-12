import React, { useState, useEffect, useMemo, useCallback } from "react";
import { supabase } from "../supabaseClient";
import {
  Users, UserCheck, UserX, Clock, AlertTriangle, BarChart3, Bell,
  Search, Plus, X, Check, ChevronLeft, ChevronRight, Home, FileText,
  Send, ShieldAlert, GraduationCap, CalendarDays, Phone, Activity,
  ClipboardList, TrendingUp, Filter, Eye, Star, PenLine,
  Printer, PlayCircle, History as HistoryIcon, Settings, UserPlus,
  Trash2, Pencil, Lock, Mail, ShieldCheck, Save, Bird, MessageCircle, LogOut
} from "lucide-react";
import { todayISO } from "./shared";
import { EmptyState } from "./EmptyState";


export function CounselorDashboard({
  students,
  attendance,
  violations,
  periodicEvaluations,
  guardianContacts,
  currentUser,
  showToast,
  onOpenStudent,
}) {
  const [cases, setCases] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("الكل");
  const [priorityFilter, setPriorityFilter] = useState("الكل");
  const [search, setSearch] = useState("");
  const [selectedCaseId, setSelectedCaseId] = useState("");
  const [sessionType, setSessionType] = useState("جلسة فردية");
  const [sessionNote, setSessionNote] = useState("");
  const [sessionAction, setSessionAction] = useState("");
  const [nextDate, setNextDate] = useState("");
  const [closeResult, setCloseResult] = useState("تحسن جزئي");

  const isAdmin = currentUser?.role === "مدير النظام";
  const isCounselor = currentUser?.role === "مرشد طلابي";
  const today = todayISO();

  const loadCounselorData = useCallback(async () => {
    setLoading(true);

    let q = supabase
      .from("counselor_cases")
      .select("*")
      .order("created_at", { ascending: false });

    if (isCounselor) {
      q = q.or(`assigned_to.eq.${currentUser.id},assigned_to.is.null`);
    }

    const [casesRes, sessionsRes] = await Promise.all([
      q,
      supabase
        .from("counseling_sessions")
        .select("*")
        .order("session_at", { ascending: false }),
    ]);

    if (casesRes.error) {
      console.error("Counselor cases load error:", casesRes.error);
      showToast?.(`تعذّر تحميل حالات منسق شؤون الطلاب: ${casesRes.error.message}`);
      setCases([]);
    } else {
      setCases(casesRes.data || []);
    }

    if (sessionsRes.error) {
      console.error("Counseling sessions load error:", sessionsRes.error);
      setSessions([]);
    } else {
      setSessions(sessionsRes.data || []);
    }

    setLoading(false);
  }, [currentUser, isCounselor, showToast]);

  useEffect(() => {
    loadCounselorData();
  }, [loadCounselorData]);

  const studentFor = (id) => students.find((s) => s.id === id);

  const filtered = useMemo(() => {
    const q = search.trim();
    return cases.filter((c) => {
      const st = studentFor(c.student_id);
      return (
        (statusFilter === "الكل" || c.status === statusFilter) &&
        (priorityFilter === "الكل" || c.priority === priorityFilter) &&
        (!q ||
          String(st?.name || "").includes(q) ||
          String(st?.studentNumber || "").includes(q) ||
          String(c.referral_reason || "").includes(q))
      );
    });
  }, [cases, students, search, statusFilter, priorityFilter]);

  const counts = {
    new: cases.filter((c) => c.status === "جديدة").length,
    open: cases.filter((c) => c.status !== "مغلقة").length,
    overdue: cases.filter(
      (c) =>
        c.status !== "مغلقة" &&
        c.next_followup_date &&
        c.next_followup_date < today
    ).length,
    closed: cases.filter((c) => c.status === "مغلقة").length,
  };

  const claimCase = async (id) => {
    const { error } = await supabase
      .from("counselor_cases")
      .update({
        assigned_to: currentUser.id,
        status: "قيد المتابعة",
        started_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) {
      showToast?.(`تعذّر استلام الحالة: ${error.message}`);
      return;
    }
    showToast?.("تم استلام الحالة");
    await loadCounselorData();
  };

  const saveSession = async () => {
    if (!selectedCaseId || !sessionNote.trim()) {
      showToast?.("اختر الحالة واكتب ملاحظات الجلسة");
      return;
    }

    const c = cases.find((x) => x.id === selectedCaseId);
    if (!c) return;

    const { error } = await supabase.from("counseling_sessions").insert({
      case_id: c.id,
      student_id: c.student_id,
      counselor_id: currentUser.id,
      session_type: sessionType,
      notes: sessionNote.trim(),
      action_taken: sessionAction.trim() || null,
      next_followup_date: nextDate || null,
    });

    if (error) {
      showToast?.(`تعذّر حفظ الجلسة: ${error.message}`);
      return;
    }

    await supabase
      .from("counselor_cases")
      .update({
        status: "قيد المتابعة",
        assigned_to: c.assigned_to || currentUser.id,
        next_followup_date: nextDate || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", c.id);

    setSessionNote("");
    setSessionAction("");
    setNextDate("");
    showToast?.("تم حفظ جلسة الإرشاد");
    await loadCounselorData();
  };

  const closeCase = async (id) => {
    const { error } = await supabase
      .from("counselor_cases")
      .update({
        status: "مغلقة",
        outcome: closeResult,
        closed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) {
      showToast?.(`تعذّر إغلاق الحالة: ${error.message}`);
      return;
    }

    showToast?.("تم إغلاق الحالة وتسجيل النتيجة");
    await loadCounselorData();
  };

  const timelineFor = (caseRow) => {
    const stId = caseRow.student_id;
    const items = [];

    (violations || [])
      .filter((v) => v.studentId === stId)
      .forEach((v) =>
        items.push({
          date: v.date,
          type: "مخالفة",
          text: `${v.item || "مخالفة"} — الدرجة ${v.degree}`,
        })
      );

    (periodicEvaluations || [])
      .filter((e) => e.studentId === stId)
      .forEach((e) =>
        items.push({
          date: e.date,
          type: "تقييم",
          text: `${e.subject || "تقييم دوري"} — ${e.overallRating || e.rating || "—"}`,
        })
      );

    sessions
      .filter((s) => s.case_id === caseRow.id)
      .forEach((s) =>
        items.push({
          date: String(s.session_at || "").slice(0, 10),
          type: "جلسة إرشاد",
          text: `${s.session_type} — ${s.action_taken || s.notes || ""}`,
        })
      );

    (guardianContacts || [])
      .filter((c) => c.studentId === stId)
      .forEach((c) =>
        items.push({
          date: String(c.contactAt || "").slice(0, 10),
          type: "ولي الأمر",
          text: `${c.channel || "تواصل"} — ${c.outcome || ""}`,
        })
      );

    items.push({
      date: String(caseRow.created_at || "").slice(0, 10),
      type: "إحالة",
      text: caseRow.referral_reason || "إحالة لمنسق شؤون الطلاب",
    });

    return items
      .filter((x) => x.date)
      .sort((a, b) => String(b.date).localeCompare(String(a.date)));
  };

  const selectedCase = cases.find((c) => c.id === selectedCaseId);

  if (!["مدير النظام", "مرشد طلابي"].includes(currentUser?.role)) {
    return <EmptyState text="لوحة منسق شؤون الطلاب غير متاحة لهذا الدور" />;
  }

  return (
    <div className="view-stack">
      <section className="card">
        <div className="card-head">
          <h3><Users size={18}/> لوحة منسق شؤون الطلاب الذكية</h3>
          <button className="chip-btn-outline" onClick={loadCounselorData}>
            <Activity size={14}/> تحديث
          </button>
        </div>
        <div className="audit-note">
          <ShieldCheck size={16}/>
          <span>
            الملاحظات الإرشادية التفصيلية مخصصة لمنسق شؤون الطلاب والإدارة. المعلم لا يصل إلى محتوى الجلسات الداخلية.
          </span>
        </div>
      </section>

      <div className="counselor-kpis">
        <div className="counselor-kpi"><b>{counts.new}</b><span>حالات جديدة</span></div>
        <div className="counselor-kpi"><b>{counts.open}</b><span>مفتوحة</span></div>
        <div className="counselor-kpi counselor-danger"><b>{counts.overdue}</b><span>متأخرة</span></div>
        <div className="counselor-kpi counselor-success"><b>{counts.closed}</b><span>مغلقة</span></div>
      </div>

      <section className="card">
        <div className="report-filter-grid">
          <div>
            <div className="field-label">بحث</div>
            <input className="text-input" value={search} onChange={(e)=>setSearch(e.target.value)} placeholder="اسم الطالب أو سبب الإحالة..." />
          </div>
          <div>
            <div className="field-label">الحالة</div>
            <select className="select-input" value={statusFilter} onChange={(e)=>setStatusFilter(e.target.value)}>
              <option value="الكل">كل الحالات</option>
              <option>جديدة</option>
              <option>قيد المتابعة</option>
              <option>مغلقة</option>
            </select>
          </div>
          <div>
            <div className="field-label">الأولوية</div>
            <select className="select-input" value={priorityFilter} onChange={(e)=>setPriorityFilter(e.target.value)}>
              <option value="الكل">كل الأولويات</option>
              <option>عالية</option>
              <option>متوسطة</option>
              <option>منخفضة</option>
            </select>
          </div>
        </div>
      </section>

      <section className="card">
        <div className="card-head"><h3><ClipboardList size={17}/> صندوق حالات منسق شؤون الطلاب</h3></div>
        {loading ? (
          <div className="empty-state">جارٍ تحميل الحالات...</div>
        ) : filtered.length === 0 ? (
          <EmptyState text="لا توجد حالات مطابقة" />
        ) : (
          <div className="counselor-case-list">
            {filtered.map((c) => {
              const st = studentFor(c.student_id);
              const overdue =
                c.status !== "مغلقة" &&
                c.next_followup_date &&
                c.next_followup_date < today;
              return (
                <div className={`counselor-case ${overdue ? "counselor-case-overdue" : ""}`} key={c.id}>
                  <div className="counselor-case-head">
                    <div>
                      <b>{st?.name || "طالب غير معروف"}</b>
                      <span>الصف {st?.class || "—"}{st?.section ? ` / ${st.section}` : ""}</span>
                    </div>
                    <div className="case-center-badges">
                      <span className="count-chip" style={{background:c.priority==="عالية"?"#C7433F":c.priority==="متوسطة"?"#E07B39":"#D9A62E"}}>{c.priority}</span>
                      <span className="count-chip" style={{background:c.status==="مغلقة"?"#2F9E6E":"#5B8DEF"}}>{c.status}</span>
                      {overdue && <span className="count-chip" style={{background:"#C7433F"}}>متأخرة</span>}
                    </div>
                  </div>

                  <div className="counselor-reason"><b>سبب الإحالة:</b> {c.referral_reason || "—"}</div>
                  <div className="early-metrics">
                    <span>المصدر <b>{c.source || "—"}</b></span>
                    <span>المتابعة القادمة <b>{c.next_followup_date || "غير محدد"}</b></span>
                    {c.outcome && <span>النتيجة <b>{c.outcome}</b></span>}
                  </div>

                  <div className="case-center-actions">
                    <button className="chip-btn-outline" onClick={()=>onOpenStudent?.(c.student_id)}><Eye size={14}/> ملف الطالب</button>
                    <button className="chip-btn-outline" onClick={()=>setSelectedCaseId(c.id)}><HistoryIcon size={14}/> الخط الزمني / جلسة</button>
                    {!c.assigned_to && isCounselor && c.status!=="مغلقة" && (
                      <button className="chip-btn" onClick={()=>claimCase(c.id)}><UserCheck size={14}/> استلام الحالة</button>
                    )}
                    {c.status!=="مغلقة" && (
                      <>
                        <select className="select-input compact-select" value={closeResult} onChange={(e)=>setCloseResult(e.target.value)}>
                          <option>تحسن واضح</option>
                          <option>تحسن جزئي</option>
                          <option>لم يتحسن بعد</option>
                          <option>أحيل لجهة أخرى</option>
                        </select>
                        <button className="chip-btn" style={{background:"#2F9E6E"}} onClick={()=>closeCase(c.id)}><Check size={14}/> إغلاق الحالة</button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {selectedCase && (
        <>
          <section className="card">
            <div className="card-head"><h3><HistoryIcon size={17}/> الخط الزمني للحالة</h3></div>
            <div className="counselor-timeline">
              {timelineFor(selectedCase).slice(0,20).map((item,i)=>(
                <div className="counselor-timeline-item" key={`${item.date}-${i}`}>
                  <span className="timeline-dot"/>
                  <div><b>{item.type}</b><span>{item.date}</span><p>{item.text}</p></div>
                </div>
              ))}
            </div>
          </section>

          {selectedCase.status !== "مغلقة" && (
            <section className="card">
              <div className="card-head"><h3><PenLine size={17}/> تسجيل جلسة إرشاد</h3></div>
              <div className="report-filter-grid">
                <div>
                  <div className="field-label">نوع الجلسة</div>
                  <select className="select-input" value={sessionType} onChange={(e)=>setSessionType(e.target.value)}>
                    <option>جلسة فردية</option>
                    <option>جلسة متابعة</option>
                    <option>جلسة مع ولي الأمر</option>
                    <option>جلسة جماعية</option>
                    <option>مقابلة سلوكية</option>
                  </select>
                </div>
                <div>
                  <div className="field-label">موعد المتابعة القادمة</div>
                  <input type="date" className="text-input" value={nextDate} onChange={(e)=>setNextDate(e.target.value)} />
                </div>
              </div>
              <div className="field-label">ملاحظات الجلسة</div>
              <textarea className="textarea-input" rows={4} value={sessionNote} onChange={(e)=>setSessionNote(e.target.value)} placeholder="ملاحظات منسق شؤون الطلاب الداخلية..." />
              <div className="field-label">الإجراء المتخذ</div>
              <input className="text-input" value={sessionAction} onChange={(e)=>setSessionAction(e.target.value)} placeholder="مثال: خطة متابعة أسبوعية، تواصل مع ولي الأمر..." />
              <button className="submit-btn" onClick={saveSession}><Save size={15}/> حفظ الجلسة</button>
            </section>
          )}
        </>
      )}
    </div>
  );
}
