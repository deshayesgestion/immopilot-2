import { useState } from "react";
import { Calendar, ChevronDown } from "lucide-react";

export const PERIODS = [
  { id: "today", label: "Aujourd'hui" },
  { id: "7d", label: "7 derniers jours" },
  { id: "30d", label: "30 derniers jours" },
  { id: "custom", label: "Personnalisée" },
];

export function getPeriodDates(period, customStart, customEnd) {
  const now = new Date();
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);
  let start = new Date(now);

  if (period === "today") {
    start.setHours(0, 0, 0, 0);
  } else if (period === "7d") {
    start.setDate(start.getDate() - 6);
    start.setHours(0, 0, 0, 0);
  } else if (period === "30d") {
    start.setDate(start.getDate() - 29);
    start.setHours(0, 0, 0, 0);
  } else if (period === "custom") {
    return {
      start: customStart ? new Date(customStart) : new Date(now.setDate(now.getDate() - 30)),
      end: customEnd ? new Date(customEnd + "T23:59:59") : end,
    };
  }
  return { start, end };
}

export function filterByPeriod(items, period, customStart, customEnd, dateField = "created_date") {
  const { start, end } = getPeriodDates(period, customStart, customEnd);
  return items.filter(item => {
    const d = new Date(item[dateField]);
    return d >= start && d <= end;
  });
}

export default function CockpitPeriodFilter({ period, onPeriodChange, customStart, customEnd, onCustomChange }) {
  const [showCustom, setShowCustom] = useState(false);

  const handlePeriod = (id) => {
    onPeriodChange(id);
    setShowCustom(id === "custom");
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <div className="flex items-center gap-1 bg-white border border-border/50 rounded-xl p-1">
        {PERIODS.filter(p => p.id !== "custom").map(p => (
          <button
            key={p.id}
            onClick={() => handlePeriod(p.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              period === p.id
                ? "bg-primary text-white shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
            }`}
          >
            {p.label}
          </button>
        ))}
        <button
          onClick={() => handlePeriod("custom")}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            period === "custom"
              ? "bg-primary text-white shadow-sm"
              : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
          }`}
        >
          <Calendar className="w-3 h-3" />
          Personnalisée
        </button>
      </div>

      {period === "custom" && (
        <div className="flex items-center gap-2 bg-white border border-border/50 rounded-xl px-3 py-1.5">
          <input
            type="date"
            value={customStart || ""}
            onChange={e => onCustomChange("start", e.target.value)}
            className="text-xs border-0 outline-none bg-transparent"
          />
          <span className="text-xs text-muted-foreground">→</span>
          <input
            type="date"
            value={customEnd || ""}
            onChange={e => onCustomChange("end", e.target.value)}
            className="text-xs border-0 outline-none bg-transparent"
          />
        </div>
      )}
    </div>
  );
}