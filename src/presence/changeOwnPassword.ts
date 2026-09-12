import type { SupabaseClient } from "@supabase/supabase-js";

export async function changeOwnPassword(auth: Pick<SupabaseClient["auth"], "updateUser">, password: string) {
  if (password.length < 6 || password !== password.trim()) {
    throw new Error("أدخل كلمة مرور من 6 أحرف على الأقل دون مسافات في البداية أو النهاية");
  }
  // The authenticated session determines the account; no target user ID is accepted.
  const { data, error } = await auth.updateUser({ password });
  if (error) {
    const messages: Record<string, string> = {
      weak_password: "كلمة المرور لا تستوفي متطلبات الأمان، اختر كلمة أقوى",
      same_password: "اختر كلمة مرور تختلف عن كلمة المرور الحالية",
      reauthentication_needed: "يرجى تسجيل الدخول مجدداً قبل تغيير كلمة المرور",
      session_not_found: "انتهت الجلسة، يرجى تسجيل الدخول مجدداً",
    };
    throw new Error(messages[error.code || ""] || "تعذّر تغيير كلمة المرور، تحقق من اتصالك وحاول مجدداً");
  }
  if (!data.user) throw new Error("يرجى تسجيل الدخول مجدداً");
}
