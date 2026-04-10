# Bug Fixes & Changes Log

A running record of bugs found, root causes, and fixes applied. Separate from PRD.md which tracks features and requirements.

---

## 2026-04-10 — Mobile UX + Bug Fixes (Round 1)

### 1. Camera: No front/back camera flip
- **Symptom**: Could only use the rear camera on mobile, no way to switch to selfie mode.
- **Root cause**: `VIDEO_CONSTRAINTS` hardcoded `facingMode: 'environment'` with no UI toggle.
- **Fix**: Added `facingMode` state + a 🔄 flip button overlaid on the viewfinder (top-right corner). Tapping it toggles between `'environment'` (rear) and `'user'` (front) camera.
- **File**: `src/pages/Camera.jsx`

### 2. Camera: Shutter button and "Upload instead" cut off on iPhone
- **Symptom**: On iOS Safari, the capture button and filters were partially hidden by the URL bar and overflowing below the viewport.
- **Root cause**: `min-h-screen` uses `100vh` which doesn't account for iOS browser chrome (URL bar, home indicator). Content could overflow without scrolling.
- **Fix**: Changed to `minHeight: '100dvh'` (dynamic viewport height that adapts when browser chrome shows/hides). Main content area is now `overflow-y: auto` so all elements are reachable via scroll.
- **File**: `src/pages/Camera.jsx`

### 3. Camera: Glam filters partially hidden by iPhone URL bar
- **Symptom**: Filter bar was cut off at the bottom of the screen on small iOS devices.
- **Root cause**: Same `100vh` overflow issue as #2 above; filter bar had no overflow handling on small widths.
- **Fix**: `dvh` layout fix from #2 addresses the vertical overflow. Additionally added `overflow-x: auto` + hidden scrollbar to `.glam-filter-bar` so filters scroll horizontally on very small screens.
- **Files**: `src/pages/Camera.jsx`, `src/index.css`

### 4. Camera: Pose prompts missing emoji
- **Symptom**: Prompt text appeared without an emoji, looking sparse.
- **Root cause**: `config.prompts` were plain strings with no emoji. The prompt container only rendered the text.
- **Fix**: Changed `config.prompts` to `{ emoji, text }` objects. Camera now renders the emoji in a `<span>` on the left of the prompt bar. Typewriter effect only runs on the text portion.
- **Files**: `src/config.js`, `src/pages/Camera.jsx`

### 5. Gallery: 3rd photo flickering / disappearing on mobile
- **Symptom**: With 3 photos in the gallery, the 3rd card would appear and disappear on mobile.
- **Root cause**: `useScrollReveal` used `threshold: 0.1` — 10% of the card must be visible before revealing. On small phones, the 3rd card sits just behind the bottom nav bar (~76px), oscillating around the 10% threshold as the iOS URL bar shows/hides.
- **Fix**: Changed observer to `threshold: 0` (reveal as soon as any pixel is visible) and added `rootMargin: '0px 0px 120px 0px'` to eagerly reveal cards just below the viewport.
- **File**: `src/hooks/useScrollReveal.js`

### 6. Gallery: Tapping a photo breaks the layout
- **Symptom**: Tapping a polaroid card made the gallery layout go haywire, with cards jumping around and the modal appearing in the wrong position.
- **Root cause**: `PhotoModal` was rendered *inside* `PolaroidCard`, which is inside `.polaroid-wrapper`. That wrapper has a `filter: drop-shadow(...)` transition on hover. CSS `filter` creates a new stacking context — `position: fixed` children are positioned relative to the filtered ancestor, not the viewport. This broke modal positioning entirely.
- **Fix**: Moved `PhotoModal` to render via `ReactDOM.createPortal(...)` targeting `document.body`, escaping the filter stacking context.
- **File**: `src/components/PolaroidCard.jsx`

### 7. Gallery: Action buttons visually merged with the polaroid photo
- **Symptom**: Save / Link / Share buttons appeared to be part of the polaroid card, not clearly separate.
- **Root cause**: Buttons were inside the `.polaroid-card` div, separated only by a thin 1px border.
- **Fix**: Moved the action row to a separate container *below* the polaroid card in the modal — frosted glass style (`rgba(255,255,255,0.1)` + `backdrop-filter: blur(8px)`) with its own border-radius. Clearly distinct from the photo.
- **File**: `src/components/PhotoModal.jsx`

### 8. Gallery: "Link" button missing hover state
- **Symptom**: Save and Share buttons changed color on hover, but Link did not.
- **Root cause**: The Link button was missing the `hover:text-gray-600 transition-colors` classes that the other two had.
- **Fix**: All three action buttons now use consistent inline `onMouseEnter`/`onMouseLeave` hover handlers that lighten them on hover.
- **File**: `src/components/PhotoModal.jsx`

### 9. Gallery: Plain dark background
- **Symptom**: Gallery background was a plain solid `#12101f` with no visual interest.
- **Request**: User wanted scattered confetti/particle effect similar to a reference screenshot (pink/purple rectangles on dark).
- **Fix**: Created `ConfettiBackground.jsx` — a `<canvas>` component that animates ~35 rectangular confetti pieces in the party theme colors (`primary`, `secondary`, `accent`) drifting slowly downward. Respects `prefers-reduced-motion` (renders static if set). Added as the first child of `.gallery-page`.
- **Files**: `src/components/ConfettiBackground.jsx` (new), `src/pages/Gallery.jsx`

### 10. Gallery: Long-press starburst never fires
- **Symptom**: Holding a gallery card for 500ms on desktop or mobile never triggered the star confetti burst.
- **Root cause**: `e.currentTarget` was accessed *inside* a `setTimeout` callback. React nullifies `e.currentTarget` after the synchronous event handler returns (synthetic event cleanup). By the time the 500ms timer fired, `e.currentTarget` was `null` — `getBoundingClientRect()` threw, and no coordinates were available.
- **Fix**: Capture `const element = e.currentTarget` synchronously before the `setTimeout`, then use `element.getBoundingClientRect()` inside the callback.
- **Secondary fix**: Added `onContextMenu={(e) => e.preventDefault()}` to the polaroid wrapper to block the iOS long-press context menu from appearing before the starburst fires.
- **File**: `src/components/PolaroidCard.jsx`

### 11. Camera: "Upload instead" had no way back to camera
- **Symptom**: Once "Upload instead" was tapped, there was no escape back to the live camera view.
- **Fix**: Added a "Use camera instead" button that appears when in file-picker mode, resetting `useFilePicker` to `false`.
- **File**: `src/pages/Camera.jsx`
