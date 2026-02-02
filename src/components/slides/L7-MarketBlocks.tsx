"use client";

import { TrendingUp } from "lucide-react";
import type { DeckTheme, SlideData } from "@/lib/types";

interface Props {
  slide: SlideData;
  theme?: DeckTheme | null;
  editable?: boolean;
  onHeadlineChange?: (v: string) => void;
  onBulletsChange?: (bullets: string[]) => void;
  onMetricsChange?: (metrics: { label: string; value: string }[]) => void;
}

export function L7MarketBlocks({ slide, theme, editable, onHeadlineChange, onBulletsChange, onMetricsChange }: Props) {
  const bullets = slide.bullets ?? ["TAM", "SAM", "SOM"];
  const metrics = slide.metrics ?? bullets.map((b) => ({ label: b, value: "—" }));

  return (
    <div className="slide-canvas flex flex-col px-12 py-10 bg-white rounded-xl shadow-lg border border-slate-200/80">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ backgroundColor: "color-mix(in srgb, var(--deck-accent) 20%, white)" }}>
          <TrendingUp className="h-5 w-5" style={{ color: "var(--deck-accent)" }} />
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
      <div className="mt-8 flex flex-col gap-4 flex-1">
        {metrics.map((m, i) => (
          <div key={i} className="rounded-lg border p-4 flex justify-between items-center" style={{ borderColor: "color-mix(in srgb, var(--deck-accent) 30%, transparent)", backgroundColor: "color-mix(in srgb, var(--deck-accent) 8%, white)" }}>
            <span
              className="font-medium"
              style={{ color: "var(--deck-on-tint)" }}
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
              className="text-xl font-bold"
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
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
