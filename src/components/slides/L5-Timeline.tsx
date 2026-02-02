"use client";

import { MapPin } from "lucide-react";
import type { DeckTheme, SlideData } from "@/lib/types";

interface Props {
  slide: SlideData;
  theme?: DeckTheme | null;
  editable?: boolean;
  onHeadlineChange?: (v: string) => void;
  onTimelineChange?: (timeline: { label: string; description: string }[]) => void;
}

export function L5Timeline({ slide, theme, editable, onHeadlineChange, onTimelineChange }: Props) {
  const items = slide.timeline ?? [
    { label: "Phase 1", description: "—" },
    { label: "Phase 2", description: "—" },
    { label: "Phase 3", description: "—" },
  ];

  return (
    <div className="slide-canvas flex flex-col px-12 py-10 bg-white rounded-xl shadow-lg border border-slate-200/80">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ backgroundColor: "color-mix(in srgb, var(--deck-accent) 20%, white)" }}>
          <MapPin className="h-5 w-5" style={{ color: "var(--deck-accent)" }} />
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
      <div className="mt-8 flex gap-6 flex-1 items-start">
        {items.map((item, i) => (
          <div key={i} className="flex-1 flex flex-col rounded-lg border p-4" style={{ borderColor: "color-mix(in srgb, var(--deck-accent) 25%, transparent)", backgroundColor: "color-mix(in srgb, var(--deck-accent) 6%, white)" }}>
            <div
              className="text-lg font-semibold"
              style={{ color: "var(--deck-primary)" }}
              contentEditable={editable}
              suppressContentEditableWarning
              onBlur={(e) => {
                const next = [...items];
                next[i] = { ...next[i], label: e.currentTarget.textContent ?? "" };
                onTimelineChange?.(next);
              }}
            >
              {item.label}
            </div>
            <div
              className="text-sm mt-1"
              style={{ color: "var(--deck-secondary)" }}
              contentEditable={editable}
              suppressContentEditableWarning
              onBlur={(e) => {
                const next = [...items];
                next[i] = { ...next[i], description: e.currentTarget.textContent ?? "" };
                onTimelineChange?.(next);
              }}
            >
              {item.description}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
