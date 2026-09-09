import React from "react";
import { DEGREES } from "./shared";


/* ---------------------------------------------------------------
   عنصر: مقياس الدرجة (الشريط ذو الأربع شرائح) — العنصر المميز للتصميم
--------------------------------------------------------------- */
export function SeverityGauge({ degree, size = "md" }) {
  const h = size === "sm" ? 6 : 9;
  const w = size === "sm" ? 5 : 22;
  return (
    <div className="severity-gauge" title={DEGREES[degree]?.label}>
      {[1, 2, 3, 4].map((d) => (
        <span
          key={d}
          className="severity-seg"
          style={{
            height: h,
            width: w,
            background: d <= degree ? DEGREES[d].color : "#E3E7E4",
          }}
        />
      ))}
    </div>
  );
}
