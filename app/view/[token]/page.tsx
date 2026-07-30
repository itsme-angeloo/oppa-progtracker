import { ActivityHeatmap } from "@/components/activity-heatmap";
import { ActivityLogEntry } from "@/components/activity-log-entry";
import { Mono } from "@/components/mono";
import { Panel } from "@/components/panel";
import { ProjectCard } from "@/components/project-card";
import { createGuestSupabaseClient } from "@/lib/supabase/guest";
import type { Activity, Project } from "@/lib/types";

type SharedPayload =
  | { error: "invalid_or_expired_link" }
  | {
      share: { label: string };
      projects: Project[];
      activities: Activity[];
    };

export default async function GuestPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const supabase = createGuestSupabaseClient();
  const { data, error } = await supabase.rpc("get_shared_dashboard", { p_token: token });
  const payload = data as SharedPayload | null;

  if (error || !payload || "error" in payload) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-bg-void p-6">
        <Panel className="max-w-md p-6 text-center">
          <Mono className="text-[10px] text-glow-amber">LINK INACTIVE</Mono>
          <h1 className="mt-2 font-display text-2xl font-semibold">This status link is no longer active.</h1>
          <p className="mt-2 text-sm text-text-muted">The owner may have revoked it, or it may have expired.</p>
        </Panel>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-bg-void text-text-primary">
      <header className="border-b border-border-subtle px-4 py-6 md:px-8">
        <Mono className="text-[10px] text-glow-cyan">READ ONLY STATUS</Mono>
        <h1 className="mt-2 font-display text-3xl font-semibold">{payload.share.label}</h1>
        <p className="mt-2 text-sm text-text-muted">Public activity only. No edit controls, no private notes.</p>
      </header>
      <div className="grid gap-5 p-4 md:p-8">
        <div className="grid gap-4 md:grid-cols-3">
          <Panel className="p-4">
            <Mono className="text-[9px] text-text-muted">PROJECTS</Mono>
            <div className="mt-1 font-display text-2xl font-bold">{payload.projects.length}</div>
          </Panel>
          <Panel className="p-4">
            <Mono className="text-[9px] text-text-muted">PUBLIC ACTIVITY</Mono>
            <div className="mt-1 font-display text-2xl font-bold">{payload.activities.length}</div>
          </Panel>
          <Panel className="p-4">
            <Mono className="text-[9px] text-text-muted">UPDATED</Mono>
            <div className="mt-2 font-mono text-xs text-text-muted">{new Date().toLocaleDateString()}</div>
          </Panel>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {payload.projects.map((project) => (
            <ProjectCard key={project.id} project={project} pauseEvents={[]} />
          ))}
        </div>
        <Panel className="p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-sm font-semibold uppercase tracking-[0.14em]">Activity</h2>
            <Mono className="text-[10px] text-text-muted">PUBLIC ONLY</Mono>
          </div>
          <ActivityHeatmap activities={payload.activities} />
        </Panel>
        <div className="grid gap-3">
          {payload.activities.slice(0, 12).map((activity) => (
            <ActivityLogEntry key={activity.id} activity={activity} project={payload.projects.find((project) => project.id === activity.project_id)} />
          ))}
        </div>
      </div>
    </main>
  );
}
