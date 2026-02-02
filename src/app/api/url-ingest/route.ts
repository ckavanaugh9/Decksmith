import { NextRequest, NextResponse } from "next/server";
import Exa from "exa-js";
import OpenAI from "openai";
import { env } from "@/lib/env";
import type { LayoutId, SlideCopyItem, SlideType } from "@/lib/types";
import {
  extractBrandingFromHtml,
  extractColorsFromCss,
  extractCssFromHtml,
  extractPaletteFromImage,
  inferThemeFromBranding,
} from "@/lib/styling-bot";

const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });

/** Max total characters from all sources to stay within context limits */
const MAX_COMBINED_CHARS = 38_000;

/** Exa limit: 5 requests per second. We batch and delay to stay under. */
const EXA_MAX_PER_SECOND = 5;
const EXA_DELAY_BETWEEN_BATCHES_MS = 1000;
const EXA_INITIAL_DELAY_MS = 250;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Run Exa searchAndContents in batches of at most (EXA_MAX_PER_SECOND - 1) with
 * 1s between batches so we never exceed 5 requests per second.
 */
async function runExaBatched(
  exa: InstanceType<typeof Exa>,
  queries: string[],
  options: { numResults: number; text: { maxCharacters: number }; contents: { text: true } }
): Promise<{ results?: { url?: string; text?: string }[] }[]> {
  const batchSize = EXA_MAX_PER_SECOND - 1; // 4 per batch to stay under 5/sec
  const out: { results?: { url?: string; text?: string }[] }[] = [];
  for (let i = 0; i < queries.length; i += batchSize) {
    const batch = queries.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map((q) => exa.searchAndContents(q, options))
    );
    out.push(...batchResults);
    if (i + batchSize < queries.length) {
      await delay(EXA_DELAY_BETWEEN_BATCHES_MS);
    }
  }
  return out;
}

/** Structured company story sections required for the pitch deck */
const COMPANY_STORY_SECTIONS = [
  "Mission statement",
  "What the company does",
  "Technology and product",
  "Differentiation vs competitors",
  "IP and patents",
  "Financial forecasting",
  "Total addressable market",
  "Fundraising and use of funds",
] as const;

