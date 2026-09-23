import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

export function useRecordAuthors(enabled: boolean, kind: "attendance" | "violations", ids: string[]) {
  const [names, setNames] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const key = JSON.stringify([...new Set(ids.filter(Boolean))].sort());
  useEffect(() => {
    let cancelled = false;
    setNames({});
    setError("");
    if (!enabled || key === "[]") return;
    const load = async () => {
      try {
        const authors = JSON.parse(key);
        const result: Record<string, string> = {};
        for (let offset = 0; offset < authors.length; offset += 200) {
          const { data, error } = await supabase.rpc("get_record_authors", {
            record_kind: kind, author_ids: authors.slice(offset, offset + 200),
          });
          if (error) throw error;
          if (cancelled) return;
          (data || []).forEach((author) => { result[author.id] = author.name; });
        }
        if (!cancelled) setNames(result);
      } catch {
        if (!cancelled) setError("تعذّر تحميل أسماء مسجّلي السجلات. يرجى إعادة فتح السجل أو التواصل مع مسؤول النظام.");
      }
    };
    load();
    return () => { cancelled = true; };
  }, [enabled, kind, key]);
  return { names, error };
}
