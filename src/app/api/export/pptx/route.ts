import { NextRequest, NextResponse } from "next/server";
import PptxGenJS from "pptxgenjs";
import type { SlideData } from "@/lib/types";

export async function POST(request: NextRequest) {
  try {
    const { slides, title = "Pitch Deck" } = (await request.json()) as {
      slides: SlideData[];
      title?: string;
    };
    if (!Array.isArray(slides) || slides.length === 0) {
      return NextResponse.json({ error: "slides array required" }, { status: 400 });
    }

    const pptx = new PptxGenJS();
    pptx.title = title;
    pptx.author = "DeckSmith AI";

    for (const s of slides) {
      const slide = pptx.addSlide();
      slide.background = { color: "FFFFFF" };

      // Title / headline
      slide.addText(s.headline, {
        x: 0.5,
        y: 0.5,
        w: 9,
        h: 0.8,
        fontSize: 28,
        bold: true,
        color: "0f172a",
      });
      if (s.subheadline) {
        slide.addText(s.subheadline, {
          x: 0.5,
          y: 1.3,
          w: 9,
          h: 0.5,
          fontSize: 14,
          color: "64748b",
        });
      }

      // Bullets
      if (s.bullets?.length) {
        const bulletText = s.bullets.map((b) => ({ text: b, options: { bullet: true } }));
        slide.addText(bulletText, {
          x: 0.5,
          y: 1.9,
          w: 9,
          h: 4,
          fontSize: 12,
          color: "334155",
        });
      }

      // Metrics (L4 / L7 style)
      if (s.metrics?.length) {
        const yStart = 2;
        s.metrics.forEach((m, i) => {
          slide.addText(m.value, {
            x: 0.5 + (i % 2) * 4.75,
            y: yStart + Math.floor(i / 2) * 1.2,
            w: 4.5,
            h: 0.5,
            fontSize: 18,
            bold: true,
            color: "0ea5e9",
          });
          slide.addText(m.label, {
            x: 0.5 + (i % 2) * 4.75,
            y: yStart + Math.floor(i / 2) * 1.2 + 0.45,
            w: 4.5,
            h: 0.4,
            fontSize: 11,
            color: "64748b",
          });
        });
      }

      // Team (L6)
      if (s.team?.length) {
        s.team.forEach((t, i) => {
          const x = 0.5 + (i % 3) * 3.2;
          const y = 2 + Math.floor(i / 3) * 1.8;
          slide.addText(t.name, { x, y, w: 3, h: 0.4, fontSize: 14, bold: true });
          slide.addText(t.role, { x, y: y + 0.35, w: 3, h: 0.35, fontSize: 11, color: "0ea5e9" });
          if (t.bio) slide.addText(t.bio, { x, y: y + 0.75, w: 3, h: 0.8, fontSize: 10, color: "64748b" });
        });
      }

      // Timeline (L5)
      if (s.timeline?.length) {
        s.timeline.forEach((item, i) => {
          slide.addText(item.label, {
            x: 0.5 + i * 3.2,
            y: 2,
            w: 3,
            h: 0.4,
            fontSize: 14,
            bold: true,
          });
          slide.addText(item.description, {
            x: 0.5 + i * 3.2,
            y: 2.4,
            w: 3,
            h: 1.2,
            fontSize: 11,
            color: "64748b",
          });
        });
      }

      // Matrix (L8) - simple table (TableCell format: { text: string }[][])
      if (s.matrix?.length) {
        const rows = s.matrix.map((r) => [
          { text: r.name },
          ...r.values.map((v) => ({ text: v })),
        ]);
        slide.addTable(rows, {
          x: 0.5,
          y: 2,
          w: 9,
          colW: [2, 2.33, 2.33, 2.34],
          fontSize: 11,
          border: { type: "solid", pt: 0.5, color: "e2e8f0" },
        });
      }
    }

    const buffer = await pptx.write({ outputType: "nodebuffer" });
    return new NextResponse(buffer as unknown as BodyInit, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        "Content-Disposition": `attachment; filename="${encodeURIComponent(title)}.pptx"`,
      },
    });
  } catch (e) {
    console.error("PPTX export error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Export failed" },
      { status: 500 }
    );
  }
}
