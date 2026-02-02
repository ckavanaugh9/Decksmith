"use client";

function isChunkLoadError(message: string): boolean {
  return /loading chunk .* failed|ChunkLoadError|Failed to fetch dynamically imported module/i.test(message);
}

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const message = error?.message ?? "An unexpected error occurred.";
  const isChunkError = isChunkLoadError(message);

  function handleTryAgain() {
    if (isChunkError && typeof window !== "undefined") {
      const qs = window.location.search || "";
      const sep = qs ? "&" : "?";
      window.location.href = window.location.pathname + qs + sep + "_cb=" + Date.now();
      return;
    }
    reset?.();
  }

  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui, sans-serif", padding: "2rem", background: "#f8fafc", minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <h1 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#0f172a" }}>Something went wrong</h1>
        <p style={{ marginTop: "0.5rem", color: "#64748b" }}>{message}</p>
        {isChunkError && (
          <p style={{ marginTop: "0.5rem", fontSize: "0.875rem", color: "#64748b" }}>
            Try again to reload with the latest code.
          </p>
        )}
        <button
          type="button"
          onClick={handleTryAgain}
          style={{ marginTop: "1.5rem", padding: "0.5rem 1rem", background: "#0f172a", color: "white", border: "none", borderRadius: "0.5rem", cursor: "pointer", fontSize: "0.875rem" }}
        >
          Try again
        </button>
      </body>
    </html>
  );
}
