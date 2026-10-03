import React, { useState, useEffect, useMemo, useCallback } from "react";
import { supabase } from "../supabaseClient";
import { createUserErrorMessage } from "./createUserError";
import { DEFAULT_CLASSES, DEFAULT_SECTIONS, DEGREES, EVAL_CRITERIA, PERIODIC_ACADEMIC_CRITERIA, PERIODIC_BEHAVIOR_CRITERIA, PERMISSION_SECTIONS, allPerms, fmtTime, periodicRatingFromAverage, ratingFor, todayISO } from "./shared";
import { LoginScreen } from "./LoginScreen";
import { Header } from "./Header";
import { SideNav } from "./SideNav";
import { Dashboard } from "./Dashboard";
import { SupervisorWorkbook } from "./SupervisorWorkbook";
import { AttendanceView } from "./AttendanceView";
import { ViolationsEntry } from "./ViolationsEntry";
import { ViolationsLog } from "./ViolationsLog";
import { PledgesView } from "./PledgesView";
import { LessonPointsView } from "./LessonPointsView";
import { EvaluationView } from "./EvaluationView";
import { PeriodicEvaluationView } from "./PeriodicEvaluationView";
import { StudentComprehensiveProfile } from "./StudentComprehensiveProfile";
import { NotificationTaskCenter } from "./NotificationTaskCenter";
import { CounselorDashboard } from "./CounselorDashboard";
import { UnifiedStudentFile } from "./UnifiedStudentFile";
import { EarlyWarningCenter } from "./EarlyWarningCenter";
import { DataManagementCenter } from "./DataManagementCenter";
import { AuditLogView } from "./AuditLogView";
import { CaseManagementCenter } from "./CaseManagementCenter";
import { SmartAnalyticsCenter } from "./SmartAnalyticsCenter";
import { Reports } from "./Reports";
import { StudentsView } from "./StudentsView";
import { HudhudView } from "./HudhudView";
import { ParentAcknowledgementCenter } from "./ParentAcknowledgementCenter";
import { ParentPortal } from "./ParentPortal";
import { SettingsView } from "./SettingsView";
import { Toast } from "./Toast";
import { MessageModal } from "./MessageModal";
import { PrintPledgeModal } from "./PrintPledgeModal";


