import React from "react";


export function HealthDot({ tag }) {
  if (!tag) return null;
  const colors = { "ربو": "#5B8DEF", "سكري": "#D9A62E", "حساسية": "#8E6FCE" };
  return (
    <span className="health-dot" style={{ background: colors[tag] || "#999" }} title={tag}>
      {tag}
    </span>
  );
}
