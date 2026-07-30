import { Sparkles } from "lucide-react";
import { Mono } from "@/components/mono";
import { Panel } from "@/components/panel";
import type { Suggestion } from "@/lib/types";

export function WhatsNextWidget({ suggestions }: { suggestions: Suggestion[] }) {
  return (
    <Panel className="border-glow-violet/30 bg-[color-mix(in_srgb,var(--bg-surface)_88%,var(--glow-violet))] p-4">
      <div className="mb-3 flex items-center gap-2">
        <Sparkles size={15} className="text-glow-violet drop-shadow-[0_0_4px_var(--glow-violet)]" />
        <h2 className="font-display text-sm font-semibold uppercase tracking-[0.16em] text-glow-violet">What&apos;s Next</h2>
        <div className="h-px flex-1 bg-glow-violet/20" />
        <Mono className="text-[9px] text-text-muted">RULE ENGINE</Mono>
      </div>
      <div className="space-y-2">
        {suggestions.length ? (
          suggestions.map((suggestion, index) => (
            <div key={suggestion.project.id} className="rounded border border-glow-violet/15 bg-bg-void/40 p-3">
              <div className="flex items-start gap-3">
                <Mono className="rounded border border-glow-violet/30 bg-glow-violet/10 px-1.5 py-0.5 text-[10px] text-glow-violet">
                  {index + 1}
                </Mono>
                <div className="min-w-0 flex-1">
                  <div className="truncate font-display text-sm font-semibold text-text-primary">{suggestion.project.name}</div>
                  <Mono className="mt-1 block text-[10px] text-text-muted">{suggestion.reasons.join(" - ")}</Mono>
                </div>
                <Mono className="text-[10px] text-glow-violet">{Math.round(suggestion.score)}</Mono>
              </div>
            </div>
          ))
        ) : (
          <p className="text-sm text-text-muted">No projects need a nudge yet. Suspiciously peaceful.</p>
        )}
      </div>
    </Panel>
  );
}
