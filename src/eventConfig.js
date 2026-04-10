export default {
  // ── Event identity ────────────────────────────────────────────────────────
  // Update these three fields when forking for a new event.
  eventSlug:         "zoey-bday-2026",   // URL-safe slug; used for ZIP filename
  date:              "2026-04-10",        // ISO date of the event
  storageBucketName: "photos",           // Supabase storage bucket name

  // ── Party details ────────────────────────────────────────────────────────
  partyName: "Zoey's Birthday!",
  subtitle: "Snap a photo and leave a memory 🎉",
  siteUrl: "https://yvonniks.github.io/zoey-bday",

  // ── Social sharing (update these when customizing for your event) ────────
  // Note: OG meta tags in index.html must also be updated manually (static site).
  ogDescription: "Join Zoey's birthday party photo booth! Snap a photo, add stickers, and see it in the live gallery.",
  ogImage: "https://yvonniks.github.io/zoey-bday/og-image.png", // replace with your own

  // ── Theme ────────────────────────────────────────────────────────────────
  // All colors used throughout the app. Change these to rebrand for any event.
  theme: {
    primary:       "#E91E8C",   // hot pink — buttons, key CTAs
    secondary:     "#9B59B6",   // purple — secondary accents
    accent:        "#FFB347",   // peach/gold — push-pins, highlights, confetti
    background:    "#FFF5F9",   // page background
    surface:       "#FFFFFF",   // card / UI surface
    text:          "#1a1a2e",   // default body text
    gradientStart: "#FF6B9D",   // header gradient left
    gradientEnd:   "#C44FE8",   // header gradient right
    corkboard:     true,        // set false to use plain background instead
  },

  // ── Pose prompts ─────────────────────────────────────────────────────────
  // Each prompt has an emoji (shown on the left) and text (typewriter animated).
  prompts: [
    { emoji: "😜", text: "Make your best silly face!" },
    { emoji: "🦸", text: "Strike a superhero pose!" },
    { emoji: "💃", text: "Show us your dance moves!" },
    { emoji: "🤗", text: "Hug someone next to you!" },
    { emoji: "😁", text: "Give us your biggest smile!" },
  ],

  // ── Stickers ─────────────────────────────────────────────────────────────
  // Add, remove, or swap emojis here to match your event theme.
  stickers: ["🎂", "🎉", "🎈", "🎁", "✨", "🦄", "🎊", "🌟", "💫", "🥳", "🍰", "🎀", "🎆", "🎇", "🎏", "💖"],
}
