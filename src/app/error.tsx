"use client";

import { useEffect } from "react";
import Link from "next/link";

function isChunkLoadError(message: string): boolean {
  return /loading chunk .* failed|ChunkLoadError|Failed to fetch dynamically imported module/i.test(message);
}

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const message = error?.message ?? "An unexpected error occurred.";
  const isChunkError = isChunkLoadError(message);

  useEffect(() => {
    if (error) console.error(error);
  }, [error]);

  function handleTryAgain() {
    // Chunk load errors mean the client has stale chunk URLs; cache-busting reload fetches fresh HTML and chunk refs
    if (isChunkError && typeof window !== "undefined") {
      const qs = window.location.search || "";
      const sep = qs ? "&" : "?";
      window.location.href = window.location.pathname + qs + sep + "_cb=" + Date.now();
      return;
    }
    reset?.();
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-slate-50">
      <h1 className="text-xl font-bold text-slate-800">Something went wrong</h1>
      <p className="mt-2 text-slate-600 text-center max-w-md">
        {message}
      </p>
      {isChunkError && (
        <p className="mt-2 text-sm text-slate-500 text-center max-w-md">
          This can happen when the dev server restarts. Try again to reload with the latest code.
        </p>
      )}
      <div className="mt-6 flex gap-3">
        <button
          type="button"
          onClick={handleTryAgain}
          className="rounded-lg bg-slate-800 text-white px-4 py-2 text-sm font-medium hover:bg-slate-700"
        >
          Try again
        </button>
        <Link
          href="/"
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
        >
          Go home
        </Link>
      </div>
    </div>
  );
}
