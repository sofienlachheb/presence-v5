import type { AttendanceByPeriod } from "./types";
import React from "react";


/* ---------------------------------------------------------------
   بيانات ثابتة: تصنيف المخالفات السلوكية إلى أربع درجات
   (مبني على لائحة التقويم السلوكي الخاصة بالمدرسة)
--------------------------------------------------------------- */
export const DEGREES = {
  1: {
    label: "الدرجة الأولى",
    short: "د١",
    color: "#2F9E6E",
    soft: "#E7F5EF",
    items: [
      "التأخير عن الحضور في الوقت المحدد لبدء الحصة الدراسية",
      "إثارة الفوضى داخل الفصل (العبث بالماء - الصوت العالي - العبث بالأجهزة)",
      "تناول الأطعمة أو المشروبات أثناء الدرس دون استئذان",
      "المقاطعة المستمرة غير الهادفة لشرح المعلم",
      "النوم داخل الفصل",
      "التأخر الصباحي / التأخر عن الطابور الصباحي",
      "عدم المشاركة في الطابور الصباحي",
      "الخروج من الفصل أو الدخول إليه دون استئذان",
      "عدم أداء الواجبات المدرسية",
      "عدم إحضار الكتب أو مستلزمات المواد الدراسية",
      "عدم الالتزام بالزي المدرسي",
      "عدم الاهتمام بالمظهر العام",
      "عدم الالتزام بقواعد الحافلات ونظمها",
    ],
  },
  2: {
    label: "الدرجة الثانية",
    short: "د٢",
    color: "#D9A62E",
    soft: "#FBF3E1",
    items: [
      "الهروب من الحصص الدراسية",
      "إحضار الهواتف النقالة",
      "التعصب القبلي أو المذهبي",
      "المشاجرات البسيطة أو التشابك بالأيدي بدون وقوع ضرر",
      "الشجار مع الزملاء بالتلفظ بألفاظ غير لائقة",
      "الإضرار بالبيئة الصفية والمدرسية",
      "الاستخدام السيئ للهاتف النقال",
      "التصوير ونشر الصور داخل المدرسة وخارجها",
      "التشبه بجنس مغاير",
    ],
  },
  3: {
    label: "الدرجة الثالثة",
    short: "د٣",
    color: "#E07B39",
    soft: "#FBEAE0",
    items: [
      "الهروب من المدرسة أثناء اليوم الدراسي",
      "إتلاف مصادر التعلم وسرقة ممتلكات المدرسة والآخرين",
      "إساءة الأدب مع المعلمين/الإداريين/الزائرين بالقول أو الإشارة",
      "إحضار واستخدام مواد أو ألعاب خطرة داخل المدرسة",
      "المشاجرات بالأيدي مع وقوع ضرر",
      "رفض الطالب الإجراءات الإدارية الصادرة بحقه",
    ],
  },
  4: {
    label: "الدرجة الرابعة",
    short: "د٤",
    color: "#C7433F",
    soft: "#F9E4E3",
    items: [
      "حيازة المخدرات أو تعاطيها أو الترويج لها",
      "حيازة الممنوعات (سجائر ونحوها) أو تعاطيها",
      "إساءة الأدب مع المعلمين أو الإداريين أو الزائرين بالضرب",
      "التجمع بهدف إيذاء الآخرين - التنمر",
      "حيازة أو استخدام الأسلحة أو أي مواد حادة",
      "إحضار مواد مخلة بالآداب ونشرها",
      "التحرشات الجنسية قولاً",
      "التحرشات الجنسية فعلاً",
      "تزوير الأوراق الرسمية",
      "الاستعراض بالسيارات أو القيادة برعونة أمام مداخل المدارس",
      "التوقيع عن ولي الأمر",
      "الاستخدام السيئ للإنترنت والأجهزة الإلكترونية",
    ],
  },
};


