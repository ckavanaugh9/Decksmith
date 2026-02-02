import type { DeckTheme } from "./types";

/** Parse hex (#rgb or #rrggbb) to 0–255 RGB. */
function hexToRgb(hex: string): [number, number, number] | null {
  const m = hex.replace(/^#/, "").match(/^([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i)
    ?? hex.replace(/^#/, "").match(/^([0-9a-f])([0-9a-f])([0-9a-f])$/i)?.map((g) => g + g);
  if (!m) return null;
  return [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)];
}

/** Relative luminance (0–1). WCAG: L = 0.2126*R + 0.7152*G + 0.0722*B (linearized). */
function luminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    const x = c / 255;
    return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/** Contrast ratio (1–21). */
function contrastRatio(l1: number, l2: number): number {
  const [a, b] = l1 >= l2 ? [l1, l2] : [l2, l1];
  return (a + 0.05) / (b + 0.05);
}

/** Return a text color that meets min contrast (e.g. 4.5) on the given background hex. */
export function getContrastingTextColor(backgroundColor: string, minRatio = 4.5): string {
  const rgb = hexToRgb(backgroundColor);
  if (!rgb) return "#1f2937";
  const lBg = luminance(rgb[0], rgb[1], rgb[2]);
  const dark = "#1f2937";
  const light = "#f9fafb";
  const [rD, gD, bD] = hexToRgb(dark)!;
  const [rL, gL, bL] = hexToRgb(light)!;
  const lDark = luminance(rD, gD, bD);
  const lLight = luminance(rL, gL, bL);
  const onDark = contrastRatio(lBg, lDark);
  const onLight = contrastRatio(lBg, lLight);
  if (lBg >= 0.5) return onDark >= minRatio ? dark : "#0f172a";
  return onLight >= minRatio ? light : "#ffffff";
}

/** Approximate card tint: mix accent 8% with white (srgb). Returns hex. */
export function getCardTintHex(accentHex: string): string {
  const rgb = hexToRgb(accentHex);
  if (!rgb) return "#f8fafc";
  const r = Math.round(0.92 * 255 + 0.08 * rgb[0]);
  const g = Math.round(0.92 * 255 + 0.08 * rgb[1]);
  const b = Math.round(0.92 * 255 + 0.08 * rgb[2]);
  const toHex = (n: number) => Math.max(0, Math.min(255, n)).toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export const DEFAULT_THEME: DeckTheme = {
  primaryColor: "#0f172a",
  secondaryColor: "#64748b",
  accentColor: "#0ea5e9",
  fontFamily: "Inter",
};

export function parseTheme(theme: unknown): DeckTheme {
  if (theme && typeof theme === "object" && "primaryColor" in theme && "accentColor" in theme) {
    const t = theme as Record<string, unknown>;
    return {
      primaryColor: typeof t.primaryColor === "string" ? t.primaryColor : DEFAULT_THEME.primaryColor,
      secondaryColor: typeof t.secondaryColor === "string" ? t.secondaryColor : DEFAULT_THEME.secondaryColor,
      accentColor: typeof t.accentColor === "string" ? t.accentColor : DEFAULT_THEME.accentColor,
      fontFamily: typeof t.fontFamily === "string" ? t.fontFamily : DEFAULT_THEME.fontFamily,
      logoUrl: typeof t.logoUrl === "string" ? t.logoUrl : undefined,
    };
  }
  return DEFAULT_THEME;
}
