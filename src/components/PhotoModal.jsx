import { useEffect, useState } from 'react'
import config from '../config'

export default function PhotoModal({ photo, imageUrl, onClose }) {
  const [copied, setCopied] = useState(false)
  const [entered, setEntered] = useState(false)
  const shareUrl = imageUrl

  const dateStr = photo.created_at
    ? new Date(photo.created_at).toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric',
      }).toUpperCase()
    : ''

  // Trigger entry animation on mount
  useEffect(() => {
    requestAnimationFrame(() => setEntered(true))
  }, [])

  // iOS scroll lock
  useEffect(() => {
    const prev = { overflow: document.body.style.overflow, position: document.body.style.position, width: document.body.style.width }
    document.body.style.overflow = 'hidden'
    document.body.style.position = 'fixed'
    document.body.style.width = '100%'
    return () => {
      document.body.style.overflow = prev.overflow
      document.body.style.position = prev.position
      document.body.style.width = prev.width
    }
  }, [])

  const handleDownload = async () => {
    try {
      const response = await fetch(imageUrl)
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `party-photo-${photo.id}.jpg`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      window.open(imageUrl, '_blank')
    }
  }

  const handleShare = async () => {
    try {
      await navigator.share({
        title: config.partyName,
        text: photo.caption || config.subtitle,
        url: shareUrl,
      })
    } catch {
      // User cancelled — silently ignore
    }
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard unavailable — silently ignore
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center p-4 gap-3"
      style={{ background: 'rgba(0,0,0,.82)', backdropFilter: 'blur(14px)' }}
      onClick={onClose}
    >
      {/* Dismiss button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 flex items-center justify-center rounded-full text-white"
        style={{
          width: 44, height: 44,
          background: 'rgba(255,255,255,.15)',
          fontSize: 20,
          fontWeight: 700,
        }}
        aria-label="Close"
      >
        ×
      </button>

      {/* Polaroid card — photo only, no actions inside */}
      <div
        className={entered ? 'modal-card-enter' : ''}
        style={{ opacity: entered ? undefined : 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="polaroid-card flex flex-col overflow-visible"
          style={{ padding: '12px 12px 0', width: 'min(340px, 90vw)' }}
        >
          <img
            src={imageUrl}
            alt={photo.caption || 'Party photo'}
            className="w-full aspect-square object-cover"
            style={{ borderRadius: '1px' }}
          />

          {/* Caption & date */}
          <div className="flex flex-col items-center justify-center" style={{ minHeight: '52px', padding: '8px 10px 10px' }}>
            {photo.caption && (
              <p className="polaroid-caption">{photo.caption}</p>
            )}
            {dateStr && (
              <p className="polaroid-date" style={{ marginTop: photo.caption ? 2 : 0 }}>{dateStr}</p>
            )}
          </div>
        </div>
      </div>

      {/* Action row — visually separated below the polaroid card */}
      <div
        className={`flex items-center justify-center gap-1 ${entered ? 'modal-card-enter' : ''}`}
        style={{
          opacity: entered ? undefined : 0,
          width: 'min(340px, 90vw)',
          background: 'rgba(255,255,255,.1)',
          backdropFilter: 'blur(8px)',
          borderRadius: 16,
          border: '1px solid rgba(255,255,255,.15)',
          padding: '2px 0',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={handleDownload}
          className="flex-1 flex items-center justify-center gap-1.5 font-bold transition-colors"
          style={{ minHeight: 48, fontSize: 13, color: 'rgba(255,255,255,.75)' }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#fff')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,.75)')}
          aria-label="Download photo"
        >
          ⬇ Save
        </button>

        <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,.15)' }} />

        <button
          onClick={handleCopy}
          className="flex-1 flex items-center justify-center gap-1.5 font-bold transition-colors"
          style={{
            minHeight: 48, fontSize: 13,
            color: copied ? config.theme.accent : 'rgba(255,255,255,.75)',
          }}
          onMouseEnter={(e) => { if (!copied) e.currentTarget.style.color = '#fff' }}
          onMouseLeave={(e) => { if (!copied) e.currentTarget.style.color = 'rgba(255,255,255,.75)' }}
          aria-label="Copy photo link"
        >
          {copied ? '✓ Copied' : '🔗 Link'}
        </button>

        {typeof navigator !== 'undefined' && navigator.share && (
          <>
            <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,.15)' }} />
            <button
              onClick={handleShare}
              className="flex-1 flex items-center justify-center gap-1.5 font-bold transition-colors"
              style={{ minHeight: 48, fontSize: 13, color: 'rgba(255,255,255,.75)' }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#fff')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,.75)')}
              aria-label="Share photo"
            >
              ↗ Share
            </button>
          </>
        )}
      </div>
    </div>
  )
}
