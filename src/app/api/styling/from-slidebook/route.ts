import { NextResponse } from "next/server";
import Exa from "exa-js";
import OpenAI from "openai";
import { env } from "@/lib/env";
import { inferThemeFromSlidebookContent } from "@/lib/styling-bot";

/**
 * GET or POST /api/styling/from-slidebook
 * Uses Exa to search slidebook.io for pitch deck examples, then LLM to infer
 * a professional deck theme (colors, font). Use when no website URL is given.
 */
export async function POST() {
  try {
    const exaApiKey = env.EXA_API_KEY;
    const openaiKey = env.OPENAI_API_KEY;
    if (!exaApiKey || !openaiKey) {
      return NextResponse.json(
        { error: "EXA_API_KEY and OPENAI_API_KEY required" },
        { status: 503 }
      );
    }

    const exa = new Exa(exaApiKey);
    const openai = new OpenAI({ apiKey: openaiKey });
    const model = env.OPENAI_MODEL ?? "gpt-4o";

    // Search Slidebook for startup / investor pitch deck examples
    const queries = [
      "site:slidebook.io startup pitch deck",
      "site:slidebook.io investor deck",
      "site:slidebook.io pitch deck design",
    ];

    const searchResults = await Promise.all(
      queries.map((q) =>
        exa.searchAndContents(q, {
          numResults: 3,
          text: { maxCharacters: 3000 },
          contents: { text: true },
        })
      )
    );

    const excerpts: string[] = [];
    const seen = new Set<string>();
    for (const res of searchResults) {
      for (const r of res.results ?? []) {
        if (r.text && !seen.has(r.url)) {
          seen.add(r.url);
          excerpts.push(`[From ${r.url}]\n${(r as { title?: string }).title ?? ""}\n${r.text}`);
        }
      }
    }

    if (excerpts.length === 0) {
      // Fallback: use a short description so LLM still returns a good default theme
      excerpts.push(
        "High-quality investor pitch decks from Slidebook: typically use clean layouts, strong typography, limited color palettes (e.g. navy, gray, one accent), and professional visuals."
      );
    }

    const theme = await inferThemeFromSlidebookContent(openai, excerpts, model);
    return NextResponse.json({ theme });
  } catch (e) {
    console.error("Slidebook styling error:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Styling from Slidebook failed" },
      { status: 500 }
    );
  }
}
