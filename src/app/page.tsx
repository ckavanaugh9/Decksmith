import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-slate-200/80 bg-white/80 backdrop-blur">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <span className="text-xl font-bold text-deck-ink">DeckSmith AI</span>
          <nav className="flex items-center gap-6">
            <Link
              href="/auth/sign-in"
              className="text-deck-muted hover:text-deck-ink transition"
            >
              Sign in
            </Link>
            <Link
              href="/create"
              className="rounded-lg bg-deck-accent text-white px-4 py-2 font-medium hover:opacity-90 transition"
            >
              Create deck
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-6 py-20">
        <h1 className="text-4xl md:text-5xl font-bold text-deck-ink text-center max-w-3xl leading-tight">
          From idea or URL → investor-ready pitch deck in minutes
        </h1>
        <p className="mt-6 text-xl text-deck-muted text-center max-w-2xl">
          DeckSmith AI generates beautiful, structured, VC-style pitch decks from a
          natural language description or your startup website. No design skills needed.
        </p>
        <div className="mt-10 flex flex-wrap gap-4 justify-center">
          <Link
            href="/create"
            className="rounded-xl bg-deck-ink text-white px-8 py-4 font-semibold text-lg hover:opacity-90 transition"
          >
            Start with a description
          </Link>
          <Link
            href="/create?mode=url"
            className="rounded-xl border-2 border-deck-ink text-deck-ink px-8 py-4 font-semibold text-lg hover:bg-deck-ink hover:text-white transition"
          >
            Paste a website URL
          </Link>
        </div>
        <p className="mt-8 text-sm text-deck-muted">
          First 10 slides free • Edit inline • Export to PDF, PPTX, or Google Slides
        </p>
      </main>

      <footer className="border-t border-slate-200/80 py-6 text-center text-sm text-deck-muted">
        DeckSmith AI — investor-ready decks in minutes
      </footer>
    </div>
  );
}
