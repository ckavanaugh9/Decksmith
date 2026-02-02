"use client";

import { LayoutGrid } from "lucide-react";
import type { DeckTheme, SlideData } from "@/lib/types";

interface Props {
  slide: SlideData;
  theme?: DeckTheme | null;
  editable?: boolean;
  onHeadlineChange?: (v: string) => void;
  onSubheadlineChange?: (v: string) => void;
  onBulletsChange?: (bullets: string[]) => void;
}

export function L3FeatureCards({ slide, theme, editable, onHeadlineChange, onSubheadlineChange, onBulletsChange }: Props) {
  const bullets = slide.bullets ?? [];
  const cards = [
    bullets[0] ?? "Feature 1",
    bullets[1] ?? "Feature 2",
    bullets[2] ?? "Feature 3",
  ];

  return (
    <div className="slide-canvas flex flex-col px-12 py-10 bg-white rounded-xl shadow-lg border border-slate-200/80">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ backgroundColor: "color-mix(in srgb, var(--deck-accent) 20%, white)" }}>
          <LayoutGrid className="h-5 w-5" style={{ color: "var(--deck-accent)" }} />
        </div>
        <div>
          <h2
            className="text-2xl font-bold"
            style={{ color: "var(--deck-primary)" }}
            contentEditable={editable}
            suppressContentEditableWarning
            onBlur={(e) => onHeadlineChange?.(e.currentTarget.textContent ?? "")}
          >
            {slide.headline}
          </h2>
          {slide.subheadline && (
            <p
              className="mt-0.5"
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
      <div className="mt-8 grid grid-cols-3 gap-6 flex-1">
        {cards.map((text, i) => (
          <div
            key={i}
            className="rounded-lg border p-5 flex flex-col justify-center"
            style={{ borderColor: "color-mix(in srgb, var(--deck-accent) 30%, transparent)", backgroundColor: "color-mix(in srgb, var(--deck-accent) 8%, white)" }}
          >
            <span
              className="font-medium"
              style={{ color: "var(--deck-on-tint)" }}
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
