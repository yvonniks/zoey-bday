import { useState } from 'react'
import { supabase } from '../supabaseClient'
import config from '../config'

export default function PolaroidCard({ photo, rotation = 0 }) {
  const [copied, setCopied] = useState(false)
  const imageUrl = supabase.storage.from('photos').getPublicUrl(photo.storage_path).data.publicUrl
  const shareUrl = imageUrl

  const dateStr = photo.created_at
    ? new Date(photo.created_at).toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric',
      }).toUpperCase()
    : ''

  // ── Download ──────────────────────────────────────────────────────────────
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

  // ── Share (Web Share API) ─────────────────────────────────────────────────
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

  // ── Copy link ─────────────────────────────────────────────────────────────
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
      className="polaroid-wrapper"
      style={{ '--rotation': `${rotation}deg` }}
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

        {/* Caption & date area — fixed height "label" below photo */}
        <div className="flex flex-col items-center justify-center" style={{ minHeight: '52px', padding: '6px 8px 4px' }}>
          {photo.caption && (
            <p className="polaroid-caption">{photo.caption}</p>
          )}
          {dateStr && (
            <p className="polaroid-date" style={{ marginTop: photo.caption ? 2 : 0 }}>{dateStr}</p>
          )}
        </div>

        {/* Action row */}
        <div
          className="flex items-center justify-center gap-0"
          style={{ borderTop: '1px solid rgba(0,0,0,.06)', padding: '4px 0 8px' }}
        >
          <button
            onClick={handleDownload}
            className="flex-1 flex items-center justify-center gap-1 text-gray-400 hover:text-gray-600 transition-colors"
            style={{ minHeight: 36, fontSize: 11, fontWeight: 700 }}
            aria-label="Download photo"
          >
            ⬇ Save
          </button>

          <div style={{ width: 1, height: 16, background: 'rgba(0,0,0,.08)' }} />

          <button
            onClick={handleCopy}
            className="flex-1 flex items-center justify-center transition-colors"
            style={{
              minHeight: 36, fontSize: 11, fontWeight: 700,
              color: copied ? config.theme.primary : '#9ca3af',
            }}
            aria-label="Copy photo link"
          >
            {copied ? '✓ Copied' : '🔗 Link'}
          </button>

          {typeof navigator !== 'undefined' && navigator.share && (
            <>
              <div style={{ width: 1, height: 16, background: 'rgba(0,0,0,.08)' }} />
              <button
                onClick={handleShare}
                className="flex-1 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
                style={{ minHeight: 36, fontSize: 11, fontWeight: 700 }}
                aria-label="Share photo"
              >
                ↗ Share
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
