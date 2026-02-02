"use client";

import { AlertCircle } from "lucide-react";
import type { DeckTheme, SlideData } from "@/lib/types";

interface Props {
  slide: SlideData;
  theme?: DeckTheme | null;
  editable?: boolean;
  onHeadlineChange?: (v: string) => void;
  onSubheadlineChange?: (v: string) => void;
  onBulletsChange?: (bullets: string[]) => void;
}

export function L2TwoColumn({ slide, theme, editable, onHeadlineChange, onSubheadlineChange, onBulletsChange }: Props) {
  const left = slide.bullets?.slice(0, Math.ceil((slide.bullets?.length ?? 0) / 2)) ?? [];
  const right = slide.bullets?.slice(Math.ceil((slide.bullets?.length ?? 0) / 2)) ?? [];

  return (
    <div className="slide-canvas flex flex-col px-12 py-10 bg-white rounded-xl shadow-lg border border-slate-200/80">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ backgroundColor: "color-mix(in srgb, var(--deck-accent) 20%, white)" }}>
          <AlertCircle className="h-5 w-5" style={{ color: "var(--deck-accent)" }} />
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
      <div className="mt-8 grid grid-cols-2 gap-8 flex-1">
        <ul className="space-y-3">
          {left.map((b, i) => (
            <li
              key={i}
              className="flex gap-2"
              style={{ color: "var(--deck-primary)" }}
              contentEditable={editable}
              suppressContentEditableWarning
              onBlur={(e) => {
                const next = [...(slide.bullets ?? [])];
                next[i] = e.currentTarget.textContent ?? "";
                onBulletsChange?.(next);
              }}
            >
              <span className="font-medium" style={{ color: "var(--deck-accent)" }}>•</span>
              <span>{b}</span>
            </li>
          ))}
        </ul>
        <ul className="space-y-3">
          {right.map((b, i) => (
            <li
              key={i}
              className="flex gap-2"
              style={{ color: "var(--deck-primary)" }}
              contentEditable={editable}
              suppressContentEditableWarning
              onBlur={(e) => {
                const next = [...(slide.bullets ?? [])];
                next[left.length + i] = e.currentTarget.textContent ?? "";
                onBulletsChange?.(next);
              }}
            >
              <span className="font-medium" style={{ color: "var(--deck-accent)" }}>•</span>
              <span>{b}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
