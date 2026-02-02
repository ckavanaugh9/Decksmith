# DeckSmith AI

**From idea or URL → investor-ready pitch deck in minutes.**

DeckSmith AI generates beautiful, structured, VC-style pitch decks from a natural language description or your startup website URL. It uses AI storytelling, structured deck logic, and automated slide design (layouts L1–L10).

## Features

- **Flow A — Prompt → Deck:** Enter a startup description (and optional industry, stage, target customer); get a 10–12 slide outline and full content.
- **Flow B — URL → Deck:** Paste a startup website URL; we scrape homepage, about, product, and pricing (via Exa), then generate a deck.
- **Editing:** Edit any text inline; regenerate entire slide, headline only, or bullets only.
- **Export:** PDF, PPTX. Google Slides: export PPTX and upload to Google Drive, or use [Google Slides API](https://developers.google.com/slides/api) with OAuth for direct create.

## Tech stack

- **Frontend:** Next.js 15 (App Router), React 19, TailwindCSS
- **Backend:** Next.js API routes, OpenAI (GPT-4o or GPT-5 when available)
- **Auth & DB:** Supabase (Auth with email, PostgreSQL)
- **URL ingestion:** Exa (contents + search)
- **Payments:** Stripe (credits)
- **Export:** PptxGenJS (PPTX), jsPDF (PDF)

## Setup

1. **Clone and install**

   ```bash
   cd "Decksmith AI"
   npm install
   ```

2. **Environment variables**

   Copy `.env.example` to `.env.local` and fill in:

   - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase project
   - `OPENAI_API_KEY` — OpenAI API key (use `gpt-4o` or set `OPENAI_MODEL=gpt-5` when available)
   - `EXA_API_KEY` — Exa API key for URL ingestion
   - `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` — for credits (optional for local dev)

3. **Supabase**

   - Create a project at [supabase.com](https://supabase.com).
   - Run the migration: Supabase Dashboard → SQL Editor → paste contents of `supabase/migrations/001_initial_schema.sql` → Run.
   - Enable Email auth in Authentication → Providers.

4. **Run**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000). You can create a deck without signing in (deck is kept in `sessionStorage` until you add DB persistence).

## Project structure

- `src/app/` — App Router pages: landing (`/`), create (`/create`), deck editor (`/deck/edit`), auth (`/auth/sign-in`)
- `src/app/api/` — API routes: `deck/generate`, `deck/regenerate-slide`, `url-ingest`, `export/pdf`, `export/pptx`
- `src/components/slides/` — Layout components L1–L10 and `SlideRenderer`
- `src/lib/` — Types, Supabase client/server/middleware, **`env.ts`** (shared env config)
- `supabase/migrations/` — PostgreSQL schema (users, decks, slides, credits)

## Monetization (MVP)

- First 10 slides free.
- 1 credit = 1 slide; $0.99 per credit. Credit packs: 10 ($9.90), 25 ($22.50), 50 ($39.00).
- Consume credits when generating beyond 10 slides or when regenerating after quota.
- Stripe for payments; store balance in `credits` table.

## Video generation (future)

For turning a deck into a short video pitch (not in MVP scope), options to consider:

- **VideoGen API** — Low cost, multiple models; good for startups.
- **Pictory API** — Stock footage + AI voices; automation-friendly.
- **Shotstack Create API** — Free tier; unified API for voices, images, video.

Integrate once you have a clear “deck → video” flow (e.g. one slide per scene + voiceover).

## Google Slides export

- **Option A:** User exports PPTX from DeckSmith and uploads to Google Drive / imports into Google Slides.
- **Option B:** Use [Google Slides API](https://developers.google.com/slides/api) with OAuth: create a new presentation and insert slides (text/shapes) from our slide data. Requires Google Cloud project and OAuth consent.

## Shared env (for all agents / code)

All API keys and config live in **`.env.local`** at the project root. Next.js loads it automatically for API routes and pages.

**Use the shared module** so every part of the app (and other agents) reads from the same place:

```ts
import { env } from "@/lib/env";

// Then use env.OPENAI_API_KEY, env.EXA_API_KEY, env.ELEVENLABS_API_KEY, etc.
```

`src/lib/env.ts` re-exports every key from `process.env`. Prefer importing `env` from `@/lib/env` instead of `process.env` directly so config stays in one place.

## Hyperspell (user preferences)

You can use [Hyperspell](https://docs.hyperspell.com/) to store and query user preferences over time (e.g. “this user prefers short bullets”) via their Memories API and custom metadata. Add `HYPERSPELL_API_KEY` and call Hyperspell when saving/loading preferences once auth is in place.

## License

Private / your choice.
