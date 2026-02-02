"use client";

import type { DeckTheme, SlideData } from "@/lib/types";
import { SlideThemeWrapper } from "./SlideThemeWrapper";
import { L1BigHeadline } from "./L1-BigHeadline";
import { L2TwoColumn } from "./L2-TwoColumn";
import { L3FeatureCards } from "./L3-FeatureCards";
import { L4MetricsGrid } from "./L4-MetricsGrid";
import { L5Timeline } from "./L5-Timeline";
import { L6TeamCards } from "./L6-TeamCards";
import { L7MarketBlocks } from "./L7-MarketBlocks";
import { L8CompetitiveMatrix } from "./L8-CompetitiveMatrix";
import { L9FullBleed } from "./L9-FullBleed";
import { L10Ask } from "./L10-Ask";

export interface SlideRendererProps {
  slide: SlideData;
  theme?: DeckTheme | null;
  editable?: boolean;
  onSlideChange?: (slide: SlideData) => void;
}

export function SlideRenderer({ slide, theme, editable, onSlideChange }: SlideRendererProps) {
  const update = (patch: Partial<SlideData>) =>
    onSlideChange?.({ ...slide, ...patch });

  const common = {
    slide,
    theme,
    editable,
    onHeadlineChange: (v: string) => update({ headline: v }),
    onSubheadlineChange: (v: string) => update({ subheadline: v }),
    onBulletsChange: (bullets: string[]) => update({ bullets }),
    onMetricsChange: (metrics: { label: string; value: string }[]) => update({ metrics }),
    onTimelineChange: (timeline: { label: string; description: string }[]) => update({ timeline }),
    onTeamChange: (team: { name: string; role: string; bio?: string }[]) => update({ team }),
    onMatrixChange: (matrix: { name: string; values: string[] }[]) => update({ matrix }),
  };

  let content;
  switch (slide.layout) {
    case "L1":
      content = <L1BigHeadline {...common} />;
      break;
    case "L2":
      content = <L2TwoColumn {...common} />;
      break;
    case "L3":
      content = <L3FeatureCards {...common} />;
      break;
    case "L4":
      content = <L4MetricsGrid {...common} />;
      break;
    case "L5":
      content = <L5Timeline {...common} />;
      break;
    case "L6":
      content = <L6TeamCards {...common} />;
      break;
    case "L7":
      content = <L7MarketBlocks {...common} />;
      break;
    case "L8":
      content = <L8CompetitiveMatrix {...common} />;
      break;
    case "L9":
      content = <L9FullBleed {...common} />;
      break;
    case "L10":
      content = <L10Ask {...common} />;
      break;
    default:
      content = <L1BigHeadline {...common} />;
  }

  return <SlideThemeWrapper theme={theme}>{content}</SlideThemeWrapper>;
}
