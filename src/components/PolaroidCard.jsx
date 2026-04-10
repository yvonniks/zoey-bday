import { useRef, useState } from 'react'
import confetti from 'canvas-confetti'
import { supabase } from '../supabaseClient'
import config from '../config'
import PhotoModal from './PhotoModal'

export default function PolaroidCard({ photo, rotation = 0 }) {
  const [modalOpen, setModalOpen] = useState(false)
  const imageUrl = supabase.storage.from('photos').getPublicUrl(photo.storage_path).data.publicUrl

  const longPressTimerRef = useRef(null)
  const suppressNextClickRef = useRef(false)

  const dateStr = photo.created_at
    ? new Date(photo.created_at).toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric',
      }).toUpperCase()
    : ''

  // ── Long-press handlers ───────────────────────────────────────────────────
  const handlePressStart = (e) => {
    longPressTimerRef.current = setTimeout(() => {
      suppressNextClickRef.current = true
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
      const rect = e.currentTarget.getBoundingClientRect()
      const x = (rect.left + rect.width / 2) / window.innerWidth
      const y = (rect.top + rect.height / 2) / window.innerHeight
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { x, y },
        colors: [config.theme.primary, config.theme.secondary, config.theme.accent, '#ff6fd8', '#fff'],
        shapes: ['star'],
        scalar: 1.2,
        startVelocity: 22,
        gravity: 0.8,
        ticks: 180,
      })
    }, 500)
  }

  const handlePressEnd = () => {
    clearTimeout(longPressTimerRef.current)
  }

  const handleClick = () => {
    if (suppressNextClickRef.current) {
      suppressNextClickRef.current = false
      return
    }
    setModalOpen(true)
  }

  return (
    <div
      className="polaroid-wrapper"
      style={{ '--rotation': `${rotation}deg`, cursor: 'pointer', touchAction: 'manipulation' }}
      onClick={handleClick}
      onMouseDown={handlePressStart}
      onMouseUp={handlePressEnd}
      onMouseLeave={handlePressEnd}
      onTouchStart={handlePressStart}
      onTouchEnd={handlePressEnd}
      onTouchCancel={handlePressEnd}
    >
      {/* Push-pin */}
      <div
        className="absolute left-1/2 -translate-x-1/2 z-10"
        style={{
          top: 0,
          width: '13px', height: '13px',
          borderRadius: '50%',
          background: `radial-gradient(circle at 35% 35%, #ffe066, ${config.theme.accent})`,
          boxShadow: `0 3px 8px rgba(0,0,0,.4), inset 0 1px 2px rgba(255,255,255,.5)`,
        }}
        aria-hidden="true"
      />

      {/* Polaroid card */}
      <div className="polaroid-card relative flex flex-col overflow-visible" style={{ padding: '10px 10px 0' }}>
        {/* Photo */}
        <img
          src={imageUrl}
          alt={photo.caption || 'Party photo'}
          className="w-full aspect-square object-cover"
          style={{ borderRadius: '1px' }}
          loading="lazy"
        />

        {/* Caption & date area */}
        <div className="flex flex-col items-center justify-center" style={{ minHeight: '52px', padding: '6px 8px 10px' }}>
          {photo.caption && (
            <p className="polaroid-caption">{photo.caption}</p>
          )}
          {dateStr && (
            <p className="polaroid-date" style={{ marginTop: photo.caption ? 2 : 0 }}>{dateStr}</p>
          )}
        </div>
      </div>

      {modalOpen && (
        <PhotoModal
          photo={photo}
          imageUrl={imageUrl}
          onClose={() => setModalOpen(false)}
        />
      )}
    </div>
  )
}
