import { useRef, useState, useCallback } from 'react'
import Webcam from 'react-webcam'
import { useNavigate } from 'react-router-dom'
import confetti from 'canvas-confetti'
import { supabase } from '../supabaseClient'
import config from '../config'
import { composeImage } from '../utils/composeImage'
import StickerPicker from '../components/StickerPicker'

const VIDEO_CONSTRAINTS = {
  facingMode: { ideal: 'environment' },
  width: { ideal: 1280 },
  height: { ideal: 960 },
}

function randomPrompt() {
  const { prompts } = config
  return prompts[Math.floor(Math.random() * prompts.length)]
}

function prefersReducedMotion() {
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
}

export default function Camera() {
  const webcamRef = useRef(null)
  const fileInputRef = useRef(null)
  const previewRef = useRef(null)
  const draggingRef = useRef(null)
  const navigate = useNavigate()

  const [capturedImage, setCapturedImage] = useState(null)
  const [caption, setCaption] = useState('')
  const [stickers, setStickers] = useState([])
  const [stickerPickerOpen, setStickerPickerOpen] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState(null)
  const [useFilePicker, setUseFilePicker] = useState(false)
  const [prompt, setPrompt] = useState(randomPrompt)
  const [flashing, setFlashing] = useState(false)

  const isDark = !capturedImage  // dark theme for viewfinder, light for preview

  // ── Capture ────────────────────────────────────────────────────────────────

  const handleCapture = useCallback(() => {
    const imageSrc = webcamRef.current?.getScreenshot()
    if (imageSrc) {
      if (!prefersReducedMotion()) setFlashing(true)
      setCapturedImage(imageSrc)
    }
  }, [])

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => setCapturedImage(ev.target.result)
    reader.readAsDataURL(file)
  }

  const handleRetake = () => {
    setCapturedImage(null)
    setCaption('')
    setStickers([])
    setError(null)
  }

  // ── Sticker placement ──────────────────────────────────────────────────────

  const handleAddSticker = (emoji) => {
    setStickers((prev) => [
      ...prev,
      { id: Date.now().toString(), emoji, xPct: 35 + Math.random() * 30, yPct: 25 + Math.random() * 45 },
    ])
  }

  const handleStickerPointerDown = (e, stickerId) => {
    e.preventDefault()
    e.stopPropagation()
    const sticker = stickers.find((s) => s.id === stickerId)
    if (!sticker) return
    const clientX = e.touches ? e.touches[0].clientX : e.clientX
    const clientY = e.touches ? e.touches[0].clientY : e.clientY
    draggingRef.current = { id: stickerId, startX: clientX, startY: clientY, origXPct: sticker.xPct, origYPct: sticker.yPct, moved: false }
  }

  const handleContainerPointerMove = (e) => {
    if (!draggingRef.current) return
    const rect = previewRef.current?.getBoundingClientRect()
    if (!rect) return
    const clientX = e.touches ? e.touches[0].clientX : e.clientX
    const clientY = e.touches ? e.touches[0].clientY : e.clientY
    const dx = ((clientX - draggingRef.current.startX) / rect.width) * 100
    const dy = ((clientY - draggingRef.current.startY) / rect.height) * 100
    if (Math.abs(dx) > 2 || Math.abs(dy) > 2) draggingRef.current.moved = true
    const { id, origXPct, origYPct } = draggingRef.current
    setStickers((prev) =>
      prev.map((s) =>
        s.id === id
          ? { ...s, xPct: Math.max(5, Math.min(95, origXPct + dx)), yPct: Math.max(5, Math.min(95, origYPct + dy)) }
          : s
      )
    )
  }

  const handleContainerPointerUp = () => {
    if (!draggingRef.current) return
    if (!draggingRef.current.moved) {
      const id = draggingRef.current.id
      setStickers((prev) => prev.filter((s) => s.id !== id))
    }
    draggingRef.current = null
  }

  // ── Upload ─────────────────────────────────────────────────────────────────

  const handleUpload = async () => {
    if (!capturedImage) return
    setUploading(true)
    setError(null)
    try {
      const blob = await composeImage(capturedImage, stickers, caption)
      const filename = `photo_${Date.now()}.jpg`
      const { error: storageError } = await supabase.storage
        .from('photos')
        .upload(filename, blob, { contentType: 'image/jpeg', upsert: false })
      if (storageError) throw storageError

      const { error: dbError } = await supabase
        .from('photos')
        .insert({ storage_path: filename, caption: caption.trim() || null })
      if (dbError) throw dbError

      if (!prefersReducedMotion()) {
        confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 }, colors: [config.theme.primary, config.theme.secondary, config.theme.accent] })
      }

      navigate('/')
    } catch (err) {
      setError(err.message || 'Upload failed. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div
      className="flex flex-col min-h-screen"
      style={{ background: isDark ? '#0d0d14' : '#FFF5E6', transition: 'background 0.3s ease' }}
    >
      {/* Capture flash overlay */}
      {flashing && (
        <div
          className="camera-flash fixed inset-0 z-50 bg-white pointer-events-none"
          onAnimationEnd={() => setFlashing(false)}
        />
      )}

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div
        className="w-full flex items-center justify-between px-4 relative z-10"
        style={{ paddingTop: 'max(0.9rem, env(safe-area-inset-top))', paddingBottom: '0.75rem' }}
      >
        <button
          onClick={() => navigate('/')}
          className="flex items-center justify-center rounded-full"
          style={{
            width: 40, height: 40,
            background: isDark ? 'rgba(255,255,255,.1)' : 'rgba(0,0,0,.06)',
            border: isDark ? '1px solid rgba(255,255,255,.12)' : 'none',
            color: isDark ? '#fff' : config.theme.text,
            fontSize: 16,
          }}
          aria-label="Back to gallery"
        >
          ←
        </button>

        <h1
          style={{
            fontFamily: "'Fredoka', sans-serif",
            fontSize: '1.3rem',
            fontWeight: 600,
            color: isDark ? '#fff' : config.theme.primary,
          }}
        >
          {config.partyName}
        </h1>

        <div style={{ width: 40 }} />
      </div>

      {/* ── Main content ────────────────────────────────────────────────────── */}
      <div
        className="flex-1 flex flex-col items-center w-full max-w-lg mx-auto px-4 gap-4"
        style={{ paddingBottom: 'max(2rem, env(safe-area-inset-bottom))' }}
      >
        {!capturedImage ? (
          <>
            {/* Pose prompt */}
            <div
              className="w-full rounded-2xl px-4 py-3 flex items-center gap-3"
              style={{
                background: isDark ? 'rgba(255,255,255,.08)' : '#fff',
                border: isDark ? '1px solid rgba(255,255,255,.1)' : '1px solid rgba(0,0,0,.06)',
                backdropFilter: isDark ? 'blur(8px)' : undefined,
              }}
            >
              <span className="text-xl">🎯</span>
              <p
                className="flex-1 text-center text-sm"
                style={{ fontWeight: 700, color: isDark ? 'rgba(255,255,255,.8)' : '#444' }}
              >
                {prompt}
              </p>
              <button
                onClick={() => setPrompt(randomPrompt())}
                className="flex items-center justify-center"
                style={{ width: 44, height: 44, fontSize: 18 }}
                aria-label="New prompt"
              >
                🔀
              </button>
            </div>

            {/* Viewfinder */}
            {!useFilePicker ? (
              <div className="relative w-full rounded-2xl overflow-hidden bg-black">
                <Webcam
                  ref={webcamRef}
                  audio={false}
                  screenshotFormat="image/jpeg"
                  videoConstraints={VIDEO_CONSTRAINTS}
                  className="w-full"
                  onUserMediaError={() => setUseFilePicker(true)}
                />
                {/* Corner brackets */}
                <div className="vf-bracket tl" />
                <div className="vf-bracket tr" />
                <div className="vf-bracket bl" />
                <div className="vf-bracket br" />
              </div>
            ) : (
              /* File picker with atmospheric dark orb background */
              <div
                className="w-full rounded-2xl relative overflow-hidden flex flex-col items-center justify-center gap-4 cursor-pointer"
                style={{
                  background: 'linear-gradient(155deg, #131b2e 0%, #0d1a2a 45%, #0a1f18 100%)',
                  minHeight: '260px',
                  border: `2px dashed ${config.theme.primary}60`,
                }}
                onClick={() => fileInputRef.current?.click()}
              >
                {/* Atmospheric orbs */}
                <div className="vf-orb" style={{ width: 190, height: 190, background: 'rgba(233,30,140,.13)', top: -55, left: -55, '--d': '5s', '--mx': '30px', '--my': '22px' }} />
                <div className="vf-orb" style={{ width: 155, height: 155, background: 'rgba(155,89,182,.11)', bottom: -25, right: -30, '--d': '4.5s', '--dl': '-2.2s', '--mx': '-22px', '--my': '-28px' }} />
                <div className="vf-orb" style={{ width: 100, height: 100, background: 'rgba(255,179,71,.09)', top: '40%', left: '50%', '--d': '6s', '--dl': '-1.2s', '--mx': '20px', '--my': '-15px' }} />

                {/* Viewfinder brackets */}
                <div className="vf-bracket tl" />
                <div className="vf-bracket tr" />
                <div className="vf-bracket bl" />
                <div className="vf-bracket br" />

                <span className="text-5xl relative z-10">📷</span>
                <p className="font-bold relative z-10" style={{ color: 'rgba(255,255,255,.6)', fontSize: 14 }}>Tap to choose a photo</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </div>
            )}

            {/* Shutter button */}
            <div className="flex flex-col items-center gap-2">
              <button
                onClick={handleCapture}
                disabled={useFilePicker}
                className="relative"
                style={{
                  width: 82, height: 82,
                  background: 'rgba(255,255,255,.12)',
                  border: '4px solid rgba(255,255,255,.55)',
                  borderRadius: '50%',
                  cursor: useFilePicker ? 'default' : 'pointer',
                  opacity: useFilePicker ? 0.4 : 1,
                }}
                aria-label="Take photo"
              >
                <div style={{
                  position: 'absolute', top: 5, left: 5, right: 5, bottom: 5,
                  background: '#fff', borderRadius: '50%',
                  boxShadow: 'inset 0 2px 4px rgba(0,0,0,.14)',
                }} />
              </button>

              {!useFilePicker && (
                <button
                  onClick={() => setUseFilePicker(true)}
                  className="text-sm underline"
                  style={{ color: 'rgba(255,255,255,.35)', fontWeight: 600 }}
                >
                  Use file picker instead
                </button>
              )}
            </div>
          </>
        ) : (
          <>
            {/* Photo preview with sticker overlay */}
            <div
              ref={previewRef}
              className="relative w-full rounded-2xl overflow-hidden shadow-xl select-none"
              onMouseMove={handleContainerPointerMove}
              onTouchMove={handleContainerPointerMove}
              onMouseUp={handleContainerPointerUp}
              onTouchEnd={handleContainerPointerUp}
              onMouseLeave={handleContainerPointerUp}
            >
              <img src={capturedImage} alt="Preview" className="w-full block" draggable={false} />
              {stickers.map((sticker) => (
                <div
                  key={sticker.id}
                  className="absolute text-4xl leading-none cursor-grab active:cursor-grabbing"
                  style={{
                    left: `${sticker.xPct}%`, top: `${sticker.yPct}%`,
                    transform: 'translate(-50%, -50%)',
                    touchAction: 'none', userSelect: 'none',
                  }}
                  onMouseDown={(e) => handleStickerPointerDown(e, sticker.id)}
                  onTouchStart={(e) => handleStickerPointerDown(e, sticker.id)}
                >
                  {sticker.emoji}
                </div>
              ))}
            </div>

            {stickers.length > 0 && (
              <p className="text-xs -mt-2" style={{ color: '#aaa', fontWeight: 600 }}>
                Drag stickers to move • tap to remove
              </p>
            )}

            {/* Sticker button */}
            <button
              onClick={() => setStickerPickerOpen(true)}
              className="w-full py-2.5 rounded-xl border-2 border-dashed font-bold"
              style={{ borderColor: config.theme.primary, color: config.theme.primary, fontSize: 14 }}
              aria-expanded={stickerPickerOpen}
            >
              + Add Sticker
            </button>

            {/* Caption */}
            <input
              type="text"
              placeholder="Add a caption… (optional)"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              maxLength={120}
              className="w-full border rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2"
              style={{
                borderColor: 'rgba(0,0,0,.12)',
                '--tw-ring-color': config.theme.primary,
                fontFamily: "'Nunito', sans-serif",
                fontWeight: 600,
              }}
            />

            {/* Action buttons */}
            <div className="flex gap-3 w-full">
              <button
                onClick={handleRetake}
                disabled={uploading}
                className="flex-1 py-3 rounded-xl font-bold active:scale-95 transition-transform"
                style={{ border: '2px solid rgba(0,0,0,.12)', color: '#666', fontSize: 15 }}
              >
                Retake
              </button>
              <button
                onClick={handleUpload}
                disabled={uploading}
                className="flex-1 py-3 rounded-xl text-white font-bold active:scale-95 transition-transform disabled:opacity-60"
                style={{
                  background: `linear-gradient(135deg, ${config.theme.primary}, ${config.theme.secondary})`,
                  boxShadow: `0 6px 20px ${config.theme.primary}50`,
                  fontFamily: "'Fredoka', sans-serif",
                  fontSize: 18,
                }}
              >
                {uploading ? 'Posting…' : 'Post 🎉'}
              </button>
            </div>
          </>
        )}
      </div>

      <StickerPicker
        open={stickerPickerOpen}
        onSelect={handleAddSticker}
        onClose={() => setStickerPickerOpen(false)}
      />

      {/* Upload error toast */}
      {error && (
        <div
          role="alert"
          className="fixed bottom-6 left-4 right-4 z-50 flex items-center justify-between gap-3 text-white text-sm rounded-2xl px-4 py-3 shadow-xl"
          style={{
            background: 'rgba(26,26,46,.95)',
            backdropFilter: 'blur(12px)',
            paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))',
          }}
        >
          <span className="flex-1">⚠️ {error}</span>
          <button onClick={() => { setError(null); handleUpload() }} className="font-bold underline whitespace-nowrap">
            Retry
          </button>
          <button
            onClick={() => setError(null)}
            aria-label="Dismiss error"
            className="flex items-center justify-center text-gray-400 text-lg"
            style={{ minWidth: 44, minHeight: 44 }}
          >
            ✕
          </button>
        </div>
      )}
    </div>
  )
}
