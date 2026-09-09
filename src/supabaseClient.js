// ضع هذا الملف في: src/supabaseClient.js
// يعتمد على متغيرات البيئة المعرّفة في ملف .env (انظر .env.example المرفق)

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    "متغيرات Supabase غير معرّفة. تأكد من وجود ملف .env في جذر المشروع " +
      "يحتوي على VITE_SUPABASE_URL و VITE_SUPABASE_ANON_KEY، ثم أعد تشغيل خادم التطوير."
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
