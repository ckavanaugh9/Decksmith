import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import type { DeckArchitectOutput, DeckTheme, GenerateDeckInput, LayoutId, SlideCopyItem, SlideData, SlideType } from "@/lib/types";
import { DEFAULT_THEME, parseTheme } from "@/lib/theme";
import { env } from "@/lib/env";

const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });

/** Fallback layout by type when GPT does not suggest a layout. */
const TYPE_TO_LAYOUT: Record<SlideType, LayoutId> = {
  title: "L1",
  vision: "L9",
  problem: "L2",
  solution: "L2",
  product: "L3",
  market: "L7",
  traction: "L4",
  business_model: "L4",
  competition: "L8",
  gtm: "L5",
  team: "L6",
  ask: "L10",
};

const VALID_LAYOUTS: LayoutId[] = ["L1", "L2", "L3", "L4", "L5", "L6", "L7", "L8", "L9", "L10"];

function slideCopyToSlideData(copy: SlideCopyItem, index: number): SlideData {
  const type = copy.type as SlideType;
  // Layout comes from GPT only — no overrides. Fallback only when GPT didn't provide a valid layout.
  const layout: LayoutId =
    copy.layout && VALID_LAYOUTS.includes(copy.layout)
      ? copy.layout
      : (TYPE_TO_LAYOUT[type] ?? VALID_LAYOUTS[index % VALID_LAYOUTS.length]) as LayoutId;
  return {
    type,
    layout,
    headline: copy.headline ?? "Slide",
    subheadline: copy.subheadline,
    bullets: copy.bullets ?? [],
    metrics: copy.metrics,
    timeline: copy.timeline,
    team: copy.team,
    matrix: copy.matrix,
    imageSuggestion: copy.imageSuggestion,
  };
}

const DECK_ARCHITECT_SYSTEM = `You are an expert pitch deck architect for venture-backed startups. You will receive a structured company story (or summary) and must produce a 10–12 slide VC-style pitch deck as valid JSON only (no markdown, no code fence).

The deck MUST explicitly cover these 8 areas from the story:
1) Mission statement — vision/title slide
2) What the company does — problem/solution
3) Technology and product — product slide(s)
4) Differentiation vs competitors — competition slide
5) IP and patents — use product or a dedicated slide (bullets/metrics)
6) Financial forecasting — business_model / traction / metrics
7) Total addressable market — market slide (L7)
8) Fundraising and use of funds — ask slide (L10)

Use this exact JSON structure:

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
  ],
  "theme": {
    "primaryColor": "#hex (dark text/headings)",
    "secondaryColor": "#hex (muted text)",
    "accentColor": "#hex (highlights, CTAs)"
  }
}

Layout mapping: L1=big headline+subtext, L2=two-column problem, L3=3 feature cards, L4=metrics grid, L5=timeline, L6=team cards, L7=market stacked blocks, L8=competitive matrix, L9=full-bleed statement, L10=ask/fundraise. Use only these layout IDs. Pull specific numbers, claims, and differentiators from the company story. If a section is "Not disclosed" use one realistic placeholder. For theme, suggest modern attractive hex colors that fit the startup.`;

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as GenerateDeckInput;
    const { description, industry, stage, targetCustomer, websiteUrl, slideCount = 11 } = body;

    const extendedBody = body as GenerateDeckInput & { websiteSummary?: string; companyStory?: string; slideCopy?: SlideCopyItem[]; theme?: DeckTheme };
    const companyStory = extendedBody.companyStory;
    const websiteSummary = extendedBody.websiteSummary;
    const slideCopy = extendedBody.slideCopy;
    const requestTheme = extendedBody.theme;

    // When URL ingest provided slide copy + theme: use GPT text and layout verbatim with style from website
    const hasSlideCopy = Array.isArray(slideCopy) && slideCopy.length > 0;
    if (hasSlideCopy) {
      const slides: SlideData[] = slideCopy.map((copy, index) => slideCopyToSlideData(copy, index));
      const theme: DeckTheme = requestTheme ? parseTheme(requestTheme) : DEFAULT_THEME;
      const first = slides[0];
      console.info("Deck generate: GPT slideCopy path", slides.length, "slides | first headline:", first?.headline ?? "(none)", "| first layout:", first?.layout ?? "(none)");
      if (!first?.headline) console.warn("Deck generate: first slide missing headline!");
      return NextResponse.json({ slides, theme, _source: "slideCopy" });
    }

    console.info("Deck generate: no slideCopy (received:", Array.isArray(slideCopy) ? slideCopy.length : typeof slideCopy, "), using architect path");
    // No slideCopy: fall back to architect (LLM generates deck from description/companyStory)

    let context = description;
    if (industry) context += `\nIndustry: ${industry}`;
    if (stage) context += `\nStage: ${stage}`;
    if (targetCustomer) context += `\nTarget customer: ${targetCustomer}`;
    if (companyStory) {
      context += `\n\nStructured company story (use this to fill all 8 required areas: mission, what company does, technology/product, differentiation, IP/patents, financials, TAM, fundraising/use of funds):\n${companyStory}`;
    } else if (websiteUrl && websiteSummary) {
      context += `\n\nWebsite summary:\n${websiteSummary}`;
    }

    const userMessage = `Generate a ${slideCount}-slide investor pitch deck (JSON only) for this startup. Ensure the deck covers: mission, what the company does, technology/product, differentiation vs competitors, IP/patents, financial forecasting, TAM, and fundraising/use of funds.\n\n${context}`;

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

    const theme: DeckTheme = parseTheme(parsed.theme);

    return NextResponse.json({ slides, theme, _source: "architect" });
  } catch (e) {
    console.error("Deck generate error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Deck generation failed" },
      { status: 500 }
    );
  }
}
