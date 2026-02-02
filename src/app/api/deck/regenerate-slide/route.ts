import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import type { RegenerateSlideInput, SlideData } from "@/lib/types";
import { env } from "@/lib/env";

const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });

const REGENERATE_SYSTEM = `You rewrite pitch deck slides to be clearer and more compelling for venture investors. Keep copy concise and presentation-ready. Output valid JSON only (no markdown) with the same structure as the input slide: headline, subheadline (optional), bullets (optional array), metrics/timeline/team/matrix if present.`;

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as RegenerateSlideInput;
    const { slide, deckContext, mode } = body;

    const userMessage =
      mode === "full"
        ? `Rewrite this entire slide to be clearer and more compelling. Deck context: ${deckContext}\n\nCurrent slide (JSON): ${JSON.stringify(slide)}`
        : mode === "headline"
          ? `Rewrite only the headline and subheadline for this slide. Deck context: ${deckContext}\n\nCurrent: headline="${slide.headline}", subheadline="${slide.subheadline ?? ""}"\n\nReturn JSON: { "headline": "...", "subheadline": "..." }`
          : `Rewrite only the bullets/content (keep headline and subheadline). Deck context: ${deckContext}\n\nCurrent slide: ${JSON.stringify(slide)}\n\nReturn JSON with same keys as slide but only update bullets (or metrics/timeline/team/matrix as applicable).`;

    const completion = await openai.chat.completions.create({
      model: env.OPENAI_MODEL,
      messages: [
        { role: "system", content: REGENERATE_SYSTEM },
        { role: "user", content: userMessage },
      ],
      response_format: { type: "json_object" },
      temperature: 0.6,
    });

    const raw = completion.choices[0]?.message?.content;
    if (!raw) {
      return NextResponse.json({ error: "No response from model" }, { status: 500 });
    }

    const updated = JSON.parse(raw) as Partial<SlideData>;
    const merged: SlideData = {
      ...slide,
      ...updated,
    };

    return NextResponse.json({ slide: merged });
  } catch (e) {
    console.error("Regenerate slide error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Regeneration failed" },
      { status: 500 }
    );
  }
}
