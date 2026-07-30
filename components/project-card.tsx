import { SignalRing } from "@/components/signal-ring";
import { StatusBadge } from "@/components/status-badge";
import { Mono } from "@/components/mono";
import { Panel } from "@/components/panel";
import { deriveDisplayStatus, progressFor } from "@/lib/status";
import type { PauseEvent, Project } from "@/lib/types";

function typeLabel(type: Project["type"]) {
  return type.replaceAll("_", " ").toUpperCase();
}

export function ProjectCard({
  project,
  pauseEvents,
  actions,
}: {
  project: Project;
  pauseEvents: PauseEvent[];
  actions?: React.ReactNode;
}) {
  const displayStatus = deriveDisplayStatus(project, pauseEvents);
  const progress = progressFor(project);

  return (
    <Panel className="p-4 transition-colors hover:border-text-muted/40">
      <div className="flex items-start gap-4">
        <SignalRing status={displayStatus} progress={progress} />
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex items-center gap-2">
            <StatusBadge status={displayStatus} />
            <Mono className="rounded border border-glow-violet/20 bg-glow-violet/10 px-1.5 py-0.5 text-[9px] text-glow-violet">
              {typeLabel(project.type)}
            </Mono>
          </div>
          <h3 className="truncate font-display text-lg font-semibold text-text-primary">{project.name}</h3>
          <p className="mt-1 line-clamp-2 text-sm text-text-muted">
            {project.description || "No brief yet. Leave a trail for future-you."}
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Mono className="text-[10px] text-text-muted">P{project.priority}</Mono>
            {project.target_date ? (
              <Mono className="text-[10px] text-text-muted">TARGET {project.target_date}</Mono>
            ) : null}
            {project.tags.map((tag) => (
              <Mono key={tag} className="rounded bg-bg-surface-raised px-1.5 py-0.5 text-[10px] text-text-muted">
                #{tag}
              </Mono>
            ))}
          </div>
        </div>
      </div>
      {actions ? <div className="mt-4 border-t border-border-subtle pt-3">{actions}</div> : null}
    </Panel>
  );
}
