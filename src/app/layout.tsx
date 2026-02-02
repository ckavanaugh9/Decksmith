import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DeckSmith AI — From idea or URL → investor-ready pitch deck",
  description:
    "Generate beautiful, structured, investor-quality pitch decks in minutes from a description or startup website URL.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

const bodyStyle: React.CSSProperties = {
  fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  margin: 0,
  minHeight: "100vh",
  backgroundColor: "#f8fafc",
  color: "#0f172a",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen font-sans antialiased" style={bodyStyle} suppressHydrationWarning>
        {children}
        <noscript>
          <div style={{ padding: "2rem", textAlign: "center", fontFamily: "system-ui, sans-serif", background: "#f8fafc", minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
            <h1 style={{ fontSize: "1.5rem", color: "#0f172a" }}>DeckSmith AI</h1>
            <p style={{ marginTop: "0.5rem", color: "#64748b" }}>Please enable JavaScript to use this app.</p>
            <a href="/" style={{ marginTop: "1rem", color: "#0ea5e9" }}>Refresh</a>
          </div>
        </noscript>
      </body>
    </html>
  );
}
