"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Save } from "lucide-react";
import { ActivityLogEntry } from "@/components/activity-log-entry";
import { Mono } from "@/components/mono";
import { Panel } from "@/components/panel";
import { ProjectCard } from "@/components/project-card";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import type { Activity, PauseEvent, Project, ProjectStatus, ProjectType } from "@/lib/types";

const PROJECT_TYPES: ProjectType[] = ["client_work", "internal_tool", "personal", "learning", "maintenance"];
const STATUSES: ProjectStatus[] = ["planning", "active", "paused", "blocked", "completed", "archived"];

function inputClass() {
  return "min-h-10 rounded-md border border-border-subtle bg-bg-void px-3 py-2 text-sm text-text-primary outline-none transition focus:border-glow-cyan";
}

function parseTags(value: string) {
  return value
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-1.5 text-xs font-medium uppercase tracking-[0.12em] text-text-muted">
      <Mono>{label}</Mono>
      {children}
    </label>
  );
}

export function ProjectDetailWorkspace({ projectId }: { projectId: string }) {
  const [project, setProject] = useState<Project | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [pauseEvents, setPauseEvents] = useState<PauseEvent[]>([]);
  const [message, setMessage] = useState("Loading project...");
  const [saving, setSaving] = useState(false);
  const supabase = useMemo(() => {
    try {
      return createBrowserSupabaseClient();
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    if (!supabase) {
      return;
    }

    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase, projectId]);

  async function refresh() {
    if (!supabase) return;
    const [projectRes, activityRes, pauseRes] = await Promise.all([
      supabase.from("projects").select("*").eq("id", projectId).single(),
      supabase.from("activities").select("*").eq("project_id", projectId).order("occurred_at", { ascending: false }),
      supabase.from("pause_events").select("*").eq("project_id", projectId).order("paused_at", { ascending: false }),
    ]);

    if (projectRes.error) {
      setMessage(projectRes.error.message);
      return;
    }

    setProject(projectRes.data as Project);
    setActivities((activityRes.data || []) as Activity[]);
    setPauseEvents((pauseRes.data || []) as PauseEvent[]);
    setMessage("");
  }

  async function saveProject(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase || !project) return;
    const form = new FormData(event.currentTarget);
    const payload = {
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

    setSaving(true);
    const { error } = await supabase.from("projects").update(payload).eq("id", project.id);
    if (error) {
      setMessage(error.message);
      setSaving(false);
      return;
    }

    await refresh();
    setMessage("Project saved.");
    setSaving(false);
  }

  if (!project) {
    return (
      <main className="min-h-screen bg-bg-void p-6 text-text-primary">
        <Panel className="p-5">
          <Mono className="text-[10px] text-text-muted">
            {supabase ? message : "Add Supabase env values to .env.local to connect the workspace."}
          </Mono>
        </Panel>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-bg-void text-text-primary">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border-subtle px-4 py-5 md:px-6">
        <div>
          <Link href="/projects" className="inline-flex items-center gap-2 text-sm text-text-muted hover:text-text-primary">
            <ArrowLeft size={14} /> Projects
          </Link>
          <h1 className="mt-2 font-display text-2xl font-semibold">{project.name}</h1>
        </div>
        <Mono className="text-[10px] text-text-muted">DETAIL / EDIT</Mono>
      </header>
      {message ? <div className="border-b border-border-subtle bg-glow-amber/10 px-4 py-2 text-sm text-glow-amber">{message}</div> : null}
      <div data-page-transition className="grid gap-5 p-4 md:p-6 xl:grid-cols-[420px_1fr]">
        <div className="grid gap-5">
          <ProjectCard project={project} pauseEvents={pauseEvents} />
          <Panel className="p-4">
            <h2 className="mb-4 font-display text-sm font-semibold uppercase tracking-[0.14em]">Edit Project</h2>
            <form onSubmit={saveProject} className="grid gap-3">
              <Field label="Name"><input name="name" className={inputClass()} defaultValue={project.name} required /></Field>
              <Field label="Description"><textarea name="description" className={`${inputClass()} min-h-20`} defaultValue={project.description || ""} /></Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Type">
                  <select name="type" className={inputClass()} defaultValue={project.type}>
                    {PROJECT_TYPES.map((type) => <option key={type} value={type}>{type.replaceAll("_", " ")}</option>)}
                  </select>
                </Field>
                <Field label="Status">
                  <select name="status" className={inputClass()} defaultValue={project.status}>
                    {STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}
                  </select>
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Priority"><input name="priority" className={inputClass()} type="number" min="1" max="5" defaultValue={project.priority} /></Field>
                <Field label="Progress"><input name="progress_override" className={inputClass()} type="number" min="0" max="100" defaultValue={project.progress_override ?? ""} /></Field>
              </div>
              <Field label="Tags"><input name="tags" className={inputClass()} defaultValue={project.tags.join(", ")} /></Field>
              <Field label="Target date"><input name="target_date" className={inputClass()} type="date" defaultValue={project.target_date || ""} /></Field>
              <Field label="Repo link"><input name="repo_link" className={inputClass()} type="url" defaultValue={project.repo_link || ""} /></Field>
              <Field label="Doc link"><input name="doc_link" className={inputClass()} type="url" defaultValue={project.doc_link || ""} /></Field>
              <button
                disabled={saving}
                className="inline-flex min-h-9 items-center justify-center gap-2 rounded-md border border-glow-cyan/40 bg-glow-cyan/15 px-3 py-1.5 text-sm font-semibold text-glow-cyan transition hover:bg-glow-cyan/20 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Save size={14} /> {saving ? "Saving..." : "Save changes"}
              </button>
            </form>
          </Panel>
        </div>
        <div className="grid content-start gap-5">
          <Panel className="p-4">
            <h2 className="mb-4 font-display text-sm font-semibold uppercase tracking-[0.14em]">Pause / Resume Timeline</h2>
            <div className="grid gap-3">
              {pauseEvents.map((event) => (
                <div key={event.id} className="rounded border border-border-subtle bg-bg-void p-3">
                  <Mono className="text-[10px] text-glow-amber">{new Date(event.paused_at).toLocaleString()}</Mono>
                  <p className="mt-2 text-sm text-text-primary">{event.reason}</p>
                  {event.resume_trigger ? <p className="mt-1 text-sm text-text-muted">Trigger: {event.resume_trigger}</p> : null}
                  {event.resumed_at ? <Mono className="mt-2 block text-[10px] text-glow-green">RESUMED {new Date(event.resumed_at).toLocaleString()}</Mono> : null}
                </div>
              ))}
              {!pauseEvents.length ? <p className="text-sm text-text-muted">No pauses logged yet.</p> : null}
            </div>
          </Panel>
          <div className="grid gap-3">
            {activities.map((activity) => <ActivityLogEntry key={activity.id} activity={activity} project={project} />)}
            {!activities.length ? <Panel className="p-5 text-sm text-text-muted">No activity tied to this project yet.</Panel> : null}
          </div>
        </div>
      </div>
    </main>
  );
}
