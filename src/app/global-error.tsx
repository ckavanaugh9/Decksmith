"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const message = error?.message ?? "An unexpected error occurred.";
  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui, sans-serif", padding: "2rem", background: "#f8fafc", minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <h1 style={{ fontSize: "1.25rem", fontWeight: 700, color: "#0f172a" }}>Something went wrong</h1>
        <p style={{ marginTop: "0.5rem", color: "#64748b" }}>{message}</p>
        <button
          type="button"
          onClick={() => reset?.()}
          style={{ marginTop: "1.5rem", padding: "0.5rem 1rem", background: "#0f172a", color: "white", border: "none", borderRadius: "0.5rem", cursor: "pointer", fontSize: "0.875rem" }}
        >
          Try again
        </button>
      </body>
    </html>
  );
}
