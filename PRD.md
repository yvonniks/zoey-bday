# PRD: Birthday Party Photo Booth — zoey-bday

## Context

A lightweight, self-hosted alternative to WedPicsQR built specifically for a single birthday party. Guests scan a QR code, take photos with pose prompts, decorate them with stickers and captions, and see everything appear instantly in a shared polaroid gallery. The app lives in one GitHub repo, deploys to GitHub Pages, and uses Supabase for storage and photo metadata. The party is within 2 weeks — MVP must be lean and shippable fast.

---

## Decisions & Constraints

| Concern | Decision |
|---|---|
| Hosting | GitHub Pages (static) |
| Backend | Supabase (Storage + PostgreSQL) |
| Auth | None — fully open via QR link |
| Moderation | None in MVP |
| Video | Deferred — photos only for MVP |
| Downloads | Individual photo only (with stickers + caption composited client-side via Canvas) |
| Stickers | Built-in emoji/birthday sticker set, no external dependencies |
| Admin | None in MVP |
| Config | Single `src/config.js` file drives all personalization |
| One party per repo | Yes — no multi-tenant design needed |
| Framework | React + Vite (manages camera/canvas/gallery state cleanly) |

---

## Tech Stack

- **Frontend**: React + Vite (static output → `dist/` folder → GitHub Pages)
- **Styling**: Tailwind CSS (mobile-first)
- **Storage**: Supabase Storage bucket (photos)
- **Database**: Supabase PostgreSQL (photo metadata: id, filename, caption, sticker positions, timestamp)
- **QR Code**: `qrcode` npm package (generated client-side from the config's site URL)
- **Camera**: `getUserMedia` API via `react-webcam` or native `<input type="file" capture="environment">`
- **Canvas compositing**: HTML5 Canvas API (sticker + caption → final downloadable image)
- **Realtime gallery**: Supabase Realtime subscriptions (new photos appear without refresh)

---

## Configuration File (`src/config.js`)

```js
export default {
  partyName: "Zoey's Birthday!",
  subtitle: "Snap a photo and leave a memory 🎉",
  accentColor: "#FF6B9D",        // primary brand color
  backgroundColor: "#FFF5F9",    // app background
  siteUrl: "https://yvonniks.github.io/zoey-bday", // used to generate QR code
  prompts: [                      // pose suggestions shown before camera opens
    "Make your best silly face!",
    "Strike a superhero pose!",
    "Show us your dance moves!",
    "Hug someone next to you!",
    "Give us your biggest smile!"
  ]
}
```

---

## MVP Stages

### Stage 1 — Foundation (Days 1–3) ✅ Shippable

**Goal**: Guests can take a photo and see it appear in the gallery. Core loop works end-to-end.

| Feature | Status | Notes |
|---|---|---|
| Supabase project setup | ✅ Done | Storage bucket (public read), `photos` table with RLS |
| Config file | ✅ Done | `src/config.js` with party name, colors, URL |
| Camera page | ✅ Done | Full-screen camera on load; falls back to file picker on desktop |
| Photo upload | ✅ Done | Upload to Supabase Storage → insert metadata row |
| Polaroid gallery | ✅ Done | Grid of polaroid cards (photo + caption area); Supabase Realtime so new uploads appear live |
| QR code page | ✅ Done | `/qr` route renders a printable QR code pointing to the site URL from config |
| GitHub Pages deploy | ✅ Done | Vite build via GitHub Actions on push to `main` |

**Supabase schema (Stage 1)**:
```sql
create table photos (
  id uuid primary key default gen_random_uuid(),
  storage_path text not null,
  caption text,
  created_at timestamptz default now()
);
```

---

### Stage 2 — Photo Enrichment (Days 4–7) ✅ Core UX

**Goal**: Guests can personalize their photo before posting.

| Feature | Notes |
|---|---|
| Pose prompts | Before camera opens, show a random prompt from `config.prompts[]` with a "New prompt" shuffle button |
| Caption input | Text field below the photo preview before submitting |
| Sticker picker | Bottom drawer with 12–16 birthday emoji stickers (🎂🎉🎈🎁✨🦄🎊🌟💫🥳🍰🎀) |
| Sticker placement | Drag stickers onto the photo preview; tap to remove |
| Canvas compositing | On upload, draw photo + stickers + caption onto a Canvas → export as JPEG blob |
| Individual download | Download button on each gallery card; serves the composited image |

**Notes on stickers**: The composited image (photo + stickers + caption) is what gets uploaded to Supabase — the raw camera frame is discarded. No sticker metadata needs to be stored server-side.

---

### Stage 3 — Polish & Deploy (Days 8–14) ✅ Party-Ready

**Goal**: Delightful, bug-free experience ready for the party.

| Feature | Notes |
|---|---|
| Polaroid animations | New photos "drop in" with a slight random rotation (CSS keyframes) |
| Loading & empty states | Spinner on upload, friendly empty gallery message |
| Error handling | Upload failure toast with retry |
| Config-driven theming | CSS variables set from config (accent color, background) |
| Mobile UX polish | Large touch targets, no horizontal scroll, safe area insets for notched phones |
| QR code print page | Styled `/qr` page with party name, subtitle, and scannable code — ready to print or display on a TV |
| README | Setup instructions for future parties (clone → edit config → deploy) |
| Smoke test checklist | End-to-end test on iPhone Safari and Android Chrome |

---

## Deferred (Post-Party / Future Stages)

| Feature | Reason deferred |
|---|---|
| Video uploads | Scope + Supabase free storage (1 GB limit) |
| Bulk ZIP download | Needs server-side zip; GitHub Pages is static-only |
| Host admin / delete | No auth system in scope for MVP |
| Custom stickers via config | Built-in set covers the birthday use case |
| Guest name tagging | Not requested; adds friction at entry |
| Multi-party support | Out of scope by design (one repo = one party) |

---

## Critical Files

| Path | Purpose |
|---|---|
| `src/config.js` | All party personalization — edit this to customize |
| `src/supabaseClient.js` | Supabase client init (reads env vars) |
| `src/pages/Camera.jsx` | Camera capture + sticker/caption editor |
| `src/pages/Gallery.jsx` | Realtime polaroid gallery |
| `src/pages/QRCode.jsx` | Printable QR code page |
| `src/components/PolaroidCard.jsx` | Individual gallery card with download button |
| `src/components/StickerPicker.jsx` | Bottom drawer sticker picker |
| `src/utils/composeImage.js` | Canvas compositing (photo + stickers + caption → JPEG) |
| `.env.local` | `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (gitignored) |
| `.env.example` | Template showing required env vars (committed) |
| `vite.config.js` | `base` set to `/zoey-bday/` for GitHub Pages |

---

## Repository Structure

```
zoey-bday/
├── public/
│   └── favicon.ico
├── src/
│   ├── config.js              ← edit this to customize the party
│   ├── supabaseClient.js
│   ├── main.jsx
│   ├── App.jsx                ← routing (Camera / Gallery / QR)
│   ├── pages/
│   │   ├── Camera.jsx
│   │   ├── Gallery.jsx
│   │   └── QRCode.jsx
│   ├── components/
│   │   ├── PolaroidCard.jsx
│   │   └── StickerPicker.jsx
│   └── utils/
│       └── composeImage.js
├── .env.local                 ← gitignored
├── .env.example               ← committed (shows required vars)
├── PRD.md                     ← this file
├── vite.config.js
└── package.json
```

---

## Verification / Testing Checklist

- [ ] `npm run dev` starts locally; Camera page opens on localhost
- [ ] Camera captures photo on mobile (iOS Safari + Android Chrome)
- [ ] Stickers drag onto photo preview correctly
- [ ] Caption text appears on photo before submit
- [ ] Upload posts to Supabase Storage and inserts metadata row
- [ ] New photo appears in Gallery in real-time without refresh
- [ ] Download button produces a composited JPEG (stickers + caption included)
- [ ] QR code at `/qr` route scans correctly and lands on the gallery
- [ ] `npm run deploy` pushes to `gh-pages` branch; site loads at configured GitHub Pages URL
- [ ] Config changes (party name, colors, prompts) reflect correctly after rebuild