/* ---------------------------------------------------------------
   التطبيق الرئيسي
--------------------------------------------------------------- */
export function App() {
  const [view, setView] = useState("dashboard");
  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [focusedStudentId, setFocusedStudentId] = useState("");
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState({}); // { [date]: { [studentId]: {status, time} } }
  const [violations, setViolations] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [toast, setToast] = useState(null);
  const [msgPreview, setMsgPreview] = useState(null);
  const [selectedDate, setSelectedDate] = useState(todayISO());
  const [classes, setClasses] = useState(DEFAULT_CLASSES);
  const [sections, setSections] = useState(DEFAULT_SECTIONS);
  const [periods, setPeriods] = useState([]);
  const [teacherClasses, setTeacherClasses] = useState([]);
  const [myTeachingAssignments, setMyTeachingAssignments] = useState([]);
  const [attClass, setAttClass] = useState(DEFAULT_CLASSES[0]);
  const [attPeriod, setAttPeriod] = useState("");
  const [violStudent, setViolStudent] = useState(null);
  const [pledges, setPledges] = useState([]);
  const [evaluations, setEvaluations] = useState([]);
  const [periodicEvaluations, setPeriodicEvaluations] = useState([]);
  const [printPledge, setPrintPledge] = useState(null);
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState({});
  const [hudhudMessages, setHudhudMessages] = useState([]);
  const [caseFollowups, setCaseFollowups] = useState([]);
  const [guardianContacts, setGuardianContacts] = useState([]);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [sessionChecked, setSessionChecked] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [notificationCount, setNotificationCount] = useState(0);

  const showToast = useCallback((text) => {
    setToast(text);
    setTimeout(() => setToast(null), 3400);
  }, []);

  /* ------------------------------------------------------------
     دوال تحويل صفوف قاعدة البيانات (snake_case) إلى شكل الواجهة (camelCase)
  ------------------------------------------------------------ */
  const mapStudentRow = (r) => ({
    id: r.id,
    studentNumber: r.student_number || "",
    name: r.name,
    nationality: r.nationality || "",
    class: r.class_name,
    section: r.section_name,
    guardianName: r.guardian_name,
    guardianPhone: r.guardian_phone,
    health: r.health,
  });

  const enrich = (rec, studentsList) => {
    const st = studentsList.find((s) => s.id === rec.studentId);
    return { ...rec, studentName: st?.name, class: st?.class, section: st?.section, guardianPhone: st?.guardianPhone };
  };

  const mapAttendanceRows = (rows) => {
    const map = {};
    rows.forEach((r) => {
      const period = r.period || "اليوم بالكامل";
      map[r.date] = map[r.date] || {};
      map[r.date][period] = map[r.date][period] || {};
      map[r.date][period][r.student_id] = { status: r.status, time: r.time };
    });
    return map;
  };

  useEffect(() => {
    if (periods.length > 0 && !attPeriod) setAttPeriod(periods[0].name);
  }, [periods, attPeriod]);


  const mapRolesRows = (rows) => {
    const map = {};
    rows.forEach((r) => (map[r.name] = { ...r.permissions, "attendance-register": r.permissions?.["attendance-register"] ?? (r.name !== "مدير النظام" && r.permissions?.attendance === true) }));
    return map;
  };

  /* ------------------------------------------------------------
     تحميل البيانات من Supabase عند فتح التطبيق
  ------------------------------------------------------------ */
  const loadAllData = async (sessionUserId = null) => {
    try {
      const resolvedUserId = sessionUserId || (await supabase.auth.getSession()).data.session?.user?.id || null;
      let resolvedRole = null;
      if (resolvedUserId) {
        const { data: ownProfile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", resolvedUserId)
          .maybeSingle();
        resolvedRole = ownProfile?.role || null;
      }

      // للمعلم نحمّل ربط صفوفه صراحةً بمعرّفه قبل بناء الواجهة.
      let ownAssignments = [];
      if (resolvedUserId && resolvedRole === "معلم") {
        const { data: ownTC, error: ownTCError } = await supabase
          .from("teacher_classes")
          .select("teacher_id, class_name, section_name")
          .eq("teacher_id", resolvedUserId)
          .order("class_name")
          .order("section_name");
        if (ownTCError) {
          console.error("فشل تحميل صفوف المعلم مباشرة:", ownTCError);
        } else {
          ownAssignments = (ownTC || []).map((r) => ({
            className: r.class_name,
            sectionName: r.section_name,
          }));
          setMyTeachingAssignments(ownAssignments);
        }
      } else {
        setMyTeachingAssignments([]);
      }

      const [
        classesRes,
        sectionsRes,
        periodsRes,
        rolesRes,
        studentsRes,
        attendanceRes,
        violationsRes,
        pledgesRes,
        evaluationsRes,
        periodicEvaluationsRes,
        hudhudRes,
        caseFollowupsRes,
        guardianContactsRes,
        profilesRes,
        guardianChildrenRes,
        teacherClassesRes,
      ] = await Promise.all([
        supabase.from("classes").select("name").order("name"),
        supabase.from("sections").select("name").order("name"),
        supabase.from("periods").select("id, name, sort_order, active").order("sort_order", { ascending: true }).order("name"),
        supabase.from("roles").select("name, permissions"),
        supabase.from("students").select("*").order("name"),
        supabase.from("attendance").select("*"),
        supabase.from("violations").select("*").order("created_at", { ascending: false }),
        supabase.from("pledges").select("*").order("date", { ascending: false }),
        supabase.from("evaluations").select("*").order("date", { ascending: false }),
        supabase.from("periodic_evaluations").select("*").order("date", { ascending: false }),
        supabase.from("hudhud_messages").select("*").order("date", { ascending: false }),
        supabase.from("student_case_followups").select("*").order("created_at", { ascending: false }),
        supabase.from("guardian_contact_log").select("*").order("contact_at", { ascending: false }),
        supabase.from("profiles").select("*"),
        supabase.from("guardian_children").select("*"),
        supabase.from("teacher_classes").select("teacher_id, class_name, section_name"),
      ]);

      if (teacherClassesRes.error) {
        console.error("فشل تحميل صفوف المعلم:", teacherClassesRes.error);
        showToast(`تعذّر تحميل صفوف المعلم: ${teacherClassesRes.error.message}`);
      }
      if (studentsRes.error) {
        console.error("فشل تحميل الطلاب:", studentsRes.error);
      }

      // للمعلم: نجلب كشف طلاب صفوفه مباشرة من دالة آمنة في Supabase.
      // الدالة ترجع أسماء أعمدة صريحة لتجنب أي تعارض في أسماء الحقول.
      let studentsRows = studentsRes.data || [];
      let studentsMapped = studentsRows.map(mapStudentRow);

      if (resolvedUserId && resolvedRole === "معلم") {
        const { data: rosterRows, error: rosterError } = await supabase.rpc("get_my_teacher_roster");

        if (rosterError) {
          console.error("فشل تحميل كشف طلاب المعلم:", rosterError);
          showToast(`تعذّر تحميل طلاب صفوفك: ${rosterError.message}`);
          studentsMapped = [];
        } else {
          studentsMapped = (rosterRows || []).map((r) => ({
            id: r.student_id,
            name: r.student_name,
            class: r.class_name,
            section: r.section_name,
            guardianName: r.guardian_name,
            guardianPhone: r.guardian_phone,
            health: r.health,
          }));
        }
      }
      setStudents(studentsMapped);
      setClasses((classesRes.data || []).map((r) => r.name));
      setSections((sectionsRes.data || []).map((r) => r.name));
      setPeriods((periodsRes.data || []).filter((r) => r.active !== false));
      setRoles(mapRolesRows(rolesRes.data || []));
      setAttendance(mapAttendanceRows(attendanceRes.data || []));

      setViolations(
        (violationsRes.data || []).map((r) =>
          enrich(
            {
              id: r.id,
              studentId: r.student_id,
              degree: r.degree,
              item: r.item,
              period: r.period,
              description: r.description,
              action: r.action,
              date: r.date,
              time: r.time,
              notified: r.notified,
              createdBy: r.created_by || null,
              teacherName:
                (profilesRes.data || []).find((p) => p.id === r.created_by)?.name || "—",
              followupStatus: r.followup_status || "مخالفة جديدة",
              followedAt: r.followed_at || null,
              referredAt: r.referred_at || null,
            },
            studentsMapped
          )
        )
      );

      setPledges(
        (pledgesRes.data || []).map((r) =>
          enrich(
            { id: r.id, studentId: r.student_id, type: r.type, violationRef: r.violation_ref, text: r.text, date: r.date },
            studentsMapped
          )
        )
      );

      setEvaluations(
        (evaluationsRes.data || []).map((r) =>
          enrich(
            {
              id: r.id,
              studentId: r.student_id,
              date: r.date,
              scores: r.scores,
              total: r.total,
              max: r.max,
              percent: r.percent,
              rating: r.rating,
              ratingColor: r.rating_color,
            },
            studentsMapped
          )
        )
      );

      setPeriodicEvaluations(
        (periodicEvaluationsRes.data || []).map((r) =>
          enrich(
            {
              id: r.id,
              studentId: r.student_id,
              teacherId: r.teacher_id,
              teacherName:
                (profilesRes.data || []).find((p) => p.id === r.teacher_id)?.name || "—",
              subject: r.subject,
              evaluationPeriod: r.evaluation_period,
              date: r.date,
              academicScores: r.academic_scores || {},
              behaviorScores: r.behavior_scores || {},
              academicRating: r.academic_rating,
              behaviorRating: r.behavior_rating,
              overallRating: r.overall_rating,
              teacherNote: r.teacher_note || "",
              createdAt: r.created_at,
            },
            studentsMapped
          )
        )
      );

      setHudhudMessages(
        (hudhudRes.data || []).map((r) =>
          enrich(
            { id: r.id, studentId: r.student_id, subject: r.subject, body: r.body, date: r.date, time: r.time, status: r.status },
            studentsMapped
          )
        )
      );

      setCaseFollowups(
        (caseFollowupsRes.data || []).map((r) =>
          enrich(
            {
              id: r.id,
              studentId: r.student_id,
              status: r.status,
              followupType: r.followup_type,
              note: r.note,
              nextAction: r.next_action,
              nextActionDate: r.next_action_date,
              createdBy: r.created_by,
              createdByName:
                (profilesRes.data || []).find((p) => p.id === r.created_by)?.name || "—",
              createdAt: r.created_at,
            },
            studentsMapped
          )
        )
      );

      setGuardianContacts(
        (guardianContactsRes.data || []).map((r) =>
          enrich(
            {
              id: r.id,
              studentId: r.student_id,
              channel: r.channel,
              outcome: r.outcome,
              summary: r.summary,
              agreedAction: r.agreed_action,
              nextContactDate: r.next_contact_date,
              contactAt: r.contact_at,
              createdBy: r.created_by,
              createdByName:
                (profilesRes.data || []).find((p) => p.id === r.created_by)?.name || "—",
            },
            studentsMapped
          )
        )
      );

      const childrenByGuardian = {};
      (guardianChildrenRes.data || []).forEach((r) => {
        childrenByGuardian[r.guardian_id] = childrenByGuardian[r.guardian_id] || [];
        childrenByGuardian[r.guardian_id].push(r.student_id);
      });
      const classesByTeacher = {};
      (teacherClassesRes.data || []).forEach((r) => {
        classesByTeacher[r.teacher_id] = classesByTeacher[r.teacher_id] || [];
        classesByTeacher[r.teacher_id].push({
          className: r.class_name,
          sectionName: r.section_name,
        });
      });
      setTeacherClasses(teacherClassesRes.data || []);

      // إذا كان المستخدم الحالي معلماً، استخدم الاستعلام المباشر كمرجع موثوق
      // حتى لو كانت نتيجة teacherClassesRes العامة فارغة بسبب RLS.
      if (resolvedUserId && resolvedRole === "معلم" && ownAssignments.length) {
        classesByTeacher[resolvedUserId] = ownAssignments;
      }

      setUsers(
        (profilesRes.data || []).map((p) => ({
          id: p.id,
          name: p.name,
          email: p.email,
          phone: p.phone,
          role: p.role,
          active: p.active,
          teachingSubject: p.teaching_subject || "",
          childStudentIds: childrenByGuardian[p.id] || [],
          teachingAssignments: classesByTeacher[p.id] || [],
        }))
      );

      if (classesRes.data?.length) setAttClass(classesRes.data[0].name);
    } catch (e) {
      console.error("فشل تحميل البيانات من Supabase:", e);
      showToast("تعذّر تحميل البيانات — تحقّق من الاتصال بقاعدة البيانات");
    }
    setLoaded(true);
  };

  /* ------------------------------------------------------------
     جلسة الدخول عبر Supabase Auth
     مهم: لا نحمل البيانات المحمية قبل معرفة جلسة المستخدم، لأن RLS
     سيعيد teacher_classes / students فارغة للمعلم إذا تم الطلب كـ anon.
  ------------------------------------------------------------ */
  useEffect(() => {
    let mounted = true;

    const initSession = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (!mounted) return;

      if (error) {
        console.error("تعذّر قراءة جلسة Supabase:", error);
      }

      const session = data.session;
      setCurrentUserId(session?.user?.id || null);
      setSessionChecked(true);

      if (session?.user) {
        await loadAllData(session.user.id);
      } else {
        setLoaded(true);
      }
    };

    initSession();

    const { data: sub } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;
      setCurrentUserId(session?.user?.id || null);
      setSessionChecked(true);

      if (session?.user && (event === "SIGNED_IN" || event === "TOKEN_REFRESHED")) {
        setLoaded(false);
        await loadAllData(session.user.id);
      }

      if (!session) {
        setUsers([]);
        setTeacherClasses([]);
        setStudents([]);
        setLoaded(true);
      }
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const currentUser = users.find((u) => u.id === currentUserId) || null;
  const currentPerms = currentUser ? roles[currentUser.role] || {} : {};

  const handleLogin = async (email, password) => {
    setLoginError("");
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: password.trim(),
    });
    if (error) {
      setLoginError("البريد الإلكتروني أو كلمة المرور غير صحيحة");
      return;
    }
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", data.user.id)
      .single();

    if (profileError) {
      console.error("تعذّر تحميل ملف المستخدم:", profileError);
      setLoginError("تم تسجيل الدخول لكن تعذّر تحميل بيانات الحساب");
      return;
    }

    if (profile && !profile.active) {
      setLoginError("هذا الحساب موقوف حالياً، يرجى مراجعة إدارة النظام");
      await supabase.auth.signOut();
      return;
    }

    // أعد تحميل البيانات بعد تسجيل الدخول حتى تُقرأ صفوف المعلم تحت جلسة authenticated
    setLoaded(false);
    await loadAllData(data.user.id);

    const { data: roleRow } = await supabase
      .from("roles")
      .select("permissions")
      .eq("name", profile?.role)
      .maybeSingle();
    const perms = roleRow?.permissions || roles[profile?.role] || {};
    const firstAllowed = PERMISSION_SECTIONS.find((s) => s.id !== "attendance-register" && perms[s.id] !== false)?.id || "dashboard";
    setView(firstAllowed);
    showToast(`مرحباً بك، ${profile?.name || ""}`);
  };

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setCurrentUserId(null);
      setUsers([]);
      setMyTeachingAssignments([]);
      setNotificationCount(0);
      setToast(null);
      setView("dashboard");
      setLoginError("");
    } catch {
      showToast("تعذّر تسجيل الخروج. يرجى المحاولة مرة أخرى.");
    }
  };

  /* ------------------------------------------------------------
     رسائل هدهد
  ------------------------------------------------------------ */
  const sendHudhudMessage = async (studentId, subject, body) => {
    const st = students.find((s) => s.id === studentId);
    const { data, error } = await supabase
      .from("hudhud_messages")
      .insert({ student_id: studentId, subject, body, date: selectedDate, time: fmtTime(), status: "تم الإرسال" })
      .select()
      .single();
    if (error) {
      showToast("تعذّر إرسال الرسالة");
      return;
    }
    const rec = enrich(
      { id: data.id, studentId, subject, body, date: data.date, time: data.time, status: data.status },
      students
    );
    setHudhudMessages((prev) => [rec, ...prev]);
    showToast(`تم إرسال رسالة هدهد إلى ولي أمر ${st?.name} (${st?.guardianPhone})`);
    return rec;
  };

  const markHudhudRead = async (messageId) => {
    const { error } = await supabase.from("hudhud_messages").update({ status: "تمت القراءة" }).eq("id", messageId);
    if (error) return;
    setHudhudMessages((prev) => prev.map((m) => (m.id === messageId ? { ...m, status: "تمت القراءة" } : m)));
  };

  /* ------------------------------------------------------------
     المستخدمون (حسابات الموظفين وأولياء الأمور)
     إنشاء الحسابات عبر دالة Supabase، وكلمة المرور الشخصية من الملف الشخصي.
  ------------------------------------------------------------ */
  const syncGuardianChildren = async (guardianId, childIds) => {
    await supabase.from("guardian_children").delete().eq("guardian_id", guardianId);
    if (childIds && childIds.length) {
      await supabase
        .from("guardian_children")
        .insert(childIds.map((sid) => ({ guardian_id: guardianId, student_id: sid })));
    }
  };

  const syncTeacherClasses = async (teacherId, assignments) => {
    const { error: deleteError } = await supabase
      .from("teacher_classes")
      .delete()
      .eq("teacher_id", teacherId);

    if (deleteError) {
      showToast(`تعذّر تحديث صفوف المعلم: ${deleteError.message}`);
      return false;
    }

    if (assignments && assignments.length) {
      const rows = assignments.map((a) => ({
        teacher_id: teacherId,
        class_name: a.className,
        section_name: a.sectionName,
      }));
      const { error: insertError } = await supabase.from("teacher_classes").insert(rows);
      if (insertError) {
        showToast(`تعذّر حفظ صفوف المعلم: ${insertError.message}`);
        return false;
      }
    }

    setTeacherClasses((prev) => [
      ...prev.filter((r) => r.teacher_id !== teacherId),
      ...(assignments || []).map((a) => ({
        teacher_id: teacherId,
        class_name: a.className,
        section_name: a.sectionName,
      })),
    ]);
    return true;
  };

