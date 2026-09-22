export async function createUserErrorMessage(error) {
  const response = error?.context;
  const status = response?.status;
  let detail = "";
  try {
    const body = await response.clone().json();
    detail = [body?.error?.message, body?.error, body?.message, body?.msg]
      .find((value) => typeof value === "string" && value.trim()) || "";
  } catch {
    // Empty or non-JSON gateway responses fall back to the HTTP status.
  }
  if (detail) return `${detail}${status ? ` (HTTP ${status})` : ""}`;
  if (status === 401) return "لم يقبل الخادم جلسة الدخول (401). سجّل الدخول مجددًا؛ وإذا استمر الخطأ، راجع مصادقة دالة create-user.";
  if (status === 403) return "رفض الخادم صلاحية إنشاء المستخدم (403). راجع صلاحيات حسابك.";
  if (status === 404) return "دالة create-user غير موجودة (404). تحقق من نشرها في مشروع Supabase الصحيح.";
  if (status) return `رفضت دالة create-user الطلب (HTTP ${status}). راجع سجل الدالة في Supabase لمعرفة السبب.`;
  return error?.message || "تعذّر الاتصال بخدمة إنشاء المستخدم. حاول مجددًا.";
}
