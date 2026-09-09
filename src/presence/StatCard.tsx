import React from "react";


export function StatCard({ icon: Icon, label, value, tone }) {
  return (
    <div className="stat-card">
      <div className="stat-icon" style={{ background: `${tone}1A`, color: tone }}>
        <Icon size={20} />
      </div>
      <div>
        <div className="stat-value">{value}</div>
        <div className="stat-label">{label}</div>
      </div>
    </div>
  );
}
