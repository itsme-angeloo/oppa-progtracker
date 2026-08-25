import type { DisplayStatus } from "@/lib/types";
import { Mono } from "@/components/mono";

const STATUS_CONFIG: Record<DisplayStatus, { cssVar: string; pulse: boolean; dim?: boolean }> = {
  planning: { cssVar: "--text-muted", pulse: false, dim: true },
  active: { cssVar: "--glow-cyan", pulse: true },
  paused: { cssVar: "--glow-amber", pulse: false, dim: true },
  ready: { cssVar: "--glow-amber", pulse: false },
  blocked: { cssVar: "--glow-red", pulse: false },
  completed: { cssVar: "--glow-green", pulse: false },
  archived: { cssVar: "--text-muted", pulse: false, dim: true },
};

export function SignalRing({
  status,
  progress,
  size = 58,
}: {
  status: DisplayStatus;
  progress: number;
  size?: number;
}) {
  const cfg = STATUS_CONFIG[status];
  const strokeWidth = 3;
  const radius = (size - strokeWidth * 2) / 2;
  const center = size / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(100, Math.max(0, progress)) / 100) * circumference;
  const color = `var(${cfg.cssVar})`;

  return (
    <div className="relative shrink-0" style={{ width: size, height: size, color }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="var(--border-subtle)"
          strokeWidth={strokeWidth}
          opacity={0.75}
        />
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeWidth={strokeWidth}
          className={cfg.pulse ? "animate-[pulse-ring_2.4s_ease-in-out_infinite]" : undefined}
          style={{
            opacity: cfg.dim ? 0.32 : 1,
            filter: cfg.dim ? "none" : "drop-shadow(0 0 8px rgb(255 255 255 / 0.14))",
            transition: "stroke-dashoffset 0.8s cubic-bezier(0.4,0,0.2,1)",
          }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        {cfg.pulse ? (
          <div className="h-2 w-2 rounded-full bg-current animate-[slow-pulse_2.4s_ease-in-out_infinite]" />
        ) : (
          <Mono className={cfg.dim ? "text-[9px] font-bold leading-none text-text-muted" : "text-[9px] font-bold leading-none"}>
            {progress}%
          </Mono>
        )}
      </div>
    </div>
  );
}
