import React from "react";

export function ClassTabs({ classes, selectedClass, onSelect }) {
  return (
    <div className="class-tabs">
      {classes.map((cls) => (
        <button
          key={cls}
          className={`class-tab ${selectedClass === cls ? "class-tab-active" : ""}`}
          onClick={() => onSelect(cls)}
        >
          {cls.includes("||")
            ? `الصف ${cls.split("||")[0]} / شعبة ${cls.split("||")[1]}`
            : `الصف ${cls}`}
        </button>
      ))}
    </div>
  );
}
