"use client";

import type { SlideData } from "@/lib/types";

interface Props {
  slide: SlideData;
  editable?: boolean;
  onHeadlineChange?: (v: string) => void;
  onTeamChange?: (team: { name: string; role: string; bio?: string }[]) => void;
}

export function L6TeamCards({ slide, editable, onHeadlineChange, onTeamChange }: Props) {
  const team = slide.team ?? [
    { name: "Name", role: "Role", bio: "" },
    { name: "Name", role: "Role", bio: "" },
    { name: "Name", role: "Role", bio: "" },
  ];

  return (
    <div className="slide-canvas flex flex-col px-12 py-10 bg-white rounded-xl shadow-lg border border-slate-200/80">
      <h2
        className="text-2xl font-bold text-deck-ink"
        contentEditable={editable}
        suppressContentEditableWarning
        onBlur={(e) => onHeadlineChange?.(e.currentTarget.textContent ?? "")}
      >
        {slide.headline}
      </h2>
      <div className="mt-8 grid grid-cols-3 gap-6 flex-1">
        {team.map((t, i) => (
          <div key={i} className="rounded-lg border border-slate-200 bg-slate-50/50 p-5">
            <div
              className="text-lg font-semibold text-deck-ink"
              contentEditable={editable}
              suppressContentEditableWarning
              onBlur={(e) => {
                const next = [...team];
                next[i] = { ...next[i], name: e.currentTarget.textContent ?? "" };
                onTeamChange?.(next);
              }}
            >
              {t.name}
            </div>
            <div
              className="text-sm text-deck-accent"
              contentEditable={editable}
              suppressContentEditableWarning
              onBlur={(e) => {
                const next = [...team];
                next[i] = { ...next[i], role: e.currentTarget.textContent ?? "" };
                onTeamChange?.(next);
              }}
            >
              {t.role}
            </div>
            {t.bio && (
              <div
                className="text-sm text-deck-muted mt-2"
                contentEditable={editable}
                suppressContentEditableWarning
                onBlur={(e) => {
                  const next = [...team];
                  next[i] = { ...next[i], bio: e.currentTarget.textContent ?? "" };
                  onTeamChange?.(next);
                }}
              >
                {t.bio}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