/**
 * Ingest startup: page through website + publicly available material (patents,
 * blogs, whitepapers, marketing, academic). Build a detailed 8-section story
 * for the Deck Architect.
 */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { url: string; debug?: boolean };
    const { url, debug: debugMode } = body;
    if (!url?.trim()) {
      return NextResponse.json({ error: "URL required" }, { status: 400 });
    }

    const exaApiKey = env.EXA_API_KEY;
    if (!exaApiKey) {
      return NextResponse.json(
        { error: "EXA_API_KEY not configured" },
        { status: 503 }
      );
    }

    const exa = new Exa(exaApiKey);

    let baseUrl: string;
    try {
      const u = new URL(url);
      baseUrl = u.origin;
    } catch {
      return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
    }

    // 1) Homepage + common inner pages (paginate through key tabs for richest detail)
    const pathSuffixes = ["", "/about", "/about-us", "/products", "/product", "/case-studies", "/press", "/awards", "/team"];
    const urlsToFetch = [url];
    for (const suffix of pathSuffixes) {
      if (!suffix) continue;
      const normalized = baseUrl.replace(/\/$/, "") + suffix;
      if (normalized !== url) urlsToFetch.push(normalized);
    }
    const contentsFromUrl = await exa.getContents(urlsToFetch.slice(0, 9), {
      text: { maxCharacters: 8000 },
    });
    await delay(EXA_INITIAL_DELAY_MS);

    const siteQueries = [
      `site:${baseUrl} about`,
      `site:${baseUrl} product`,
      `site:${baseUrl} pricing`,
      `site:${baseUrl} blog`,
      `site:${baseUrl} resources`,
      `site:${baseUrl} whitepaper`,
      `site:${baseUrl} case studies`,
      `site:${baseUrl} press OR awards`,
      `site:${baseUrl} team OR who we serve`,
    ];

    const siteResults = await runExaBatched(exa, siteQueries, {
      numResults: 3,
      text: { maxCharacters: 5000 },
      contents: { text: true },
    });

    const seenUrls = new Set<string>();
    const textChunks: string[] = [];

    for (const c of contentsFromUrl.results ?? []) {
      if (c.text && c.url) {
        seenUrls.add(c.url);
        textChunks.push(`[From ${c.url}]\n${c.text}`);
      }
    }
    for (const res of siteResults) {
      for (const r of res.results ?? []) {
        if (r.text && r.url && !seenUrls.has(r.url)) {
          seenUrls.add(r.url);
          textChunks.push(`[From ${r.url}]\n${r.text}`);
        }
      }
    }

    // 2) Extract company/product name from initial content for targeted searches
    const firstBlob = textChunks.slice(0, 3).join("\n").slice(0, 4000);
    let companyName = "";
    try {
      const nameCompletion = await openai.chat.completions.create({
        model: env.OPENAI_MODEL ?? "gpt-4o",
        messages: [
          {
            role: "system",
            content:
              "Reply with only the company or product name (2–6 words), nothing else. If unclear, use the site title or first heading.",
          },
          { role: "user", content: `From this website content, what is the company or product name?\n\n${firstBlob.slice(0, 2000)}` },
        ],
        temperature: 0.2,
        max_tokens: 50,
      });
      companyName = (nameCompletion.choices[0]?.message?.content?.trim() ?? "").replace(/^["']|["']$/g, "");
    } catch {
      // Fallback: use domain or "the company"
      try {
        companyName = new URL(url).hostname.replace(/^www\./, "").split(".")[0] ?? "the company";
      } catch {
        companyName = "the company";
      }
    }

    const searchTerm = companyName ? `"${companyName}"` : baseUrl;

    // 3) Search for patents, whitepapers, blogs, marketing, TAM, funding (public material)
    const externalQueries = [
      `${searchTerm} patents`,
      `${searchTerm} whitepaper OR blog OR research paper`,
      `${searchTerm} total addressable market OR TAM OR market size`,
      `${searchTerm} funding OR use of funds OR fundraising`,
      `${searchTerm} competitors OR differentiation`,
      `${searchTerm} financial forecast OR revenue`,
    ];

    const externalResults = await runExaBatched(exa, externalQueries, {
      numResults: 3,
      text: { maxCharacters: 5000 },
      contents: { text: true },
    });

    for (const res of externalResults) {
      for (const r of res.results ?? []) {
        if (r.text && r.url && !seenUrls.has(r.url)) {
          seenUrls.add(r.url);
          textChunks.push(`[From ${r.url}]\n${r.text}`);
        }
      }
    }

    // Cap total size
    let combined = "";
    for (const chunk of textChunks) {
      if (combined.length + chunk.length + 10 > MAX_COMBINED_CHARS) {
        combined += "\n\n---\n\n" + chunk.slice(0, MAX_COMBINED_CHARS - combined.length - 20);
        break;
      }
      combined += (combined ? "\n\n---\n\n" : "") + chunk;
    }

    if (!combined.trim()) {
      return NextResponse.json(
        { error: "No content could be extracted from URL" },
        { status: 422 }
      );
    }

    // 4) Generate concise bullet-point slide copy for 10 slides (VC pitch)
    const slideCopyPrompt = `You are writing slide copy for a VC pitch deck. The company's website is: ${url}

We have gathered the following research from the website and public sources. Your job is to turn this research into PUNCHY, INVESTOR-GRADE copy — specific and memorable, not generic.

SPECIFICITY RULES:
- Pull real details from the research: company name, product name, numbers ($, %, years), awards, patents, partner/customer names, geography, metrics. If the research says it, use it.
- Every slide should have at least one concrete detail (a number, a name, or a specific claim from the research). Avoid slides that are 100% vague.
- If the research has no data for a section, use one short plausible placeholder (e.g. "TAM details in diligence") — do NOT fill with generic filler.

AVOID (do not write like this):
- "Leverage cutting-edge technology" / "Best-in-class solution" / "Drive growth and efficiency" / "World-class team" / "Innovative platform" / "Scalable and flexible" / "Disrupt the market" / "Unlock value"
- Bullets that could apply to any startup. If a bullet could fit 100 other decks, rewrite it to be specific to THIS company using the research below.
- Copying the example phrases in this prompt verbatim. The examples show STYLE only; you must REWRITE every bullet using ONLY details from the research below.

NAMES AND NUMBERS: When the research mentions any of the following, you MUST use them in the bullets: grant or funding ($, NSF, SBIR, etc.), partners or customers (DOTs, agencies, universities, company names), people (founders, researchers, e.g. "Dr. X"), awards (Edison, TIME, ASCE Gamechanger, etc.), stats (e.g. "25% overuse of cement", "11 states", "X% reduction"). Do not drop concrete details in favor of generic phrasing.

REFERENCE EXAMPLE — Match this STYLE (punchy headlines, visual layouts, specific details). Use the research below to write YOUR version — do NOT copy this example text:

Slide 1 — Vision / Hero Slide
Headline: "Concrete Just Got Smart"
Subheadline: "Real-time strength intelligence for faster, safer construction"
Layout: L9 (full-bleed statement)
Image suggestion: "Major infrastructure pour (bridge, highway, or high-rise foundation)"

Slide 2 — The Problem
Headline: "Concrete Decisions Run on Guesswork"
Layout: L2 (two-column bullets)
Bullets: ["🧪 Slow Testing — Break tests take days", "💸 Cost Overruns — Delays = labor + equipment burn", "🌍 Material Waste — Overdesign drives excess cement use"]
Image suggestion: "Simple line icons + muted gray background texture"

Slide 3 — The Solution
Headline: "Real-Time Strength. Zero Breaks."
Layout: L2 (left text, right visual)
Bullets: ["In-place, real-time strength measurement", "No cylinders, no lab delays", "Live alerts for construction milestones"]
Image suggestion: "Exploded or in-context diagram of sensor embedded in concrete sending data to cloud/dashboard"

Slide 4 — Technology
Headline: "Physics + AI = Breakthrough Measurement"
Layout: L5 (timeline/flow)
Timeline: [
  {"label": "Concrete → Sensor", "description": "Acoustic/Resonance Signal"},
  {"label": "Sensor → Cloud", "description": "AI Strength Modeling"},
  {"label": "Cloud → Dashboard", "description": "Wireless Data Pipeline"},
  {"label": "Dashboard → Site", "description": "Actionable Site Insights"}
]
Image suggestion: "Clean schematic, thin lines, glowing signal waves inside concrete block graphic"

Slide 5 — Why We Win
Headline: "Not an Estimate. The Actual Strength."
Layout: L8 (comparison table)
Matrix: [
  {"name": "Wavelogix", "values": ["✓", "✓", "✓", "✓"]},
  {"name": "Cylinder Breaks", "values": ["❌", "❌", "⚠️", "❌"]},
  {"name": "Temp/Maturity Sensors", "values": ["❌", "✓", "❌", "⚠️"]}
]
Image suggestion: "Comparison table with green checks vs gray Xs, lots of white space"

Slide 6 — Defensibility
Headline: "Deep Tech. Protected."
Layout: L2 (two-column)
Bullets: ["Patented resonance-based sensing", "Proprietary signal processing", "Data + model moat grows with every pour"]
Image suggestion: "Stylized patent shield icon overlaying waveform signal inside concrete"

Slide 7 — Traction
Headline: "Adopted Where Failure Isn't an Option"
Layout: L4 (metrics grid)
Metrics: [
  {"label": "National infrastructure pilots", "value": "11 states"},
  {"label": "Federal research funding", "value": "$1M NSF"},
  {"label": "Industry awards", "value": "Edison Gold, TIME Best Inventions"}
]
Image suggestion: "Logo bar with DOTs, contractors, research partners; background of highway paving"

Slide 8 — Market Opportunity
Headline: "Digitizing a Trillion-Dollar Industry"
Layout: L7 (market stacked blocks)
Bullets: ["TAM: Global concrete construction", "SAM: Infrastructure + commercial builds", "SOM: Sensor-enabled smart construction"]
Image suggestion: "Expanding circles (TAM → SAM → SOM) visualization"

Slide 9 — Business Model
Headline: "Hardware + Recurring Data Revenue"
Layout: L4 (metrics/revenue stack)
Metrics: [
  {"label": "Sensor Hardware Sales", "value": "Base"},
  {"label": "Project-Based Monitoring", "value": "Mid"},
  {"label": "Recurring SaaS Dashboard", "value": "High"},
  {"label": "Predictive Analytics", "value": "Highest"}
]
Image suggestion: "Stacked blocks growing upward, top blocks higher margin"

Slide 10 — The Ask
Headline: "Scaling the Standard for Concrete Intelligence"
Layout: L10 (ask/fundraise)
Subheadline: "Raising growth capital"
Bullets: ["Manufacturing scale", "Sales expansion", "R&D / AI platform", "Cloud infrastructure", "Customer success"]
Image suggestion: "Use of funds pie chart; subtle blueprint grid texture"

FORMAT (match the STYLE above — punchy headlines, visual layouts, specific details — but write content ONLY from the research; do not copy the example text):

Slide 1 — Mission & Vision: Headline "Mission & Vision". 3 bullets: one tagline or vision from the research first, then 2 benefit bullets derived from the research (use the company's own words or claims where possible).

Slide 2 — The Problem: Headline "The Problem". 3 short bullets (problems this company actually addresses per the research).

Slide 3 — What We Do: Headline "What We Do". 3 short bullets (what the product/company does, key differentiator, benefit — from research).

Slide 4 — Technology & Product: Headline "Technology & Product" or product name. 3 short bullets (product name, key tech, and one more feature or capability from research).

Slide 5 — Differentiation: Headline "Differentiation". 4 short bullets (key differentiators from research; include standards, patents, or comparisons if mentioned). No table — use bullets only.

Slide 6 — IP & Defensibility: Headline "IP & Defensibility". 3 short bullets (patents, standards, algorithms, or barriers mentioned in research).

Slide 7 — Traction: Headline "Traction". 4 short bullets: include awards, press, grants ($ if known), pilots, customers, or geography (e.g. "Deployed in X states") — all from research.

Slide 8 — Market Opportunity: Headline "Market Opportunity". 3 short bullets (market size $ if in research, TAM/SAM, expansion — or "TAM details in diligence" if not).

Slide 9 — Financial Forecast: Headline "Financial Forecast (5-Year)". Use "metrics" for year/revenue rows: [{"label": "2026", "value": "$X"}, ...] (5 rows). Use numbers from research if given; otherwise plausible placeholders. Plus 1 bullet (e.g. margin or model note from research).

Slide 10 — Fundraise: Headline "Fundraise & Use of Funds". If the research mentions a round, amount, or use of funds, use that (subheadline + bullets). If the research does NOT mention fundraising, use a single placeholder subheadline (e.g. "Raising growth capital") and one bullet (e.g. "Use of funds — details in diligence"); do NOT invent a full 30/25/20/15/10 split or "Series B — $10M" when the research says nothing about it.

Research to use:
---
${combined.slice(0, 30_000)}
---

LAYOUT — YOU choose the layout for every slide. There are no fixed slide layouts; pick the layout that best fits the content for that slide.
- L1: Big headline + subtext (title, mission/vision, one strong statement)
- L2: Two-column bullet list (problem, solution, differentiation, any 3–6 bullets) — use "bullets"
- L3: Three feature cards (product features, 3 distinct points) — use "bullets" (3 items)
- L4: Metrics grid (traction stats, financial forecast, key-value pairs) — use "metrics"
- L5: Timeline / roadmap (milestones, phases) — use "timeline"
- L6: Team member cards (people with names/roles) — use "team"
- L7: Market stacked blocks (TAM/SAM/SOM) — use "bullets" or "metrics"
- L8: Competitive matrix (comparison table) — you MUST provide "matrix": [{"name": "Us", "values": ["✓","✓","—"]}, {"name": "Competitor A", "values": ["—","✓","✓"]}] with column labels as the first row or in the values. If you prefer bullets for differentiation, use L2 and "bullets" instead.
- L9: Full-bleed statement (single punchy vision or quote)
- L10: Ask / fundraise (use of funds, contact, CTA)

Match content to layout: if you choose L8, provide "matrix". If you choose L2 or L3, provide "bullets". If you choose L4 or L7 for metrics, provide "metrics". If you choose L6, provide "team". If you choose L5, provide "timeline".

REQUIRED: Every slide MUST have "type" and "layout" (exactly one of L1–L10). You decide the layout per slide — no fixed mapping.
OPTIONAL: "imageSuggestion" — short description of what image would work for this slide (e.g. "Product dashboard screenshot", "Team photo", "Customer logos", "Award ceremony"). One phrase per slide.

Output valid JSON only — no markdown code fences, no text before or after the JSON. Use "metrics" only for the financial slide (Slide 9). All other slides use "bullets" (short one-line phrases). Do not copy this prompt's example sentences; every bullet must be rewritten from the research. When research has names (NSF, Purdue, INDOT, ASCE, etc.) or numbers ($1M, 25%, 11 states), include them.

{
  "slides": [
    {
      "type": "title" | "vision" | "problem" | "solution" | "product" | "market" | "traction" | "business_model" | "competition" | "ask",
      "layout": "L1" | "L2" | "L3" | "L4" | "L5" | "L6" | "L7" | "L8" | "L9" | "L10",
      "headline": "string",
      "subheadline": "optional string",
      "bullets": ["short one-line bullet", "..."],
      "metrics": [{"label": "2026", "value": "$2M"}, ...],
      "matrix": [{"name": "Us", "values": ["✓","—","✓"]}, ...],
      "team": [{"name": "Name", "role": "Role"}, ...],
      "timeline": [{"label": "Phase", "description": "..."}, ...],
      "imageSuggestion": "optional short phrase e.g. Product dashboard"
    }
  ]
}

Generate exactly 10 slides in order: title (Mission & Vision), problem, solution (What We Do), product (Technology & Product), competition (Differentiation), IP (headline "IP & Defensibility"), traction, market, business_model (Financial Forecast with metrics), ask (Fundraise & Use of Funds). For each slide YOU choose the layout (L1–L10) that best fits the content and provide the matching content (bullets, metrics, matrix, team, or timeline). Match the REFERENCE EXAMPLE style: punchy headlines, visual layouts, specific details. Optionally add "imageSuggestion" per slide describing the visual (e.g. "Product dashboard", "Award ceremony", "Comparison chart"). Colors/theme will be taken from the website separately — you control text, layout, and image suggestions only.`;

    const slideCopyCompletion = await openai.chat.completions.create({
      model: env.OPENAI_MODEL ?? "gpt-4o",
      messages: [
        {
          role: "system",
          content:
            "You are a VC pitch deck writer. You dictate slide text, layout, and image suggestions. Match the REFERENCE EXAMPLE style: punchy, memorable headlines (e.g. 'Concrete Just Got Smart', 'Not an Estimate. The Actual Strength.'), visual layouts that fit the content, and specific details from the research. Output only valid JSON with a 'slides' array. For each slide you choose: type, layout (L1–L10 — pick the layout that best fits the content; no fixed mapping), headline (make it punchy and memorable, not generic), subheadline, and the content that matches the layout (bullets for L2/L3, metrics for L4/L7, matrix for L8, team for L6, timeline for L5). If you choose L8 you must provide 'matrix'. Optionally add 'imageSuggestion' (one short phrase per slide describing the visual, e.g. 'Product dashboard screenshot', 'Award ceremony photo'). Rules: (1) Rewrite every bullet using ONLY the research provided — do NOT copy the example text. (2) Include grants, partners, people, awards by name when in research. (3) No invented fundraising split when research says nothing. (4) Headlines should be punchy and memorable (like the example), not safe and generic. Colors/theme come from the website — you control text, layout, and image suggestions.",
        },
        { role: "user", content: slideCopyPrompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0.6,
    });

    const slideCopyRaw = slideCopyCompletion.choices[0]?.message?.content?.trim() ?? "";
    let slideCopy: SlideCopyItem[] = [];
    let companyStory = "";
    let websiteSummary = "";

    // Strip markdown code fences so we can parse GPT output (e.g. ```json ... ```)
    function extractJson(raw: string): string {
      let s = raw.trim();
      const codeFence = s.match(/^```(?:json)?\s*\n?/);
      if (codeFence) {
        s = s.slice(codeFence[0].length);
        const end = s.indexOf("```");
        if (end !== -1) s = s.slice(0, end);
      }
      const firstBrace = s.indexOf("{");
      if (firstBrace !== -1) {
        let depth = 0;
        let end = -1;
        for (let i = firstBrace; i < s.length; i++) {
          if (s[i] === "{") depth++;
          else if (s[i] === "}") {
            depth--;
            if (depth === 0) {
              end = i;
              break;
            }
          }
        }
        if (end !== -1) s = s.slice(firstBrace, end + 1);
      }
      return s;
    }

    const validSlideTypes: SlideType[] = ["title", "vision", "problem", "solution", "product", "market", "traction", "business_model", "competition", "gtm", "team", "ask"];
    const validLayouts: LayoutId[] = ["L1", "L2", "L3", "L4", "L5", "L6", "L7", "L8", "L9", "L10"];

    function parseSlidesFromParsed(parsed: Record<string, unknown>): unknown[] | null {
      const slides = parsed.slides ?? parsed.Slides ?? (parsed as { data?: { slides?: unknown[] } }).data?.slides;
      return Array.isArray(slides) && slides.length > 0 ? slides : null;
    }

    function toSlideCopyItem(s: unknown, index: number): SlideCopyItem {
      const t = (s ?? {}) as Record<string, unknown>;
      const typeStr = String(t.type ?? t.Type ?? "product").trim().toLowerCase();
      const type = (validSlideTypes.includes(typeStr as SlideType) ? typeStr : "product") as SlideType;
      const layoutRaw = typeof (t.layout ?? t.Layout) === "string" ? String(t.layout ?? t.Layout).trim().toUpperCase() : "";
      const layout: LayoutId = layoutRaw && validLayouts.includes(layoutRaw as LayoutId) ? (layoutRaw as LayoutId) : (validLayouts[index % validLayouts.length] as LayoutId);
      return {
        type,
        layout,
        headline: (t.headline ?? t.Headline ?? "Slide") as string,
        subheadline: (t.subheadline ?? t.Subheadline) as string | undefined,
        bullets: (t.bullets ?? t.Bullets) as string[] | undefined,
        metrics: (t.metrics ?? t.Metrics) as { label: string; value: string }[] | undefined,
        timeline: (t.timeline ?? t.Timeline) as { label: string; description: string }[] | undefined,
        team: (t.team ?? t.Team) as { name: string; role: string; bio?: string }[] | undefined,
        matrix: (t.matrix ?? t.Matrix) as { name: string; values: string[] }[] | undefined,
        imageSuggestion: typeof (t.imageSuggestion ?? t.image_suggestion) === "string" ? String(t.imageSuggestion ?? t.image_suggestion).trim() || undefined : undefined,
      };
    }

    try {
      let parsed: Record<string, unknown> | unknown[] | null = null;
      for (const candidate of [extractJson(slideCopyRaw), slideCopyRaw]) {
        if (!candidate?.trim()) continue;
        try {
          parsed = JSON.parse(candidate) as Record<string, unknown> | unknown[];
          break;
        } catch {
          continue;
        }
      }
      let slidesArray: unknown[] | null = null;
      if (parsed) {
        if (Array.isArray(parsed) && parsed.length > 0) {
          slidesArray = parsed;
        } else if (typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)) {
          slidesArray = parseSlidesFromParsed(parsed as Record<string, unknown>);
        }
      }
      if (slidesArray) {
        slideCopy = slidesArray.slice(0, 12).map((s: unknown, index: number) => toSlideCopyItem(s, index));
        companyStory = slideCopy.map((s) => `## ${s.type}\n${s.headline}\n${s.subheadline ?? ""}\n${(s.bullets ?? []).join("\n")}`).join("\n\n");
        websiteSummary = (slideCopy.slice(0, 3).map((s) => s.headline).join(". ") || slideCopy[0]?.headline) ?? "";
        console.info("URL ingest: slide copy from GPT parsed successfully", slideCopy.length, "slides");
      } else {
        console.warn("URL ingest: slide copy parse failed (no slides array), using architect path. Raw length:", slideCopyRaw?.length ?? 0);
      }
    } catch (e) {
      console.warn("URL ingest: slide copy parse failed, using architect path", e instanceof Error ? e.message : e);
    }
    if (!websiteSummary && slideCopy[0]) {
      websiteSummary = slideCopy[0].headline + (slideCopy[0].subheadline ? " " + slideCopy[0].subheadline : "");
    }

    // 5) Styling: branding + CSS + image palette + theme
    let brandingFromHtml: ReturnType<typeof extractBrandingFromHtml> = {};
    let cssColors: string[] = [];
    let imagePalette: string[] = [];
    try {
      const htmlRes = await fetch(url, {
        headers: { "User-Agent": "Mozilla/5.0 (compatible; DeckSmithBot/1.0)" },
        signal: AbortSignal.timeout(10000),
      });
      if (htmlRes.ok) {
        const html = await htmlRes.text();
        brandingFromHtml = extractBrandingFromHtml(html, baseUrl);
        const css = await extractCssFromHtml(html, baseUrl);
        if (css.trim()) cssColors = extractColorsFromCss(css);
        const imageUrls = [brandingFromHtml.favicon, brandingFromHtml.ogImage].filter(Boolean) as string[];
        for (const imgUrl of imageUrls.slice(0, 2)) {
          const palette = await extractPaletteFromImage(imgUrl);
          imagePalette.push(...palette);
        }
        imagePalette = [...new Set(imagePalette)];
      }
    } catch {
      // ignore
    }

    const firstResult = contentsFromUrl.results?.[0] as { favicon?: string } | undefined;
    const logoUrl = brandingFromHtml.favicon ?? brandingFromHtml.ogImage ?? firstResult?.favicon;

    const theme = await inferThemeFromBranding(
      openai,
      brandingFromHtml,
      websiteSummary,
      env.OPENAI_MODEL ?? "gpt-4o",
      { cssColors, imagePalette }
    );
    const brand = {
      primaryColor: theme.primaryColor,
      secondaryColor: theme.secondaryColor,
      accentColor: theme.accentColor,
      logoUrl: logoUrl ?? theme.logoUrl,
    };

    const response: Record<string, unknown> = {
      websiteSummary,
      companyStory: companyStory || websiteSummary,
      slideCopy: slideCopy.length > 0 ? slideCopy : undefined,
      url,
      brand,
      _slideCopySource: slideCopy.length > 0 ? "gpt" : "parse_failed",
    };
    if (debugMode) {
      response._debugGptRaw = slideCopyRaw;
      response._debugCombinedLength = combined.length;
      response._debugCombinedPreview = combined.slice(0, 5000);
      response._debugParsedSlides = slideCopy.slice(0, 3).map((s) => ({ type: s.type, layout: s.layout, headline: s.headline, bullets: s.bullets, metrics: s.metrics }));
    }
    return NextResponse.json(response);
  } catch (e) {
    console.error("URL ingest error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "URL ingestion failed" },
      { status: 500 }
    );
  }
}
