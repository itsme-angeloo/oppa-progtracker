export type ProjectStatus = "planning" | "active" | "paused" | "blocked" | "completed" | "archived";
export type ProjectType = "client_work" | "internal_tool" | "personal" | "learning" | "maintenance";
export type ActivityType =
  | "dev_work"
  | "bugfix"
  | "webinar"
  | "training"
  | "meeting"
  | "research"
  | "support_ticket"
  | "pause"
  | "resume"
  | "note";

export type DisplayStatus = "planning" | "active" | "paused" | "ready" | "blocked" | "completed" | "archived";

export type Project = {
  id: string;
  owner_id: string;
  name: string;
  description: string | null;
  type: ProjectType;
  tags: string[];
  priority: number;
  status: ProjectStatus;
  start_date: string | null;
  target_date: string | null;
  color: string;
  repo_link: string | null;
  doc_link: string | null;
  progress_override: number | null;
  created_at: string;
  updated_at: string;
};

export type Activity = {
  id: string;
  owner_id: string;
  project_id: string | null;
  type: ActivityType;
  title: string;
  notes: string | null;
  is_public: boolean;
  duration_minutes: number | null;
  skill_tags: string[];
  occurred_at: string;
  created_at: string;
};

export type PauseEvent = {
  id: string;
  project_id: string;
  paused_at: string;
  reason: string;
  resume_trigger: string | null;
  expected_resume_date: string | null;
  resumed_at: string | null;
  resume_note: string | null;
};

export type ShareLink = {
  id: string;
  owner_id: string;
  token: string;
  label: string;
  scope_all: boolean;
  expires_at: string | null;
  revoked: boolean;
  created_at: string;
};

export type Suggestion = {
  project: Project;
  score: number;
  reasons: string[];
};
