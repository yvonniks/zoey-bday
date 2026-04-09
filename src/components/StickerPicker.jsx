import { useEffect, useState } from 'react'
import config from '../config'

export default function StickerPicker({ open, onSelect, onClose }) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    // Delay one tick so the initial render doesn't flash the sheet open
    if (open) setMounted(true)
  }, [open])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end" onClick={onClose}>
      <div
        className={`w-full bg-white rounded-t-3xl p-4 shadow-2xl${mounted ? ' sticker-sheet-enter' : ''}`}
        style={{ opacity: mounted ? undefined : 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag handle */}
        <div className="w-10 h-1.5 bg-gray-300 rounded-full mx-auto mb-4" />
        <p className="text-center text-sm text-gray-500 font-semibold mb-3">
          Tap a sticker to add it ✨
        </p>
        <div className="grid grid-cols-8 gap-2 pb-2">
          {config.stickers.map((emoji) => (
            <button
              key={emoji}
              onClick={() => { onSelect(emoji); onClose() }}
              className="text-3xl p-1 rounded-xl active:scale-90 transition-transform hover:bg-gray-100 min-h-[44px] flex items-center justify-center"
              aria-label={`Add ${emoji} sticker`}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
