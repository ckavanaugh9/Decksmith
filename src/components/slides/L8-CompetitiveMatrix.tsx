"use client";

import { Grid3X3 } from "lucide-react";
import type { DeckTheme, SlideData } from "@/lib/types";

interface Props {
  slide: SlideData;
  theme?: DeckTheme | null;
  editable?: boolean;
  onHeadlineChange?: (v: string) => void;
  onMatrixChange?: (matrix: { name: string; values: string[] }[]) => void;
}

export function L8CompetitiveMatrix({ slide, theme, editable, onHeadlineChange, onMatrixChange }: Props) {
  const matrix = slide.matrix ?? [
    { name: "Us", values: ["✓", "✓", "✓"] },
    { name: "Competitor A", values: ["—", "—", "—"] },
    { name: "Competitor B", values: ["—", "—", "—"] },
  ];
  const cols = matrix[0]?.values?.length ?? 3;

  return (
    <div className="slide-canvas flex flex-col px-12 py-10 bg-white rounded-xl shadow-lg border border-slate-200/80">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ backgroundColor: "color-mix(in srgb, var(--deck-accent) 20%, white)" }}>
          <Grid3X3 className="h-5 w-5" style={{ color: "var(--deck-accent)" }} />
        </div>
        <h2
          className="text-2xl font-bold"
          style={{ color: "var(--deck-primary)" }}
        contentEditable={editable}
        suppressContentEditableWarning
        onBlur={(e) => onHeadlineChange?.(e.currentTarget.textContent ?? "")}
        >
          {slide.headline}
        </h2>
      </div>
      <div className="mt-6 overflow-x-auto flex-1">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr>
              <th className="text-left p-2 border-b border-slate-200 font-semibold text-deck-ink"> </th>
              {Array.from({ length: cols }).map((_, i) => (
                <th key={i} className="text-left p-2 border-b border-slate-200 font-medium text-deck-muted">
                  {i === 0 ? "Criteria 1" : i === 1 ? "Criteria 2" : "Criteria 3"}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {matrix.map((row, ri) => (
              <tr key={ri}>
                <td
                  className="p-2 border-b border-slate-100 font-medium"
                  contentEditable={editable}
                  suppressContentEditableWarning
                  onBlur={(e) => {
                    const next = matrix.map((r, i) =>
                      i === ri ? { ...r, name: e.currentTarget.textContent ?? "" } : r
                    );
                    onMatrixChange?.(next);
                  }}
                >
                  {row.name}
                </td>
                {row.values.map((v, vi) => (
                  <td
                    key={vi}
                    className="p-2 border-b border-slate-100"
                    contentEditable={editable}
                    suppressContentEditableWarning
                    onBlur={(e) => {
                      const next = matrix.map((r, i) => {
                        if (i !== ri) return r;
                        const vals = [...r.values];
                        vals[vi] = e.currentTarget.textContent ?? "";
                        return { ...r, values: vals };
                      });
                      onMatrixChange?.(next);
                    }}
                  >
                    {v}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
