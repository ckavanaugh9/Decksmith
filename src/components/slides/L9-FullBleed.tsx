"use client";

import type { SlideData } from "@/lib/types";

interface Props {
  slide: SlideData;
  editable?: boolean;
  onHeadlineChange?: (v: string) => void;
  onSubheadlineChange?: (v: string) => void;
}

export function L9FullBleed({ slide, editable, onHeadlineChange, onSubheadlineChange }: Props) {
  return (
    <div className="slide-canvas flex flex-col justify-center items-center px-16 py-12 bg-deck-ink rounded-xl text-white">
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
          className="mt-4 text-lg text-slate-300 text-center max-w-2xl"
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
