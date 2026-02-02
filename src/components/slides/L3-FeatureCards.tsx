"use client";

import type { SlideData } from "@/lib/types";

interface Props {
  slide: SlideData;
  editable?: boolean;
  onHeadlineChange?: (v: string) => void;
  onSubheadlineChange?: (v: string) => void;
  onBulletsChange?: (bullets: string[]) => void;
}

export function L3FeatureCards({ slide, editable, onHeadlineChange, onSubheadlineChange, onBulletsChange }: Props) {
  const bullets = slide.bullets ?? [];
  const cards = [
    bullets[0] ?? "Feature 1",
    bullets[1] ?? "Feature 2",
    bullets[2] ?? "Feature 3",
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
      {slide.subheadline && (
        <p
          className="mt-1 text-deck-muted"
          contentEditable={editable}
          suppressContentEditableWarning
          onBlur={(e) => onSubheadlineChange?.(e.currentTarget.textContent ?? "")}
        >
          {slide.subheadline}
        </p>
      )}
      <div className="mt-8 grid grid-cols-3 gap-6 flex-1">
        {cards.map((text, i) => (
          <div
            key={i}
            className="rounded-lg border border-slate-200 bg-slate-50/50 p-5 flex flex-col justify-center"
          >
            <span
              className="text-slate-700 font-medium"
              contentEditable={editable}
              suppressContentEditableWarning
              onBlur={(e) => {
                const next = [...bullets];
                next[i] = e.currentTarget.textContent ?? "";
                onBulletsChange?.(next);
              }}
            >
              {text}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
