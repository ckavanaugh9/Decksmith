"use client";

import type { SlideData } from "@/lib/types";
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
  editable?: boolean;
  onSlideChange?: (slide: SlideData) => void;
}

export function SlideRenderer({ slide, editable, onSlideChange }: SlideRendererProps) {
  const update = (patch: Partial<SlideData>) =>
    onSlideChange?.({ ...slide, ...patch });

  const common = {
    slide,
    editable,
    onHeadlineChange: (v: string) => update({ headline: v }),
    onSubheadlineChange: (v: string) => update({ subheadline: v }),
    onBulletsChange: (bullets: string[]) => update({ bullets }),
    onMetricsChange: (metrics: { label: string; value: string }[]) => update({ metrics }),
    onTimelineChange: (timeline: { label: string; description: string }[]) => update({ timeline }),
    onTeamChange: (team: { name: string; role: string; bio?: string }[]) => update({ team }),
    onMatrixChange: (matrix: { name: string; values: string[] }[]) => update({ matrix }),
  };

  switch (slide.layout) {
    case "L1":
      return <L1BigHeadline {...common} />;
    case "L2":
      return <L2TwoColumn {...common} />;
    case "L3":
      return <L3FeatureCards {...common} />;
    case "L4":
      return <L4MetricsGrid {...common} />;
    case "L5":
      return <L5Timeline {...common} />;
    case "L6":
      return <L6TeamCards {...common} />;
    case "L7":
      return <L7MarketBlocks {...common} />;
    case "L8":
      return <L8CompetitiveMatrix {...common} />;
    case "L9":
      return <L9FullBleed {...common} />;
    case "L10":
      return <L10Ask {...common} />;
    default:
      return <L1BigHeadline {...common} />;
  }
}
