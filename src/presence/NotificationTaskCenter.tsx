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




export function NotificationTaskCenter({ currentUser, showToast, onRefreshCount, onNavigate }) {
  const [notifications, setNotifications] = useState([]), [tasks, setTasks] = useState([]), [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("الكل"), [taskTitle, setTaskTitle] = useState(""), [taskDue, setTaskDue] = useState("");
  const load = useCallback(async () => {
    setLoading(true);
    const [nRes,tRes]=await Promise.all([
      supabase.from("notifications").select("*").eq("recipient_id",currentUser.id).order("created_at",{ascending:false}).limit(300),
      supabase.from("user_tasks").select("*").eq("assigned_to",currentUser.id).order("due_date",{ascending:true}).limit(300)
    ]);
    if(nRes.error) showToast?.(`تعذّر تحميل الإشعارات: ${nRes.error.message}`); if(tRes.error) showToast?.(`تعذّر تحميل المهام: ${tRes.error.message}`);
    setNotifications(nRes.data||[]); setTasks(tRes.data||[]); setLoading(false); onRefreshCount?.();
  },[currentUser,showToast,onRefreshCount]);
  useEffect(()=>{load()},[load]);
  const markRead=async id=>{await supabase.from("notifications").update({is_read:true,read_at:new Date().toISOString()}).eq("id",id);await load()};
  const markAll=async()=>{await supabase.from("notifications").update({is_read:true,read_at:new Date().toISOString()}).eq("recipient_id",currentUser.id).eq("is_read",false);await load()};
  const toggleTask=async t=>{await supabase.from("user_tasks").update({status:t.status==="منجزة"?"مفتوحة":"منجزة",completed_at:t.status==="منجزة"?null:new Date().toISOString()}).eq("id",t.id);await load()};
  const addTask=async()=>{if(!taskTitle.trim())return showToast?.("اكتب عنوان المهمة");const {error}=await supabase.from("user_tasks").insert({title:taskTitle.trim(),assigned_to:currentUser.id,created_by:currentUser.id,due_date:taskDue||null,status:"مفتوحة",priority:"متوسطة"});if(error)return showToast?.(`تعذّر حفظ المهمة: ${error.message}`);setTaskTitle("");setTaskDue("");showToast?.("تمت إضافة المهمة");await load()};
  const visible=notifications.filter(n=>filter==="الكل"||(filter==="غير مقروء"?!n.is_read:n.type===filter)); const open=tasks.filter(t=>t.status!=="منجزة"); const overdue=open.filter(t=>t.due_date&&t.due_date<todayISO());
  return <div className="view-stack">
    <section className="card"><div className="card-head"><h3><Bell size={18}/> مركز الإشعارات والمهام الذكية</h3><button className="chip-btn-outline" onClick={load}><Activity size={14}/> تحديث</button></div><div className="audit-note"><ShieldCheck size={16}/><span>كل مستخدم يرى إشعاراته ومهامه فقط. التنبيهات المرتبطة بالحالات تُنشأ تلقائيًا من قاعدة البيانات.</span></div></section>
    <div className="notify-kpis"><div><b>{notifications.filter(n=>!n.is_read).length}</b><span>غير مقروءة</span></div><div><b>{open.length}</b><span>مهام مفتوحة</span></div><div className="notify-danger"><b>{overdue.length}</b><span>متأخرة</span></div><div><b>{tasks.filter(t=>t.status==="منجزة").length}</b><span>منجزة</span></div></div>
    <section className="card"><div className="card-head"><h3><Plus size={17}/> مهمة شخصية جديدة</h3></div><div className="notify-task-form"><input className="text-input" value={taskTitle} onChange={e=>setTaskTitle(e.target.value)} placeholder="عنوان المهمة..."/><input type="date" className="text-input" value={taskDue} onChange={e=>setTaskDue(e.target.value)}/><button className="chip-btn" onClick={addTask}><Plus size={14}/> إضافة</button></div></section>
    <section className="card"><div className="card-head"><h3><ClipboardList size={17}/> مهامي</h3></div>{tasks.length?<div className="notify-list">{tasks.map(t=><div className={`notify-row ${t.due_date&&t.due_date<todayISO()&&t.status!=="منجزة"?"notify-overdue":""}`} key={t.id}><button className="icon-btn" onClick={()=>toggleTask(t)}>{t.status==="منجزة"?<Check size={18}/>:<Clock size={18}/>}</button><div><b>{t.title}</b><span>{t.due_date?`الاستحقاق: ${t.due_date}`:"بدون تاريخ استحقاق"}</span></div><span className="count-chip" style={{background:t.status==="منجزة"?"#2F9E6E":"#5B8DEF"}}>{t.status}</span></div>)}</div>:<EmptyState text="لا توجد مهام"/>}</section>
    <section className="card"><div className="card-head"><h3><Bell size={17}/> الإشعارات</h3><button className="chip-btn-outline" onClick={markAll}>تحديد الكل كمقروء</button></div><div className="analytics-preset-row"><button className="chip-btn-outline" onClick={()=>setFilter("الكل")}>الكل</button><button className="chip-btn-outline" onClick={()=>setFilter("غير مقروء")}>غير مقروء</button><button className="chip-btn-outline" onClick={()=>setFilter("إحالة")}>إحالات</button><button className="chip-btn-outline" onClick={()=>setFilter("متابعة")}>متابعات</button></div>{loading?<div className="empty-state">جارٍ التحميل...</div>:visible.length?<div className="notify-list">{visible.map(n=><div className={`notify-row ${!n.is_read?"notify-unread":""}`} key={n.id} onClick={()=>!n.is_read&&markRead(n.id)}><div className="notify-icon"><Bell size={16}/></div><div><b>{n.title}</b><p>{n.body}</p><span>{String(n.created_at||"").replace("T"," ").slice(0,16)}</span></div>{n.link_view&&<button className="chip-btn-outline" onClick={e=>{e.stopPropagation();markRead(n.id);onNavigate?.(n.link_view)}}>فتح</button>}</div>)}</div>:<EmptyState text="لا توجد إشعارات"/>}</section>
  </div>;
}
