import { NextRequest, NextResponse } from "next/server";
import Exa from "exa-js";
import OpenAI from "openai";
import { env } from "@/lib/env";
import {
  extractBrandingFromHtml,
  extractColorsFromCss,
  extractCssFromHtml,
  extractPaletteFromImage,
  inferThemeFromBranding,
} from "@/lib/styling-bot";

const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });

/**
 * Ingest startup website: use Exa to get content from homepage, about, product, pricing.
 * Then summarize into structured text for the Deck Architect.
 */
export async function POST(request: NextRequest) {
  try {
    const { url } = (await request.json()) as { url: string };
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

    // Get base domain for filtering
    let baseUrl: string;
    try {
      const u = new URL(url);
      baseUrl = u.origin;
    } catch {
      return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
    }

    // 1) Get contents from the given URL (homepage)
    const contentsFromUrl = await exa.getContents([url], {
      text: { maxCharacters: 8000 },
    });

    // 2) Search for about/product/pricing on same domain to get more URLs
    const searchQueries = [
      `site:${baseUrl} about`,
      `site:${baseUrl} product`,
      `site:${baseUrl} pricing`,
    ];
    const searchResults = await Promise.all(
      searchQueries.map((q) =>
        exa.searchAndContents(q, {
          numResults: 2,
          text: { maxCharacters: 4000 },
          contents: { text: true },
        })
      )
    );

    const textChunks: string[] = [];
    for (const c of contentsFromUrl.results ?? []) {
      if (c.text) textChunks.push(`[From ${c.url}]\n${c.text}`);
    }
    for (const res of searchResults) {
      for (const r of res.results ?? []) {
        if (r.text && !textChunks.some((t) => t.includes(r.url))) {
          textChunks.push(`[From ${r.url}]\n${r.text}`);
        }
      }
    }

    const combined = textChunks.slice(0, 6).join("\n\n---\n\n");
    if (!combined.trim()) {
      return NextResponse.json(
        { error: "No content could be extracted from URL" },
        { status: 422 }
      );
    }

    // 3) Summarize with LLM into structured startup summary for Deck Architect
    const summaryPrompt = `Extract and summarize the following startup website content into a concise summary suitable for generating an investor pitch deck. Include: value proposition, product description, target customer, key benefits, and any visible metrics. Keep it under 800 words.\n\n${combined}`;

    const completion = await openai.chat.completions.create({
      model: env.OPENAI_MODEL ?? "gpt-4o",
      messages: [
        {
          role: "system",
          content:
            "You extract key startup information from website content. Output only the summary text, no JSON.",
        },
        { role: "user", content: summaryPrompt },
      ],
      temperature: 0.4,
    });

    const websiteSummary = completion.choices[0]?.message?.content?.trim() ?? "";

    // 4) Styling bot: fetch HTML, extract branding + CSS colors + image palette, then LLM to infer theme (dark/light + accents)
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
      // Ignore fetch/parse errors
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

    return NextResponse.json({
      websiteSummary,
      url,
      brand,
    });
  } catch (e) {
    console.error("URL ingest error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "URL ingestion failed" },
      { status: 500 }
    );
  }
}
