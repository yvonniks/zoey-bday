import config from '../eventConfig'

export default function BulkActionBar({ selectedCount, totalCount, onSelectAll, onDownload, onCancel, downloading, downloadProgress }) {
  const isMobile = typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches

  const handleDownload = () => {
    if (isMobile && selectedCount > 20) {
      // Warning is shown by Gallery via showToast — proceed regardless
    }
    onDownload()
  }

  const downloadLabel = () => {
    if (!downloading) return `⬇ Download (${selectedCount})`
    if (downloadProgress) return `Downloading… ${downloadProgress.done}/${downloadProgress.total}`
    return 'Preparing…'
  }

  return (
    <div
      className="bulk-action-bar"
      style={{
        position: 'fixed',
        left: '1rem',
        right: '1rem',
        bottom: 'calc(76px + env(safe-area-inset-bottom) + 8px)',
        zIndex: 40,
        background: 'rgba(30,24,50,.92)',
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
        border: '1px solid rgba(255,255,255,.12)',
        borderRadius: 18,
        display: 'flex',
        alignItems: 'center',
        overflow: 'hidden',
        animation: 'bulk-bar-in 220ms cubic-bezier(0.34,1.56,0.64,1) both',
      }}
    >
      {/* Select All */}
      <button
        onClick={onSelectAll}
        disabled={downloading}
        style={{
          flex: 1,
          minHeight: 52,
          fontSize: 13,
          fontWeight: 700,
          color: selectedCount === totalCount ? config.theme.accent : 'rgba(255,255,255,.7)',
          fontFamily: "'Fredoka', sans-serif",
          transition: 'color .15s',
        }}
        onMouseEnter={(e) => { if (!downloading) e.currentTarget.style.color = '#fff' }}
        onMouseLeave={(e) => { e.currentTarget.style.color = selectedCount === totalCount ? config.theme.accent : 'rgba(255,255,255,.7)' }}
      >
        {selectedCount === totalCount ? '✓ All' : 'Select All'}
      </button>

      <div style={{ width: 1, height: 22, background: 'rgba(255,255,255,.12)' }} />

      {/* Download Selected */}
      <button
        onClick={handleDownload}
        disabled={downloading || selectedCount === 0}
        style={{
          flex: 2,
          minHeight: 52,
          fontSize: 13,
          fontWeight: 700,
          color: selectedCount === 0 ? 'rgba(255,255,255,.3)' : 'rgba(255,255,255,.85)',
          fontFamily: "'Fredoka', sans-serif",
          transition: 'color .15s',
        }}
        onMouseEnter={(e) => { if (!downloading && selectedCount > 0) e.currentTarget.style.color = '#fff' }}
        onMouseLeave={(e) => { e.currentTarget.style.color = selectedCount === 0 ? 'rgba(255,255,255,.3)' : 'rgba(255,255,255,.85)' }}
      >
        {downloadLabel()}
      </button>

      <div style={{ width: 1, height: 22, background: 'rgba(255,255,255,.12)' }} />

      {/* Cancel */}
      <button
        onClick={onCancel}
        disabled={downloading}
        style={{
          flex: 1,
          minHeight: 52,
          fontSize: 13,
          fontWeight: 700,
          color: 'rgba(255,255,255,.55)',
          fontFamily: "'Fredoka', sans-serif",
          transition: 'color .15s',
        }}
        onMouseEnter={(e) => { if (!downloading) e.currentTarget.style.color = '#fff' }}
        onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,.55)' }}
      >
        ✕ Cancel
      </button>
    </div>
  )
}
