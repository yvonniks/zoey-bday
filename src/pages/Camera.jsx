import { useRef, useState, useCallback } from 'react'
import Webcam from 'react-webcam'
import { useNavigate } from 'react-router-dom'
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

  // ── Capture ────────────────────────────────────────────────────────────────

  const handleCapture = useCallback(() => {
    const imageSrc = webcamRef.current?.getScreenshot()
    if (imageSrc) setCapturedImage(imageSrc)
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
      {
        id: Date.now().toString(),
        emoji,
        xPct: 35 + Math.random() * 30,
        yPct: 25 + Math.random() * 45,
      },
    ])
  }

  const handleStickerPointerDown = (e, stickerId) => {
    e.preventDefault()
    e.stopPropagation()
    const sticker = stickers.find((s) => s.id === stickerId)
    if (!sticker) return
    const clientX = e.touches ? e.touches[0].clientX : e.clientX
    const clientY = e.touches ? e.touches[0].clientY : e.clientY
    draggingRef.current = {
      id: stickerId,
      startX: clientX,
      startY: clientY,
      origXPct: sticker.xPct,
      origYPct: sticker.yPct,
      moved: false,
    }
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
          ? {
              ...s,
              xPct: Math.max(5, Math.min(95, origXPct + dx)),
              yPct: Math.max(5, Math.min(95, origYPct + dy)),
            }
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

      navigate('/')
    } catch (err) {
      setError(err.message || 'Upload failed. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col items-center min-h-screen" style={{ backgroundColor: config.backgroundColor }}>
      {/* Header */}
      <div
        className="w-full flex items-center justify-between px-4"
        style={{
          paddingTop: 'max(0.75rem, env(safe-area-inset-top))',
          paddingBottom: '0.75rem',
        }}
      >
        <button onClick={() => navigate('/')} className="text-2xl" aria-label="Back to gallery">
          ←
        </button>
        <h1 className="text-lg font-semibold" style={{ color: config.accentColor }}>
          {config.partyName}
        </h1>
        <div className="w-8" />
      </div>

      <div className="flex-1 flex flex-col items-center w-full max-w-lg px-4 gap-4" style={{ paddingBottom: 'max(2rem, env(safe-area-inset-bottom))' }}>
        {!capturedImage ? (
          <>
            {/* Pose prompt */}
            <div className="w-full bg-white rounded-2xl px-4 py-3 shadow-sm flex items-center gap-3">
              <span className="text-xl">🎯</span>
              <p className="flex-1 text-center text-sm font-medium text-gray-700">{prompt}</p>
              <button
                onClick={() => setPrompt(randomPrompt())}
                className="text-lg leading-none"
                aria-label="New prompt"
              >
                🔀
              </button>
            </div>

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
              </div>
            ) : (
              <div
                className="w-full rounded-2xl flex flex-col items-center justify-center gap-4 py-16 cursor-pointer border-2 border-dashed"
                style={{ borderColor: config.accentColor }}
                onClick={() => fileInputRef.current?.click()}
              >
                <span className="text-5xl">📷</span>
                <p className="text-gray-500">Tap to choose a photo</p>
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

            <button
              onClick={handleCapture}
              disabled={useFilePicker}
              className="w-16 h-16 rounded-full border-4 border-white shadow-lg active:scale-95 transition-transform"
              style={{ backgroundColor: config.accentColor }}
              aria-label="Take photo"
            />

            {!useFilePicker && (
              <button onClick={() => setUseFilePicker(true)} className="text-sm text-gray-400 underline">
                Use file picker instead
              </button>
            )}
          </>
        ) : (
          <>
            {/* Photo preview with sticker overlay */}
            <div
              ref={previewRef}
              className="relative w-full rounded-2xl overflow-hidden shadow-lg select-none"
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
                    left: `${sticker.xPct}%`,
                    top: `${sticker.yPct}%`,
                    transform: 'translate(-50%, -50%)',
                    touchAction: 'none',
                    userSelect: 'none',
                  }}
                  onMouseDown={(e) => handleStickerPointerDown(e, sticker.id)}
                  onTouchStart={(e) => handleStickerPointerDown(e, sticker.id)}
                >
                  {sticker.emoji}
                </div>
              ))}
            </div>

            {stickers.length > 0 && (
              <p className="text-xs text-gray-400 -mt-2">Drag stickers to move • tap to remove</p>
            )}

            {/* Sticker button */}
            <button
              onClick={() => setStickerPickerOpen(true)}
              className="w-full py-2 rounded-xl border-2 border-dashed text-sm font-medium"
              style={{ borderColor: config.accentColor, color: config.accentColor }}
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
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2"
              style={{ '--tw-ring-color': config.accentColor }}
            />

            <div className="flex gap-3 w-full">
              <button
                onClick={handleRetake}
                disabled={uploading}
                className="flex-1 py-3 rounded-xl border border-gray-300 text-gray-600 font-medium active:scale-95 transition-transform"
              >
                Retake
              </button>
              <button
                onClick={handleUpload}
                disabled={uploading}
                className="flex-1 py-3 rounded-xl text-white font-medium active:scale-95 transition-transform disabled:opacity-60"
                style={{ backgroundColor: config.accentColor }}
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
        <div className="fixed bottom-6 left-4 right-4 z-50 flex items-center justify-between gap-3 bg-gray-900 text-white text-sm rounded-2xl px-4 py-3 shadow-xl"
          style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
        >
          <span className="flex-1">⚠️ {error}</span>
          <button
            onClick={() => { setError(null); handleUpload() }}
            className="font-semibold underline whitespace-nowrap"
          >
            Retry
          </button>
          <button onClick={() => setError(null)} aria-label="Dismiss" className="text-gray-400 text-lg leading-none">
            ✕
          </button>
        </div>
      )}
    </div>
  )
}
