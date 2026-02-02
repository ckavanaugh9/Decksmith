"use client";

import type { SlideData } from "@/lib/types";

interface Props {
  slide: SlideData;
  editable?: boolean;
  onHeadlineChange?: (v: string) => void;
  onSubheadlineChange?: (v: string) => void;
  onBulletsChange?: (bullets: string[]) => void;
}

export function L2TwoColumn({ slide, editable, onHeadlineChange, onSubheadlineChange, onBulletsChange }: Props) {
  const left = slide.bullets?.slice(0, Math.ceil((slide.bullets?.length ?? 0) / 2)) ?? [];
  const right = slide.bullets?.slice(Math.ceil((slide.bullets?.length ?? 0) / 2)) ?? [];

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
          className="mt-1 text-lg text-deck-muted"
          contentEditable={editable}
          suppressContentEditableWarning
          onBlur={(e) => onSubheadlineChange?.(e.currentTarget.textContent ?? "")}
        >
          {slide.subheadline}
        </p>
      )}
      <div className="mt-8 grid grid-cols-2 gap-8 flex-1">
        <ul className="space-y-3">
          {left.map((b, i) => (
            <li
              key={i}
              className="flex gap-2 text-slate-700"
              contentEditable={editable}
              suppressContentEditableWarning
              onBlur={(e) => {
                const next = [...(slide.bullets ?? [])];
                next[i] = e.currentTarget.textContent ?? "";
                onBulletsChange?.(next);
              }}
            >
              <span className="text-deck-accent font-medium">•</span>
              <span>{b}</span>
            </li>
          ))}
        </ul>
        <ul className="space-y-3">
          {right.map((b, i) => (
            <li
              key={i}
              className="flex gap-2 text-slate-700"
              contentEditable={editable}
              suppressContentEditableWarning
              onBlur={(e) => {
                const next = [...(slide.bullets ?? [])];
                next[left.length + i] = e.currentTarget.textContent ?? "";
                onBulletsChange?.(next);
              }}
            >
              <span className="text-deck-accent font-medium">•</span>
              <span>{b}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