/* الإجراءات الإدارية المتدرجة حسب لائحة التقويم السلوكي */
export const ACTIONS_LIST = [
  "تنبيه شفهي للطالب",
  "تنبيه كتابي",
  "إشعار ولي الأمر",
  "استدعاء ولي الأمر",
  "تعهد خطي بعدم التكرار للطالب",
  "تعهد خطي بعدم التكرار لولي الأمر",
  "تحويل إلى منسق شؤون الطالب",
  "تحويل إلى قسم إرشاد الطلبة",
  "تحويل إلى الأخصائي الاجتماعي",
  "تحويل إلى الأخصائي النفسي",
  "تحويل إلى لجنة التقويم السلوكي",
  "فصل مؤقت للطالب (داخلي)",
  "التحفظ على الهاتف النقال إلى نهاية العام",
  "التزام الطالب بالتعويض عن قيمة ما أتلفه",
  "حرمان الطالب من ركوب الحافلة مع الالتزام بالدوام",
  "مصادرة ما تم ضبطه من مواد ممنوعة",
  "طلب الجهات الأمنية",
];


/* معايير مصفوفة تقييم أداء الطالب (سلوكي / أكاديمي) — من ١ إلى ٥ لكل معيار */
export const EVAL_CRITERIA = [
  { key: "participation", label: "المشاركة والتفاعل الصفي" },
  { key: "homework", label: "الالتزام بالواجبات المدرسية" },
  { key: "behavior", label: "السلوك داخل الفصل" },
  { key: "cooperation", label: "التعاون مع الزملاء" },
  { key: "discipline", label: "الانضباط والالتزام بالمواعيد" },
  { key: "academic", label: "المستوى الأكاديمي العام" },
];


/* التقييم الدوري الرسمي — منفصل عن تقييم النجوم اليومي */
export const PERIODIC_ACADEMIC_CRITERIA = [
  { key: "tasks", label: "إنجاز المهام والواجبات" },
  { key: "work_habits", label: "عادات العمل والأداء الأكاديمي" },
  { key: "participation", label: "المشاركة والتفاعل" },
  { key: "progress", label: "التقدم والتحصيل الأكاديمي" },
  { key: "activities", label: "الأنشطة والمبادرات التعليمية" },
];


export const PERIODIC_BEHAVIOR_CRITERIA = [
  { key: "problem_solving", label: "حل المشكلات" },
  { key: "directions", label: "اتباع الإرشادات" },
  { key: "rules", label: "الالتزام بالقوانين المدرسية" },
  { key: "respect", label: "الاحترام وتحمل المسؤولية" },
  { key: "citizenship", label: "المواطنة الإيجابية وتمثل القيم" },
];


export const PERIODIC_RATING_SCALE = [
  { value: 5, label: "ممتاز" },
  { value: 4, label: "جيد جداً" },
  { value: 3, label: "جيد" },
  { value: 2, label: "مقبول" },
  { value: 1, label: "ضعيف" },
];


export const PERIODIC_PERIODS = [
  "التقييم الأول",
  "التقييم الثاني",
  "التقييم الثالث",
  "التقييم النهائي",
];


export const periodicRatingFromAverage = (avg) => {
  if (avg >= 4.5) return "ممتاز";
  if (avg >= 3.5) return "جيد جداً";
  if (avg >= 2.5) return "جيد";
  if (avg >= 1.5) return "مقبول";
  return "ضعيف";
};


/* الدليل الوصفي للتقديرات */
export const RATING_SCALE = [
  { min: 90, label: "ممتاز", color: "#2F9E6E" },
  { min: 80, label: "جيد جداً", color: "#5B8DEF" },
  { min: 70, label: "جيد", color: "#D9A62E" },
  { min: 60, label: "مقبول", color: "#E07B39" },
  { min: 0, label: "ضعيف", color: "#C7433F" },
];

export const ratingFor = (percent) => RATING_SCALE.find((r) => percent >= r.min) || RATING_SCALE[RATING_SCALE.length - 1];


