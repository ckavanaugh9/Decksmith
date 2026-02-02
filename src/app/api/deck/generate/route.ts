import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import type { DeckArchitectOutput, GenerateDeckInput, SlideData } from "@/lib/types";
import { env } from "@/lib/env";

const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });

const DECK_ARCHITECT_SYSTEM = `You are an expert pitch deck architect for venture-backed startups. Given startup information, output a 10–12 slide VC-style pitch deck as valid JSON only (no markdown, no code fence). Use this exact structure:

{
  "slides": [
    {
      "type": "title" | "problem" | "solution" | "product" | "market" | "traction" | "business_model" | "competition" | "gtm" | "team" | "vision" | "ask",
      "layout": "L1" | "L2" | "L3" | "L4" | "L5" | "L6" | "L7" | "L8" | "L9" | "L10",
      "headline": "string",
      "subheadline": "optional string",
      "bullets": ["optional array of strings"],
      "metrics": [{"label": "string", "value": "string"}],
      "timeline": [{"label": "string", "description": "string"}],
      "team": [{"name": "string", "role": "string", "bio": "optional string"}],
      "matrix": [{"name": "string", "values": ["string"]}]
    }
  ]
}

Layout mapping: L1=big headline+subtext, L2=two-column problem, L3=3 feature cards, L4=metrics grid, L5=timeline, L6=team cards, L7=market stacked blocks, L8=competitive matrix, L9=full-bleed statement, L10=ask/fundraise. Use only these layout IDs. Keep tone investor-ready and concise. If info is missing use realistic placeholders like "Insert current MRR or growth rate".`;

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as GenerateDeckInput;
    const { description, industry, stage, targetCustomer, websiteUrl, slideCount = 11 } = body;

    let context = description;
    if (industry) context += `\nIndustry: ${industry}`;
    if (stage) context += `\nStage: ${stage}`;
    if (targetCustomer) context += `\nTarget customer: ${targetCustomer}`;
    if (websiteUrl) {
      // URL content will be injected by caller if they hit /api/url-ingest first
      const urlContext = (body as GenerateDeckInput & { websiteSummary?: string }).websiteSummary;
      if (urlContext) context += `\n\nWebsite summary:\n${urlContext}`;
    }

    const userMessage = `Generate a ${slideCount}-slide investor pitch deck (JSON only) for this startup:\n\n${context}`;

    const completion = await openai.chat.completions.create({
      model: env.OPENAI_MODEL,
      messages: [
        { role: "system", content: DECK_ARCHITECT_SYSTEM },
        { role: "user", content: userMessage },
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    const raw = completion.choices[0]?.message?.content;
    if (!raw) {
      return NextResponse.json({ error: "No response from model" }, { status: 500 });
    }

    const parsed = JSON.parse(raw) as DeckArchitectOutput;
    if (!Array.isArray(parsed.slides)) {
      return NextResponse.json({ error: "Invalid deck structure" }, { status: 500 });
    }

    // Normalize: ensure each slide has layout and required fields
    const slides: SlideData[] = parsed.slides.map((s) => ({
      type: s.type ?? "product",
      layout: s.layout ?? "L1",
      headline: s.headline ?? "Slide",
      subheadline: s.subheadline,
      bullets: s.bullets,
      metrics: s.metrics,
      timeline: s.timeline,
      team: s.team,
      matrix: s.matrix,
    }));

    return NextResponse.json({ slides });
  } catch (e) {
    console.error("Deck generate error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Deck generation failed" },
      { status: 500 }
    );
  }
}
