import { useEffect, useRef, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import config from '../eventConfig'

const INTERVAL_MS = 5000

export default function Slideshow() {
  const [photos, setPhotos] = useState([])
  const [currentIdx, setCurrentIdx] = useState(0)
  const [visible, setVisible] = useState(true) // drives crossfade
  const [loading, setLoading] = useState(true)
  const [paused, setPaused] = useState(false)
  const intervalRef = useRef(null)
  const resumeTimerRef = useRef(null)
  const navigate = useNavigate()

  // ── Data ───────────────────────────────────────────────────────────────────

  useEffect(() => {
    const fetchPhotos = async () => {
      const { data, error } = await supabase
        .from('photos')
        .select('*')
        .order('created_at', { ascending: true })
      if (!error && data.length > 0) setPhotos(data)
      setLoading(false)
    }
    fetchPhotos()

    // Realtime: append new photos to end (don't disrupt current slide)
    const channel = supabase
      .channel('photos-slideshow')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'photos' }, (payload) => {
        setPhotos((prev) => [...prev, payload.new])
      })
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [])

  // ── Auto-advance ───────────────────────────────────────────────────────────

  const advance = useCallback((delta) => {
    if (photos.length <= 1) return
    // Fade out → change → fade in
    setVisible(false)
    setTimeout(() => {
      setCurrentIdx((i) => (i + delta + photos.length) % photos.length)
      setVisible(true)
    }, 300)
  }, [photos.length])

  useEffect(() => {
    if (paused || photos.length <= 1) return
    intervalRef.current = setInterval(() => advance(1), INTERVAL_MS)
    return () => clearInterval(intervalRef.current)
  }, [paused, photos.length, advance])

  // ── Keyboard navigation ────────────────────────────────────────────────────

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'ArrowRight') handleNext()
      if (e.key === 'ArrowLeft') handlePrev()
      if (e.key === ' ') { e.preventDefault(); togglePause() }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  // ── User interaction helpers ───────────────────────────────────────────────

  const pauseTemporarily = () => {
    clearInterval(intervalRef.current)
    clearTimeout(resumeTimerRef.current)
    setPaused(true)
    resumeTimerRef.current = setTimeout(() => setPaused(false), INTERVAL_MS)
  }

  const handlePrev = () => { pauseTemporarily(); advance(-1) }
  const handleNext = () => { pauseTemporarily(); advance(1) }
  const togglePause = () => {
    clearTimeout(resumeTimerRef.current)
    setPaused((p) => !p)
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  const current = photos[currentIdx]
  const imageUrl = current
    ? supabase.storage.from(config.storageBucketName).getPublicUrl(current.storage_path).data.publicUrl
    : null

  const dateStr = current?.created_at
    ? new Date(current.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase()
    : ''

  return (
    <div
      style={{
        position: 'fixed', inset: 0,
        background: '#0d0d14',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}
    >
      {/* ── Top controls ──────────────────────────────────────────────────── */}
      <div
        style={{
          position: 'absolute',
          top: 0, left: 0, right: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: 'max(1rem, env(safe-area-inset-top)) 1.25rem 0.75rem',
          background: 'linear-gradient(to bottom, rgba(0,0,0,.6) 0%, transparent 100%)',
          zIndex: 10,
        }}
      >
        <button
          onClick={() => navigate('/')}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            color: 'rgba(255,255,255,.7)',
            fontSize: 13, fontWeight: 700,
            fontFamily: "'Fredoka', sans-serif",
            background: 'rgba(255,255,255,.1)',
            border: '1px solid rgba(255,255,255,.15)',
            borderRadius: 20,
            padding: '6px 14px',
            minHeight: 36,
          }}
        >
          ← Gallery
        </button>

        <span style={{
          color: 'rgba(255,255,255,.5)',
          fontSize: 12, fontWeight: 700,
          fontFamily: "'Fredoka', sans-serif",
          letterSpacing: '.5px',
        }}>
          {config.partyName}
        </span>

        <button
          onClick={togglePause}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: 36, height: 36,
            color: 'rgba(255,255,255,.7)',
            fontSize: 16,
            background: 'rgba(255,255,255,.1)',
            border: '1px solid rgba(255,255,255,.15)',
            borderRadius: '50%',
          }}
          aria-label={paused ? 'Play slideshow' : 'Pause slideshow'}
        >
          {paused ? '▶' : '⏸'}
        </button>
      </div>

      {/* ── Main photo ────────────────────────────────────────────────────── */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          <span style={{ fontSize: 48 }} className="animate-spin">🎉</span>
          <p style={{ color: 'rgba(255,255,255,.4)', fontSize: 13, fontWeight: 700 }}>Loading memories…</p>
        </div>
      ) : photos.length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, textAlign: 'center' }}>
          <span style={{ fontSize: 56 }}>🎈</span>
          <p style={{ color: 'rgba(255,255,255,.55)', fontSize: 18, fontWeight: 700 }}>No photos yet</p>
          <button
            onClick={() => navigate('/camera')}
            style={{
              padding: '12px 24px',
              borderRadius: 16,
              background: `linear-gradient(135deg, ${config.theme.primary}, ${config.theme.secondary})`,
              color: '#fff',
              fontWeight: 700,
              fontSize: 15,
              fontFamily: "'Fredoka', sans-serif",
            }}
          >
            📷 Take the first photo
          </button>
        </div>
      ) : (
        <>
          {/* Photo + nav arrows */}
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 0, width: '100%', justifyContent: 'center' }}>
            {/* Prev arrow */}
            <button
              onClick={handlePrev}
              style={{
                position: 'absolute', left: 'max(0.75rem, env(safe-area-inset-left))',
                zIndex: 5,
                width: 48, height: 48,
                borderRadius: '50%',
                background: 'rgba(255,255,255,.1)',
                border: '1px solid rgba(255,255,255,.15)',
                color: 'rgba(255,255,255,.7)',
                fontSize: 20,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}
              aria-label="Previous photo"
            >
              ‹
            </button>

            {/* Polaroid */}
            <div
              style={{
                opacity: visible ? 1 : 0,
                transition: 'opacity 300ms ease',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 0,
              }}
            >
              <div
                className="polaroid-card"
                style={{
                  padding: '16px 16px 0',
                  width: 'min(380px, calc(100vw - 120px))',
                  boxShadow: '0 24px 80px rgba(0,0,0,.7)',
                }}
              >
                {imageUrl && (
                  <img
                    key={currentIdx}
                    src={imageUrl}
                    alt={current.caption || 'Party photo'}
                    style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', borderRadius: '1px', display: 'block' }}
                  />
                )}
                <div style={{ minHeight: 60, padding: '10px 12px 14px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  {current.caption && (
                    <p className="polaroid-caption">{current.caption}</p>
                  )}
                  {dateStr && (
                    <p className="polaroid-date" style={{ marginTop: current.caption ? 2 : 0 }}>{dateStr}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Next arrow */}
            <button
              onClick={handleNext}
              style={{
                position: 'absolute', right: 'max(0.75rem, env(safe-area-inset-right))',
                zIndex: 5,
                width: 48, height: 48,
                borderRadius: '50%',
                background: 'rgba(255,255,255,.1)',
                border: '1px solid rgba(255,255,255,.15)',
                color: 'rgba(255,255,255,.7)',
                fontSize: 20,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}
              aria-label="Next photo"
            >
              ›
            </button>
          </div>

          {/* ── Dot indicators ────────────────────────────────────────────── */}
          <div
            style={{
              position: 'absolute',
              bottom: 'max(1.5rem, env(safe-area-inset-bottom))',
              left: 0, right: 0,
              display: 'flex',
              justifyContent: 'center',
              gap: 6,
              flexWrap: 'wrap',
              padding: '0 2rem',
              maxHeight: 40,
              overflow: 'hidden',
            }}
          >
            {photos.slice(0, 40).map((_, i) => (
              <button
                key={i}
                onClick={() => { pauseTemporarily(); setCurrentIdx(i) }}
                style={{
                  width: i === currentIdx ? 20 : 7,
                  height: 7,
                  borderRadius: 4,
                  background: i === currentIdx ? config.theme.primary : 'rgba(255,255,255,.25)',
                  transition: 'all .3s ease',
                  flexShrink: 0,
                }}
                aria-label={`Go to photo ${i + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
