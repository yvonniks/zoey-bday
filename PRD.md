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
| QR code page | ✅ Done | `/qr` route renders a printable QR code; QR button in gallery header |
| GitHub Pages deploy | ✅ Done | Vite build via GitHub Actions on push to `main`; SPA routing handled via 404.html redirect |

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

### Stage 2 — Photo Enrichment (Days 4–7) ✅ Done

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

### Stage 3 — Polish & Deploy (Days 8–14) ✅ Done

**Goal**: Delightful, bug-free experience ready for the party.

| Feature | Status | Notes |
|---|---|---|
| Polaroid animations | ✅ Done | New photos drop in with bounce keyframe + ±4° random permanent tilt; initial load photos get rotation only |
| Loading & empty states | ✅ Done | Spinner on gallery load, friendly empty state message |
| Error handling | ✅ Done | Upload failure shows fixed bottom toast with Retry and Dismiss buttons |
| Config-driven theming | ✅ Done | `--accent` and `--bg-color` CSS vars set from `config.js` in App.jsx |
| Mobile UX polish | ✅ Done | Safe area insets (`env(safe-area-inset-*)`) on all headers/footers; no horizontal scroll |
| QR code print page | ✅ Done | Redesigned `/qr` with branded card, 300px QR, Print button; `.no-print` hides UI chrome on print |
| README | ✅ Done | Full setup guide: clone → Supabase schema → config → env vars → deploy |
| Smoke test checklist | ⬜ Pending | End-to-end test on iPhone Safari and Android Chrome |

---

### Stage 4 — UX Design Polish ✅ Done

**Goal**: Delightful, accessible, fully personalized experience with modern visual design inspired by the Snappie prototype aesthetic.

| Feature | Status | Notes |
|---|---|---|
| Typography | ✅ Done | **Fredoka** (display/headings — party energy) + **Nunito** (body — clean, accessible). Both via Google Fonts. |
| Color system | ✅ Done | Expanded `config.theme`: `primary`, `secondary`, `accent`, `background`, `surface`, `text`, `gradientStart`, `gradientEnd` |
| Gallery dark backdrop | ✅ Done | Deep `#12101f` background — polaroids float on darkness and pop visually |
| Gallery hero header | ✅ Done | Full-bleed gradient hero (pink→purple) with Fredoka party name, decorative circles, live photo count pill |
| Bottom nav | ✅ Done | Fixed dark bottom nav with floating elevated camera button (pink gradient, elevated 18px above bar) |
| Polaroid cream cards | ✅ Done | Warm cream `#FFF5E6` polaroid background; Fredoka captions + auto date stamp |
| Polaroid push-pin | ✅ Done | Peach/gold radial-gradient push-pin dot above each card |
| Tape corners | ✅ Done | CSS `::before`/`::after` semi-transparent golden tape at top corners |
| Polaroid hover lift | ✅ Done | Card lifts 8px, scales 1.04×, de-rotates, and deepens shadow on hover |
| Scroll reveal | ✅ Done | Cards fade+slide in via IntersectionObserver (`useScrollReveal` hook) |
| Camera dark atmospheric | ✅ Done | Dark `#0d0d14` background; ambient orbs pulsing in file-picker; viewfinder corner brackets; double-ring shutter button |
| Camera transitions | ✅ Done | Background smoothly transitions from dark (viewfinder) to warm cream (preview) after capture |
| Camera flash | ✅ Done | White overlay flash on capture |
| Confetti on upload | ✅ Done | `canvas-confetti` burst on successful post using theme colors; gated on `prefers-reduced-motion` |
| Sticker picker slide-up | ✅ Done | Bottom sheet slides up with spring animation; reads stickers from `config.stickers[]` |
| Web Share API | ✅ Done | Share button on polaroid cards; native OS share sheet on iOS/Android; hidden on unsupported browsers |
| Copy link | ✅ Done | One-tap copy of photo URL; "✓ Copied" label swap for 2s |
| OG / social meta | ✅ Done | Open Graph + Twitter Card tags in `index.html`; comments guide customizers to update them |
| Reduced motion | ✅ Done | `@media (prefers-reduced-motion: reduce)` disables all animations; scroll-reveal cards remain visible |
| Accessibility | ✅ Done | All buttons ≥44px touch targets, `aria-label` on all icon buttons, `role="alert"` on error toast, global `:focus-visible` ring |
| Personalization | ✅ Done | `src/config.js` is single source of truth — theme, stickers, OG copy, party details, prompts |

**New files**:
- `src/hooks/useScrollReveal.js` — IntersectionObserver hook for gallery scroll-reveal

**New dependency**:
- `canvas-confetti` (~7kb, no sub-deps)

---

---

### Stage 5 — Engagement & Delight ✅ Done

**Goal**: Make the experience feel alive, celebratory, and full of surprise moments throughout the party.

| Feature | Status | Notes |
|---|---|---|
| Entry confetti | ✅ Done | `canvas-confetti` burst fires on every Gallery mount (350ms delay, gated on reduced-motion) |
| Hero circles breathing | ✅ Done | CSS `@keyframes hero-breathe` slow scale+opacity pulse on `::before`/`::after` pseudo-elements |
| Remove hero QR button | ✅ Done | QR still accessible via bottom nav Share tab; hero is more compact |
| Shrink hero padding | ✅ Done | `paddingTop` and `paddingBottom` reduced for less dead space |
| Caveat marker font for captions | ✅ Done | Google Font "Caveat" replaces Fredoka for `.polaroid-caption`; handwritten marker feel |
| Caption not burned into photo | ✅ Done | Removed canvas caption band from `composeImage.js`; caption lives only in DB + polaroid white area |
| Tap photo → modal | ✅ Done | `PhotoModal.jsx` — full-screen blur backdrop, polaroid card, Save/Link/Share actions; iOS scroll lock; tap-outside dismiss |
| Long-press star burst | ✅ Done | 500ms hold on any polaroid → `canvas-confetti` star burst from card center; `touchAction: manipulation` prevents iOS native menu |
| Camera button larger | ✅ Done | `bottom-nav-cam` 58px → 66px, font-size 24px → 27px, float margin adjusted |
| "Upload instead" text | ✅ Done | Replaced "Use file picker instead" in Camera.jsx |
| Pose prompt typewriter | ✅ Done | `useEffect` types prompt char-by-char at 28ms/char; blinking cursor while typing; reduced-motion skips animation |
| Pose prompt shuffle label | ✅ Done | 🔀 button now has "Shuffle" label below it; 🎯 target icon removed |
| Pose prompt glow pulse | ✅ Done | `prompt-container` CSS class with `@keyframes prompt-glow` pink box-shadow pulse |
| Glam filters | ✅ Done | 5 CSS filter presets (Off, Glow ✨, Vivid 🌈, Warm 🌅, B&W 🎞️); applied live to Webcam; baked into JPEG on capture via offscreen canvas |
| Realtime new-photo toast | ✅ Done | Pink gradient toast slides in from top when Supabase realtime fires INSERT; auto-dismisses after 3s |
| Sticker bounce on tap | ✅ Done | `sticker-tap` CSS animation on sticker button for 300ms when tapped in picker |

**New files**:
- `src/components/PhotoModal.jsx` — tap-to-open photo modal with actions

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
| `src/components/StickerPicker.jsx` | Bottom drawer sticker picker (stickers sourced from `config.stickers[]`) |
| `src/hooks/useScrollReveal.js` | IntersectionObserver hook for gallery scroll-reveal |
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
│   ├── hooks/
│   │   └── useScrollReveal.js
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
