"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import type { DeckTheme } from "@/lib/types";
import { DEFAULT_THEME } from "@/lib/theme";

type Mode = "prompt" | "url";

function CreateForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialMode = (searchParams.get("mode") === "url" ? "url" : "prompt") as Mode;
  const [mode, setMode] = useState<Mode>(initialMode);
  const [description, setDescription] = useState("");
  const [url, setUrl] = useState("");
  const [industry, setIndustry] = useState("");
  const [stage, setStage] = useState("");
  const [targetCustomer, setTargetCustomer] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      let websiteSummary: string | undefined;
      let ingest: { websiteSummary?: string; brand?: { primaryColor?: string; secondaryColor?: string; accentColor?: string; logoUrl?: string } } | null = null;
      if (mode === "url" && url.trim()) {
        const ingestRes = await fetch("/api/url-ingest", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: url.trim() }),
        });
        if (!ingestRes.ok) {
          const data = await ingestRes.json().catch(() => ({}));
          throw new Error(data.error || "Failed to fetch website content");
        }
        ingest = await ingestRes.json();
        websiteSummary = ingest?.websiteSummary;
      }

      let theme: DeckTheme = DEFAULT_THEME;

      // When no URL: get theme from Slidebook examples (Exa + LLM)
      if (mode === "prompt") {
        try {
          const styleRes = await fetch("/api/styling/from-slidebook", { method: "POST" });
          if (styleRes.ok) {
            const { theme: slidebookTheme } = await styleRes.json();
            if (slidebookTheme?.primaryColor) theme = slidebookTheme;
          }
        } catch {
          // Keep DEFAULT_THEME
        }
      }

      const body: Record<string, unknown> = {
        description: mode === "url" ? (websiteSummary ?? description) : description,
        slideCount: 11,
      };
      if (industry) body.industry = industry;
      if (stage) body.stage = stage;
      if (targetCustomer) body.targetCustomer = targetCustomer;
      if (mode === "url" && url.trim()) {
        body.websiteUrl = url.trim();
        body.websiteSummary = websiteSummary;
      }

      const res = await fetch("/api/deck/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Deck generation failed");
      }
      const data = await res.json();
      const { slides, theme: generatedTheme } = data;
      if (mode === "url" && ingest?.brand) {
        theme = {
          primaryColor: ingest.brand.primaryColor ?? DEFAULT_THEME.primaryColor,
          secondaryColor: ingest.brand.secondaryColor ?? DEFAULT_THEME.secondaryColor,
          accentColor: ingest.brand.accentColor ?? DEFAULT_THEME.accentColor,
          logoUrl: ingest.brand.logoUrl,
        };
      } else if (mode === "prompt") {
        // Theme already set from Slidebook (or DEFAULT_THEME if that failed)
      } else if (generatedTheme?.primaryColor) {
        theme = {
          primaryColor: generatedTheme.primaryColor,
          secondaryColor: generatedTheme.secondaryColor ?? DEFAULT_THEME.secondaryColor,
          accentColor: generatedTheme.accentColor ?? DEFAULT_THEME.accentColor,
          logoUrl: generatedTheme.logoUrl,
        };
      }
      sessionStorage.setItem("decksmith_current_deck", JSON.stringify({ slides, title: "Pitch Deck", theme }));
      router.push("/deck/edit");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/50">
      <header className="border-b border-slate-200/80 bg-white">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-deck-ink">
            DeckSmith AI
          </Link>
          <Link href="/" className="text-deck-muted hover:text-deck-ink">
            Back
          </Link>
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto w-full px-6 py-12">
        <h1 className="text-2xl font-bold text-deck-ink">Create your pitch deck</h1>
        <p className="mt-1 text-deck-muted">
          Describe your startup or paste your website URL. We’ll generate a 10–12 slide investor deck.
        </p>

        <div className="mt-8 flex gap-2 border-b border-slate-200">
          <button
            type="button"
            onClick={() => setMode("prompt")}
            className={`px-4 py-2 font-medium rounded-t-lg transition ${
              mode === "prompt"
                ? "bg-white border border-slate-200 border-b-white -mb-px text-deck-ink"
                : "text-deck-muted hover:text-deck-ink"
            }`}
          >
            Describe your startup
          </button>
          <button
            type="button"
            onClick={() => setMode("url")}
            className={`px-4 py-2 font-medium rounded-t-lg transition ${
              mode === "url"
                ? "bg-white border border-slate-200 border-b-white -mb-px text-deck-ink"
                : "text-deck-muted hover:text-deck-ink"
            }`}
          >
            Paste website URL
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          {mode === "prompt" ? (
            <div>
              <label className="block text-sm font-medium text-deck-ink">Startup description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                rows={6}
                className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-3 text-deck-ink placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-deck-accent focus:border-transparent"
                placeholder="e.g. We build an AI-powered scheduling tool for healthcare admins. They waste 30% of their time on manual scheduling; we automate it and cut no-shows by 40%..."
              />
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-deck-ink">Website URL</label>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                required
                className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-3 text-deck-ink placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-deck-accent focus:border-transparent"
                placeholder="https://yourstartup.com"
              />
              <p className="mt-2 text-sm text-deck-muted">
                We’ll scan your homepage, about, product, and pricing pages to extract your positioning.
              </p>
            </div>
          )}

          <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-deck-muted">Industry (optional)</label>
              <input
                type="text"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-deck-accent"
                placeholder="e.g. Healthcare"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-deck-muted">Stage (optional)</label>
              <input
                type="text"
                value={stage}
                onChange={(e) => setStage(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-deck-accent"
                placeholder="e.g. Pre-seed"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-deck-muted">Target customer (optional)</label>
              <input
                type="text"
                value={targetCustomer}
                onChange={(e) => setTargetCustomer(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-deck-accent"
                placeholder="e.g. Hospital admins"
              />
            </div>
          </div>

          {error && (
            <div className="mt-4 rounded-lg bg-red-50 text-red-700 px-4 py-3 text-sm">
              {error}
            </div>
          )}

          <div className="mt-6 flex items-center gap-4">
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-deck-accent text-white px-6 py-3 font-medium hover:opacity-90 disabled:opacity-50 transition"
            >
              {loading ? "Generating deck…" : "Generate deck"}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}

export default function CreatePage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-deck-muted">Loading…</div>}>
      <CreateForm />
    </Suspense>
  );
}
