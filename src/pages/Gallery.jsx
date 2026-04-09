import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import config from '../config'
import PolaroidCard from '../components/PolaroidCard'

function randomRotation() {
  // Between -4 and +4 degrees
  return (Math.random() * 8 - 4).toFixed(2)
}

function withMeta(photo, isNew = false) {
  return { ...photo, _isNew: isNew, _rotation: randomRotation() }
}

export default function Gallery() {
  const [photos, setPhotos] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    // Initial fetch — newest first
    const fetchPhotos = async () => {
      const { data, error } = await supabase
        .from('photos')
        .select('*')
        .order('created_at', { ascending: false })
      if (!error) setPhotos(data.map((p) => withMeta(p, false)))
      setLoading(false)
    }
    fetchPhotos()

    // Realtime subscription — new inserts prepend to gallery with drop-in animation
    const channel = supabase
      .channel('photos-gallery')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'photos' }, (payload) => {
        setPhotos((prev) => [withMeta(payload.new, true), ...prev])
      })
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [])

  return (
    <div className="flex flex-col min-h-screen" style={{ backgroundColor: config.backgroundColor }}>
      {/* Header */}
      <div
        className="sticky top-0 z-10 w-full px-4 flex items-center justify-between shadow-sm"
        style={{
          backgroundColor: config.backgroundColor,
          paddingTop: 'max(1rem, env(safe-area-inset-top))',
          paddingBottom: '1rem',
        }}
      >
        <div>
          <h1 className="text-xl font-bold leading-tight" style={{ color: config.accentColor }}>
            {config.partyName}
          </h1>
          <p className="text-xs text-gray-400">{config.subtitle}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/qr')}
            className="px-3 py-2 rounded-full text-sm font-semibold border active:scale-95 transition-transform"
            style={{ borderColor: config.accentColor, color: config.accentColor }}
            aria-label="QR Code"
          >
            QR
          </button>
          <button
          onClick={() => navigate('/camera')}
          className="flex items-center gap-2 px-4 py-2 rounded-full text-white text-sm font-semibold shadow active:scale-95 transition-transform"
          style={{ backgroundColor: config.accentColor }}
        >
          📷 Add Photo
        </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-3" style={{ paddingBottom: 'max(2rem, env(safe-area-inset-bottom))' }}>
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <span className="text-4xl animate-spin">🎉</span>
          </div>
        ) : photos.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-4 h-64 text-center">
            <span className="text-6xl">🎈</span>
            <p className="text-gray-400 text-lg">No photos yet — be the first!</p>
          </div>
        ) : (
          <div className="columns-2 sm:columns-3 gap-3 space-y-3 pt-3">
            {photos.map((photo) => (
              <div
                key={photo.id}
                className={`break-inside-avoid${photo._isNew ? ' polaroid-drop-in' : ''}`}
                style={{ '--card-rotation': `${photo._rotation}deg` }}
              >
                <PolaroidCard photo={photo} rotation={photo._rotation} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
