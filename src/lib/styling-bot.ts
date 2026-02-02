/**
 * Intelligent styling bot: extract branding from a website or infer from Slidebook examples.
 * Used when URL is given (scrape branding) or when no URL (style from slidebook.io).
 * Uses regex-based extraction (no cheerio) so the module resolves reliably in Next.js.
 */

import type { DeckTheme } from "./types";
import { DEFAULT_THEME } from "./theme";

export interface BrandingFromHtml {
  themeColor?: string;
  favicon?: string;
  ogImage?: string;
  title?: string;
  description?: string;
}

/** Extract content from first matching meta/link tag. */
function firstMatch(html: string, regex: RegExp): string | undefined {
  const m = html.match(regex);
  return m?.[1]?.trim();
}

/** Parse HTML string for branding hints: theme-color, favicon, og:image (no external deps). */
export function extractBrandingFromHtml(html: string, baseUrl: string): BrandingFromHtml {
  const result: BrandingFromHtml = {};
  try {
    const themeColor = firstMatch(
      html,
      /<meta[^>]*name\s*=\s*["']theme-color["'][^>]*content\s*=\s*["']([^"']+)["']/i
    ) ?? firstMatch(html, /<meta[^>]*content\s*=\s*["']([^"']+)["'][^>]*name\s*=\s*["']theme-color["']/i);
    if (themeColor) result.themeColor = themeColor;

    const ogImage = firstMatch(
      html,
      /<meta[^>]*property\s*=\s*["']og:image["'][^>]*content\s*=\s*["']([^"']+)["']/i
    ) ?? firstMatch(html, /<meta[^>]*content\s*=\s*["']([^"']+)["'][^>]*property\s*=\s*["']og:image["']/i);
    if (ogImage) result.ogImage = resolveUrl(ogImage, baseUrl);

    const favicon =
      firstMatch(html, /<link[^>]*rel\s*=\s*["'](?:shortcut\s+)?icon["'][^>]*href\s*=\s*["']([^"']+)["']/i) ??
      firstMatch(html, /<link[^>]*href\s*=\s*["']([^"']+)["'][^>]*rel\s*=\s*["'](?:shortcut\s+)?icon["']/i) ??
      firstMatch(html, /<link[^>]*rel\s*=\s*["']apple-touch-icon["'][^>]*href\s*=\s*["']([^"']+)["']/i) ??
      firstMatch(html, /<link[^>]*href\s*=\s*["']([^"']+)["'][^>]*rel\s*=\s*["']apple-touch-icon["']/i);
    if (favicon) result.favicon = resolveUrl(favicon, baseUrl);

    const title = firstMatch(html, /<title[^>]*>([\s\S]*?)<\/title>/i);
    if (title) result.title = title.replace(/\s+/g, " ").trim();

    const desc =
      firstMatch(html, /<meta[^>]*name\s*=\s*["']description["'][^>]*content\s*=\s*["']([^"']+)["']/i) ??
      firstMatch(html, /<meta[^>]*content\s*=\s*["']([^"']+)["'][^>]*name\s*=\s*["']description["']/i) ??
      firstMatch(html, /<meta[^>]*property\s*=\s*["']og:description["'][^>]*content\s*=\s*["']([^"']+)["']/i) ??
      firstMatch(html, /<meta[^>]*content\s*=\s*["']([^"']+)["'][^>]*property\s*=\s*["']og:description["']/i);
    if (desc) result.description = desc;
  } catch {
    // Ignore parse errors
  }
  return result;
}

function resolveUrl(href: string, baseUrl: string): string {
  if (href.startsWith("http")) return href;
  try {
    return new URL(href, baseUrl).href;
  } catch {
    return href;
  }
}

const THEME_JSON_SCHEMA = `Return valid JSON only, no markdown: { "primaryColor": "#hex", "secondaryColor": "#hex", "accentColor": "#hex", "fontFamily": "optional string", "logoUrl": "optional string" }`;

/** Infer a full DeckTheme from scraped branding + optional company summary (LLM). */
export async function inferThemeFromBranding(
  openai: import("openai").OpenAI,
  branding: BrandingFromHtml,
  companySummary?: string,
  model = "gpt-4o"
): Promise<DeckTheme> {
  const parts: string[] = [];
  if (branding.themeColor) parts.push(`Theme color (from site): ${branding.themeColor}`);
  if (branding.ogImage) parts.push(`OG image (logo/card): ${branding.ogImage}`);
  if (branding.favicon) parts.push(`Favicon: ${branding.favicon}`);
  if (branding.title) parts.push(`Site title: ${branding.title}`);
  if (branding.description) parts.push(`Meta description: ${branding.description}`);
  if (companySummary) parts.push(`Company summary:\n${companySummary.slice(0, 600)}`);

  const prompt = `Extract a pitch-deck color scheme and style from this website's branding. Use the theme-color as primary or accent if provided. Suggest secondary and accent that work together. Prefer modern, distinctive hex colors. ${THEME_JSON_SCHEMA}\n\n${parts.join("\n")}`;

  const completion = await openai.chat.completions.create({
    model,
    messages: [
      { role: "system", content: "You extract brand colors and style for pitch decks. Output only valid JSON." },
      { role: "user", content: prompt },
    ],
    response_format: { type: "json_object" },
    temperature: 0.4,
  });

  const raw = completion.choices[0]?.message?.content ?? "{}";
  return parseThemeFromJson(raw, branding.favicon ?? branding.ogImage);
}

/** Infer DeckTheme from Slidebook-style content (no URL flow). */
export async function inferThemeFromSlidebookContent(
  openai: import("openai").OpenAI,
  slidebookExcerpts: string[],
  model = "gpt-4o"
): Promise<DeckTheme> {
  const combined = slidebookExcerpts.slice(0, 5).join("\n\n---\n\n");
  const prompt = `Below are excerpts from high-quality investor pitch decks curated on Slidebook (slidebook.io). Infer a professional, modern color scheme and style that would suit a VC pitch deck. Use colors that feel premium and startup-appropriate (e.g. deep navy, clean grays, one accent). ${THEME_JSON_SCHEMA}\n\nSlidebook deck excerpts:\n${combined.slice(0, 4000)}`;

  const completion = await openai.chat.completions.create({
    model,
    messages: [
      { role: "system", content: "You suggest professional pitch deck styling from examples. Output only valid JSON." },
      { role: "user", content: prompt },
    ],
    response_format: { type: "json_object" },
    temperature: 0.5,
  });

  const raw = completion.choices[0]?.message?.content ?? "{}";
  return parseThemeFromJson(raw);
}

function parseThemeFromJson(raw: string, defaultLogoUrl?: string): DeckTheme {
  try {
    const o = JSON.parse(raw) as Record<string, unknown>;
    const primary = o.primaryColor && typeof o.primaryColor === "string" && o.primaryColor.startsWith("#") ? o.primaryColor : DEFAULT_THEME.primaryColor;
    const secondary = o.secondaryColor && typeof o.secondaryColor === "string" && o.secondaryColor.startsWith("#") ? o.secondaryColor : DEFAULT_THEME.secondaryColor;
    const accent = o.accentColor && typeof o.accentColor === "string" && o.accentColor.startsWith("#") ? o.accentColor : DEFAULT_THEME.accentColor;
    const fontFamily = typeof o.fontFamily === "string" ? o.fontFamily : DEFAULT_THEME.fontFamily;
    const logoUrl = typeof o.logoUrl === "string" ? o.logoUrl : defaultLogoUrl;
    return { primaryColor: primary, secondaryColor: secondary, accentColor: accent, fontFamily, logoUrl };
  } catch {
    return { ...DEFAULT_THEME, logoUrl: defaultLogoUrl };
  }
}
