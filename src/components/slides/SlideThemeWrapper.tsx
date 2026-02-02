"use client";

import type { DeckTheme } from "@/lib/types";
import { DEFAULT_THEME } from "@/lib/theme";

interface Props {
  theme?: DeckTheme | null;
  children: React.ReactNode;
  className?: string;
}

export function SlideThemeWrapper({ theme, children, className = "" }: Props) {
  const t = theme ?? DEFAULT_THEME;
  const cssVars = {
    ["--deck-primary"]: t.primaryColor,
    ["--deck-secondary"]: t.secondaryColor,
    ["--deck-accent"]: t.accentColor,
  } as React.CSSProperties;

  return (
    <div className={className} style={cssVars}>
      {children}
    </div>
  );
}
