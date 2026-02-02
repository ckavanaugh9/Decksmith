/**
 * DeckSmith AI — shared types for deck structure, slides, and API.
 * Matches PRD: 10–12 slide investor deck, layout IDs L1–L10.
 */

export type LayoutId =
  | "L1"  // Big headline + subtext
  | "L2"  // Two-column problem breakdown
  | "L3"  // 3 feature cards
  | "L4"  // Metrics grid
  | "L5"  // Timeline / roadmap
  | "L6"  // Team member cards
  | "L7"  // Market size stacked blocks
  | "L8"  // Competitive matrix
  | "L9"  // Full-bleed statement slide
  | "L10"; // Fundraising / Ask slide

export type SlideType =
  | "title"
  | "problem"
  | "solution"
  | "product"
  | "market"
  | "traction"
  | "business_model"
  | "competition"
  | "gtm"
  | "team"
  | "vision"
  | "ask";

export interface SlideData {
  type: SlideType;
  layout: LayoutId;
  headline: string;
  subheadline?: string;
  bullets?: string[];
  /** For L4/L7: key-value metrics */
  metrics?: { label: string; value: string }[];
  /** For L5: timeline items */
  timeline?: { label: string; description: string }[];
  /** For L6: team members */
  team?: { name: string; role: string; bio?: string }[];
  /** For L8: rows for competitive matrix */
  matrix?: { name: string; values: string[] }[];
  /** Optional image URL (future) */
  imageUrl?: string;
}

export interface DeckArchitectOutput {
  slides: SlideData[];
}

export interface GenerateDeckInput {
  /** Natural language startup description */
  description: string;
  industry?: string;
  stage?: string;
  targetCustomer?: string;
  /** If provided, URL content will be fetched and merged into context */
  websiteUrl?: string;
  slideCount?: number;
}

export interface RegenerateSlideInput {
  slideIndex: number;
  slide: SlideData;
  deckContext: string;
  mode: "full" | "headline" | "bullets";
}
