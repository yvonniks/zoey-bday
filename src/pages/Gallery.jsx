import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import confetti from 'canvas-confetti'
import { supabase } from '../supabaseClient'
import config from '../config'
import PolaroidCard from '../components/PolaroidCard'
import ConfettiBackground from '../components/ConfettiBackground'
import { useScrollReveal } from '../hooks/useScrollReveal'

function randomRotation() {
  return (Math.random() * 8 - 4).toFixed(2)
}

function withMeta(photo, isNew = false) {
  return { ...photo, _isNew: isNew, _rotation: randomRotation() }
}

function RevealCard({ photo }) {
  const ref = useRef(null)
  useScrollReveal(ref)
  return (
    <div
      ref={ref}
      className={`break-inside-avoid mb-4 ${photo._isNew ? 'polaroid-drop-in' : 'scroll-reveal'}`}
      style={{ '--card-rotation': `${photo._rotation}deg` }}
    >
      <PolaroidCard photo={photo} rotation={photo._rotation} />
    </div>
  )
}

export default function Gallery() {
  const [photos, setPhotos] = useState([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState(null) // { message, exiting }
  const confettiFiredRef = useRef(false)
  const toastTimerRef = useRef(null)
  const navigate = useNavigate()

  const showToast = (message) => {
    clearTimeout(toastTimerRef.current)
    setToast({ message, exiting: false })
    toastTimerRef.current = setTimeout(() => {
      setToast((t) => t ? { ...t, exiting: true } : null)
      toastTimerRef.current = setTimeout(() => setToast(null), 300)
    }, 3000)
  }

  useEffect(() => {
    // Entry confetti on every gallery visit
    if (!confettiFiredRef.current && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      confettiFiredRef.current = true
      setTimeout(() => {
        confetti({
          particleCount: 80,
          spread: 100,
          origin: { y: 0.3 },
          colors: [config.theme.primary, config.theme.secondary, config.theme.accent, '#ffffff'],
          startVelocity: 28,
          gravity: 0.9,
          ticks: 200,
        })
      }, 350)
    }

    const fetchPhotos = async () => {
      const { data, error } = await supabase
        .from('photos')
        .select('*')
        .order('created_at', { ascending: false })
      if (!error) setPhotos(data.map((p) => withMeta(p, false)))
      setLoading(false)
    }
    fetchPhotos()

    const channel = supabase
      .channel('photos-gallery')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'photos' }, (payload) => {
        setPhotos((prev) => [withMeta(payload.new, true), ...prev])
        showToast('📸 A new memory just landed!')
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
      clearTimeout(toastTimerRef.current)
    }
  }, [])

  return (
    <div className="gallery-page flex flex-col min-h-screen" style={{ position: 'relative' }}>
      {/* Animated confetti background — sits behind all content */}
      <ConfettiBackground />

      {/* ── Hero header ──────────────────────────────────────────────────────── */}
      <div
        className="gallery-hero flex-shrink-0"
        style={{
          position: 'relative', zIndex: 1,
          paddingTop: 'max(2.5rem, env(safe-area-inset-top))',
          paddingBottom: '1.1rem',
          paddingLeft: '1.5rem',
          paddingRight: '1.5rem',
        }}
      >
        {/* Party name */}
        <h1 className="gallery-title">{config.partyName}</h1>
        <p className="gallery-subtitle">{config.subtitle}</p>

        {/* Photo count pill */}
        {!loading && photos.length > 0 && (
          <div
            className="inline-flex items-center gap-1.5 mt-3 px-3 py-1 rounded-full relative z-10"
            style={{ background: 'rgba(0,0,0,.2)', color: 'rgba(255,255,255,.7)', fontSize: '11px', fontWeight: 700 }}
          >
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#4eff91', display: 'inline-block', animation: 'none' }} />
            {photos.length} {photos.length === 1 ? 'photo' : 'photos'} shared
          </div>
        )}
      </div>

      {/* ── Gallery grid ─────────────────────────────────────────────────────── */}
      <div
        className="flex-1 px-3 pt-5"
        style={{ position: 'relative', zIndex: 1, paddingBottom: 'calc(76px + env(safe-area-inset-bottom) + 1.5rem)' }}
      >
        {loading ? (
          <div className="flex flex-col items-center justify-center gap-4 h-64">
            <span className="text-5xl animate-spin">🎉</span>
            <p style={{ color: 'rgba(255,255,255,.4)', fontSize: 13, fontWeight: 700 }}>Loading memories…</p>
          </div>
        ) : photos.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 h-64 text-center">
            <span className="text-6xl">🎈</span>
            <p style={{ color: 'rgba(255,255,255,.55)', fontSize: 17, fontWeight: 700 }}>
              No photos yet — be the first!
            </p>
            <button
              onClick={() => navigate('/camera')}
              className="px-6 py-3 rounded-2xl font-bold text-white active:scale-95 transition-transform"
              style={{ background: `linear-gradient(135deg, ${config.theme.primary}, ${config.theme.secondary})`, fontSize: 15 }}
            >
              📷 Take the first photo
            </button>
          </div>
        ) : (
          <div className="columns-2 sm:columns-3 lg:columns-4 gap-4">
            {photos.map((photo) => (
              <RevealCard key={photo.id} photo={photo} />
            ))}
          </div>
        )}
      </div>

      {/* ── New photo toast ──────────────────────────────────────────────────── */}
      {toast && (
        <div
          className={`fixed top-4 left-1/2 z-50 px-5 py-2.5 rounded-2xl text-white font-bold shadow-xl pointer-events-none ${toast.exiting ? 'toast-exit' : 'toast-enter'}`}
          style={{
            transform: 'translateX(-50%)',
            background: `linear-gradient(135deg, ${config.theme.primary}, ${config.theme.secondary})`,
            fontFamily: "'Fredoka', sans-serif",
            fontSize: 15,
            whiteSpace: 'nowrap',
            marginTop: 'env(safe-area-inset-top)',
          }}
          aria-live="polite"
        >
          {toast.message}
        </div>
      )}

      {/* ── Bottom nav ───────────────────────────────────────────────────────── */}
      <div className="bottom-nav">
        {/* Gallery tab (active) */}
        <div className="bottom-nav-item">
          <span className="bottom-nav-icon">🖼️</span>
          <span className="bottom-nav-label active">Gallery</span>
        </div>

        {/* Floating camera button */}
        <div className="bottom-nav-cam-wrap">
          <button
            className="bottom-nav-cam"
            onClick={() => navigate('/camera')}
            aria-label="Take a photo"
          >
            📷
          </button>
        </div>

        {/* QR tab */}
        <div className="bottom-nav-item" onClick={() => navigate('/qr')} style={{ cursor: 'pointer' }}>
          <span className="bottom-nav-icon">📲</span>
          <span className="bottom-nav-label">Share</span>
        </div>
      </div>
    </div>
  )
}
