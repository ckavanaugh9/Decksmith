"use client";

import { Quote } from "lucide-react";
import type { DeckTheme, SlideData } from "@/lib/types";

interface Props {
  slide: SlideData;
  theme?: DeckTheme | null;
  editable?: boolean;
  onHeadlineChange?: (v: string) => void;
  onSubheadlineChange?: (v: string) => void;
}

export function L9FullBleed({ slide, theme, editable, onHeadlineChange, onSubheadlineChange }: Props) {
  return (
    <div
      className="slide-canvas flex flex-col justify-center items-center px-16 py-12 rounded-xl text-white"
      style={{ backgroundColor: "var(--deck-primary)" }}
    >
      <Quote className="h-12 w-12 mb-6 opacity-80" strokeWidth={1.5} />
      <h2
        className="text-3xl font-bold text-center max-w-3xl leading-tight"
        contentEditable={editable}
        suppressContentEditableWarning
        onBlur={(e) => onHeadlineChange?.(e.currentTarget.textContent ?? "")}
      >
        {slide.headline}
      </h2>
      {slide.subheadline && (
        <p
          className="mt-4 text-lg text-center max-w-2xl opacity-90"
          contentEditable={editable}
          suppressContentEditableWarning
          onBlur={(e) => onSubheadlineChange?.(e.currentTarget.textContent ?? "")}
        >
          {slide.subheadline}
        </p>
      )}
    </div>
  );
}
