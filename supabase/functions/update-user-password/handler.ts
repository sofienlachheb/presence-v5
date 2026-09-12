import type { SupabaseClient } from "@supabase/supabase-js";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

export function createHandler(admin: SupabaseClient) {
  return async (request: Request): Promise<Response> => {
    const reply = (status: number, body: object) => new Response(JSON.stringify(body), {
      status, headers: { ...cors, "Content-Type": "application/json", "Cache-Control": "no-store" },
    });
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
    if (request.method !== "POST") return reply(405, { error: "طريقة الطلب غير مسموحة" });
    try {
      const token = request.headers.get("Authorization")?.match(/^Bearer\s+(.+)$/i)?.[1];
      if (!token) return reply(401, { error: "يرجى تسجيل الدخول مجدداً" });
      const { data: auth, error: authError } = await admin.auth.getUser(token);
      if (authError || !auth.user) return reply(401, { error: "انتهت الجلسة، يرجى تسجيل الدخول مجدداً" });
      const { data: actor, error: actorError } = await admin.from("profiles").select("role, active").eq("id", auth.user.id).maybeSingle();
      if (actorError || actor?.role !== "مدير النظام" || actor.active !== true) {
        return reply(403, { error: "تغيير كلمة المرور متاح لمدير النظام النشط فقط" });
      }
      let body;
      try { body = await request.json(); } catch { return reply(400, { error: "بيانات الطلب غير صحيحة" }); }
      const { userId, password } = body || {};
      if (typeof userId !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId) ||
          typeof password !== "string" || password.length < 6 || password !== password.trim()) {
        return reply(400, { error: "أدخل مستخدماً صالحاً وكلمة مرور من 6 أحرف على الأقل دون مسافات في البداية أو النهاية" });
      }
      const { data: target, error: targetError } = await admin.from("profiles").select("id").eq("id", userId).maybeSingle();
      if (targetError) return reply(500, { error: "تعذّر التحقق من المستخدم" });
      if (!target) return reply(404, { error: "المستخدم غير موجود" });
      const { error } = await admin.auth.admin.updateUserById(userId, { password });
      if (error) return reply(error.status === 422 ? 422 : 400, {
        error: error.code === "weak_password" ? "كلمة المرور لا تستوفي متطلبات الأمان، اختر كلمة أقوى" : "تعذّر تغيير كلمة المرور، حاول مجدداً",
      });
      return reply(200, { success: true });
    } catch {
      return reply(500, { error: "تعذّر تغيير كلمة المرور، حاول مجدداً" });
    }
  };
}
