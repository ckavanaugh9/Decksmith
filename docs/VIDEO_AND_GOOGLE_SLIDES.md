# Video generation & Google Slides export

## Video generation (future)

For turning a deck into a short video pitch (not in MVP scope), these options are cost-effective and high quality:

| Option | Notes |
|--------|--------|
| **VideoGen API** | Low cost ($29–49/mo), multiple models (Sora 2, Veo 3.1, etc.), YC-backed; good for startups. |
| **Pictory API** | ~$79/mo, stock footage + AI voices, automation-friendly (Make, Zapier). |
| **Shotstack Create API** | Free tier; unified API for voices, images, video; trusted by brands. |

Integrate once you have a clear flow (e.g. one slide per scene + voiceover). Use `OPENAI_MODEL` (or TTS like ElevenLabs if you add `ELEVENLABS_API_KEY`) for script; then send frames or slides to a video API.

## Google Slides export

- **Option A (current):** User exports PPTX from DeckSmith AI, then uploads to Google Drive and opens with Google Slides.
- **Option B:** Use [Google Slides API](https://developers.google.com/slides/api) with OAuth:
  1. Create a Google Cloud project, enable Google Slides API.
  2. Implement OAuth (e.g. next-auth with Google provider).
  3. Create a new presentation via API and insert slides (text/shapes) from our slide JSON.
  4. Return the edit URL to the user.

Option B gives a one-click “Export to Google Slides” but requires Google Cloud and consent screen setup.
