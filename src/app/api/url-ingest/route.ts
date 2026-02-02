import { NextRequest, NextResponse } from "next/server";
import Exa from "exa-js";
import OpenAI from "openai";
import { env } from "@/lib/env";

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

    // 4) Extract brand: favicon from first result + LLM-suggested colors from summary
    const firstResult = contentsFromUrl.results?.[0] as { favicon?: string } | undefined;
    const logoUrl = firstResult?.favicon ?? undefined;

    const brandPrompt = `Given this company summary, suggest a professional pitch deck color scheme (hex). Return valid JSON only: { "primaryColor": "#hex", "secondaryColor": "#hex", "accentColor": "#hex" }. Use modern, distinctive colors that fit the company.\n\nSummary:\n${websiteSummary.slice(0, 500)}`;

    const brandCompletion = await openai.chat.completions.create({
      model: env.OPENAI_MODEL ?? "gpt-4o",
      messages: [
        { role: "system", content: "You suggest professional hex colors for pitch decks. Output only valid JSON." },
        { role: "user", content: brandPrompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0.5,
    });

    const brandRaw = brandCompletion.choices[0]?.message?.content ?? "{}";
    let brand: { primaryColor: string; secondaryColor: string; accentColor: string };
    try {
      const parsed = JSON.parse(brandRaw) as Record<string, string>;
      brand = {
        primaryColor: parsed.primaryColor?.startsWith("#") ? parsed.primaryColor : "#0f172a",
        secondaryColor: parsed.secondaryColor?.startsWith("#") ? parsed.secondaryColor : "#64748b",
        accentColor: parsed.accentColor?.startsWith("#") ? parsed.accentColor : "#0ea5e9",
      };
    } catch {
      brand = { primaryColor: "#0f172a", secondaryColor: "#64748b", accentColor: "#0ea5e9" };
    }

    return NextResponse.json({
      websiteSummary,
      url,
      brand: { ...brand, logoUrl },
    });
  } catch (e) {
    console.error("URL ingest error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "URL ingestion failed" },
      { status: 500 }
    );
  }
}
