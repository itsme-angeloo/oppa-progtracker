import type { Activity } from "@/lib/types";
import { Mono } from "@/components/mono";

const LEVEL_CLASSES = [
  "bg-bg-void",
  "bg-glow-cyan/15",
  "bg-glow-cyan/30",
  "bg-glow-cyan/55",
  "bg-glow-cyan shadow-[0_0_3px_var(--glow-cyan)]",
];

export function ActivityHeatmap({ activities }: { activities: Activity[] }) {
  const today = new Date();
  const days = Array.from({ length: 112 }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (111 - index));
    const key = date.toISOString().slice(0, 10);
    const count = activities.filter((activity) => activity.occurred_at.slice(0, 10) === key).length;
    return { key, level: Math.min(4, count) };
  });

  return (
    <div>
      <div className="grid grid-flow-col grid-rows-7 gap-1 overflow-x-auto pb-1">
        {days.map((day) => (
          <div
            key={day.key}
            title={`${day.key}: ${day.level} activities`}
            className={`h-2.5 w-2.5 shrink-0 rounded-[2px] ${LEVEL_CLASSES[day.level]}`}
          />
        ))}
      </div>
      <div className="mt-3 flex items-center justify-end gap-1">
        <Mono className="text-[10px] text-text-muted">Less</Mono>
        {LEVEL_CLASSES.map((className, index) => (
          <span key={index} className={`h-2.5 w-2.5 rounded-[2px] ${className}`} />
        ))}
        <Mono className="text-[10px] text-text-muted">More</Mono>
      </div>
    </div>
  );
}
