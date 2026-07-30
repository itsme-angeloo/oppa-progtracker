import type { Suggestion } from "@/lib/types";

export async function narrateSuggestions(suggestions: Suggestion[]) {
  if (process.env.AI_PROVIDER === "none" || !process.env.AI_API_KEY) {
    return suggestions.map((suggestion) => ({
      project_id: suggestion.project.id,
      text: suggestion.reasons.join(" - "),
    }));
  }

  return suggestions.map((suggestion) => ({
    project_id: suggestion.project.id,
    text: suggestion.reasons.join(" - "),
  }));
}
