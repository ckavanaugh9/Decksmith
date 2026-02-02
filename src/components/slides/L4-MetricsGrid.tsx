"use client";

import { BarChart3 } from "lucide-react";
import type { DeckTheme, SlideData } from "@/lib/types";

interface Props {
  slide: SlideData;
  theme?: DeckTheme | null;
  editable?: boolean;
  onHeadlineChange?: (v: string) => void;
  onMetricsChange?: (metrics: { label: string; value: string }[]) => void;
}

export function L4MetricsGrid({ slide, theme, editable, onHeadlineChange, onMetricsChange }: Props) {
  const metrics = slide.metrics ?? [
    { label: "Metric 1", value: "—" },
    { label: "Metric 2", value: "—" },
    { label: "Metric 3", value: "—" },
    { label: "Metric 4", value: "—" },
  ];

  return (
    <div className="slide-canvas flex flex-col px-12 py-10 bg-white rounded-xl shadow-lg border border-slate-200/80">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ backgroundColor: "color-mix(in srgb, var(--deck-accent) 20%, white)" }}>
          <BarChart3 className="h-5 w-5" style={{ color: "var(--deck-accent)" }} />
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
      <div className="mt-8 grid grid-cols-2 gap-6 flex-1">
        {metrics.map((m, i) => (
          <div key={i} className="rounded-lg border p-5" style={{ borderColor: "color-mix(in srgb, var(--deck-accent) 30%, transparent)", backgroundColor: "color-mix(in srgb, var(--deck-accent) 8%, white)" }}>
            <div
              className="text-2xl font-bold"
              style={{ color: "var(--deck-accent)" }}
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
              className="text-sm mt-1"
              style={{ color: "var(--deck-secondary)" }}
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
