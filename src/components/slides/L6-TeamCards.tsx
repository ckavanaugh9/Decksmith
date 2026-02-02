"use client";

import { Users } from "lucide-react";
import type { DeckTheme, SlideData } from "@/lib/types";

interface Props {
  slide: SlideData;
  theme?: DeckTheme | null;
  editable?: boolean;
  onHeadlineChange?: (v: string) => void;
  onTeamChange?: (team: { name: string; role: string; bio?: string }[]) => void;
}

export function L6TeamCards({ slide, theme, editable, onHeadlineChange, onTeamChange }: Props) {
  const team = slide.team ?? [
    { name: "Name", role: "Role", bio: "" },
    { name: "Name", role: "Role", bio: "" },
    { name: "Name", role: "Role", bio: "" },
  ];

  return (
    <div className="slide-canvas flex flex-col px-12 py-10 bg-white rounded-xl shadow-lg border border-slate-200/80">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ backgroundColor: "color-mix(in srgb, var(--deck-accent) 20%, white)" }}>
          <Users className="h-5 w-5" style={{ color: "var(--deck-accent)" }} />
        </div>
        <h2
          className="text-2xl font-bold"
          style={{ color: "var(--deck-primary)" }}
          contentEditable={editable}
          suppressContentEditableWarning
          onBlur={(e) => onHeadlineChange?.(e.currentTarget.textContent ?? "")}
        >
          {slide.headline}
        </h2>
      </div>
      <div className="mt-8 grid grid-cols-3 gap-6 flex-1">
        {team.map((t, i) => (
          <div key={i} className="rounded-lg border p-5" style={{ borderColor: "color-mix(in srgb, var(--deck-accent) 30%, transparent)", backgroundColor: "color-mix(in srgb, var(--deck-accent) 8%, white)" }}>
            <div
              className="text-lg font-semibold"
              style={{ color: "var(--deck-primary)" }}
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
              className="text-sm"
              style={{ color: "var(--deck-on-tint)" }}
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
                className="text-sm mt-2"
                style={{ color: "var(--deck-on-tint)" }}
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
