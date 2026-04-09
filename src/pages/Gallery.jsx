import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import config from '../config'
import PolaroidCard from '../components/PolaroidCard'
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
      className={`break-inside-avoid scroll-reveal${photo._isNew ? ' polaroid-drop-in' : ''}`}
      style={{ '--card-rotation': `${photo._rotation}deg` }}
    >
      <PolaroidCard photo={photo} rotation={photo._rotation} />
    </div>
  )
}

export default function Gallery() {
  const [photos, setPhotos] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
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
      })
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [])

  return (
    <div className="gallery-page flex flex-col min-h-screen">

      {/* ── Hero header ──────────────────────────────────────────────────────── */}
      <div
        className="gallery-hero flex-shrink-0"
        style={{
          paddingTop: 'max(3.5rem, env(safe-area-inset-top))',
          paddingBottom: '1.75rem',
          paddingLeft: '1.5rem',
          paddingRight: '1.5rem',
        }}
      >
        {/* QR button — top right */}
        <div className="flex justify-end mb-3 relative z-10">
          <button
            onClick={() => navigate('/qr')}
            className="px-4 py-1.5 rounded-full text-sm font-bold border-2 border-white/40 text-white/80 hover:border-white hover:text-white transition-colors active:scale-95"
            aria-label="View QR Code"
          >
            QR
          </button>
        </div>

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
        style={{ paddingBottom: 'calc(76px + env(safe-area-inset-bottom) + 1.5rem)' }}
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
          <div className="columns-2 sm:columns-3 lg:columns-4 gap-4 space-y-5">
            {photos.map((photo) => (
              <RevealCard key={photo.id} photo={photo} />
            ))}
          </div>
        )}
      </div>

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
