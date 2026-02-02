"use client";

import type { SlideData } from "@/lib/types";

interface Props {
  slide: SlideData;
  editable?: boolean;
  onHeadlineChange?: (v: string) => void;
  onSubheadlineChange?: (v: string) => void;
  onBulletsChange?: (bullets: string[]) => void;
}

export function L10Ask({ slide, editable, onHeadlineChange, onSubheadlineChange, onBulletsChange }: Props) {
  const bullets = slide.bullets ?? ["Raising $X for Y", "Use of funds", "Contact"];

  return (
    <div className="slide-canvas flex flex-col justify-center px-16 py-12 bg-white rounded-xl shadow-lg border border-slate-200/80">
      <h2
        className="text-3xl font-bold text-deck-ink"
        contentEditable={editable}
        suppressContentEditableWarning
        onBlur={(e) => onHeadlineChange?.(e.currentTarget.textContent ?? "")}
      >
        {slide.headline}
      </h2>
      {slide.subheadline && (
        <p
          className="mt-2 text-lg text-deck-muted"
          contentEditable={editable}
          suppressContentEditableWarning
          onBlur={(e) => onSubheadlineChange?.(e.currentTarget.textContent ?? "")}
        >
          {slide.subheadline}
        </p>
      )}
      <ul className="mt-6 space-y-2">
        {bullets.map((b, i) => (
          <li
            key={i}
            className="text-slate-700"
            contentEditable={editable}
            suppressContentEditableWarning
            onBlur={(e) => {
              const next = [...bullets];
              next[i] = e.currentTarget.textContent ?? "";
              onBulletsChange?.(next);
            }}
          >
            • {b}
          </li>
        ))}
      </ul>
    </div>
  );
}
