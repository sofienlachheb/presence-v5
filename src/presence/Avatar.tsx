import React from "react";


export function Avatar({ name, tone = "#8A1538" }) {
  const initial = name.trim().charAt(0);
  return (
    <div className="avatar" style={{ background: tone }}>
      {initial}
    </div>
  );
}

