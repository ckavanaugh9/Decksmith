"use client";

import type { DeckTheme } from "@/lib/types";
import { DEFAULT_THEME, getCardTintHex, getContrastingTextColor } from "@/lib/theme";

interface Props {
  theme?: DeckTheme | null;
  children: React.ReactNode;
  className?: string;
}

export function SlideThemeWrapper({ theme, children, className = "" }: Props) {
  const t = theme ?? DEFAULT_THEME;
  const cardTint = getCardTintHex(t.accentColor);
  const onTint = getContrastingTextColor(cardTint, 4.5);
  const onPrimary = getContrastingTextColor(t.primaryColor, 4.5);
  const cssVars = {
    ["--deck-primary"]: t.primaryColor,
    ["--deck-secondary"]: t.secondaryColor,
    ["--deck-accent"]: t.accentColor,
    ["--deck-on-tint"]: onTint,
    ["--deck-on-primary"]: onPrimary,
  } as React.CSSProperties;

  return (
    <div className={className} style={cssVars}>
      {children}
    </div>
  );
}
