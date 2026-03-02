"use client";

import { useState, useEffect, useRef } from "react";
import { useWorldViewStore } from "@/stores/worldview-store";

const MONTH_NAMES = [
  "JAN", "FEB", "MAR", "APR", "MAY", "JUN",
  "JUL", "AUG", "SEP", "OCT", "NOV", "DEC",
];

const DAY_HEADERS = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"];

export default function CalendarPicker() {
  const simulationDate = useWorldViewStore((s) => s.simulationDate);
  const setSimulationDate = useWorldViewStore((s) => s.setSimulationDate);
  const setCalendarOpen = useWorldViewStore((s) => s.setCalendarOpen);

  const [viewYear, setViewYear] = useState(simulationDate.getUTCFullYear());
  const [viewMonth, setViewMonth] = useState(simulationDate.getUTCMonth());
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setCalendarOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [setCalendarOpen]);

  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  const selectDay = (day: number) => {
    const d = new Date(Date.UTC(viewYear, viewMonth, day));
    setSimulationDate(d);
    setCalendarOpen(false);
  };

  // Build calendar grid
  const firstDayOfMonth = new Date(Date.UTC(viewYear, viewMonth, 1)).getUTCDay();
  const daysInMonth = new Date(Date.UTC(viewYear, viewMonth + 1, 0)).getUTCDate();

  const fmt = (y: number, m: number, d: number) =>
    `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  const today = new Date();
  const todayStr = fmt(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
  const selectedStr = fmt(simulationDate.getUTCFullYear(), simulationDate.getUTCMonth(), simulationDate.getUTCDate());

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDayOfMonth; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div ref={ref} className="calendar-popup">
      {/* Header: < MONTH YEAR > */}
      <div className="flex items-center justify-between mb-2 px-1">
        <button className="calendar-nav-btn" onClick={prevMonth}>
          &lt;
        </button>
        <span className="text-[10px] tracking-wider text-green-500 hud-glow">
          {MONTH_NAMES[viewMonth]} {viewYear}
        </span>
        <button className="calendar-nav-btn" onClick={nextMonth}>
          &gt;
        </button>
      </div>

      {/* Day-of-week headers */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {DAY_HEADERS.map((d) => (
          <div
            key={d}
            className="w-[28px] text-center text-[8px] text-green-700/50 tracking-wider"
          >
            {d}
          </div>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, i) => {
          if (day === null) {
            return <div key={`empty-${i}`} className="w-[28px] h-[24px]" />;
          }

          const dayStr = fmt(viewYear, viewMonth, day);
          const isToday = dayStr === todayStr;
          const isSelected = dayStr === selectedStr;

          return (
            <button
              key={day}
              onClick={() => selectDay(day)}
              className={`calendar-day ${isSelected ? "calendar-day-active" : ""} ${isToday ? "calendar-day-today" : ""}`}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}
