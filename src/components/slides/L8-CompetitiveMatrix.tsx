"use client";

import type { SlideData } from "@/lib/types";

interface Props {
  slide: SlideData;
  editable?: boolean;
  onHeadlineChange?: (v: string) => void;
  onMatrixChange?: (matrix: { name: string; values: string[] }[]) => void;
}

export function L8CompetitiveMatrix({ slide, editable, onHeadlineChange, onMatrixChange }: Props) {
  const matrix = slide.matrix ?? [
    { name: "Us", values: ["✓", "✓", "✓"] },
    { name: "Competitor A", values: ["—", "—", "—"] },
    { name: "Competitor B", values: ["—", "—", "—"] },
  ];
  const cols = matrix[0]?.values?.length ?? 3;

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
