"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  ChevronRight,
  FolderKanban,
  LayoutDashboard,
  Link2,
  Pause,
  Play,
  Plus,
  Settings,
  Sparkles,
  Zap,
} from "lucide-react";
import { ActivityHeatmap } from "@/components/activity-heatmap";
import { ActivityLogEntry } from "@/components/activity-log-entry";
import { Mono } from "@/components/mono";
import { Panel } from "@/components/panel";
import { ProjectCard } from "@/components/project-card";
import { WhatsNextWidget } from "@/components/whats-next-widget";
import { rankSuggestions } from "@/lib/scoring";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import type { Activity as WorkActivity, ActivityType, PauseEvent, Project, ProjectStatus, ProjectType, ShareLink } from "@/lib/types";

type View = "dashboard" | "projects" | "activity" | "suggestions" | "share-links" | "settings";
type SessionUser = { id: string; email?: string };

const NAV_ITEMS: { view: View; label: string; icon: React.ComponentType<{ size?: number; className?: string }> }[] = [
  { view: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { view: "projects", label: "Projects", icon: FolderKanban },
  { view: "activity", label: "Activity Log", icon: Activity },
  { view: "suggestions", label: "Suggestions", icon: Sparkles },
  { view: "share-links", label: "Share Links", icon: Link2 },
  { view: "settings", label: "Settings", icon: Settings },
];

const PROJECT_TYPES: ProjectType[] = ["client_work", "internal_tool", "personal", "learning", "maintenance"];
const ACTIVITY_TYPES: ActivityType[] = ["dev_work", "bugfix", "webinar", "training", "meeting", "research", "support_ticket", "note"];

function labelFor(value: string) {
  return value.replaceAll("_", " ");
}

function parseTags(value: string) {
  return value
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="grid gap-1.5 text-xs font-medium uppercase tracking-[0.12em] text-text-muted">
      <Mono>{label}</Mono>
      {children}
    </label>
  );
}

function inputClass() {
  return "min-h-10 rounded-md border border-border-subtle bg-bg-void px-3 py-2 text-sm text-text-primary outline-none transition focus:border-glow-cyan";
}

