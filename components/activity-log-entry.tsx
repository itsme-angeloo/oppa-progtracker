import { ActivityIcon } from "lucide-react";
import { Mono } from "@/components/mono";
import type { Activity, Project } from "@/lib/types";

export function ActivityLogEntry({ activity, project }: { activity: Activity; project?: Project }) {
  return (
    <article className="rounded border border-border-subtle bg-bg-surface p-3">
      <div className="flex items-start gap-3">
        <ActivityIcon size={14} className="mt-1 shrink-0 text-glow-green drop-shadow-[0_0_3px_var(--glow-green)]" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-display text-sm font-semibold text-text-primary">{activity.title}</h3>
            <Mono className="rounded bg-bg-surface-raised px-1.5 py-0.5 text-[9px] uppercase text-text-muted">
              {activity.type.replaceAll("_", " ")}
            </Mono>
            {!activity.is_public ? (
              <Mono className="rounded bg-glow-red/10 px-1.5 py-0.5 text-[9px] text-glow-red">PRIVATE</Mono>
            ) : null}
          </div>
          <p className="mt-1 text-sm text-text-muted">{activity.notes || project?.name || "Logged without ceremony."}</p>
          <Mono className="mt-2 block text-[10px] text-text-muted">{new Date(activity.occurred_at).toLocaleString()}</Mono>
        </div>
      </div>
    </article>
  );
}
