# zoey-bday — Birthday Party Photo Booth

A lightweight, self-hosted photo booth for a birthday party. Guests scan a QR code, take photos, add stickers and captions, and see everything appear instantly in a shared polaroid gallery.

**Live site**: [https://yvonniks.github.io/zoey-bday](https://yvonniks.github.io/zoey-bday)

---

## For a future party — setup in 5 steps

### 1. Clone and install

```bash
git clone https://github.com/yvonniks/zoey-bday.git my-party
cd my-party
npm install
```

### 2. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) and create a new project.
2. In the SQL editor, run:

```sql
create table photos (
  id uuid primary key default gen_random_uuid(),
  storage_path text not null,
  caption text,
  created_at timestamptz default now()
);

-- Allow public reads and inserts (no auth)
alter table photos enable row level security;
create policy "Public read" on photos for select using (true);
create policy "Public insert" on photos for insert with check (true);
```

3. In **Storage**, create a bucket named `photos` and set it to **public**.
4. In **Storage → Policies**, add a policy allowing public uploads (INSERT for `anon` role).

### 3. Configure the party

Edit `src/config.js`:

```js
export default {
  partyName: "Your Party Name!",
  subtitle: "Snap a photo and leave a memory 🎉",
  accentColor: "#FF6B9D",        // brand color
  backgroundColor: "#FFF5F9",    // background
  siteUrl: "https://your-username.github.io/your-repo",
  prompts: [
    "Make your best silly face!",
    "Strike a superhero pose!",
    // add more...
  ]
}
```

### 4. Add environment variables

Copy `.env.example` to `.env.local` and fill in your Supabase credentials:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

Find these in your Supabase project under **Settings → API**.

For GitHub Actions deploys, add these as repository secrets (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) under **Settings → Secrets → Actions**.

### 5. Deploy to GitHub Pages

Update `vite.config.js` to match your repo name:

```js
base: '/your-repo-name/',
```

Then push to `main` — GitHub Actions will build and deploy automatically.

To deploy manually:

```bash
npm run build
npm run deploy  # deploys dist/ to gh-pages branch
```

---

## Running locally

```bash
npm run dev
```

Open [http://localhost:5173/zoey-bday/](http://localhost:5173/zoey-bday/) (adjust the base path if you changed it).

---

## Tech stack

- **React + Vite** — frontend
- **Tailwind CSS** — styling
- **Supabase** — storage (photos) + PostgreSQL (metadata) + Realtime
- **HTML5 Canvas** — client-side compositing (photo + stickers + caption)
- **GitHub Pages** — static hosting via GitHub Actions

---

## Customization

| What | Where |
|---|---|
| Party name, colors, prompts | `src/config.js` |
| Sticker set | `src/components/StickerPicker.jsx` |
| Canvas compositing logic | `src/utils/composeImage.js` |
| Routing | `src/App.jsx` |