const addUser = async (data, options = { quiet: false }) => {
  let accountCreated = false;
  let message = "";
  const notify = (text) => { message = text; if (!options.quiet) showToast(text); };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(data.email || "").trim())) {
    notify("أدخل بريدًا إلكترونيًا صحيحًا");
    return { success: accountCreated, message };
  }
  if (String(data.password || "").trim().length < 6) {
    notify("يجب أن تتكون كلمة المرور من 6 أحرف على الأقل");
    return { success: accountCreated, message };
  }
  try {
    const { data: result, error } = await supabase.functions.invoke(
      "create-user",
      {
        body: {
          name: data.name,
          email: data.email,
          phone: data.phone,
          password: data.password,
          role: data.role,
          active: data.active,
          childStudentIds: data.childStudentIds || [],
        },
      }
    );

    if (error) {
      console.error("create-user error:", error);
      notify(`تعذّر إنشاء المستخدم: ${await createUserErrorMessage(error)}`);
      return { success: accountCreated, message };
    }

    if (!result?.success) {
      notify(result?.error || "تعذّر إنشاء المستخدم");
      return { success: accountCreated, message };
    }

    accountCreated = true;
    if (data.role === "معلم") {
      const { error: subjectError } = await supabase.from("profiles").update({ teaching_subject: data.teachingSubject.trim() }).eq("id", result.user.id);
      if (subjectError) { notify("تم إنشاء الحساب، لكن تعذّر حفظ المادة. حدّدها من تعديل المستخدم بعد تطبيق ترحيل المرحلة 23."); await loadAllData(currentUserId); return { success: accountCreated, message }; }
      const ok = await syncTeacherClasses(result.user.id, data.teachingAssignments || []);
      if (!ok) { notify("تم إنشاء الحساب، لكن تعذّر حفظ الصفوف. راجع تعديل المستخدم."); await loadAllData(currentUserId); return { success: true, message }; }
    }

    const newUser = {
      id: result.user.id,
      name: data.name,
      email: data.email,
      phone: data.phone,
      role: data.role,
      active: data.active,
      teachingSubject: data.role === "معلم" ? data.teachingSubject.trim() : "",
      childStudentIds: data.childStudentIds || [],
      teachingAssignments: data.role === "معلم" ? (data.teachingAssignments || []) : [],
    };

    setUsers((prev) => [newUser, ...prev]);

    if (result.restored) {
      await loadAllData(currentUserId);
      notify(result.warning || result.message || "تمت استعادة المستخدم؛ كلمة المرور القديمة ما زالت سارية");
      return { success: accountCreated, message };
    }

    notify(
      data.role === "ولي أمر"
        ? `تم إنشاء حساب ولي الأمر ${data.name} وربطه بالأبناء`
        : `تم إنشاء المستخدم ${data.name}`
    );
  } catch (err) {
    console.error(err);
    notify(accountCreated ? "تم إنشاء الحساب، لكن تعذّر إكمال بياناته. راجع قائمة المستخدمين قبل إعادة الاستيراد." : `تعذّر إنشاء المستخدم: ${await createUserErrorMessage(err)}`);
  }
  return { success: accountCreated, message };
};
  const updateUser = async (id, patch) => {
    const { error } = await supabase
      .from("profiles")
      .update({ name: patch.name, phone: patch.phone, role: patch.role, active: patch.active, teaching_subject: patch.role === "معلم" ? String(patch.teachingSubject || "").trim() : null })
      .eq("id", id);
    if (error) {
      showToast("تعذّر تحديث بيانات المستخدم");
      return;
    }
    if (patch.role === "ولي أمر" && patch.childStudentIds) {
      await syncGuardianChildren(id, patch.childStudentIds);
    }
    if (patch.role === "معلم") {
      const ok = await syncTeacherClasses(id, patch.teachingAssignments || []);
      if (!ok) return;
    } else {
      await syncTeacherClasses(id, []);
    }
    setUsers((prev) =>
      prev.map((u) =>
        u.id === id
          ? {
              ...u,
              ...patch,
              teachingAssignments: patch.role === "معلم" ? (patch.teachingAssignments || []) : [],
            }
          : u
      )
    );
    showToast("تم تحديث بيانات المستخدم");
  };

  const resetUserPassword = async (email) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) showToast("تعذّر إرسال رابط إعادة التعيين");
    else showToast(`تم إرسال رابط إعادة تعيين كلمة المرور إلى ${email}`);
  };

  const deleteUser = async (id) => {
    const { error } = await supabase.from("profiles").delete().eq("id", id);
    if (error) {
      showToast("تعذّر حذف المستخدم");
      return;
    }
    setUsers((prev) => prev.filter((u) => u.id !== id));
    showToast("تم حذف ملف المستخدم (يبقى حساب الدخول نفسه يُحذف من لوحة Supabase عند الحاجة)");
  };

  /* ------------------------------------------------------------
     الطلاب
  ------------------------------------------------------------ */
  const addStudent = async (data) => {
    const { data: row, error } = await supabase
      .from("students")
      .insert({
        student_number: data.studentNumber || null,
        name: data.name,
        nationality: data.nationality || null,
        class_name: data.class,
        section_name: data.section,
        guardian_name: data.guardianName,
        guardian_phone: data.guardianPhone,
        health: data.health,
      })
      .select()
      .single();
    if (error) {
      showToast("تعذّر إضافة الطالب");
      return;
    }
    setStudents((prev) => [...prev, mapStudentRow(row)]);
    showToast(`تمت إضافة الطالب ${data.name}`);
  };


  const bulkImportStudents = async (rows) => {
    if (!Array.isArray(rows) || rows.length === 0) {
      return { success: false, message: "ملف Excel لا يحتوي على بيانات." };
    }

    const invalidRows = [];
    const normalizedRows = [];

    rows.forEach((r, index) => {
      const studentNumber = String(r.studentNumber ?? "").trim();
      const name = String(r.name ?? "").trim();
      const nationality = String(r.nationality ?? "").trim();
      const className = String(r.className ?? "").trim();
      const sectionName = String(r.sectionName ?? "").trim();
      const phone = String(r.phone ?? "").trim();

      const errors = [];
      if (!name) errors.push("الاسم");
      if (!className) errors.push("الصف");
      if (!sectionName) errors.push("الشعبة الصفية");

      if (errors.length) {
        invalidRows.push({ row: index + 2, name, errors });
        return;
      }

      normalizedRows.push({
        student_number: studentNumber || null,
        name,
        nationality: nationality || null,
        class_name: className,
        section_name: sectionName,
        guardian_name: null,
        guardian_phone: phone || null,
        health: null,
      });
    });

    if (normalizedRows.length === 0) {
      return {
        success: false,
        invalidRows,
        message: "لم يتم العثور على أي طالب صالح للاستيراد.",
      };
    }

    // إنشاء الصفوف والشعب الجديدة الموجودة في ملف المدرسة تلقائياً.
    const fileClasses = [...new Set(normalizedRows.map((r) => r.class_name))];
    const fileSections = [...new Set(normalizedRows.map((r) => r.section_name))];

    const missingClasses = fileClasses.filter((c) => !classes.includes(c));
    if (missingClasses.length) {
      const { error } = await supabase
        .from("classes")
        .insert(missingClasses.map((name) => ({ name })));

      if (error) {
        console.error("Create classes from Excel error:", error);
        return {
          success: false,
          message: `تعذّر إنشاء الصفوف الموجودة في Excel: ${error.message}`,
        };
      }

      setClasses((prev) => [...new Set([...prev, ...missingClasses])]);
    }

    const missingSections = fileSections.filter((s) => !sections.includes(s));
    if (missingSections.length) {
      const { error } = await supabase
        .from("sections")
        .insert(missingSections.map((name) => ({ name })));

      if (error) {
        console.error("Create sections from Excel error:", error);
        return {
          success: false,
          message: `تعذّر إنشاء الشعب الموجودة في Excel: ${error.message}`,
        };
      }

      setSections((prev) => [...new Set([...prev, ...missingSections])]);
    }

    // منع التكرار: الأولوية للرقم الطلابي، وإذا كان فارغاً نستخدم الاسم + الصف + الشعبة.
    const existingNumbers = new Set(
      students
        .map((s) => String(s.studentNumber || "").trim())
        .filter(Boolean)
    );

    const existingFallback = new Set(
      students.map(
        (s) =>
          `${String(s.name || "").trim()}||${String(s.class || "").trim()}||${String(s.section || "").trim()}`
      )
    );

    const uniqueRows = [];
    const skippedDuplicates = [];

    normalizedRows.forEach((r) => {
      const numberKey = String(r.student_number || "").trim();
      const fallbackKey = `${r.name}||${r.class_name}||${r.section_name}`;

      const duplicate =
        (numberKey && existingNumbers.has(numberKey)) ||
        existingFallback.has(fallbackKey);

      if (duplicate) {
        skippedDuplicates.push(r.name);
        return;
      }

      if (numberKey) existingNumbers.add(numberKey);
      existingFallback.add(fallbackKey);
      uniqueRows.push(r);
    });

    if (uniqueRows.length === 0) {
      return {
        success: true,
        inserted: 0,
        skippedDuplicates: skippedDuplicates.length,
        invalidRows,
      };
    }

    // إدراج على دفعات لتفادي إرسال طلب كبير جداً.
    const insertedRows = [];
    const batchSize = 150;

    for (let i = 0; i < uniqueRows.length; i += batchSize) {
      const batch = uniqueRows.slice(i, i + batchSize);

      const { data, error } = await supabase
        .from("students")
        .insert(batch)
        .select();

      if (error) {
        console.error("Bulk Excel students insert error:", error);
        return {
          success: false,
          message: `تعذّر إدراج الطلاب: ${error.message}`,
          insertedBeforeError: insertedRows.length,
        };
      }

      insertedRows.push(...(data || []));
    }

    const mapped = insertedRows.map(mapStudentRow);
    setStudents((prev) => [...prev, ...mapped]);

    return {
      success: true,
      inserted: mapped.length,
      skippedDuplicates: skippedDuplicates.length,
      invalidRows,
      classesFound: fileClasses.length,
      sectionsFound: fileSections.length,
    };
  };



  const deleteStudentsByClass = async (className) => {
    const cleanClass = String(className || "").trim();
    if (!cleanClass) return false;

    const classCount = students.filter(
      (s) => String(s.class || "").trim() === cleanClass
    ).length;

    if (classCount === 0) {
      showToast(`لا يوجد طلاب في الصف ${cleanClass}`);
      return false;
    }

    const firstConfirm = window.confirm(
      `سيتم حذف جميع طلاب الصف ${cleanClass} وعددهم ${classCount} طالباً.\n\n` +
      `سيتم أيضاً حذف السجلات المرتبطة بهم مثل الحضور والمخالفات والتعهدات والتقييمات ورسائل هدهد.\n\n` +
      `هل تريد المتابعة؟`
    );

    if (!firstConfirm) return false;

    const secondConfirm = window.confirm(
      `تأكيد نهائي: هل أنت متأكد من حذف جميع طلاب الصف ${cleanClass}؟\n` +
      `لا يمكن التراجع عن هذه العملية.`
    );

    if (!secondConfirm) return false;

    const { data, error } = await supabase.rpc("delete_students_by_class", {
      p_class_name: cleanClass,
    });

    if (error) {
      console.error("Delete students by class error:", error);
      showToast(`تعذّر حذف طلاب الصف: ${error.message}`);
      return false;
    }

    // إعادة تحميل البيانات بعد الحذف لضمان تحديث كل السجلات المرتبطة في الواجهة.
    await loadAllData(currentUserId);

    const deletedCount =
      data && typeof data === "object" && "deleted_students" in data
        ? data.deleted_students
        : classCount;

    showToast(`تم حذف ${deletedCount} طالباً من الصف ${cleanClass}`);
    return true;
  };

  const updateStudent = async (id, patch) => {
    const { error } = await supabase
      .from("students")
      .update({
        student_number: patch.studentNumber || null,
        name: patch.name,
        nationality: patch.nationality || null,
        class_name: patch.class,
        section_name: patch.section,
        guardian_name: patch.guardianName,
        guardian_phone: patch.guardianPhone,
        health: patch.health,
      })
      .eq("id", id);
    if (error) {
      showToast("تعذّر تحديث بيانات الطالب");
      return;
    }
    setStudents((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
    showToast("تم تحديث بيانات الطالب");
  };

  const deleteStudent = async (id) => {
    const st = students.find((s) => s.id === id);
    const { error } = await supabase.from("students").delete().eq("id", id);
    if (error) {
      showToast("تعذّر حذف الطالب");
      return;
    }
    setStudents((prev) => prev.filter((s) => s.id !== id));
    // FK ON DELETE CASCADE يزيل تلقائياً أي ربط بولي أمر في guardian_children
    setUsers((prev) =>
      prev.map((u) =>
        u.childStudentIds?.includes(id) ? { ...u, childStudentIds: u.childStudentIds.filter((c) => c !== id) } : u
      )
    );
    showToast(`تم حذف الطالب ${st?.name || ""}`);
  };

  /* ------------------------------------------------------------
     الصفوف والشعب
  ------------------------------------------------------------ */
  const addClass = async (name) => {
    if (!name || classes.includes(name)) return;
    const { error } = await supabase.from("classes").insert({ name });
    if (error) {
      showToast("تعذّر إضافة الصف");
      return;
    }
    setClasses((prev) => [...prev, name]);
    showToast(`تمت إضافة الصف «${name}»`);
  };

  const deleteClass = async (name) => {
    if (students.some((s) => s.class === name)) {
      showToast(`لا يمكن حذف الصف «${name}» لوجود طلاب مسجّلين فيه`);
      return;
    }
    const { error } = await supabase.from("classes").delete().eq("name", name);
    if (error) {
      showToast("تعذّر حذف الصف");
      return;
    }
    setClasses((prev) => prev.filter((c) => c !== name));
    showToast(`تم حذف الصف «${name}»`);
  };

  const addSection = async (name) => {
    if (!name || sections.includes(name)) return;
    const { error } = await supabase.from("sections").insert({ name });
    if (error) {
      showToast("تعذّر إضافة الشعبة");
      return;
    }
    setSections((prev) => [...prev, name]);
    showToast(`تمت إضافة الشعبة «${name}»`);
  };

  const deleteSection = async (name) => {
    if (students.some((s) => s.section === name)) {
      showToast(`لا يمكن حذف الشعبة «${name}» لوجود طلاب مسجّلين فيها`);
      return;
    }
    const { error } = await supabase.from("sections").delete().eq("name", name);
    if (error) {
      showToast("تعذّر حذف الشعبة");
      return;
    }
    setSections((prev) => prev.filter((s) => s !== name));
    showToast(`تم حذف الشعبة «${name}»`);
  };

  /* ------------------------------------------------------------
     الأدوار والصلاحيات
  ------------------------------------------------------------ */
  const togglePermission = async (role, sectionId) => {
    const newPerms = { ...roles[role], [sectionId]: !roles[role]?.[sectionId] };
    setRoles((prev) => ({ ...prev, [role]: newPerms }));
    const { error } = await supabase.from("roles").update({ permissions: newPerms }).eq("name", role);
    if (error) {
      setRoles((prev) => ({ ...prev, [role]: roles[role] }));
      showToast("تعذّر حفظ تعديل الصلاحية");
    }
  };

  const addRole = async (name) => {
    if (!name || roles[name]) return;
    const perms = allPerms(false);
    const { error } = await supabase.from("roles").insert({ name, permissions: perms });
    if (error) {
      showToast("تعذّر إضافة الدور");
      return;
    }
    setRoles((prev) => ({ ...prev, [name]: perms }));
    showToast(`تمت إضافة الدور «${name}»`);
  };

  const deleteRole = async (name) => {
    if (users.some((u) => u.role === name)) {
      showToast(`لا يمكن حذف الدور «${name}» لوجود مستخدمين مرتبطين به`);
      return;
    }
    const { error } = await supabase.from("roles").delete().eq("name", name);
    if (error) {
      showToast("تعذّر حذف الدور");
      return;
    }
    setRoles((prev) => {
      const next = { ...prev };
      delete next[name];
      return next;
    });
    showToast(`تم حذف الدور «${name}»`);
  };

  /* ------------------------------------------------------------
     إدارة أسماء الحصص - لمدير النظام من الإعدادات
  ------------------------------------------------------------ */
  const addPeriod = async (name) => {
    const cleanName = (name || "").trim();
    if (!cleanName) return;

    if (periods.some((p) => p.name === cleanName)) {
      showToast(`الحصة «${cleanName}» موجودة بالفعل`);
      return;
    }

    const maxOrder = periods.length
      ? Math.max(...periods.map((p) => Number(p.sort_order) || 0))
      : 0;

    const { data, error } = await supabase
      .from("periods")
      .insert({
        name: cleanName,
        sort_order: maxOrder + 1,
        active: true,
      })
      .select("id, name, sort_order, active")
      .single();

    if (error) {
      showToast(`تعذّر إضافة الحصة: ${error.message}`);
      return;
    }

    setPeriods((prev) =>
      [...prev, data].sort(
        (a, b) =>
          (Number(a.sort_order) || 0) - (Number(b.sort_order) || 0) ||
          a.name.localeCompare(b.name, "ar")
      )
    );
    showToast(`تمت إضافة الحصة «${cleanName}»`);
  };

  const deletePeriod = async (id) => {
    const period = periods.find((p) => p.id === id);
    if (!period) return;

    const { error } = await supabase.from("periods").delete().eq("id", id);

    if (error) {
      showToast(`تعذّر حذف الحصة: ${error.message}`);
      return;
    }

    setPeriods((prev) => prev.filter((p) => p.id !== id));
    showToast(`تم حذف الحصة «${period.name}»`);
  };

  /* ------------------------------------------------------------
     التعهدات، التقييمات، الحضور، المخالفات
  ------------------------------------------------------------ */
  const addPledge = async (studentId, type, violationRef, text) => {
    const st = students.find((s) => s.id === studentId);
    const { data, error } = await supabase
      .from("pledges")
      .insert({ student_id: studentId, type, violation_ref: violationRef || "", text, date: selectedDate })
      .select()
      .single();
    if (error) {
      showToast("تعذّر حفظ التعهد");
      return;
    }
    const rec = enrich(
      { id: data.id, studentId, type, violationRef: data.violation_ref, text, date: data.date },
      students
    );
    setPledges((prev) => [rec, ...prev]);
    showToast(`تم حفظ تعهد ${type === "طالب" ? "الطالب" : "ولي الأمر"} لـ ${st?.name}`);
    return rec;
  };


  const addEvaluation = async (studentId, scores) => {
    const st = students.find((s) => s.id === studentId);

    // إضافة التقييم محصورة بالمعلمين فقط.
    if (currentUser?.role !== "معلم") {
      showToast("إضافة تقييمات الطلاب متاحة للمعلمين فقط");
      return;
    }

    const allowed = accessibleStudents.some((s) => s.id === studentId);
    if (!allowed) {
      showToast("لا يمكنك تقييم طالب خارج صفوفك");
      return;
    }

    const total = (Object.values(scores) as number[]).reduce((a, b) => a + b, 0);
    const max = EVAL_CRITERIA.length * 5;
    const percent = Math.round((total / max) * 100);
    const rating = ratingFor(percent);
    const { data, error } = await supabase
      .from("evaluations")
      .insert({
        student_id: studentId,
        date: selectedDate,
        scores,
        total,
        max,
        percent,
        rating: rating.label,
        rating_color: rating.color,
      })
      .select()
      .single();
    if (error) {
      showToast("تعذّر حفظ التقييم");
      return;
    }
    const rec = enrich(
      { id: data.id, studentId, date: data.date, scores, total, max, percent, rating: rating.label, ratingColor: rating.color },
      students
    );
    setEvaluations((prev) => [rec, ...prev]);
    showToast(`تم حفظ تقييم ${st?.name} — التقدير: ${rating.label}`);
  };

  const effectiveTeachingAssignments = useMemo(() => {
    if (currentUser?.role !== "معلم") return [];
    if (myTeachingAssignments.length > 0) return myTeachingAssignments;
    return currentUser?.teachingAssignments || [];
  }, [currentUser, myTeachingAssignments]);

  const normalizeSchoolValue = (value) =>
    String(value ?? "")
      .normalize("NFKC")
      .replace(/\s+/g, " ")
      .trim();

  const accessibleStudents = useMemo(() => {
    if (!currentUser || currentUser.role !== "معلم") return students;

    return students.filter((st) =>
      effectiveTeachingAssignments.some((a) =>
        normalizeSchoolValue(a.className) === normalizeSchoolValue(st.class) &&
        normalizeSchoolValue(a.sectionName) === normalizeSchoolValue(st.section)
      )
    );
  }, [students, currentUser, effectiveTeachingAssignments]);


  const addPeriodicEvaluation = async ({
    studentId,
    subject,
    evaluationPeriod,
    academicScores,
    behaviorScores,
    teacherNote,
  }) => {
    if (currentUser?.role !== "معلم") {
      showToast("إضافة التقييم الدوري متاحة للمعلمين فقط");
      return null;
    }

    const teacherSubject = String(currentUser.teachingSubject || "").trim();
    if (!teacherSubject) { showToast("يرجى تحديد مادة المعلم في إعدادات المستخدمين أولًا"); return null; }
    const allowed = accessibleStudents.some((s) => s.id === studentId);
    if (!allowed) {
      showToast("لا يمكنك تقييم طالب خارج صفوفك");
      return null;
    }

    const academicValues = Object.values(academicScores || {}).map(Number);
    const behaviorValues = Object.values(behaviorScores || {}).map(Number);

    if (
      academicValues.length !== PERIODIC_ACADEMIC_CRITERIA.length ||
      behaviorValues.length !== PERIODIC_BEHAVIOR_CRITERIA.length ||
      academicValues.some((v) => !v) ||
      behaviorValues.some((v) => !v)
    ) {
      showToast("يرجى استكمال جميع معايير التقييم");
      return null;
    }

    const academicAvg =
      academicValues.reduce((a, b) => a + b, 0) / academicValues.length;
    const behaviorAvg =
      behaviorValues.reduce((a, b) => a + b, 0) / behaviorValues.length;

    const academicRating = periodicRatingFromAverage(academicAvg);
    const behaviorRating = periodicRatingFromAverage(behaviorAvg);
    const overallRating = periodicRatingFromAverage(
      (academicAvg + behaviorAvg) / 2
    );

    const { data, error } = await supabase
      .from("periodic_evaluations")
      .insert({
        student_id: studentId,
        teacher_id: currentUser.id,
        subject: teacherSubject,
        evaluation_period: evaluationPeriod,
        date: selectedDate,
        academic_scores: academicScores,
        behavior_scores: behaviorScores,
        academic_rating: academicRating,
        behavior_rating: behaviorRating,
        overall_rating: overallRating,
        teacher_note: teacherNote.trim() || null,
      })
      .select()
      .single();

    if (error) {
      console.error("Periodic evaluation insert error:", error);
      showToast(`تعذّر حفظ التقييم الدوري: ${error.message}`);
      return null;
    }

    const st = students.find((s) => s.id === studentId);
    const rec = {
      id: data.id,
      studentId,
      teacherId: currentUser.id,
      teacherName: currentUser.name,
      studentName: st?.name,
      class: st?.class,
      section: st?.section,
      guardianPhone: st?.guardianPhone,
      subject: data.subject,
      evaluationPeriod: data.evaluation_period,
      date: data.date,
      academicScores: data.academic_scores || {},
      behaviorScores: data.behavior_scores || {},
      academicRating: data.academic_rating,
      behaviorRating: data.behavior_rating,
      overallRating: data.overall_rating,
      teacherNote: data.teacher_note || "",
      createdAt: data.created_at,
    };

    setPeriodicEvaluations((prev) => [rec, ...prev]);
    showToast(`تم حفظ ${evaluationPeriod} للطالب ${st?.name || ""}`);
    return rec;
  };


  const addCaseFollowup = async (studentId, data) => {
    const allowedRoles = ["مدير النظام", "مرشد طلابي", "مشرف سلوكي"];
    if (!allowedRoles.includes(currentUser?.role)) {
      showToast("إضافة متابعة للحالة متاحة للإدارة ومنسق شؤون الطلاب والمشرف فقط");
      return null;
    }

    const { data: row, error } = await supabase
      .from("student_case_followups")
      .insert({
        student_id: studentId,
        status: data.status,
        followup_type: data.followupType,
        note: data.note?.trim() || null,
        next_action: data.nextAction?.trim() || null,
        next_action_date: data.nextActionDate || null,
        created_by: currentUser.id,
      })
      .select()
      .single();

    if (error) {
      console.error("Case followup insert error:", error);
      showToast(`تعذّر حفظ متابعة الحالة: ${error.message}`);
      return null;
    }

    const st = students.find((s) => s.id === studentId);
    const rec = {
      id: row.id,
      studentId,
      studentName: st?.name,
      class: st?.class,
      section: st?.section,
      status: row.status,
      followupType: row.followup_type,
      note: row.note,
      nextAction: row.next_action,
      nextActionDate: row.next_action_date,
      createdBy: currentUser.id,
      createdByName: currentUser.name,
      createdAt: row.created_at,
    };

    setCaseFollowups((prev) => [rec, ...prev]);
    showToast("تم حفظ متابعة الحالة");
    return rec;
  };

  const completeCaseFollowup = async (followupId) => {
    const allowedRoles = ["مدير النظام", "مرشد طلابي", "مشرف سلوكي"];
    if (!allowedRoles.includes(currentUser?.role)) {
      showToast("إغلاق إجراء المتابعة متاح للإدارة ومنسق شؤون الطلاب والمشرف فقط");
      return false;
    }
    const { error } = await supabase
      .from("student_case_followups")
      .update({ status: "مغلقة" })
      .eq("id", followupId);
    if (error) {
      console.error("Case followup close error:", error);
      showToast(`تعذّر إغلاق الإجراء: ${error.message}`);
      return false;
    }
    setCaseFollowups((prev) =>
      prev.map((x) => (x.id === followupId ? { ...x, status: "مغلقة" } : x))
    );
    showToast("تم إنجاز الإجراء وإغلاق المتابعة");
    return true;
  };

  const referStudentToCounselor = async (studentId, payload: { referralReason?: string; priority?: string; source?: string; assignedTo?: string; nextFollowupDate?: string } = {}) => {
    if (!["مدير النظام", "مرشد طلابي"].includes(currentUser?.role)) {
      showToast("إحالة الطالب لمنسق شؤون الطلاب متاحة لمدير النظام ومنسق شؤون الطلاب فقط");
      return null;
    }

    const existing = await supabase
      .from("counselor_cases")
      .select("id, status")
      .eq("student_id", studentId)
      .not("status", "eq", "مغلقة")
      .limit(1)
      .maybeSingle();

    if (existing.data?.id) {
      showToast("لدى الطالب حالة إرشادية مفتوحة بالفعل");
      return existing.data;
    }

    const { data: row, error } = await supabase
      .from("counselor_cases")
      .insert({
        student_id: studentId,
        referral_reason: payload.referralReason || "إحالة من نظام الإنذار المبكر",
        priority: payload.priority || "متوسطة",
        source: payload.source || "الإنذار المبكر",
        status: "جديدة",
        referred_by: currentUser.id,
        assigned_to: payload.assignedTo || null,
        next_followup_date: payload.nextFollowupDate || null,
      })
      .select()
      .single();

    if (error) {
      console.error("Counselor referral error:", error);
      showToast(`تعذّرت إحالة الطالب: ${error.message}`);
      return null;
    }

    showToast("تمت إحالة الطالب إلى لوحة منسق شؤون الطلاب");
    return row;
  };

  const addGuardianContact = async (studentId, data) => {
    const allowedRoles = ["مدير النظام", "مرشد طلابي", "مشرف سلوكي"];
    if (!allowedRoles.includes(currentUser?.role)) {
      showToast("توثيق التواصل مع ولي الأمر متاح للإدارة ومنسق شؤون الطلاب والمشرف فقط");
      return null;
    }

    const { data: row, error } = await supabase
      .from("guardian_contact_log")
      .insert({
        student_id: studentId,
        channel: data.channel,
        outcome: data.outcome,
        summary: data.summary?.trim() || null,
        agreed_action: data.agreedAction?.trim() || null,
        next_contact_date: data.nextContactDate || null,
        contact_at: new Date().toISOString(),
        created_by: currentUser.id,
      })
      .select()
      .single();

    if (error) {
      console.error("Guardian contact insert error:", error);
      showToast(`تعذّر حفظ التواصل: ${error.message}`);
      return null;
    }

    const st = students.find((s) => s.id === studentId);
    const rec = {
      id: row.id,
      studentId,
      studentName: st?.name,
      class: st?.class,
      section: st?.section,
      channel: row.channel,
      outcome: row.outcome,
      summary: row.summary,
      agreedAction: row.agreed_action,
      nextContactDate: row.next_contact_date,
      contactAt: row.contact_at,
      createdBy: currentUser.id,
      createdByName: currentUser.name,
    };

    setGuardianContacts((prev) => [rec, ...prev]);
    showToast("تم توثيق التواصل مع ولي الأمر");
    return rec;
  };

  const studentsByClass = useMemo(() => {
    const map = {};

    if (currentUser?.role === "معلم") {
      // عند المعلم نستخدم الصف + الشعبة كمفتاح مستقل.
      effectiveTeachingAssignments.forEach((a) => {
        const className = normalizeSchoolValue(a.className);
        const sectionName = normalizeSchoolValue(a.sectionName);
        const key = `${className}||${sectionName}`;
        if (className && sectionName && !map[key]) map[key] = [];
      });

      accessibleStudents.forEach((st) => {
        const className = normalizeSchoolValue(st.class);
        const sectionName = normalizeSchoolValue(st.section);
        const key = `${className}||${sectionName}`;
        if (!map[key]) return;
        map[key].push(st);
      });

      return map;
    }

    classes.forEach((c) => {
      map[c] = students.filter((s) => normalizeSchoolValue(s.class) === normalizeSchoolValue(c));
    });
    return map;
  }, [students, accessibleStudents, classes, currentUser, effectiveTeachingAssignments]);

  useEffect(() => {
    if (currentUser?.role !== "معلم") return;

    const availableKeys = effectiveTeachingAssignments
      .map((a) => `${normalizeSchoolValue(a.className)}||${normalizeSchoolValue(a.sectionName)}`)
      .filter(Boolean);

    if (!availableKeys.length) {
      setAttClass("");
      return;
    }

    if (!availableKeys.includes(attClass)) {
      setAttClass(availableKeys[0]);
    }
  }, [effectiveTeachingAssignments, currentUser, attClass]);

  const attendanceLogClasses = useMemo(() => {
    if (currentUser?.role !== "معلم") return classes;

    return [...new Set(
      effectiveTeachingAssignments
        .map((a) => String(a.className || "").trim())
        .filter(Boolean)
    )];
  }, [classes, currentUser, effectiveTeachingAssignments]);

  const violationLogClasses = useMemo(() => {
    if (currentUser?.role !== "معلم") return classes;

    return [...new Set(
      effectiveTeachingAssignments
        .map((a) => String(a.className || "").trim())
        .filter(Boolean)
    )];
  }, [classes, currentUser, effectiveTeachingAssignments]);

  const violationLogItems = useMemo(() => {
    if (currentUser?.role !== "معلم") return violations;

    const allowedStudentIds = new Set(accessibleStudents.map((s) => s.id));
    return violations.filter((v) => allowedStudentIds.has(v.studentId));
  }, [violations, currentUser, accessibleStudents]);

  const evaluationItems = useMemo(() => {
    if (currentUser?.role !== "معلم") return evaluations;

    const allowedStudentIds = new Set(accessibleStudents.map((s) => s.id));
    return evaluations.filter((e) => allowedStudentIds.has(e.studentId));
  }, [evaluations, currentUser, accessibleStudents]);

  const periodicEvaluationItems = useMemo(() => {
    if (currentUser?.role !== "معلم") return periodicEvaluations;

    const allowedStudentIds = new Set(accessibleStudents.map((s) => s.id));
    return periodicEvaluations.filter((e) => allowedStudentIds.has(e.studentId));
  }, [periodicEvaluations, currentUser, accessibleStudents]);

  const todaysAttendance = attendance[selectedDate]?.[attPeriod] || {};

  const saveAttendanceBatch = async (period, changes) => {
    if (currentPerms.attendance === false || currentPerms["attendance-register"] !== true) {
      showToast("ليس لديك صلاحية تسجيل الحضور");
      return false;
    }
    const entries = Object.entries(changes);
    if (entries.length === 0) return true;

    if (currentUser?.role === "معلم") {
      const allowedIds = new Set(accessibleStudents.map((st) => st.id));
      if (entries.some(([studentId]) => !allowedIds.has(studentId))) {
        showToast("لا يمكنك تسجيل الحضور أو الغياب لطلاب خارج صفوفك");
        return false;
      }
    }
    const time = fmtTime();
    const rows = entries.map(([studentId, status]) => ({
      student_id: studentId,
      date: selectedDate,
      period,
      status,
      time,
      created_by: currentUser?.id,
    }));
    const { error } = await supabase.from("attendance").upsert(rows, { onConflict: "student_id,date,period" });
    if (error) {
      showToast("تعذّر حفظ الحضور");
      return false;
    }
    setAttendance((prev) => {
      const dayRec = { ...(prev[selectedDate] || {}) };
      const periodRec = { ...(dayRec[period] || {}) };
      entries.forEach(([studentId, status]) => { periodRec[studentId] = { status, time }; });
      return { ...prev, [selectedDate]: { ...dayRec, [period]: periodRec } };
    });
    showToast("تم حفظ الحضور بنجاح");
    return true;
  };

  const fetchAttendanceLog = useCallback(async ({ date, className, teacherId, studentName, status }) => {
    let query = supabase
      .from("attendance")
      .select("*, students!inner(name, class_name, section_name), profiles(name)")
      .order("date", { ascending: false })
      .order("id", { ascending: true });
    if (date) query = query.eq("date", date);
    if (className && className !== "الكل") query = query.eq("students.class_name", className);
    if (teacherId && ["مشرف سلوكي", "مدير النظام"].includes(currentUser?.role)) query = query.eq("created_by", teacherId);
    if (currentUser?.role === "معلم") {
      const studentIds = accessibleStudents.map((student) => student.id);
      if (!studentIds.length) return [];
      query = query.in("student_id", studentIds);
    }
    if (status) query = query.eq("status", status);
    const data = [];
    const pageSize = 500;
    for (let offset = 0; ; offset += pageSize) {
      const { data: page, error } = await query.range(offset, offset + pageSize - 1);
      if (error) throw error;
      data.push(...(page || []));
      if (!page || page.length < pageSize) break;
    }
    let rows = (data || []).map((r) => ({
      id: r.id, studentId: r.student_id, studentName: r.students?.name,
      class: r.students?.class_name, section: r.students?.section_name,
      date: r.date, period: r.period, status: r.status, time: r.time,
      teacherName: r.profiles?.name || "—",
      createdBy: r.created_by,
    }));

    // عند المعلم: سجل الحضور يعرض فقط طلاب الصفوف المسندة إليه.
    if (currentUser?.role === "معلم") {
      const allowedStudentIds = new Set(accessibleStudents.map((s) => s.id));
      rows = rows.filter((r) => allowedStudentIds.has(r.studentId));
    }

    if (studentName) rows = rows.filter((r) => r.studentName?.includes(studentName));
    return rows;
  }, [currentUser?.role, accessibleStudents]);

 const addViolation = async (studentId, degree, item, period, description, action) => {
  const st = students.find((s) => s.id === studentId);

  if (currentUser?.role === "معلم") {
    const allowed = accessibleStudents.some((student) => student.id === studentId);
    if (!allowed) {
      showToast("لا يمكنك تسجيل مخالفة لطالب خارج صفوفك");
      return;
    }
  }
  const { data, error } = await supabase
    .from("violations")
    .insert({
      student_id: studentId,
      degree,
      item,
      period,
      description,
      action,
      date: selectedDate,
      time: fmtTime(),
      notified: true,
      followup_status: "مخالفة جديدة",
      created_by: currentUser?.id,   // ← الإضافة المطلوبة
    })
    .select()
    .single();
  if (error) {
    console.error("Violation insert error:", error);
    showToast(`تعذّر تسجيل المخالفة: ${error.message}`);
    return;
  }
  const rec = enrich(
    {
      id: data.id,
      studentId,
      degree,
      item,
      period,
      description,
      action,
      date: data.date,
      time: data.time,
      notified: true,
      followupStatus: data.followup_status || "مخالفة جديدة",
      followedAt: data.followed_at || null,
      referredAt: data.referred_at || null,
      createdBy: data.created_by,
      teacherName: currentUser?.name || "—",
    },
    students
  );
  setViolations((prev) => [rec, ...prev]);
  showToast(`تم تسجيل المخالفة وإبلاغ ولي أمر ${st?.name} على ${st?.guardianPhone}`);
  setViolStudent(null);
};

  const updateViolationFollowupStatus = async (violationId, status) => {
    const patch: any = { followup_status: status };
    if (status === "تمت متابعتها") patch.followed_at = new Date().toISOString();
    if (status === "محولة إلى الأخصائي الاجتماعي") patch.referred_at = new Date().toISOString();

    const { error } = await supabase.from("violations").update(patch).eq("id", violationId);
    if (error) {
      console.error("تعذّر تحديث حالة المخالفة:", error);
      showToast("تعذّر تحديث حالة المخالفة");
      return;
    }

    setViolations((prev) =>
      prev.map((v) =>
        v.id === violationId
          ? {
              ...v,
              followupStatus: status,
              followedAt: patch.followed_at || v.followedAt || null,
              referredAt: patch.referred_at || v.referredAt || null,
            }
          : v
      )
    );
    showToast(`تم تغيير حالة المخالفة إلى: ${status}`);
  };

  const stats = useMemo(() => {
    const todayViol = violations.filter((v) => v.date === selectedDate);
    const dayAtt = Object.values(todaysAttendance) as { status: string }[];
    const present = dayAtt.filter((a) => a.status === "حاضر").length;
    const absent = dayAtt.filter((a) => a.status === "غائب").length;
    const late = dayAtt.filter((a) => a.status === "متأخر").length;
    const byDegree = [1, 2, 3, 4].map((d) => ({
      name: DEGREES[d].short,
      full: DEGREES[d].label,
      count: todayViol.filter((v) => v.degree === d).length,
      color: DEGREES[d].color,
    }));
    return { present, absent, late, unmarked: students.length - dayAtt.length, todayViol, byDegree };
  }, [attendance, selectedDate, violations, students, todaysAttendance]);

  const refreshNotificationCount = useCallback(async () => {
    if (!currentUserId) return;
    const { count, error } = await supabase.from("notifications").select("id", { count: "exact", head: true }).eq("recipient_id", currentUserId).eq("is_read", false);
    if (!error) setNotificationCount(count || 0);
  }, [currentUserId]);

  useEffect(() => { refreshNotificationCount(); }, [refreshNotificationCount, view]);

  if (!loaded || !sessionChecked) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner" />
      </div>
    );
  }

  if (!currentUser) {
    return (
      <>
        
        <LoginScreen users={users} onLogin={handleLogin} error={loginError} />
      </>
    );
  }

  return (
    <div className="app-root" dir="rtl">
     
      <Header
        selectedDate={selectedDate}
        setSelectedDate={setSelectedDate}
        currentUser={currentUser}
        onLogout={handleLogout}
        notificationCount={notificationCount}
        onNotifications={() => setView("notifications")}
      />
      <div className="app-body">
        <SideNav view={view} setView={setView} pendingCount={stats.absent} perms={currentPerms} currentUser={currentUser} />
        <main className="main-area">
          {view === "dashboard" && currentUser?.role === "مشرف سلوكي" && currentPerms.dashboard === true && (
            <SupervisorWorkbook key={currentUser.id} students={accessibleStudents} periods={periods}
              violations={violationLogItems} selectedDate={selectedDate} currentUser={currentUser}
              perms={currentPerms} fetchAttendanceLog={fetchAttendanceLog} setView={setView} />
          )}
          {view === "dashboard" && (
            <Dashboard
              stats={stats}
              students={students}
              violations={violations}
              attendance={attendance}
              evaluations={evaluations}
              periodicEvaluations={periodicEvaluations}
              caseFollowups={caseFollowups}
              guardianContacts={guardianContacts}
              selectedDate={selectedDate}
              setView={setView}
              setFocusedStudentId={setFocusedStudentId}
              completeCaseFollowup={completeCaseFollowup}
              perms={currentPerms}
              currentUser={currentUser}
            />
          )}
          {view === "attendance" && (
            <AttendanceView
              chooseClassFirst={currentUser?.role === "مشرف سلوكي"}
              canFilterTeachers={["مشرف سلوكي", "مدير النظام"].includes(currentUser?.role)}
              canRegister={currentPerms.attendance !== false && currentPerms["attendance-register"] === true}
              attClass={attClass}
              setAttClass={setAttClass}
              attPeriod={attPeriod}
              setAttPeriod={setAttPeriod}
              periods={periods}
              studentsByClass={studentsByClass}
              todaysAttendance={todaysAttendance}
              saveAttendanceBatch={saveAttendanceBatch}
              selectedDate={selectedDate}
              classes={attendanceLogClasses}
              users={users}
              fetchAttendanceLog={fetchAttendanceLog}
            />
          )}
          {view === "violations" && (
            <ViolationsEntry
              studentsByClass={studentsByClass}
              violStudent={violStudent}
              setViolStudent={setViolStudent}
              addViolation={addViolation}
              periods={periods}
              currentUser={currentUser}
            />
          )}
          {view === "log" && (
            <ViolationsLog
              violations={violationLogItems}
              setMsgPreview={setMsgPreview}
              classes={violationLogClasses}
              currentUser={currentUser}
              updateViolationFollowupStatus={updateViolationFollowupStatus}
            />
          )}
          {view === "pledges" && (
            <PledgesView
              students={students}
              violations={violations}
              pledges={pledges}
              addPledge={addPledge}
              setPrintPledge={setPrintPledge}
            />
          )}
          {view === "lesson-points" && currentUser?.role === "معلم" && (
            <LessonPointsView key={currentUser.id} students={accessibleStudents} assignments={effectiveTeachingAssignments} periods={periods} currentUser={currentUser} />
          )}
          {view === "evaluation" && (
            <EvaluationView
              students={currentUser?.role === "معلم" ? accessibleStudents : students}
              evaluations={evaluationItems}
              addEvaluation={addEvaluation}
              sendHudhudMessage={sendHudhudMessage}
              currentUser={currentUser}
            />
          )}
          {view === "periodic-evaluation" && (
            <PeriodicEvaluationView
              students={currentUser?.role === "معلم" ? accessibleStudents : students}
              evaluations={periodicEvaluationItems}
              addPeriodicEvaluation={addPeriodicEvaluation}
              sendHudhudMessage={sendHudhudMessage}
              currentUser={currentUser}
            />
          )}
          {view === "student-profile" && (
            <StudentComprehensiveProfile
              students={currentUser?.role === "معلم" ? accessibleStudents : students}
              attendance={attendance}
              violations={currentUser?.role === "معلم" ? violationLogItems : violations}
              evaluations={currentUser?.role === "معلم" ? evaluationItems : evaluations}
              periodicEvaluations={currentUser?.role === "معلم" ? periodicEvaluationItems : periodicEvaluations}
              pledges={pledges}
              hudhudMessages={hudhudMessages}
              caseFollowups={caseFollowups}
              guardianContacts={guardianContacts}
              addCaseFollowup={addCaseFollowup}
              addGuardianContact={addGuardianContact}
              currentUser={currentUser}
              initialStudentId={focusedStudentId}
            />
          )}
          {view === "notifications" && (
            <NotificationTaskCenter currentUser={currentUser} showToast={showToast} onRefreshCount={refreshNotificationCount} onNavigate={setView} />
          )}
          {view === "counselor-center" && ["مدير النظام", "مرشد طلابي"].includes(currentUser?.role) && (
            <CounselorDashboard
              students={students}
              attendance={attendance}
              violations={violations}
              periodicEvaluations={periodicEvaluations}
              guardianContacts={guardianContacts}
              currentUser={currentUser}
              showToast={showToast}
              onOpenStudent={(studentId) => {
                setSelectedStudentId(studentId);
                setView("student-file");
              }}
            />
          )}
          {view === "student-file" && ["مدير النظام", "مرشد طلابي"].includes(currentUser?.role) && (
            <UnifiedStudentFile
              studentId={selectedStudentId}
              students={students}
              attendance={attendance}
              violations={violations}
              evaluations={evaluations}
              periodicEvaluations={periodicEvaluations}
              caseFollowups={caseFollowups}
              guardianContacts={guardianContacts}
              onBack={() => setView("early-warning")}
            />
          )}
          {view === "early-warning" && currentUser?.role === "مدير النظام" && (
            <EarlyWarningCenter
              students={students}
              attendance={attendance}
              violations={violations}
              evaluations={evaluations}
              periodicEvaluations={periodicEvaluations}
              caseFollowups={caseFollowups}
              guardianContacts={guardianContacts}
              currentUser={currentUser}
              onReferToCounselor={referStudentToCounselor}
              onOpenStudent={(studentId) => {
                setSelectedStudentId(studentId);
                setView("student-file");
              }}
            />
          )}
          {view === "data-center" && currentUser?.role === "مدير النظام" && (
            <DataManagementCenter
              students={students}
              attendance={attendance}
              violations={violations}
              evaluations={evaluations}
              periodicEvaluations={periodicEvaluations}
              caseFollowups={caseFollowups}
              guardianContacts={guardianContacts}
              hudhudMessages={hudhudMessages}
              pledges={pledges}
              users={users}
              teacherClasses={teacherClasses}
              periods={periods}
              currentUser={currentUser}
            />
          )}
          {view === "audit-log" && currentUser?.role === "مدير النظام" && (
            <AuditLogView currentUser={currentUser} />
          )}
          {view === "case-center" && currentUser?.role === "مدير النظام" && (
            <CaseManagementCenter
              students={students}
              caseFollowups={caseFollowups}
              guardianContacts={guardianContacts}
              setFocusedStudentId={setFocusedStudentId}
              setView={setView}
              completeCaseFollowup={completeCaseFollowup}
              currentUser={currentUser}
            />
          )}
          {view === "analytics" && currentUser?.role === "مدير النظام" && (
            <SmartAnalyticsCenter
              students={students}
              attendance={attendance}
              violations={violations}
              evaluations={evaluations}
              periodicEvaluations={periodicEvaluations}
              caseFollowups={caseFollowups}
              guardianContacts={guardianContacts}
              classes={classes}
              currentUser={currentUser}
            />
          )}
          {view === "reports" && (
            <Reports
              violations={violations}
              students={students}
              attendance={attendance}
              classes={classes}
              users={users}
              currentUser={currentUser}
            />
          )}
          {view === "students" && (
            <StudentsView
              studentsByClass={studentsByClass}
              addStudent={addStudent}
              bulkImportStudents={bulkImportStudents}
              updateStudent={updateStudent}
              deleteStudent={deleteStudent}
              deleteStudentsByClass={deleteStudentsByClass}
              classes={classes}
              sections={sections}
              addClass={addClass}
              deleteClass={deleteClass}
              addSection={addSection}
              deleteSection={deleteSection}
              currentUser={currentUser}
            />
          )}
          {view === "hudhud" && (
            <HudhudView
              students={currentUser?.role === "معلم" ? accessibleStudents : students}
              hudhudMessages={
                currentUser?.role === "معلم"
                  ? hudhudMessages.filter((m) => accessibleStudents.some((s) => s.id === m.studentId))
                  : hudhudMessages
              }
              sendHudhudMessage={sendHudhudMessage}
              currentUser={currentUser}
            />
          )}
          {view === "parent-ack-center" && currentUser?.role === "مدير النظام" && (
            <ParentAcknowledgementCenter
              students={students}
              violations={violations}
              pledges={pledges}
              hudhudMessages={hudhudMessages}
              showToast={showToast}
            />
          )}
          {view === "parent-portal" && (
            <ParentPortal
              currentUser={currentUser}
              students={students}
              attendance={attendance}
              violations={violations}
              evaluations={evaluations}
              periodicEvaluations={periodicEvaluations}
              pledges={pledges}
              hudhudMessages={hudhudMessages}
              markHudhudRead={markHudhudRead}
              showToast={showToast}
            />
          )}
          {view === "settings" && (
            <SettingsView
              users={users}
              roles={roles}
              students={students}
              addUser={addUser}
              updateUser={updateUser}
              deleteUser={deleteUser}
              togglePermission={togglePermission}
              addRole={addRole}
              deleteRole={deleteRole}
              resetUserPassword={resetUserPassword}
              periods={periods}
              addPeriod={addPeriod}
              deletePeriod={deletePeriod}
              classes={classes}
              sections={sections}
            />
          )}
        </main>
      </div>
      {toast && <Toast text={toast} />}
      {msgPreview && <MessageModal data={msgPreview} onClose={() => setMsgPreview(null)} />}
      {printPledge && (
        <PrintPledgeModal
          pledge={printPledge}
          violations={violations}
          onClose={() => setPrintPledge(null)}
        />
      )}
    </div>
  );
}