/* قوالب نصوص التعهد */
export const PLEDGE_TEMPLATES = {
  "طالب":
    "أنا الطالب/ {name} من الصف {class} أتعهد أمام إدارة المدرسة بالالتزام بالأنظمة واللوائح المدرسية، وعدم تكرار المخالفة المتعلقة بـ «{violation}»، وأتحمل المسؤولية الكاملة في حال تكرار ذلك مستقبلاً.",
  "ولي أمر":
    "أنا ولي أمر الطالب/ {name} من الصف {class} أتعهد بمتابعة ابني/ابنتي والحرص على التزامه بالأنظمة المدرسية، وذلك على إثر المخالفة المتعلقة بـ «{violation}»، وأتعهد بالتواصل المستمر مع إدارة المدرسة لمتابعة سلوكه.",
};


/* أقسام النظام القابلة للتحكم بصلاحيات الوصول إليها */
export const PERMISSION_SECTIONS = [
  { id: "dashboard", label: "لوحة المتابعة" },
  { id: "attendance", label: "الحضور والغياب" },
  { id: "attendance-register", label: "تسجيل الحضور" },
  { id: "violations", label: "تسجيل مخالفة" },
  { id: "log", label: "سجلّ المخالفات" },
  { id: "pledges", label: "نماذج التعهد" },
  { id: "lesson-points", label: "نقاط الحصة والتعزيز" },
  { id: "evaluation", label: "تقييم أداء الطالب" },
  { id: "periodic-evaluation", label: "التقييم الدوري للطالب" },
  { id: "reports", label: "الإحصائيات" },
  { id: "students", label: "الطلاب" },
  { id: "hudhud", label: "رسائل هدهد" },
  { id: "parent-portal", label: "متابعة أبنائي" },
  { id: "settings", label: "الإعدادات" },
];


export const allPerms = (val) =>
  PERMISSION_SECTIONS.reduce((acc, s) => ({ ...acc, [s.id]: val }), {});


/* الأدوار الافتراضية وصلاحيات كل دور على أقسام النظام */
export function seedRoles() {
  return {
    "مدير النظام": { ...allPerms(true), "attendance-register": false },
    "مرشد طلابي": {
      ...allPerms(true),
      settings: false,
    },
    "معلم": {
      ...allPerms(false),
      dashboard: true,
      attendance: true,
      "attendance-register": true,
      violations: true,
      evaluation: true,
      "lesson-points": true,
      "periodic-evaluation": true,
    },
    "مشرف سلوكي": {
      ...allPerms(false),
      dashboard: true,
      violations: true,
      log: true,
      pledges: true,
      reports: true,
      students: true,
      hudhud: true,
    },
    "ولي أمر": {
      ...allPerms(false),
      "parent-portal": true,
    },
  };
}


export function seedUsers() {
  return [
    { id: "U1", name: "أ. سارة المهندي", email: "sara.almuhannadi@school.qa", phone: "55011122", role: "مدير النظام", active: true, password: "123456" },
    { id: "U2", name: "أ. محمد الكواري", email: "m.alkuwari@school.qa", phone: "55033344", role: "مرشد طلابي", active: true, password: "123456" },
    { id: "U3", name: "أ. فاطمة الدوسري", email: "f.aldosari@school.qa", phone: "55055566", role: "معلم", active: true, password: "123456" },
    { id: "U4", name: "ولي أمر/ خالد النعيمي", email: "k.alnuaimi@gmail.com", phone: "55077788", role: "ولي أمر", active: true, password: "123456", childStudentIds: ["S1", "S2"] },
  ];
}


export const DEFAULT_CLASSES = ["الأول", "الثاني", "الثالث", "الرابع", "الخامس", "السادس"];

export const DEFAULT_SECTIONS = ["أ", "ب"];

export const FIRST_NAMES = ["محمد", "عبدالله", "أحمد", "خالد", "يوسف", "علي", "سالم", "راشد", "حمد", "عيسى", "فهد", "ناصر"];

