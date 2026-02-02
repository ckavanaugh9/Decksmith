"use client";

import { DollarSign } from "lucide-react";
import type { DeckTheme, SlideData } from "@/lib/types";

interface Props {
  slide: SlideData;
  theme?: DeckTheme | null;
  editable?: boolean;
  onHeadlineChange?: (v: string) => void;
  onSubheadlineChange?: (v: string) => void;
  onBulletsChange?: (bullets: string[]) => void;
}

export function L10Ask({ slide, theme, editable, onHeadlineChange, onSubheadlineChange, onBulletsChange }: Props) {
  const bullets = slide.bullets ?? ["Raising $X for Y", "Use of funds", "Contact"];

  return (
    <div className="slide-canvas flex flex-col justify-center px-16 py-12 bg-white rounded-xl shadow-lg border border-slate-200/80">
      <div className="flex items-center gap-3 mb-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl" style={{ backgroundColor: "color-mix(in srgb, var(--deck-accent) 20%, white)" }}>
          <DollarSign className="h-6 w-6" style={{ color: "var(--deck-accent)" }} />
        </div>
        <div>
          <h2
            className="text-3xl font-bold"
            style={{ color: "var(--deck-primary)" }}
            contentEditable={editable}
            suppressContentEditableWarning
            onBlur={(e) => onHeadlineChange?.(e.currentTarget.textContent ?? "")}
          >
            {slide.headline}
          </h2>
          {slide.subheadline && (
            <p
              className="mt-0.5 text-lg"
              style={{ color: "var(--deck-secondary)" }}
              contentEditable={editable}
              suppressContentEditableWarning
              onBlur={(e) => onSubheadlineChange?.(e.currentTarget.textContent ?? "")}
            >
              {slide.subheadline}
            </p>
          )}
        </div>
      </div>
      <ul className="mt-6 space-y-2">
        {bullets.map((b, i) => (
          <li
            key={i}
            className="flex gap-2"
            style={{ color: "var(--deck-primary)" }}
            contentEditable={editable}
            suppressContentEditableWarning
            onBlur={(e) => {
              const next = [...bullets];
              next[i] = e.currentTarget.textContent ?? "";
              onBulletsChange?.(next);
            }}
          >
            <span className="font-medium" style={{ color: "var(--deck-accent)" }}>•</span>
            {b}
          </li>
        ))}
      </ul>
    </div>
  );
}
