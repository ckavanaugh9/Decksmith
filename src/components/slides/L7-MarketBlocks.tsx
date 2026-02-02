"use client";

import type { SlideData } from "@/lib/types";

interface Props {
  slide: SlideData;
  editable?: boolean;
  onHeadlineChange?: (v: string) => void;
  onBulletsChange?: (bullets: string[]) => void;
  onMetricsChange?: (metrics: { label: string; value: string }[]) => void;
}

export function L7MarketBlocks({ slide, editable, onHeadlineChange, onBulletsChange, onMetricsChange }: Props) {
  const bullets = slide.bullets ?? ["TAM", "SAM", "SOM"];
  const metrics = slide.metrics ?? bullets.map((b) => ({ label: b, value: "—" }));

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
      <div className="mt-8 flex flex-col gap-4 flex-1">
        {metrics.map((m, i) => (
          <div key={i} className="rounded-lg border border-slate-200 bg-slate-50/50 p-4 flex justify-between items-center">
            <span
              className="font-medium text-deck-ink"
              contentEditable={editable}
              suppressContentEditableWarning
              onBlur={(e) => {
                const next = [...metrics];
                next[i] = { ...next[i], label: e.currentTarget.textContent ?? "" };
                onMetricsChange?.(next);
                const b = [...bullets];
                b[i] = next[i].label;
                onBulletsChange?.(b);
              }}
            >
              {m.label}
            </span>
            <span
              className="text-xl font-bold text-deck-accent"
              contentEditable={editable}
              suppressContentEditableWarning
              onBlur={(e) => {
                const next = [...metrics];
                next[i] = { ...next[i], value: e.currentTarget.textContent ?? "" };
                onMetricsChange?.(next);
              }}
            >
              {m.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
