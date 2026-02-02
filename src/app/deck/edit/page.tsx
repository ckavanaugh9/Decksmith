"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import type { DeckTheme, SlideData } from "@/lib/types";
import { DEFAULT_THEME } from "@/lib/theme";

const SlideRenderer = dynamic(
  () => import("@/components/slides/SlideRenderer").then((m) => ({ default: m.SlideRenderer })),
  { ssr: false, loading: () => <div className="slide-canvas rounded-xl border border-slate-200 bg-white animate-pulse min-h-[320px]" /> }
);

type DeckState = { slides: SlideData[]; title: string; theme?: DeckTheme };

export default function DeckEditPage() {
  const [deck, setDeck] = useState<DeckState | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [regenerating, setRegenerating] = useState(false);
  const [exporting, setExporting] = useState<"pdf" | "pptx" | null>(null);
  const [showThemeEditor, setShowThemeEditor] = useState(false);

  useEffect(() => {
    const raw = typeof window !== "undefined" ? sessionStorage.getItem("decksmith_current_deck") : null;
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as DeckState;
        if (!parsed.theme) parsed.theme = DEFAULT_THEME;
        setDeck(parsed);
      } catch {
        setDeck(null);
      }
    } else {
      setDeck(null);
    }
  }, []);

  const persistDeck = useCallback((next: DeckState) => {
    setDeck(next);
    if (typeof window !== "undefined") {
      sessionStorage.setItem("decksmith_current_deck", JSON.stringify(next));
    }
  }, []);

  const updateSlide = useCallback(
    (index: number, slide: SlideData) => {
      if (!deck) return;
      const slides = [...deck.slides];
      slides[index] = slide;
      persistDeck({ ...deck, slides, theme: deck.theme ?? DEFAULT_THEME });
    },
    [deck, persistDeck]
  );

  async function regenerateSlide(mode: "full" | "headline" | "bullets") {
    if (!deck) return;
    setRegenerating(true);
    try {
      const slide = deck.slides[currentIndex];
      const deckContext = deck.slides.map((s) => s.headline).join(". ");
      const res = await fetch("/api/deck/regenerate-slide", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slideIndex: currentIndex,
          slide,
          deckContext,
          mode,
        }),
      });
      if (!res.ok) throw new Error("Regeneration failed");
      const { slide: updated } = await res.json();
      updateSlide(currentIndex, updated);
    } catch (e) {
      console.error(e);
    } finally {
      setRegenerating(false);
    }
  }

  async function exportDeck(format: "pdf" | "pptx") {
    if (!deck) return;
    setExporting(format);
    try {
      const res = await fetch(`/api/export/${format}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slides: deck.slides, title: deck.title }),
      });
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${deck.title}.${format}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
    } finally {
      setExporting(null);
    }
  }

  if (!deck) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6">
        <p className="text-deck-muted">No deck in progress. Create one first.</p>
        <Link href="/create" className="mt-4 text-deck-accent font-medium hover:underline">
          Create deck
        </Link>
      </div>
    );
  }

  const slide = deck.slides[currentIndex];
  const theme = deck.theme ?? DEFAULT_THEME;

  function updateTheme(patch: Partial<DeckTheme>) {
    if (!deck) return;
    const nextTheme = { ...theme, ...patch };
    persistDeck({ ...deck, theme: nextTheme });
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-100">
      <header className="border-b border-slate-200 bg-white px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-lg font-bold text-deck-ink">
            DeckSmith AI
          </Link>
          <span className="text-deck-muted">|</span>
          <span className="text-deck-ink font-medium">{deck.title}</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setShowThemeEditor((v) => !v)}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-deck-ink hover:bg-slate-50"
          >
            {showThemeEditor ? "Hide theme" : "Edit theme"}
          </button>
          <button
            type="button"
            onClick={() => exportDeck("pdf")}
            disabled={!!exporting}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-deck-ink hover:bg-slate-50 disabled:opacity-50"
          >
            {exporting === "pdf" ? "Exporting…" : "Export PDF"}
          </button>
          <button
            type="button"
            onClick={() => exportDeck("pptx")}
            disabled={!!exporting}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-deck-ink hover:bg-slate-50 disabled:opacity-50"
          >
            {exporting === "pptx" ? "Exporting…" : "Export PPTX"}
          </button>
        </div>
      </header>

      {showThemeEditor && (
        <div className="border-b border-slate-200 bg-white px-6 py-4 flex flex-wrap items-center gap-6">
          <span className="text-sm font-medium text-slate-600">Theme colors</span>
          <label className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Primary</span>
            <input
              type="color"
              value={theme.primaryColor}
              onChange={(e) => updateTheme({ primaryColor: e.target.value })}
              className="h-8 w-12 rounded border border-slate-200 cursor-pointer"
            />
            <input
              type="text"
              value={theme.primaryColor}
              onChange={(e) => updateTheme({ primaryColor: e.target.value })}
              className="w-24 rounded border border-slate-200 px-2 py-1 text-xs font-mono"
            />
          </label>
          <label className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Secondary</span>
            <input
              type="color"
              value={theme.secondaryColor}
              onChange={(e) => updateTheme({ secondaryColor: e.target.value })}
              className="h-8 w-12 rounded border border-slate-200 cursor-pointer"
            />
            <input
              type="text"
              value={theme.secondaryColor}
              onChange={(e) => updateTheme({ secondaryColor: e.target.value })}
              className="w-24 rounded border border-slate-200 px-2 py-1 text-xs font-mono"
            />
          </label>
          <label className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Accent</span>
            <input
              type="color"
              value={theme.accentColor}
              onChange={(e) => updateTheme({ accentColor: e.target.value })}
              className="h-8 w-12 rounded border border-slate-200 cursor-pointer"
            />
            <input
              type="text"
              value={theme.accentColor}
              onChange={(e) => updateTheme({ accentColor: e.target.value })}
              className="w-24 rounded border border-slate-200 px-2 py-1 text-xs font-mono"
            />
          </label>
          <label className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Logo URL</span>
            <input
              type="url"
              value={theme.logoUrl ?? ""}
              onChange={(e) => updateTheme({ logoUrl: e.target.value || undefined })}
              placeholder="Optional"
              className="w-48 rounded border border-slate-200 px-2 py-1 text-xs"
            />
          </label>
        </div>
      )}

      <div className="flex-1 flex overflow-hidden">
        <aside className="w-56 border-r border-slate-200 bg-white overflow-y-auto flex-shrink-0">
          <div className="p-3">
            <p className="text-xs font-medium text-deck-muted uppercase tracking-wider mb-2">
              Slides
            </p>
            <ul className="space-y-1">
              {deck.slides.map((s, i) => (
                <li key={i}>
                  <button
                    type="button"
                    onClick={() => setCurrentIndex(i)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm truncate transition ${
                      i === currentIndex
                        ? "bg-deck-accent/10 text-deck-accent font-medium"
                        : "text-deck-ink hover:bg-slate-100"
                    }`}
                  >
                    {i + 1}. {s.headline.slice(0, 30)}
                    {s.headline.length > 30 ? "…" : ""}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </aside>

        <main className="flex-1 overflow-auto p-8 flex flex-col items-center">
          <div className="w-full max-w-4xl">
            <SlideRenderer
              slide={slide}
              theme={theme}
              editable
              onSlideChange={(updated) => updateSlide(currentIndex, updated)}
            />
          </div>
          <div className="mt-6 flex items-center gap-2">
            <button
              type="button"
              onClick={() => regenerateSlide("full")}
              disabled={regenerating}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium hover:bg-slate-50 disabled:opacity-50"
            >
              {regenerating ? "Regenerating…" : "Regenerate slide"}
            </button>
            <button
              type="button"
              onClick={() => regenerateSlide("headline")}
              disabled={regenerating}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium hover:bg-slate-50 disabled:opacity-50"
            >
              Regenerate headline
            </button>
            <button
              type="button"
              onClick={() => regenerateSlide("bullets")}
              disabled={regenerating}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium hover:bg-slate-50 disabled:opacity-50"
            >
              Regenerate bullets
            </button>
          </div>
        </main>
      </div>
    </div>
  );
}