export const LAST_NAMES = ["الكواري", "المري", "النعيمي", "السليطي", "العبيدلي", "الكعبي", "الهاجري", "الدوسري"];

export const HEALTH_TAGS = [null, null, null, null, "ربو", "سكري", "حساسية"];


export function seedStudents() {
  let id = 1;
  const students = [];
  DEFAULT_CLASSES.forEach((cls) => {
    DEFAULT_SECTIONS.forEach((section) => {
      const count = 5 + (id % 3);
      for (let i = 0; i < count; i++) {
        const fn = FIRST_NAMES[(id * 3 + i) % FIRST_NAMES.length];
        const ln = LAST_NAMES[(id + i) % LAST_NAMES.length];
        students.push({
          id: `S${id}`,
          name: `${fn} ${ln}`,
          class: cls,
          section,
          guardianName: `ولي أمر ${fn}`,
          guardianPhone: `550${String(100000 + id * 37).slice(0, 6)}`,
          health: HEALTH_TAGS[id % HEALTH_TAGS.length],
        });
        id++;
      }
    });
  });
  return students;
}


export const todayISO = () => new Date().toISOString().slice(0, 10);

export const fmtDate = (iso) =>
  new Date(iso).toLocaleDateString("ar-QA", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

export const fmtTime = () => {
  const now = new Date();
  const hh = String(now.getHours()).padStart(2, "0");
  const mm = String(now.getMinutes()).padStart(2, "0");
  const ss = String(now.getSeconds()).padStart(2, "0");
  return `${hh}:${mm}:${ss}`;
};


/* ---------------------------------------------------------------
   سجلّ المخالفات
--------------------------------------------------------------- */
/* ---------------------------------------------------------------
   سجلّ المخالفات (مع ترقيم صفحات — 5 مخالفات في كل صفحة)
--------------------------------------------------------------- */
export const LOG_PAGE_SIZE = 5;


/* ---------------------------------------------------------------
   رسائل هدهد — إرسال ومتابعة رسائل التواصل مع أولياء الأمور
--------------------------------------------------------------- */
export const HUDHUD_TEMPLATES = [
  { label: "تنويه عام", subject: "تنويه من إدارة المدرسة", body: "نحيطكم علماً بضرورة متابعة ابنكم/ابنتكم {name} من الصف {class} فيما يخص التزامه بالأنظمة المدرسية." },
  { label: "دعوة لاجتماع", subject: "دعوة لحضور اجتماع", body: "نأمل من ولي أمر الطالب/ة {name} من الصف {class} التكرم بالحضور إلى إدارة المدرسة لمناقشة موضوع يخص ابنكم/ابنتكم." },
  { label: "شكر وتقدير", subject: "شكر وتقدير", body: "يسر إدارة المدرسة أن تتقدم بالشكر والتقدير لابنكم/ابنتكم {name} من الصف {class} لما أظهره من التزام وسلوك متميز." },
];







export function buildEarlyWarningData({
  students,
  attendance,
  violations,
  evaluations,
  periodicEvaluations,
  caseFollowups,
  guardianContacts,
}) {
  const now = new Date();
  const dayMs = 86400000;
  const dateDaysAgo = (days) => {
    const d = new Date(now.getTime() - days * dayMs);
    return d.toISOString().slice(0, 10);
  };
  const d7 = dateDaysAgo(7);
  const d14 = dateDaysAgo(14);
  const d30 = dateDaysAgo(30);

  const attendanceRows = [];
  Object.entries<AttendanceByPeriod>(attendance || {}).forEach(([date, periodMap]) => {
    Object.entries(periodMap || {}).forEach(([period, studentMap]) => {
      Object.entries(studentMap || {}).forEach(([studentId, rec]) => {
        attendanceRows.push({ date, period, studentId, ...(rec || {}) });
      });
    });
  });

  return (students || []).map((s) => {
    const reasons = [];
    let score = 0;

    const sAtt = attendanceRows.filter((x) => x.studentId === s.id);
    const abs7 = sAtt.filter((x) => x.date >= d7 && x.status === "غائب").length;
    const late14 = sAtt.filter((x) => x.date >= d14 && x.status === "متأخر").length;

    if (abs7 >= 3) {
      score += 4;
      reasons.push({ type: "غياب", text: `${abs7} حالات غياب خلال آخر 7 أيام`, weight: 4 });
    } else if (abs7 >= 2) {
      score += 2;
      reasons.push({ type: "غياب", text: `${abs7} حالتا غياب خلال آخر 7 أيام`, weight: 2 });
    }

    if (late14 >= 4) {
      score += 3;
      reasons.push({ type: "تأخر", text: `${late14} حالات تأخر خلال آخر 14 يومًا`, weight: 3 });
    } else if (late14 >= 2) {
      score += 1;
      reasons.push({ type: "تأخر", text: `${late14} حالتا تأخر خلال آخر 14 يومًا`, weight: 1 });
    }

    const sViol = (violations || []).filter((v) => v.studentId === s.id);
    const viol30 = sViol.filter((v) => String(v.date || "") >= d30);
    const severe = viol30.filter((v) => Number(v.degree) >= 3);

    if (severe.length) {
      score += 5;
      reasons.push({ type: "مخالفة", text: `${severe.length} مخالفة من الدرجة الثالثة/الرابعة خلال 30 يومًا`, weight: 5 });
    } else if (viol30.length >= 3) {
      score += 4;
      reasons.push({ type: "مخالفة", text: `${viol30.length} مخالفات خلال آخر 30 يومًا`, weight: 4 });
    } else if (viol30.length >= 2) {
      score += 2;
      reasons.push({ type: "مخالفة", text: `${viol30.length} مخالفتان خلال آخر 30 يومًا`, weight: 2 });
    }

    const sPeriodic = (periodicEvaluations || [])
      .filter((e) => e.studentId === s.id)
      .sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")));

    const weakWords = ["ضعيف", "غير مقبول"];
    const weakRecent = sPeriodic.slice(0, 2).filter((e) =>
      weakWords.some((w) => String(e.overallRating || e.rating || "").includes(w))
    ).length;
    if (weakRecent >= 2) {
      score += 3;
      reasons.push({ type: "تقييم", text: "آخر تقييمين دوريّين يشيران إلى مستوى يحتاج متابعة", weight: 3 });
    }

    const sFollowups = (caseFollowups || []).filter((f) => f.studentId === s.id);
    const overdue = sFollowups.filter(
      (f) =>
        f.status !== "مغلقة" &&
        f.status !== "مغلقة" &&
        f.nextActionDate &&
        f.nextActionDate < now.toISOString().slice(0, 10)
    );
    if (overdue.length) {
      score += 4;
      reasons.push({ type: "متابعة", text: `${overdue.length} متابعة تجاوزت تاريخ الاستحقاق`, weight: 4 });
    }

    const lastContact = (guardianContacts || [])
      .filter((c) => c.studentId === s.id)
      .sort((a, b) => String(b.contactAt || "").localeCompare(String(a.contactAt || "")))[0];

    if ((viol30.length >= 2 || abs7 >= 3) && !lastContact) {
      score += 2;
      reasons.push({ type: "ولي الأمر", text: "توجد مؤشرات متكررة دون تواصل مسجل مع ولي الأمر", weight: 2 });
    }

    let level = "مستقر";
    if (score >= 8) level = "أولوية عالية";
    else if (score >= 5) level = "يحتاج تدخل";
    else if (score >= 2) level = "يحتاج متابعة";

    return {
      student: s,
      score,
      level,
      reasons: reasons.sort((a, b) => b.weight - a.weight),
      abs7,
      late14,
      violations30: viol30.length,
      overdue: overdue.length,
    };
  }).sort((a, b) => b.score - a.score);
}
