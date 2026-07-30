import type { DisplayStatus, PauseEvent, Project } from "@/lib/types";

export function deriveDisplayStatus(project: Project, pauseEvents: PauseEvent[] = []): DisplayStatus {
  if (project.status !== "paused") {
    return project.status;
  }

  const openPause = pauseEvents
    .filter((event) => event.project_id === project.id && !event.resumed_at)
    .sort((a, b) => Date.parse(b.paused_at) - Date.parse(a.paused_at))[0];

  if (!openPause?.expected_resume_date) {
    return "paused";
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const resumeDate = new Date(`${openPause.expected_resume_date}T00:00:00`);

  return resumeDate <= today ? "ready" : "paused";
}

export function progressFor(project: Project) {
  return project.progress_override ?? (project.status === "completed" ? 100 : 0);
}
