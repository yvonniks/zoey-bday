# Party Photo Booth

A real-time, mobile-first party photo booth web app. Guests snap photos, add stickers and captions, and see them appear instantly in a shared live gallery.

**Live site**: [https://yvonniks.github.io/zoey-bday](https://yvonniks.github.io/zoey-bday)

**Built with:** React 19 · React Router 7 · Vite · Tailwind CSS · Supabase (Postgres + Storage + Realtime)

---

## Quick Start

```bash
git clone https://github.com/yvonniks/zoey-bday.git
cd zoey-bday
npm install
cp .env.example .env.local   # fill in your Supabase credentials
npm run dev
```

Open [http://localhost:5173/zoey-bday](http://localhost:5173/zoey-bday).

---

## Supabase Setup

### 1. Create a project

Go to [supabase.com](https://supabase.com) → New project. Note your **Project URL** and **anon public key** (Settings → API).

### 2. Create the `photos` table

Run this in the Supabase SQL editor:

```sql
create table photos (
  id           bigint generated always as identity primary key,
  storage_path text not null,
  caption      text,
  created_at   timestamptz default now()
);

-- Allow anyone to read and insert (no auth required)
alter table photos enable row level security;

create policy "Public read"   on photos for select using (true);
create policy "Public insert" on photos for insert with check (true);
```

### 3. Create a storage bucket

1. Go to **Storage** → **New bucket**
2. Name it `photos` (or whatever you set in `eventConfig.storageBucketName`)
3. Toggle **Public bucket** ON
4. Under **Policies**, add:
   - **SELECT** → `true` (public read)
   - **INSERT** → `true` (anyone can upload)

### 4. Enable Realtime

Go to **Database** → **Replication** → enable the `photos` table for **INSERT** events.

### 5. Fill in `.env.local`

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

For GitHub Actions deploys, add these as repository secrets under **Settings → Secrets → Actions**.

---

## Fork for Your Event

Only two files need to change:

### `src/eventConfig.js`

| Field | Type | Description |
|---|---|---|
| `eventSlug` | `string` | URL-safe slug used in the ZIP filename, e.g. `"emma-bday-2027"` |
| `date` | `string` | ISO date of the event, e.g. `"2027-06-15"` |
| `storageBucketName` | `string` | Supabase storage bucket name (must match what you created) |
| `partyName` | `string` | Displayed in the header and on the camera page |
| `subtitle` | `string` | Subheading under the party name |
| `siteUrl` | `string` | Full deployed URL — used for the QR code |
| `ogDescription` | `string` | Open Graph description for link previews |
| `ogImage` | `string` | Open Graph image URL |
| `theme.primary` | `hex` | Primary color — buttons, active states |
| `theme.secondary` | `hex` | Secondary color — accents, gradients |
| `theme.accent` | `hex` | Accent color — push-pins, confetti, highlights |
| `theme.background` | `hex` | Page background (used when `corkboard: false`) |
| `theme.gradientStart` | `hex` | Gallery hero gradient left color |
| `theme.gradientEnd` | `hex` | Gallery hero gradient right color |
| `theme.corkboard` | `boolean` | `true` to show corkboard texture background |
| `prompts` | `Array<{emoji, text}>` | Pose prompts shown on the camera viewfinder |
| `stickers` | `string[]` | Emoji sticker palette |

### `.env.local`

Swap in your new project's Supabase URL and anon key.

### `index.html`

Update the `<title>`, `og:title`, `og:description`, and `og:image` meta tags manually — these are static and can't be injected at build time.

---

## Deploy to GitHub Pages

1. Update `vite.config.js` — set `base` to match your repo name:
   ```js
   base: '/your-repo-name/'
   ```
2. Update `BrowserRouter` in `src/App.jsx`:
   ```jsx
   <BrowserRouter basename="/your-repo-name">
   ```
3. Run:
   ```bash
   npm run deploy
   ```

This builds the app and pushes `dist/` to the `gh-pages` branch. GitHub Pages serves it automatically.

---

## Features

| Feature | Description |
|---|---|
| **Live Gallery** | Photos appear in real-time via Supabase Realtime |
| **Camera** | Webcam capture with glam filters, stickers, captions |
| **Upload** | Tap the gallery icon to upload from your camera roll |
| **Bulk Select** | Select photos in the gallery → download as a single ZIP |
| **Slideshow** | Full-screen auto-playing carousel at `/slideshow` — great for a TV or projector |
| **QR Code** | Shareable QR code to invite guests |
| **Mobile-first** | Safe area insets, iOS 100dvh fix, native share sheet on mobile |

## Routes

| Path | Page |
|---|---|
| `/` | Gallery (live photo feed) |
| `/camera` | Camera / photo editor |
| `/qr` | QR code share page |
| `/slideshow` | Full-screen slideshow |

## Tech Stack

- **React + Vite** — frontend framework and build tool
- **Tailwind CSS** — utility styling
- **Supabase** — Postgres (metadata) + Storage (photos) + Realtime
- **HTML5 Canvas** — client-side photo compositing (stickers + caption baked in)
- **JSZip + file-saver** — bulk photo ZIP download
- **GitHub Pages** — static hosting
