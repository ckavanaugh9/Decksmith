# Styling Bot & Alternative Tools

DeckSmith AI uses an **intelligent styling bot** that:

1. **When a website URL is given:** Fetches the page HTML, extracts branding (theme-color, favicon, og:image, meta description), then uses an LLM to infer a full pitch-deck theme (primary, secondary, accent colors, optional font and logo URL).
2. **When no URL is given:** Uses Exa to search [Slidebook](https://www.slidebook.io/) for pitch deck examples, gets content excerpts, then uses an LLM to infer a professional deck style (colors, font) inspired by those examples.

## Current stack

| Purpose | Tool | Notes |
|--------|------|--------|
| Search + content | **Exa** | Search slidebook.io, get page content; getContents for URL content. |
| HTML parsing | **Cheerio** | Parse fetched HTML for `<meta theme-color>`, `<link rel="icon">`, og:image, etc. |
| Inference | **OpenAI** | LLM infers hex colors and style from branding hints or Slidebook excerpts. |
| Fetch | **fetch()** | Native fetch in API route to get URL HTML for branding extraction. |

## Alternative / complementary tools

Use these if you need higher fidelity or different data sources.

### 1. **Puppeteer or Playwright** (best for “pixel-perfect” emulation)

- **Use for:** Full browser render of a URL → computed styles, screenshots, dominant colors from the live page.
- **Pros:** Get real `getComputedStyle()`, take a screenshot and run color extraction (e.g. dominant palette). Most accurate for “make my deck look like this site.”
- **Cons:** Heavier (headless browser), slower, more memory. Run in a separate worker or serverless with a large timeout.
- **Example:** Visit URL → `page.evaluate(() => getComputedStyle(document.body).backgroundColor)`; screenshot → pass to color-extraction library or vision API.

### 2. **Cheerio** (already in use)

- **Use for:** Lightweight HTML parsing in Node (meta tags, link tags, inline styles).
- **Pros:** Fast, no browser, works in Next API routes. Good for theme-color, favicon, og:image.
- **Cons:** No computed styles; only what’s in the HTML/CSS source.

### 3. **Brandfetch API**

- **Use for:** Structured brand data (logo, colors, fonts) by domain.
- **Pros:** No scraping; returns palette and assets. [brandfetch.com](https://brandfetch.com) / API.
- **Cons:** Paid; rate limits; not every site is in their index.

### 4. **Image color extraction** (e.g. node-vibrant, sharp + palette)

- **Use for:** Dominant colors from logo/favicon/og:image once you have the image URL.
- **Pros:** Real palette from the actual logo/image; great for accent colors.
- **Cons:** Need to fetch the image and run extraction in Node (buffer/canvas or similar).

### 5. **Vision API** (GPT-4V, Claude, etc.)

- **Use for:** “Look at this screenshot of a website or Slidebook deck and return primary/secondary/accent hex and font suggestions.”
- **Pros:** Can interpret visual design, not just meta tags or text.
- **Cons:** Cost and latency; need to capture and send screenshots (e.g. via Puppeteer/Playwright).

### 6. **JSDOM**

- **Use for:** HTML parsing with a DOM (querySelector, etc.) without a full browser.
- **Pros:** More DOM-like than Cheerio; can run in Node.
- **Cons:** Still no computed styles; for branding extraction Cheerio is usually enough.

## Recommendation

- **Keep:** Exa + Cheerio + OpenAI for the current flows (URL branding + Slidebook style).
- **Add later if needed:**
  - **Puppeteer/Playwright** if you want “render this URL and copy its look” with computed styles and screenshots.
  - **node-vibrant** (or similar) to derive accent/primary from favicon/og:image.
  - **Brandfetch** if you want structured brand data without scraping.
  - **Vision API** to analyze deck screenshots (e.g. from Slidebook) for style.

## Slidebook flow (no URL)

- Exa searches `site:slidebook.io` for “startup pitch deck”, “investor deck”, “pitch deck design”.
- Content from 2–3 results is passed to the LLM to infer a professional theme (primary, secondary, accent, optional font).
- That theme is used as the deck’s default style when the user doesn’t provide a website.
