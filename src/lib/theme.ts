import type { DeckTheme } from "./types";

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
