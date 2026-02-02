import { NextRequest, NextResponse } from "next/server";
import { jsPDF } from "jspdf";
import type { SlideData } from "@/lib/types";

// A4 landscape in mm
const SLIDE_W = 297;
const SLIDE_H = 210;
const MARGIN = 20;

export async function POST(request: NextRequest) {
  try {
    const { slides, title = "Pitch Deck" } = (await request.json()) as {
      slides: SlideData[];
      title?: string;
    };
    if (!Array.isArray(slides) || slides.length === 0) {
      return NextResponse.json({ error: "slides array required" }, { status: 400 });
    }

    const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });

    slides.forEach((s, index) => {
      if (index > 0) doc.addPage("a4", "landscape");
      doc.setFontSize(22);
      doc.setFont("helvetica", "bold");
      doc.text(s.headline, MARGIN, MARGIN + 10, { maxWidth: SLIDE_W - 2 * MARGIN });
      let y = MARGIN + 18;
      if (s.subheadline) {
        doc.setFontSize(12);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(100, 116, 139);
        doc.text(s.subheadline, MARGIN, y, { maxWidth: SLIDE_W - 2 * MARGIN });
        y += 10;
      }
      doc.setTextColor(15, 23, 42);
      if (s.bullets?.length) {
        doc.setFontSize(11);
        doc.setFont("helvetica", "normal");
        s.bullets.forEach((b) => {
          doc.text(`• ${b}`, MARGIN, y, { maxWidth: SLIDE_W - 2 * MARGIN - 5 });
          y += 7;
        });
      }
      if (s.metrics?.length) {
        y += 5;
        s.metrics.forEach((m, i) => {
          doc.setFontSize(14);
          doc.setFont("helvetica", "bold");
          doc.setTextColor(14, 165, 233);
          doc.text(m.value, MARGIN + (i % 2) * 120, y);
          doc.setFontSize(10);
          doc.setFont("helvetica", "normal");
          doc.setTextColor(100, 116, 139);
          doc.text(m.label, MARGIN + (i % 2) * 120, y + 6);
          if (i % 2 === 1) y += 18;
        });
      }
    });

    const buffer = Buffer.from(doc.output("arraybuffer"));
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${encodeURIComponent(title)}.pdf"`,
      },
    });
  } catch (e) {
    console.error("PDF export error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Export failed" },
      { status: 500 }
    );
  }
}