function ActionButton({
  children,
  type = "button",
  onClick,
  tone = "cyan",
  disabled,
}: {
  children: React.ReactNode;
  type?: "button" | "submit";
  onClick?: () => void;
  tone?: "cyan" | "violet" | "amber" | "red" | "quiet";
  disabled?: boolean;
}) {
  const toneClass = {
    cyan: "border-glow-cyan/40 bg-glow-cyan/15 text-glow-cyan hover:bg-glow-cyan/20",
    violet: "border-glow-violet/40 bg-glow-violet/15 text-glow-violet hover:bg-glow-violet/20",
    amber: "border-glow-amber/40 bg-glow-amber/15 text-glow-amber hover:bg-glow-amber/20",
    red: "border-glow-red/40 bg-glow-red/15 text-glow-red hover:bg-glow-red/20",
    quiet: "border-border-subtle bg-bg-surface-raised text-text-muted hover:text-text-primary",
  }[tone];

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex min-h-9 items-center justify-center gap-2 rounded-md border px-3 py-1.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${toneClass}`}
    >
      {children}
    </button>
  );
}

export function OwnerWorkspace({ view }: { view: View }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [projects, setProjects] = useState<Project[]>([]);
  const [activities, setActivities] = useState<WorkActivity[]>([]);
  const [pauseEvents, setPauseEvents] = useState<PauseEvent[]>([]);
  const [shareLinks, setShareLinks] = useState<ShareLink[]>([]);
  const [message, setMessage] = useState("Loading workspace...");
  const [busy, setBusy] = useState(false);

  const supabase = useMemo(() => {
    try {
      return createBrowserSupabaseClient();
    } catch {
      return null;
    }
  }, []);

  const suggestions = useMemo(
    () => rankSuggestions({ projects, activities, pauseEvents }),
    [projects, activities, pauseEvents],
  );

  useEffect(() => {
    if (!supabase) {
      return;
    }

    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setUser({ id: data.user.id, email: data.user.email });
      } else {
        setMessage("Sign in to open Progress OS.");
      }
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ? { id: session.user.id, email: session.user.email } : null);
    });

    return () => listener.subscription.unsubscribe();
  }, [supabase]);

  useEffect(() => {
    if (user) {
      void refresh();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  async function refresh() {
    if (!supabase || !user) return;

    const [projectRes, activityRes, pauseRes, linkRes] = await Promise.all([
      supabase.from("projects").select("*").order("updated_at", { ascending: false }),
      supabase.from("activities").select("*").order("occurred_at", { ascending: false }),
      supabase.from("pause_events").select("*").order("paused_at", { ascending: false }),
      supabase.from("share_links").select("*").order("created_at", { ascending: false }),
    ]);

    if (projectRes.error || activityRes.error || pauseRes.error || linkRes.error) {
      setMessage(projectRes.error?.message || activityRes.error?.message || pauseRes.error?.message || linkRes.error?.message || "Could not load workspace.");
      return;
    }

    setProjects((projectRes.data || []) as Project[]);
    setActivities((activityRes.data || []) as WorkActivity[]);
    setPauseEvents((pauseRes.data || []) as PauseEvent[]);
    setShareLinks((linkRes.data || []) as ShareLink[]);
    setMessage("");
  }

  async function signIn(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase) return;
    setBusy(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      const signUp = await supabase.auth.signUp({ email, password });
      if (signUp.error) {
        setMessage(signUp.error.message);
      } else {
        setUser(signUp.data.user ? { id: signUp.data.user.id, email: signUp.data.user.email } : null);
        setMessage("Account created. Confirm email if Supabase requires it, then sign in.");
      }
    } else {
      setUser(data.user ? { id: data.user.id, email: data.user.email } : null);
    }
    setBusy(false);
  }

  async function createProject(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase || !user) return;
    const form = new FormData(event.currentTarget);
    const payload = {
      owner_id: user.id,
      name: String(form.get("name") || "").trim(),
      description: String(form.get("description") || "").trim() || null,
      type: String(form.get("type")) as ProjectType,
      priority: Number(form.get("priority") || 3),
      status: String(form.get("status")) as ProjectStatus,
      tags: parseTags(String(form.get("tags") || "")),
      target_date: String(form.get("target_date") || "") || null,
      progress_override: form.get("progress_override") ? Number(form.get("progress_override")) : null,
      repo_link: String(form.get("repo_link") || "").trim() || null,
      doc_link: String(form.get("doc_link") || "").trim() || null,
    };

    if (!payload.name) {
      setMessage("Project name is required.");
      return;
    }

    const { error } = await supabase.from("projects").insert(payload);
    if (error) setMessage(error.message);
    event.currentTarget.reset();
    await refresh();
  }

  async function createActivity(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase || !user) return;
    const form = new FormData(event.currentTarget);
    const payload = {
      owner_id: user.id,
      project_id: String(form.get("project_id") || "") || null,
      type: String(form.get("type")) as ActivityType,
      title: String(form.get("title") || "").trim(),
      notes: String(form.get("notes") || "").trim() || null,
      duration_minutes: form.get("duration_minutes") ? Number(form.get("duration_minutes")) : null,
      is_public: form.get("is_public") === "on",
    };

    if (!payload.title) {
      setMessage("Activity title is required.");
      return;
    }

    const { error } = await supabase.from("activities").insert(payload);
    if (error) setMessage(error.message);
    event.currentTarget.reset();
    await refresh();
  }

  async function pauseProject(project: Project) {
    if (!supabase || !user) return;
    const reason = window.prompt("Pause reason? Required.");
    if (!reason?.trim()) {
      setMessage("Pause reason is required.");
      return;
    }
    const resumeTrigger = window.prompt("Resume trigger or condition? Optional.") || null;
    const expectedResumeDate = window.prompt("Expected resume date as YYYY-MM-DD? Optional.") || null;

    const pauseInsert = await supabase.from("pause_events").insert({
      project_id: project.id,
      reason: reason.trim(),
      resume_trigger: resumeTrigger?.trim() || null,
      expected_resume_date: expectedResumeDate?.trim() || null,
    });
    const projectUpdate = await supabase.from("projects").update({ status: "paused" }).eq("id", project.id);
    const activityInsert = await supabase.from("activities").insert({
      owner_id: user.id,
      project_id: project.id,
      type: "pause",
      title: `Paused ${project.name}`,
      notes: reason.trim(),
      is_public: true,
    });

    if (pauseInsert.error || projectUpdate.error || activityInsert.error) {
      setMessage(pauseInsert.error?.message || projectUpdate.error?.message || activityInsert.error?.message || "Pause failed.");
    }
    await refresh();
  }

  async function resumeProject(project: Project) {
    if (!supabase || !user) return;
    const note = window.prompt("Resume note?") || "";
    const openPause = pauseEvents.find((event) => event.project_id === project.id && !event.resumed_at);

    if (openPause) {
      const { error } = await supabase
        .from("pause_events")
        .update({ resumed_at: new Date().toISOString(), resume_note: note.trim() || null })
        .eq("id", openPause.id);
      if (error) setMessage(error.message);
    }

    const projectUpdate = await supabase.from("projects").update({ status: "active" }).eq("id", project.id);
    const activityInsert = await supabase.from("activities").insert({
      owner_id: user.id,
      project_id: project.id,
      type: "resume",
      title: `Resumed ${project.name}`,
      notes: note.trim() || null,
      is_public: true,
    });

    if (projectUpdate.error || activityInsert.error) {
      setMessage(projectUpdate.error?.message || activityInsert.error?.message || "Resume failed.");
    }
    await refresh();
  }

  async function createShareLink(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase || !user) return;
    const form = new FormData(event.currentTarget);
    const { error } = await supabase.from("share_links").insert({
      owner_id: user.id,
      label: String(form.get("label") || "Status link"),
      scope_all: true,
      expires_at: String(form.get("expires_at") || "") || null,
    });
    if (error) setMessage(error.message);
    event.currentTarget.reset();
    await refresh();
  }

  async function revokeShareLink(link: ShareLink) {
    if (!supabase) return;
    const { error } = await supabase.from("share_links").update({ revoked: true }).eq("id", link.id);
    if (error) setMessage(error.message);
    await refresh();
  }

  if (!user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-bg-void p-6">
        <Panel className="w-full max-w-md p-6">
          <div className="mb-6">
            <Mono className="text-[10px] text-glow-cyan">PROGRESS OS</Mono>
            <h1 className="mt-2 font-display text-2xl font-semibold">Owner access</h1>
            <p className="mt-2 text-sm text-text-muted">
              {supabase ? message : "Add Supabase env values to .env.local to connect the workspace."}
            </p>
          </div>
          <form onSubmit={signIn} className="grid gap-3">
            <Field label="Email">
              <input className={inputClass()} value={email} onChange={(event) => setEmail(event.target.value)} type="email" required />
            </Field>
            <Field label="Password">
              <input className={inputClass()} value={password} onChange={(event) => setPassword(event.target.value)} type="password" required />
            </Field>
            <ActionButton type="submit" disabled={busy}>
              <Zap size={14} /> Sign in
            </ActionButton>
          </form>
        </Panel>
      </main>
    );
  }

  const activeProjects = projects.filter((project) => project.status === "active").length;
  const completedProjects = projects.filter((project) => project.status === "completed").length;

  return (
    <div className="flex min-h-screen bg-bg-void text-text-primary">
      <aside className="hidden w-64 shrink-0 border-r border-border-subtle bg-bg-void lg:block">
        <div className="flex h-16 items-center gap-3 border-b border-border-subtle px-5">
          <div className="relative h-7 w-7 rounded-sm border border-border-subtle bg-bg-void">
            <span className="absolute inset-1 rounded-sm border border-glow-cyan shadow-[0_0_6px_var(--glow-cyan)]" />
            <span className="absolute left-1/2 top-1/2 h-1 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-glow-cyan shadow-[0_0_4px_var(--glow-cyan)]" />
          </div>
          <h1 className="font-display text-sm font-semibold uppercase tracking-[0.15em]">Progress OS</h1>
        </div>
        <nav className="p-3">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = item.view === view;
            return (
              <a
                key={item.view}
                href={`/${item.view === "dashboard" ? "dashboard" : item.view}`}
                className={`mb-1 flex items-center gap-3 rounded-md border-l-2 px-3 py-2 text-sm transition ${
                  active
                    ? "border-glow-cyan bg-bg-surface-raised text-text-primary shadow-[inset_0_0_12px_rgb(77_232_255_/_0.05)]"
                    : "border-transparent text-text-muted hover:bg-bg-surface hover:text-text-primary"
                }`}
              >
                <Icon size={16} className={active ? "text-glow-cyan drop-shadow-[0_0_4px_var(--glow-cyan)]" : ""} />
                {item.label}
              </a>
            );
          })}
        </nav>
        <div className="absolute bottom-0 hidden w-64 border-t border-border-subtle p-4 lg:block">
          <Mono className="block truncate text-[10px] text-text-muted">{user.email}</Mono>
          <button
            className="mt-2 text-xs text-text-muted hover:text-text-primary"
            onClick={() => void supabase?.auth.signOut()}
          >
            Sign out
          </button>
        </div>
      </aside>

      <main className="min-w-0 flex-1">
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-border-subtle bg-bg-void/95 px-4 backdrop-blur md:px-6">
          <div>
            <Mono className="text-[10px] text-text-muted">OWNER WORKSPACE</Mono>
            <h2 className="font-display text-lg font-semibold uppercase tracking-[0.15em]">{view.replaceAll("-", " ")}</h2>
          </div>
          <ActionButton onClick={() => void refresh()} tone="quiet">Refresh</ActionButton>
        </header>
        {message ? <div className="border-b border-border-subtle bg-glow-amber/10 px-4 py-2 text-sm text-glow-amber">{message}</div> : null}
        <div className="grid gap-5 p-4 md:p-6">
          {view === "dashboard" ? (
            <>
              <div className="grid gap-3 md:grid-cols-3">
                {[
                  ["ACTIVE PROJECTS", activeProjects, `${completedProjects} complete`],
                  ["ACTIVITIES", activities.length, "logged total"],
                  ["SHARE LINKS", shareLinks.filter((link) => !link.revoked).length, "active links"],
                ].map(([label, value, sub]) => (
                  <Panel key={label} className="p-4">
                    <Mono className="text-[9px] text-text-muted">{label}</Mono>
                    <div className="mt-1 font-display text-2xl font-bold">{value}</div>
                    <Mono className="text-[10px] text-text-muted">{sub}</Mono>
                  </Panel>
                ))}
              </div>
              <div className="grid gap-5 xl:grid-cols-[1fr_380px]">
                <div className="grid gap-4 md:grid-cols-2">
                  {projects.slice(0, 6).map((project) => (
                    <ProjectCard key={project.id} project={project} pauseEvents={pauseEvents} actions={<ProjectActions project={project} onPause={pauseProject} onResume={resumeProject} />} />
                  ))}
                  {!projects.length ? <EmptyState text="Create a project and the signal grid wakes up." /> : null}
                </div>
                <WhatsNextWidget suggestions={suggestions} />
              </div>
              <Panel className="p-4">
                <div className="mb-3 flex items-center gap-2">
                  <Activity size={14} className="text-glow-green" />
                  <Mono className="text-[10px] text-text-muted">ACTIVITY HEATMAP</Mono>
                </div>
                <ActivityHeatmap activities={activities} />
              </Panel>
            </>
          ) : null}

          {view === "projects" ? (
            <div className="grid gap-5 xl:grid-cols-[380px_1fr]">
              <ProjectForm onSubmit={createProject} />
              <div className="grid gap-4 md:grid-cols-2">
                {projects.map((project) => (
                  <ProjectCard key={project.id} project={project} pauseEvents={pauseEvents} actions={<ProjectActions project={project} onPause={pauseProject} onResume={resumeProject} />} />
                ))}
                {!projects.length ? <EmptyState text="No projects yet. Start with a name; structure can come later." /> : null}
              </div>
            </div>
          ) : null}

          {view === "activity" ? (
            <div className="grid gap-5 xl:grid-cols-[380px_1fr]">
              <ActivityForm projects={projects} onSubmit={createActivity} />
              <div className="grid gap-3">
                {activities.map((activity) => (
                  <ActivityLogEntry key={activity.id} activity={activity} project={projects.find((project) => project.id === activity.project_id)} />
                ))}
                {!activities.length ? <EmptyState text="Log the first breadcrumb. Type and title are enough." /> : null}
              </div>
            </div>
          ) : null}

          {view === "suggestions" ? <WhatsNextWidget suggestions={suggestions} /> : null}

          {view === "share-links" ? (
            <div className="grid gap-5 xl:grid-cols-[380px_1fr]">
              <ShareLinkForm onSubmit={createShareLink} />
              <div className="grid gap-3">
                {shareLinks.map((link) => (
                  <Panel key={link.id} className="p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <h3 className="font-display text-base font-semibold">{link.label}</h3>
                        <Mono className="mt-1 block break-all text-[10px] text-text-muted">{`${window.location.origin}/view/${link.token}`}</Mono>
                      </div>
                      <div className="flex items-center gap-2">
                        <Mono className={link.revoked ? "text-[10px] text-glow-red" : "text-[10px] text-glow-green"}>
                          {link.revoked ? "REVOKED" : "ACTIVE"}
                        </Mono>
                        {!link.revoked ? <ActionButton tone="red" onClick={() => void revokeShareLink(link)}>Revoke</ActionButton> : null}
                      </div>
                    </div>
                  </Panel>
                ))}
                {!shareLinks.length ? <EmptyState text="No status links yet. Create one when someone needs the calm version." /> : null}
              </div>
            </div>
          ) : null}

          {view === "settings" ? (
            <Panel className="p-5">
              <h3 className="font-display text-lg font-semibold">Settings</h3>
              <p className="mt-2 text-sm text-text-muted">AI narration is optional. With `AI_PROVIDER=none`, Progress OS keeps using the rule-based engine.</p>
            </Panel>
          ) : null}
        </div>
      </main>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return <Panel className="p-5 text-sm text-text-muted">{text}</Panel>;
}

function ProjectActions({
  project,
  onPause,
  onResume,
}: {
  project: Project;
  onPause: (project: Project) => Promise<void>;
  onResume: (project: Project) => Promise<void>;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {project.status === "paused" ? (
        <ActionButton tone="cyan" onClick={() => void onResume(project)}>
          <Play size={13} /> Resume
        </ActionButton>
      ) : (
        <ActionButton tone="amber" onClick={() => void onPause(project)}>
          <Pause size={13} /> Pause
        </ActionButton>
      )}
      <a href={`/projects/${project.id}`} className="inline-flex min-h-9 items-center gap-2 rounded-md border border-border-subtle bg-bg-surface-raised px-3 py-1.5 text-sm text-text-muted hover:text-text-primary">
        Detail <ChevronRight size={13} />
      </a>
    </div>
  );
}

function ProjectForm({ onSubmit }: { onSubmit: (event: React.FormEvent<HTMLFormElement>) => Promise<void> }) {
  return (
    <Panel className="p-4">
      <div className="mb-4 flex items-center gap-2">
        <Plus size={14} className="text-glow-cyan" />
        <h2 className="font-display text-sm font-semibold uppercase tracking-[0.14em]">New Project</h2>
      </div>
      <form onSubmit={onSubmit} className="grid gap-3">
        <Field label="Name"><input name="name" className={inputClass()} required /></Field>
        <Field label="Description"><textarea name="description" className={`${inputClass()} min-h-20`} /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Type">
            <select name="type" className={inputClass()} defaultValue="personal">
              {PROJECT_TYPES.map((type) => <option key={type} value={type}>{labelFor(type)}</option>)}
            </select>
          </Field>
          <Field label="Status">
            <select name="status" className={inputClass()} defaultValue="planning">
              {["planning", "active", "paused", "blocked", "completed"].map((status) => <option key={status} value={status}>{status}</option>)}
            </select>
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Priority"><input name="priority" className={inputClass()} type="number" min="1" max="5" defaultValue="3" /></Field>
          <Field label="Progress"><input name="progress_override" className={inputClass()} type="number" min="0" max="100" /></Field>
        </div>
        <Field label="Tags"><input name="tags" className={inputClass()} placeholder="ai, support, client" /></Field>
        <Field label="Target date"><input name="target_date" className={inputClass()} type="date" /></Field>
        <Field label="Repo link"><input name="repo_link" className={inputClass()} type="url" /></Field>
        <Field label="Doc link"><input name="doc_link" className={inputClass()} type="url" /></Field>
        <ActionButton type="submit"><Plus size={14} /> Create project</ActionButton>
      </form>
    </Panel>
  );
}

function ActivityForm({
  projects,
  onSubmit,
}: {
  projects: Project[];
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => Promise<void>;
}) {
  return (
    <Panel className="p-4">
      <h2 className="mb-4 font-display text-sm font-semibold uppercase tracking-[0.14em]">Quick Log</h2>
      <form onSubmit={onSubmit} className="grid gap-3">
        <Field label="Type">
          <select name="type" className={inputClass()} defaultValue="dev_work">
            {ACTIVITY_TYPES.map((type) => <option key={type} value={type}>{labelFor(type)}</option>)}
          </select>
        </Field>
        <Field label="Title"><input name="title" className={inputClass()} required /></Field>
        <Field label="Project">
          <select name="project_id" className={inputClass()} defaultValue="">
            <option value="">Standalone</option>
            {projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
          </select>
        </Field>
        <Field label="Notes"><textarea name="notes" className={`${inputClass()} min-h-20`} /></Field>
        <Field label="Minutes"><input name="duration_minutes" type="number" min="0" className={inputClass()} /></Field>
        <label className="flex items-center gap-2 text-sm text-text-muted">
          <input name="is_public" type="checkbox" defaultChecked /> Public in guest view
        </label>
        <ActionButton type="submit"><Plus size={14} /> Log activity</ActionButton>
      </form>
    </Panel>
  );
}

function ShareLinkForm({ onSubmit }: { onSubmit: (event: React.FormEvent<HTMLFormElement>) => Promise<void> }) {
  return (
    <Panel className="p-4">
      <h2 className="mb-4 font-display text-sm font-semibold uppercase tracking-[0.14em]">New Share Link</h2>
      <form onSubmit={onSubmit} className="grid gap-3">
        <Field label="Label"><input name="label" className={inputClass()} placeholder="For manager" required /></Field>
        <Field label="Expires at"><input name="expires_at" className={inputClass()} type="datetime-local" /></Field>
        <ActionButton type="submit" tone="violet"><Link2 size={14} /> Create link</ActionButton>
      </form>
    </Panel>
  );
}
