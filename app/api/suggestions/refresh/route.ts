import { NextResponse } from "next/server";
import { narrateSuggestions } from "@/lib/ai/narrate";
import { rankSuggestions } from "@/lib/scoring";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);

  if (!body || !Array.isArray(body.projects) || !Array.isArray(body.activities) || !Array.isArray(body.pauseEvents)) {
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  }

  const suggestions = rankSuggestions({
    projects: body.projects,
    activities: body.activities,
    pauseEvents: body.pauseEvents,
  });
  const narrated = await narrateSuggestions(suggestions);

  return NextResponse.json({ suggestions: narrated });
}
