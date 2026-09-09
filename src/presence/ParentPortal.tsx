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
import { Avatar } from "./Avatar";
import { StatCard } from "./StatCard";
import { DEGREES, fmtDate } from "./shared";


export function ParentPortal({
  currentUser,
  students,
  attendance,
  violations,
  evaluations,
  periodicEvaluations,
  pledges,
  hudhudMessages,
  markHudhudRead,
  showToast,
}) {
  const children = students.filter((s) =>
    (currentUser?.childStudentIds || []).includes(s.id)
  );

  const [activeChildId, setActiveChildId] = useState(children[0]?.id || null);
  const [tab, setTab] = useState("overview");
  const [acks, setAcks] = useState([]);
  const [ackRequests, setAckRequests] = useState([]);
  const [loadingAcks, setLoadingAcks] = useState(false);

  useEffect(() => {
    if (!activeChildId && children[0]?.id) {
      setActiveChildId(children[0].id);
    }
  }, [activeChildId, children]);

  const child = children.find((c) => c.id === activeChildId) || children[0];

  const loadAcknowledgements = useCallback(async () => {
    if (!currentUser?.id || currentUser?.role !== "ولي أمر") return;
    setLoadingAcks(true);
    const [{ data, error }, reqRes] = await Promise.all([
      supabase
        .from("parent_acknowledgements")
        .select("*")
        .eq("guardian_id", currentUser.id)
        .order("acknowledged_at", { ascending: false }),
      supabase
        .from("parent_ack_requests")
        .select("*")
        .eq("guardian_id", currentUser.id)
        .order("created_at", { ascending: false }),
    ]);

    if (error) {
      console.error("Parent acknowledgements load error:", error);
      setAcks([]);
    } else {
      setAcks(data || []);
    }
    if (reqRes.error) {
      console.error("Parent acknowledgement requests load error:", reqRes.error);
      setAckRequests([]);
    } else {
      setAckRequests(reqRes.data || []);
    }
    setLoadingAcks(false);
  }, [currentUser]);

  useEffect(() => {
    loadAcknowledgements();
  }, [loadAcknowledgements]);

  const acknowledge = async (itemType, itemId, studentId) => {
    if (currentUser?.role !== "ولي أمر") {
      showToast?.("تأكيد الاستلام متاح لولي الأمر فقط");
      return;
    }

    const { error } = await supabase
      .from("parent_acknowledgements")
      .upsert(
        {
          guardian_id: currentUser.id,
          student_id: studentId,
          item_type: itemType,
          item_id: String(itemId),
          acknowledged_at: new Date().toISOString(),
        },
        { onConflict: "guardian_id,item_type,item_id" }
      );

    if (error) {
      showToast?.(`تعذّر تأكيد الاستلام: ${error.message}`);
      return;
    }

    await supabase
      .from("parent_ack_requests")
      .update({ status: "تم الإقرار", acknowledged_at: new Date().toISOString() })
      .eq("guardian_id", currentUser.id)
      .eq("item_type", itemType)
      .eq("item_id", String(itemId));

    if (itemType === "hudhud") {
      await markHudhudRead?.(itemId);
    }

    showToast?.("تم تأكيد الإقرار والاستلام");
    await loadAcknowledgements();
  };

  const isAcknowledged = (itemType, itemId) =>
    acks.some(
      (a) =>
        a.item_type === itemType &&
        String(a.item_id) === String(itemId)
    );

  if (currentUser?.role !== "ولي أمر") {
    return (
      <div className="view-stack">
        <EmptyState text="بوابة ولي الأمر متاحة لحسابات أولياء الأمور فقط" />
      </div>
    );
  }

  if (children.length === 0) {
    return (
      <div className="view-stack">
        <EmptyState text="لم يتم ربط أي طالب بحساب ولي الأمر هذا بعد. يرجى مراجعة إدارة النظام لربط أبنائك بالحساب." />
      </div>
    );
  }

  // الحضور مخزن بالشكل: التاريخ ← الحصة ← الطالب.
  const childAttendance = [];
  Object.entries(attendance || {}).forEach(([date, periods]) => {
    Object.entries(periods || {}).forEach(([period, byStudent]) => {
      const rec = byStudent?.[child.id];
      if (rec) childAttendance.push({ date, period, rec });
    });
  });
  childAttendance.sort((a, b) =>
    String(b.date).localeCompare(String(a.date))
  );

  const attSummary = {
    حاضر: childAttendance.filter((x) => x.rec.status === "حاضر").length,
    متأخر: childAttendance.filter((x) => x.rec.status === "متأخر").length,
    غائب: childAttendance.filter((x) => x.rec.status === "غائب").length,
  };

  const totalAttendance =
    attSummary.حاضر + attSummary.متأخر + attSummary.غائب;
  const attendanceRate = totalAttendance
    ? Math.round(
        ((attSummary.حاضر + attSummary.متأخر) / totalAttendance) * 100
      )
    : 0;

  const childViolations = (violations || [])
    .filter((v) => v.studentId === child.id)
    .sort((a, b) => String(b.date).localeCompare(String(a.date)));

  const childEvaluations = (evaluations || [])
    .filter((e) => e.studentId === child.id)
    .sort((a, b) => String(b.date).localeCompare(String(a.date)));

  const childPeriodic = (periodicEvaluations || [])
    .filter((e) => e.studentId === child.id)
    .sort((a, b) => String(b.date).localeCompare(String(a.date)));

  const childPledges = (pledges || [])
    .filter((p) => p.studentId === child.id)
    .sort((a, b) => String(b.date).localeCompare(String(a.date)));

  const childMessages = (hudhudMessages || [])
    .filter((m) => m.studentId === child.id)
    .sort((a, b) => String(b.date).localeCompare(String(a.date)));

  const unreadCount = childMessages.filter(
    (m) => m.status !== "تمت القراءة"
  ).length;

  const pendingAckCount = ackRequests.filter(
    (r) => r.student_id === child.id && r.status !== "تم الإقرار"
  ).length;

  const totalStars = childEvaluations.reduce(
    (sum, e) =>
      sum +
      Object.values(e.scores || {}).reduce(
        (a, b) => a + Number(b || 0),
        0
      ),
    0
  );

  const averageEval = childEvaluations.length
    ? Math.round(
        childEvaluations.reduce(
          (sum, e) => sum + Number(e.percent || 0),
          0
        ) / childEvaluations.length
      )
    : null;

  const statusColor = {
    حاضر: "#2F9E6E",
    متأخر: "#D9A62E",
    غائب: "#C7433F",
  };

  const recentActivity = [
    ...childAttendance.slice(0, 8).map((x) => ({
      date: x.date,
      type: "الحضور",
      text: `${x.rec.status} — ${x.period}`,
      tone: statusColor[x.rec.status] || "#5B8DEF",
    })),
    ...childViolations.slice(0, 8).map((v) => ({
      date: v.date,
      type: "مخالفة",
      text: `${v.item || "مخالفة"} — الدرجة ${v.degree}`,
      tone: "#C7433F",
    })),
    ...childEvaluations.slice(0, 8).map((e) => ({
      date: e.date,
      type: "تقييم",
      text: `${e.percent}% — ${e.rating || ""}`,
      tone: "#D9A62E",
    })),
    ...childMessages.slice(0, 8).map((m) => ({
      date: m.date,
      type: "رسالة",
      text: m.subject || "رسالة هدهد",
      tone: "#8E6FCE",
    })),
  ]
    .filter((x) => x.date)
    .sort((a, b) => String(b.date).localeCompare(String(a.date)))
    .slice(0, 10);

  return (
    <div className="view-stack">
      <section className="card parent-portal-hero">
        <div className="card-head">
          <h3><GraduationCap size={18} /> بوابة ولي الأمر</h3>
          <span className="att-sub">
            متابعة الأبناء من الحضور إلى التقييمات والرسائل
          </span>
        </div>

        {children.length > 1 && (
          <div className="child-switcher">
            {children.map((c) => (
              <button
                key={c.id}
                className={`child-chip ${
                  child?.id === c.id ? "child-chip-active" : ""
                }`}
                onClick={() => setActiveChildId(c.id)}
              >
                <Avatar
                  name={c.name}
                  tone={child?.id === c.id ? "#5B8DEF" : "#9AA3AF"}
                />
                <span>{c.name}</span>
              </button>
            ))}
          </div>
        )}
      </section>

      <section className="card">
        <div className="parent-child-header">
          <div>
            <h2>{child.name}</h2>
            <span>
              الصف {child.class}
              {child.section ? ` / ${child.section}` : ""}
              {child.studentNumber ? ` · رقم الطالب ${child.studentNumber}` : ""}
            </span>
          </div>
          <div className="parent-attendance-ring">
            <b>{attendanceRate}%</b>
            <span>الحضور</span>
          </div>
        </div>

        <div className="stat-grid">
          <StatCard
            icon={UserCheck}
            label="الحضور"
            value={attSummary.حاضر}
            tone="#2F9E6E"
          />
          <StatCard
            icon={Clock}
            label="التأخر"
            value={attSummary.متأخر}
            tone="#D9A62E"
          />
          <StatCard
            icon={UserX}
            label="الغياب"
            value={attSummary.غائب}
            tone="#C7433F"
          />
          <StatCard
            icon={AlertTriangle}
            label="المخالفات"
            value={childViolations.length}
            tone="#C7433F"
          />
          <StatCard
            icon={Star}
            label="نقاط النجوم"
            value={totalStars}
            tone="#D9A62E"
          />
          <StatCard
            icon={Activity}
            label="متوسط التقييم"
            value={averageEval === null ? "—" : `${averageEval}%`}
            tone="#5B8DEF"
          />
          <StatCard
            icon={Bird}
            label="رسائل غير مقروءة"
            value={unreadCount}
            tone="#8E6FCE"
          />
          <StatCard
            icon={ShieldCheck}
            label="إقرارات مطلوبة"
            value={pendingAckCount}
            tone="#E07B39"
          />
        </div>
      </section>

      <section className="card">
        <div className="settings-tabs parent-tabs">
          {[
            ["overview", "نظرة عامة", Activity],
            ["attendance", "الحضور والغياب", UserCheck],
            ["violations", "المخالفات", AlertTriangle],
            ["evaluation", "النجوم والتقييم", Star],
            ["periodic", "التقييم الدوري", FileText],
            ["pledges", "التعهدات", PenLine],
            ["hudhud", "رسائل هدهد", Bird],
          ].map(([id, label, Icon]) => (
            <button
              key={id}
              className={`settings-tab ${
                tab === id ? "settings-tab-active" : ""
              }`}
              onClick={() => setTab(id)}
            >
              <Icon size={15} />
              {label}
              {id === "hudhud" && unreadCount > 0 && (
                <span className="tab-badge">{unreadCount}</span>
              )}
            </button>
          ))}
        </div>
      </section>

      {tab === "overview" && (
        <div className="two-col">
          <section className="card">
            <div className="card-head">
              <h3><HistoryIcon size={17} /> آخر النشاطات</h3>
            </div>
            {recentActivity.length ? (
              <div className="parent-activity-list">
                {recentActivity.map((x, i) => (
                  <div key={`${x.date}-${i}`} className="parent-activity-item">
                    <span
                      className="parent-activity-dot"
                      style={{ background: x.tone }}
                    />
                    <div>
                      <b>{x.type}</b>
                      <span>{x.text}</span>
                    </div>
                    <small>{fmtDate(x.date)}</small>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState text="لا توجد نشاطات مسجلة بعد" />
            )}
          </section>

          <section className="card">
            <div className="card-head">
              <h3><ShieldCheck size={17} /> بيانات التواصل</h3>
            </div>
            <div className="student-info-grid">
              <div>
                <span>ولي الأمر</span>
                <b>{currentUser?.name || child.guardianName || "—"}</b>
              </div>
              <div>
                <span>الهاتف</span>
                <b>{currentUser?.phone || child.guardianPhone || "—"}</b>
              </div>
              <div>
                <span>البريد الإلكتروني</span>
                <b>{currentUser?.email || "—"}</b>
              </div>
              <div>
                <span>الحالة الصحية للطالب</span>
                <b>{child.health || "لا توجد ملاحظات"}</b>
              </div>
            </div>
          </section>
        </div>
      )}

      {tab === "attendance" && (
        <section className="card">
          <div className="card-head">
            <h3><UserCheck size={17} /> سجل الحضور والغياب</h3>
          </div>
          {childAttendance.length === 0 ? (
            <EmptyState text="لا يوجد سجل حضور بعد" />
          ) : (
            <div className="parent-table-wrap">
              <table className="simple-table">
                <thead>
                  <tr>
                    <th>التاريخ</th>
                    <th>الحصة</th>
                    <th>الحالة</th>
                    <th>الوقت</th>
                  </tr>
                </thead>
                <tbody>
                  {childAttendance.slice(0, 80).map((x, i) => (
                    <tr key={`${x.date}-${x.period}-${i}`}>
                      <td>{fmtDate(x.date)}</td>
                      <td>{x.period}</td>
                      <td>
                        <span
                          className="count-chip"
                          style={{
                            background:
                              statusColor[x.rec.status] || "#9AA3AF",
                          }}
                        >
                          {x.rec.status}
                        </span>
                      </td>
                      <td>{x.rec.time || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {tab === "violations" && (
        <section className="card">
          <div className="card-head">
            <h3><AlertTriangle size={17} /> المخالفات المسجلة</h3>
          </div>

          {childViolations.length === 0 ? (
            <EmptyState text="لا توجد مخالفات مسجلة" />
          ) : (
            <div className="parent-card-list">
              {childViolations.map((v) => {
                const ack = isAcknowledged("violation", v.id);
                return (
                  <div key={v.id} className="parent-info-card">
                    <div className="parent-info-head">
                      <div>
                        <b>{v.item || "مخالفة"}</b>
                        <span>{fmtDate(v.date)} · {v.period || "—"}</span>
                      </div>
                      <span
                        className="count-chip"
                        style={{
                          background:
                            DEGREES[v.degree]?.color || "#C7433F",
                        }}
                      >
                        {DEGREES[v.degree]?.label || `الدرجة ${v.degree}`}
                      </span>
                    </div>

                    {v.description && (
                      <p className="parent-info-text">{v.description}</p>
                    )}

                    {v.action && (
                      <div className="parent-action-note">
                        <b>الإجراء:</b> {v.action}
                      </div>
                    )}

                    <div className="parent-info-foot">
                      {ack ? (
                        <span className="parent-ack-ok">
                          <Check size={13} /> تم تأكيد الاستلام
                        </span>
                      ) : (
                        <button
                          className="chip-btn-outline"
                          onClick={() =>
                            acknowledge("violation", v.id, child.id)
                          }
                        >
                          <Check size={13} /> تأكيد الاطلاع
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {tab === "evaluation" && (
        <section className="card">
          <div className="card-head">
            <h3><Star size={17} /> النجوم وتقييم الأداء</h3>
          </div>
          {childEvaluations.length === 0 ? (
            <EmptyState text="لا يوجد تقييم أداء بعد" />
          ) : (
            <div className="parent-card-list">
              {childEvaluations.map((e) => (
                <div key={e.id} className="parent-info-card">
                  <div className="parent-info-head">
                    <div>
                      <b>{fmtDate(e.date)}</b>
                      <span>
                        {e.total}/{e.max} نقطة · {e.percent}%
                      </span>
                    </div>
                    <span
                      className="count-chip"
                      style={{
                        background: e.ratingColor || "#D9A62E",
                      }}
                    >
                      {e.rating}
                    </span>
                  </div>

                  <div className="parent-star-summary">
                    {Object.entries(e.scores || {}).map(([k, v]) => (
                      <span key={k}>
                        {k}: <b>{v}</b>
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {tab === "periodic" && (
        <section className="card">
          <div className="card-head">
            <h3><FileText size={17} /> التقييم الدوري</h3>
          </div>
          {childPeriodic.length === 0 ? (
            <EmptyState text="لا يوجد تقييم دوري بعد" />
          ) : (
            <div className="parent-card-list">
              {childPeriodic.map((e) => (
                <div key={e.id} className="parent-info-card">
                  <div className="parent-info-head">
                    <div>
                      <b>{e.subject || "تقييم دوري"}</b>
                      <span>{fmtDate(e.date)}</span>
                    </div>
                    <span
                      className="count-chip"
                      style={{ background: "#5B8DEF" }}
                    >
                      {e.overallRating || e.rating || "—"}
                    </span>
                  </div>
                  {e.teacherNote && (
                    <p className="parent-info-text">
                      <b>ملاحظة المعلم:</b> {e.teacherNote}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {tab === "pledges" && (
        <section className="card">
          <div className="card-head">
            <h3><PenLine size={17} /> نماذج التعهد</h3>
          </div>
          {childPledges.length === 0 ? (
            <EmptyState text="لا توجد تعهدات بعد" />
          ) : (
            <div className="parent-card-list">
              {childPledges.map((p) => (
                <div key={p.id} className="parent-info-card">
                  <div className="parent-info-head">
                    <div>
                      <b>
                        تعهد {p.type === "طالب" ? "الطالب" : "ولي الأمر"}
                      </b>
                      <span>{fmtDate(p.date)}</span>
                    </div>
                    <span
                      className="count-chip"
                      style={{ background: "#5B8DEF" }}
                    >
                      {p.type}
                    </span>
                  </div>
                  <p className="parent-info-text">{p.text}</p>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {tab === "hudhud" && (
        <section className="card">
          <div className="card-head">
            <h3><Bird size={17} /> رسائل هدهد</h3>
          </div>
          {childMessages.length === 0 ? (
            <EmptyState text="لا توجد رسائل بعد" />
          ) : (
            <ul className="hudhud-inbox">
              {childMessages.map((m) => {
                const isRead = m.status === "تمت القراءة";
                const ack = isAcknowledged("hudhud", m.id);

                return (
                  <li
                    key={m.id}
                    className={`hudhud-inbox-item ${
                      isRead ? "" : "hudhud-inbox-unread"
                    }`}
                  >
                    <div className="hudhud-inbox-head">
                      <span className="hudhud-inbox-subject">
                        {m.subject}
                      </span>
                      <span className="hudhud-inbox-date">
                        {m.date} — {m.time}
                      </span>
                    </div>
                    <div className="hudhud-inbox-body">{m.body}</div>
                    <div className="hudhud-inbox-foot">
                      <span
                        className="count-chip"
                        style={{
                          background: isRead ? "#9AA3AF" : "#8E6FCE",
                        }}
                      >
                        {m.status}
                      </span>

                      {ack ? (
                        <span className="parent-ack-ok">
                          <Check size={13} /> تم تأكيد الاستلام
                        </span>
                      ) : (
                        <button
                          className="chip-btn-outline"
                          onClick={() =>
                            acknowledge("hudhud", m.id, child.id)
                          }
                        >
                          <Check size={13} /> تأكيد الاستلام
                        </button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      )}

      {loadingAcks && (
        <div className="att-sub">جارٍ تحديث تأكيدات الاستلام...</div>
      )}
    </div>
  );
}
