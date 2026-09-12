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
import { EmptyState } from "./EmptyState";


/* ---------------------------------------------------------------
   بوابة ولي الأمر — متابعة قراءة فقط لأبناء ولي الأمر
--------------------------------------------------------------- */


export function ParentAcknowledgementCenter({
  students,
  violations,
  pledges,
  hudhudMessages,
  showToast,
}) {
  const [rows, setRows] = useState([]);
  const [guardians, setGuardians] = useState([]);
  const [loading, setLoading] = useState(true);
  const [classFilter, setClassFilter] = useState("الكل");
  const [typeFilter, setTypeFilter] = useState("الكل");
  const [statusFilter, setStatusFilter] = useState("الكل");
  const [search, setSearch] = useState("");
  const [deadlineHours, setDeadlineHours] = useState(48);

  const load = useCallback(async () => {
    setLoading(true);
    const [req, prof] = await Promise.all([
      supabase.from("parent_ack_requests").select("*").order("created_at",{ascending:false}),
      supabase.from("profiles").select("id,name,phone,email,role").eq("role","ولي أمر"),
    ]);
    if(req.error){ showToast?.(`تعذر تحميل الإقرارات: ${req.error.message}`); setRows([]); }
    else setRows(req.data||[]);
    setGuardians(prof.data||[]);
    setLoading(false);
  },[showToast]);

  useEffect(()=>{ load(); },[load]);

  const studentFor=id=>students.find(s=>s.id===id);
  const guardianFor=id=>guardians.find(g=>g.id===id);
  const classes=[...new Set<string>(students.map(s=>s.class).filter(Boolean))].sort();
  const now=new Date();

  const statusOf=r=>{
    if(r.status==="تم الإقرار") return "تم الإقرار";
    if(r.due_at && new Date(r.due_at)<now) return "متأخر";
    return r.status||"بانتظار الإقرار";
  };

  const filtered=rows.filter(r=>{
    const s=studentFor(r.student_id), g=guardianFor(r.guardian_id), st=statusOf(r);
    const q=search.trim();
    return (classFilter==="الكل"||s?.class===classFilter) &&
      (typeFilter==="الكل"||r.item_type===typeFilter) &&
      (statusFilter==="الكل"||st===statusFilter) &&
      (!q||String(s?.name||"").includes(q)||String(g?.name||"").includes(q));
  });

  const createRequest=async(itemType,itemId,studentId)=>{
    const {data:links,error:linkErr}=await supabase
      .from("guardian_children").select("guardian_id").eq("student_id",studentId);
    if(linkErr||!links?.length){ showToast?.("لا يوجد ولي أمر مربوط بهذا الطالب"); return; }
    const due=new Date(Date.now()+Number(deadlineHours||48)*3600000).toISOString();
    const payload=links.map(x=>({
      guardian_id:x.guardian_id,student_id:studentId,item_type:itemType,item_id:String(itemId),
      status:"بانتظار الإقرار",due_at:due
    }));
    const {error}=await supabase.from("parent_ack_requests").upsert(payload,{onConflict:"guardian_id,item_type,item_id"});
    if(error){showToast?.(`تعذر إنشاء طلب الإقرار: ${error.message}`);return;}
    showToast?.("تم إرسال طلب الإقرار لولي الأمر");
    load();
  };

  const sendReminder=async r=>{
    const {error}=await supabase.from("parent_ack_requests")
      .update({reminder_count:Number(r.reminder_count||0)+1,last_reminder_at:new Date().toISOString()})
      .eq("id",r.id);
    if(error){showToast?.(`تعذر تسجيل التذكير: ${error.message}`);return;}
    showToast?.("تم تسجيل تذكير جديد لولي الأمر");
    load();
  };

  const typeLabel={violation:"مخالفة",hudhud:"رسالة هدهد",pledge:"تعهد"};

  const candidates=[
    ...(violations||[]).slice(0,20).map(x=>({type:"violation",id:x.id,studentId:x.studentId,label:x.item||"مخالفة",date:x.date})),
    ...(pledges||[]).slice(0,20).map(x=>({type:"pledge",id:x.id,studentId:x.studentId,label:`تعهد ${x.type||""}`,date:x.date})),
    ...(hudhudMessages||[]).slice(0,20).map(x=>({type:"hudhud",id:x.id,studentId:x.studentId,label:x.subject||"رسالة هدهد",date:x.date})),
  ].sort((a,b)=>String(b.date||"").localeCompare(String(a.date||""))).slice(0,30);

  return <div className="view-stack">
    <section className="card">
      <div className="card-head"><h3><ShieldCheck size={18}/> متابعة إقرارات أولياء الأمور</h3></div>
      <div className="audit-note"><Clock size={16}/><span>متابعة الاستلام والإقرار والتنبيه عند تجاوز المهلة المحددة.</span></div>
    </section>

    <div className="ack-kpis">
      <div className="counselor-kpi"><b>{rows.length}</b><span>إجمالي الطلبات</span></div>
      <div className="counselor-kpi counselor-success"><b>{rows.filter(r=>statusOf(r)==="تم الإقرار").length}</b><span>تم الإقرار</span></div>
      <div className="counselor-kpi"><b>{rows.filter(r=>statusOf(r)==="بانتظار الإقرار").length}</b><span>بانتظار الرد</span></div>
      <div className="counselor-kpi counselor-danger"><b>{rows.filter(r=>statusOf(r)==="متأخر").length}</b><span>متأخر</span></div>
    </div>

    <section className="card">
      <div className="card-head"><h3>إنشاء طلب إقرار</h3><span className="att-sub">آخر السجلات القابلة للإرسال</span></div>
      <div className="ack-deadline"><span>مهلة الإقرار:</span><input type="number" min="1" className="text-input" value={deadlineHours} onChange={e=>setDeadlineHours(Number(e.target.value))}/><b>ساعة</b></div>
      <div className="ack-candidate-list">
        {candidates.map(c=>{const s=studentFor(c.studentId);return <div className="ack-candidate" key={`${c.type}-${c.id}`}>
          <div><b>{s?.name||"طالب"}</b><span>{typeLabel[c.type]} · {c.label} · {c.date||"—"}</span></div>
          <button className="chip-btn" onClick={()=>createRequest(c.type,c.id,c.studentId)}><Bell size={13}/> طلب إقرار</button>
        </div>})}
      </div>
    </section>

    <section className="card">
      <div className="report-filter-grid">
        <div><div className="field-label">بحث</div><input className="text-input" value={search} onChange={e=>setSearch(e.target.value)} placeholder="الطالب أو ولي الأمر..."/></div>
        <div><div className="field-label">الصف</div><select className="select-input" value={classFilter} onChange={e=>setClassFilter(e.target.value)}><option value="الكل">كل الصفوف</option>{classes.map(c=><option key={c}>{c}</option>)}</select></div>
        <div><div className="field-label">النوع</div><select className="select-input" value={typeFilter} onChange={e=>setTypeFilter(e.target.value)}><option value="الكل">كل الأنواع</option><option value="violation">مخالفة</option><option value="pledge">تعهد</option><option value="hudhud">رسالة هدهد</option></select></div>
        <div><div className="field-label">الحالة</div><select className="select-input" value={statusFilter} onChange={e=>setStatusFilter(e.target.value)}><option value="الكل">كل الحالات</option><option>بانتظار الإقرار</option><option>تم الإقرار</option><option>متأخر</option></select></div>
      </div>
    </section>

    <section className="card">
      <div className="card-head"><h3>سجل الإقرارات</h3><span className="count-chip" style={{background:"#1E2A4A"}}>{filtered.length}</span></div>
      {loading?<div className="empty-state">جارٍ التحميل...</div>:filtered.length===0?<EmptyState text="لا توجد إقرارات مطابقة"/>:
      <div className="parent-table-wrap"><table className="simple-table"><thead><tr><th>الطالب</th><th>ولي الأمر</th><th>النوع</th><th>تاريخ الطلب</th><th>المهلة</th><th>الحالة</th><th>الإجراء</th></tr></thead><tbody>
        {filtered.map(r=>{const s=studentFor(r.student_id),g=guardianFor(r.guardian_id),st=statusOf(r);return <tr key={r.id}>
          <td>{s?.name||"—"}<small className="ack-small">{s?.class||""}</small></td>
          <td>{g?.name||"—"}</td><td>{typeLabel[r.item_type]||r.item_type}</td>
          <td>{String(r.created_at||"").slice(0,16).replace("T"," ")}</td>
          <td>{String(r.due_at||"").slice(0,16).replace("T"," ")||"—"}</td>
          <td><span className="count-chip" style={{background:st==="تم الإقرار"?"#2F9E6E":st==="متأخر"?"#C7433F":"#D9A62E"}}>{st}</span></td>
          <td>{st!=="تم الإقرار"?<button className="chip-btn-outline" onClick={()=>sendReminder(r)}><Bell size={12}/> تذكير ({r.reminder_count||0})</button>:<span className="parent-ack-ok"><Check size={13}/> مكتمل</span>}</td>
        </tr>})}
      </tbody></table></div>}
    </section>
  </div>;
}
