"use client";

import type { SlideData } from "@/lib/types";

interface Props {
  slide: SlideData;
  editable?: boolean;
  onHeadlineChange?: (value: string) => void;
  onSubheadlineChange?: (value: string) => void;
}

export function L1BigHeadline({ slide, editable, onHeadlineChange, onSubheadlineChange }: Props) {
  return (
    <div className="slide-canvas flex flex-col justify-center px-16 py-12 bg-white rounded-xl shadow-lg border border-slate-200/80">
      <h1
        className="text-4xl font-bold text-deck-ink tracking-tight leading-tight"
        contentEditable={editable}
        suppressContentEditableWarning
        onBlur={(e) => onHeadlineChange?.(e.currentTarget.textContent ?? "")}
      >
        {slide.headline}
      </h1>
      {slide.subheadline && (
        <p
          className="mt-4 text-xl text-deck-muted max-w-2xl"
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
