import type { DisplayStatus } from "@/lib/types";
import { Mono } from "@/components/mono";

const STATUS_STYLES: Record<DisplayStatus, { label: string; className: string }> = {
  planning: { label: "PLANNING", className: "border-text-muted/30 bg-text-muted/10 text-text-muted" },
  active: { label: "ACTIVE", className: "border-glow-cyan/30 bg-glow-cyan/10 text-glow-cyan" },
  paused: { label: "PAUSED", className: "border-glow-amber/30 bg-glow-amber/10 text-glow-amber opacity-70" },
  ready: { label: "READY", className: "border-glow-amber/40 bg-glow-amber/15 text-glow-amber" },
  blocked: { label: "BLOCKED", className: "border-glow-red/35 bg-glow-red/10 text-glow-red" },
  completed: { label: "DONE", className: "border-glow-green/35 bg-glow-green/10 text-glow-green" },
  archived: { label: "ARCHIVED", className: "border-text-muted/30 bg-text-muted/10 text-text-muted" },
};

export function StatusBadge({ status }: { status: DisplayStatus }) {
  const style = STATUS_STYLES[status];

  return (
    <Mono className={`rounded border px-1.5 py-0.5 text-[9px] font-bold leading-none tracking-[0.14em] ${style.className}`}>
      {style.label}
    </Mono>
  );
}
