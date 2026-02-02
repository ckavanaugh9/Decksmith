"use client";

import type { SlideData } from "@/lib/types";

interface Props {
  slide: SlideData;
  editable?: boolean;
  onHeadlineChange?: (v: string) => void;
  onMetricsChange?: (metrics: { label: string; value: string }[]) => void;
}

export function L4MetricsGrid({ slide, editable, onHeadlineChange, onMetricsChange }: Props) {
  const metrics = slide.metrics ?? [
    { label: "Metric 1", value: "—" },
    { label: "Metric 2", value: "—" },
    { label: "Metric 3", value: "—" },
    { label: "Metric 4", value: "—" },
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
      <div className="mt-8 grid grid-cols-2 gap-6 flex-1">
        {metrics.map((m, i) => (
          <div key={i} className="rounded-lg border border-slate-200 bg-slate-50/50 p-5">
            <div
              className="text-2xl font-bold text-deck-accent"
              contentEditable={editable}
              suppressContentEditableWarning
              onBlur={(e) => {
                const next = [...metrics];
                next[i] = { ...next[i], value: e.currentTarget.textContent ?? "" };
                onMetricsChange?.(next);
              }}
            >
              {m.value}
            </div>
            <div
              className="text-sm text-deck-muted mt-1"
              contentEditable={editable}
              suppressContentEditableWarning
              onBlur={(e) => {
                const next = [...metrics];
                next[i] = { ...next[i], label: e.currentTarget.textContent ?? "" };
                onMetricsChange?.(next);
              }}
            >
              {m.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
