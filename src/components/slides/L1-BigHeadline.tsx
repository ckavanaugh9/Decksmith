"use client";

import { Sparkles } from "lucide-react";
import type { DeckTheme, SlideData } from "@/lib/types";

interface Props {
  slide: SlideData;
  theme?: DeckTheme | null;
  editable?: boolean;
  onHeadlineChange?: (value: string) => void;
  onSubheadlineChange?: (value: string) => void;
}

export function L1BigHeadline({ slide, theme, editable, onHeadlineChange, onSubheadlineChange }: Props) {
  return (
    <div className="slide-canvas flex flex-col justify-center px-16 py-12 rounded-xl shadow-lg border border-slate-200/80 bg-white">
      {theme?.logoUrl ? (
        <img src={theme.logoUrl} alt="" className="h-12 w-auto mb-6 object-contain" />
      ) : (
        <div className="mb-6 flex items-center gap-2 text-[var(--deck-accent)]">
          <Sparkles className="h-10 w-10" strokeWidth={1.5} />
        </div>
      )}
      <h1
        className="text-4xl font-bold tracking-tight leading-tight"
        style={{ color: "var(--deck-primary)" }}
        contentEditable={editable}
        suppressContentEditableWarning
        onBlur={(e) => onHeadlineChange?.(e.currentTarget.textContent ?? "")}
      >
        {slide.headline}
      </h1>
      {slide.subheadline && (
        <p
          className="mt-4 text-xl max-w-2xl"
          style={{ color: "var(--deck-secondary)" }}
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
