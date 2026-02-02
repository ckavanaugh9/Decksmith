"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const message = error?.message ?? "An unexpected error occurred.";
  useEffect(() => {
    if (error) console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-slate-50">
      <h1 className="text-xl font-bold text-slate-800">Something went wrong</h1>
      <p className="mt-2 text-slate-600 text-center max-w-md">
        {message}
      </p>
      <div className="mt-6 flex gap-3">
        <button
          type="button"
          onClick={() => reset?.()}
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
