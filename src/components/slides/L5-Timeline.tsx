"use client";

import type { SlideData } from "@/lib/types";

interface Props {
  slide: SlideData;
  editable?: boolean;
  onHeadlineChange?: (v: string) => void;
  onTimelineChange?: (timeline: { label: string; description: string }[]) => void;
}

export function L5Timeline({ slide, editable, onHeadlineChange, onTimelineChange }: Props) {
  const items = slide.timeline ?? [
    { label: "Phase 1", description: "—" },
    { label: "Phase 2", description: "—" },
    { label: "Phase 3", description: "—" },
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
      <div className="mt-8 flex gap-6 flex-1 items-start">
        {items.map((item, i) => (
          <div key={i} className="flex-1 flex flex-col">
            <div
              className="text-lg font-semibold text-deck-ink"
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
              className="text-sm text-deck-muted mt-1"
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
