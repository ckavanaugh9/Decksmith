/**
 * Intelligent styling bot: extract branding from a website or infer from Slidebook examples.
 * Used when URL is given (scrape branding) or when no URL (style from slidebook.io).
 * Includes: meta tags, CSS/token extraction, image color analysis, dark/light + accent inference.
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

/** Extended style context: CSS colors + image palette for LLM theme inference */
export interface StyleContext {
  branding: BrandingFromHtml;
  cssColors: string[];
  imagePalette: string[];
}

/** Extract content from first matching meta/link tag. */
function firstMatch(html: string, regex: RegExp): string | undefined {
  const m = html.match(regex);
  return m?.[1]?.trim();
}

/** Extract all capture-group matches (for multiple link hrefs, etc.). */
function getAllMatches(html: string, regex: RegExp): string[] {
  const out: string[] = [];
  let m: RegExpExecArray | null;
  const re = new RegExp(regex.source, regex.flags + "g");
  while ((m = re.exec(html)) !== null) if (m[1]) out.push(m[1].trim());
  return [...new Set(out)];
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

/** Collect CSS from inline <style> and linked stylesheets (fetched). */
export async function extractCssFromHtml(html: string, baseUrl: string): Promise<string> {
  const chunks: string[] = [];
  const inlineRegex = /<style[^>]*>([\s\S]*?)<\/style>/gi;
  let m: RegExpExecArray | null;
  while ((m = inlineRegex.exec(html)) !== null) if (m[1]) chunks.push(m[1].trim());
  const linkHrefs = getAllMatches(
    html,
    /<link[^>]*rel\s*=\s*["']stylesheet["'][^>]*href\s*=\s*["']([^"']+)["']/i
  ).concat(
    getAllMatches(html, /<link[^>]*href\s*=\s*["']([^"']+)["'][^>]*rel\s*=\s*["']stylesheet["']/i)
  );
  for (const href of linkHrefs.slice(0, 12)) {
    try {
      const fullUrl = resolveUrl(href, baseUrl);
      const res = await fetch(fullUrl, {
        headers: { "User-Agent": "Mozilla/5.0 (compatible; DeckSmithBot/1.0)" },
        signal: AbortSignal.timeout(5000),
      });
      if (res.ok) chunks.push(await res.text());
    } catch {
      // Skip failed stylesheet
    }
  }
  return chunks.join("\n");
}

/** Normalize rgb(r,g,b) or rgb(r g b) to hex. */
function rgbToHex(r: number, g: number, b: number): string {
  const hex = (n: number) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, "0");
  return `#${hex(r)}${hex(g)}${hex(b)}`;
}

/** Extract color values from CSS (hex, rgb, rgba, hsl, hsla, --var: value). Returns unique hex strings. */
export function extractColorsFromCss(css: string): string[] {
  const hexSet = new Set<string>();
  const addHex = (hex: string) => {
    let h = hex.startsWith("#") ? hex : `#${hex}`;
    if (h.length === 4) h = `#${h[1]}${h[1]}${h[2]}${h[2]}${h[3]}${h[3]}`;
    if (/^#[0-9a-fA-F]{6}$/.test(h)) hexSet.add(h.toLowerCase());
  };
  const hexRe = /#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})(?![0-9a-fA-F])/g;
  let match: RegExpExecArray | null;
  while ((match = hexRe.exec(css)) !== null) addHex(match[0]);
  const rgbRe = /rgba?\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*[\d.]+)?\s*\)/g;
  while ((match = rgbRe.exec(css)) !== null) hexSet.add(rgbToHex(Number(match[1]), Number(match[2]), Number(match[3])).toLowerCase());
  const rgbSpaceRe = /rgba?\s*\(\s*(\d+)\s+(\d+)\s+(\d+)(?:\s*\/\s*[\d.]+)?\s*\)/g;
  while ((match = rgbSpaceRe.exec(css)) !== null) hexSet.add(rgbToHex(Number(match[1]), Number(match[2]), Number(match[3])).toLowerCase());
  const hslRe = /hsla?\s*\(\s*(\d+)\s*,\s*(\d+)%\s*,\s*(\d+)%(?:\s*,\s*[\d.]+)?\s*\)/g;
  while ((match = hslRe.exec(css)) !== null) {
    const h = Number(match[1]) / 360;
    const s = Number(match[2]) / 100;
    const l = Number(match[3]) / 100;
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };
    const r = hue2rgb(p, q, h + 1 / 3) * 255;
    const g = hue2rgb(p, q, h) * 255;
    const b = hue2rgb(p, q, h - 1 / 3) * 255;
    hexSet.add(rgbToHex(r, g, b).toLowerCase());
  }
  const varColorRe = /--[a-zA-Z0-9-]+\s*:\s*(#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})|rgba?\([^)]+\)|hsla?\([^)]+\))/g;
  while ((match = varColorRe.exec(css)) !== null) {
    const val = match[1];
    if (val.startsWith("#")) addHex(val);
    else if (val.startsWith("rgb")) {
      const m2 = val.match(/rgba?\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
      if (m2) hexSet.add(rgbToHex(Number(m2[1]), Number(m2[2]), Number(m2[3])).toLowerCase());
    }
  }
  return [...hexSet];
}

/** Extract dominant colors from an image URL (favicon, og:image). Returns hex strings. */
export async function extractPaletteFromImage(imageUrl: string): Promise<string[]> {
  try {
    const res = await fetch(imageUrl, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; DeckSmithBot/1.0)" },
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) return [];
    const contentType = res.headers.get("content-type")?.split(";")[0]?.trim() || "image/png";
    const buffer = Buffer.from(await res.arrayBuffer());
    const getColors = (await import("get-image-colors")).default;
    const colors = await getColors(buffer, { count: 6, type: contentType });
    return (colors || []).map((c: { hex: () => string }) => c.hex()).filter(Boolean);
  } catch {
    return [];
  }
}

const THEME_JSON_SCHEMA = `Return valid JSON only, no markdown: { "isDarkTheme": boolean, "primaryColor": "#hex", "secondaryColor": "#hex", "accentColor": "#hex", "fontFamily": "optional string", "logoUrl": "optional string" }`;

/** Infer a full DeckTheme from scraped branding, CSS colors, image palette, and optional company summary (LLM). */
export async function inferThemeFromBranding(
  openai: import("openai").OpenAI,
  branding: BrandingFromHtml,
  companySummary?: string,
  model = "gpt-4o",
  options?: { cssColors?: string[]; imagePalette?: string[] }
): Promise<DeckTheme> {
  const parts: string[] = [];
  if (branding.themeColor) parts.push(`Theme color (meta): ${branding.themeColor}`);
  if (branding.ogImage) parts.push(`OG image URL: ${branding.ogImage}`);
  if (branding.favicon) parts.push(`Favicon URL: ${branding.favicon}`);
  if (branding.title) parts.push(`Site title: ${branding.title}`);
  if (branding.description) parts.push(`Meta description: ${branding.description}`);
  if (options?.cssColors?.length) parts.push(`Colors from site CSS (hex): ${options.cssColors.slice(0, 40).join(", ")}`);
  if (options?.imagePalette?.length) parts.push(`Dominant colors from site images (favicon/og): ${options.imagePalette.join(", ")}`);
  if (companySummary) parts.push(`Company summary:\n${companySummary.slice(0, 500)}`);

  const prompt = `Infer the website's visual style and map it to a pitch-deck theme.

1) Determine if the site is DARK or LIGHT: use CSS colors and image palette. Dark sites often have very dark backgrounds (#0a0a0a, #111, #1a1a1a, etc.) and light text; light sites have light backgrounds (#fff, #f8fafc) and dark text.
2) Choose primaryColor, secondaryColor, accentColor from the site's actual palette:
   - For DARK sites: set primaryColor to the site's dark background, secondaryColor to the site's light text color, accentColor to the site's main accent (e.g. red, blue, green from CSS or images).
   - For LIGHT sites: set primaryColor to the site's main dark text/header color, secondaryColor to muted gray, accentColor to the site's accent.
3) Prefer colors that appear in "Colors from site CSS" and "Dominant colors from site images" over generic guesses. If the site uses a strong accent (e.g. red), use that as accentColor.

${THEME_JSON_SCHEMA}

Data from the site:
${parts.join("\n")}`;

  const completion = await openai.chat.completions.create({
    model,
    messages: [
      { role: "system", content: "You infer brand theme (dark/light) and exact hex colors for pitch decks from website data. Output only valid JSON with isDarkTheme, primaryColor, secondaryColor, accentColor, optional fontFamily and logoUrl." },
      { role: "user", content: prompt },
    ],
    response_format: { type: "json_object" },
    temperature: 0.3,
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
