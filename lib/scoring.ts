import type { Activity, PauseEvent, Project, Suggestion } from "@/lib/types";

const MS_PER_DAY = 1000 * 60 * 60 * 24;

function daysBetween(from: Date, to: Date) {
  return Math.floor((to.getTime() - from.getTime()) / MS_PER_DAY);
}

export function rankSuggestions({
  projects,
  activities,
  pauseEvents,
  now = new Date(),
}: {
  projects: Project[];
  activities: Activity[];
  pauseEvents: PauseEvent[];
  now?: Date;
}): Suggestion[] {
  return projects
    .filter((project) => !["completed", "archived"].includes(project.status))
    .map((project) => {
      const projectActivities = activities.filter((activity) => activity.project_id === project.id);
      const lastActivity = projectActivities.sort((a, b) => Date.parse(b.occurred_at) - Date.parse(a.occurred_at))[0];
      const openPause = pauseEvents
        .filter((event) => event.project_id === project.id && !event.resumed_at)
        .sort((a, b) => Date.parse(b.paused_at) - Date.parse(a.paused_at))[0];
      const reasons: string[] = [];
      let score = project.priority * 12;

      reasons.push(`P${project.priority}`);

      if (lastActivity) {
        const staleDays = Math.max(0, daysBetween(new Date(lastActivity.occurred_at), now));
        if (staleDays >= 3) {
          score += staleDays * 2;
          reasons.push(`${staleDays}d stale`);
        }
      } else {
        score += 8;
        reasons.push("no activity yet");
      }

      if (project.target_date) {
        const deadlineDays = daysBetween(now, new Date(`${project.target_date}T23:59:59`));
        if (deadlineDays <= 7) {
          score += Math.max(0, 16 - deadlineDays * 2);
          reasons.push(deadlineDays < 0 ? `${Math.abs(deadlineDays)}d overdue` : `deadline in ${deadlineDays}d`);
        }
      }

      if (project.status === "blocked") {
        score -= 20;
        reasons.push("blocked");
      }

      if (openPause) {
        const pausedDays = Math.max(0, daysBetween(new Date(openPause.paused_at), now));
        score += pausedDays;
        reasons.push(`paused ${pausedDays}d`);

        if (openPause.expected_resume_date) {
          const resumeDate = new Date(`${openPause.expected_resume_date}T00:00:00`);
          if (resumeDate <= now) {
            score += 24;
            reasons.push("resume trigger met");
          }
        }
      }

      return { project, score, reasons };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);
}
