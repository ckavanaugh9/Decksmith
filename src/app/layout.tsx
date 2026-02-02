import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DeckSmith AI — From idea or URL → investor-ready pitch deck",
  description:
    "Generate beautiful, structured, investor-quality pitch decks in minutes from a description or startup website URL.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen font-sans antialiased" style={{ fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
        {children}
      </body>
    </html>
  );
}
