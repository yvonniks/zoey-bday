const STICKERS = ['🎂', '🎉', '🎈', '🎁', '✨', '🦄', '🎊', '🌟', '💫', '🥳', '🍰', '🎀', '🎆', '🎇', '🎏', '💖']

export default function StickerPicker({ open, onSelect, onClose }) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end" onClick={onClose}>
      <div
        className="w-full bg-white rounded-t-2xl p-4 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto mb-3" />
        <p className="text-center text-sm text-gray-500 mb-3">Tap a sticker to place it</p>
        <div className="grid grid-cols-8 gap-2 pb-2">
          {STICKERS.map((emoji) => (
            <button
              key={emoji}
              onClick={() => { onSelect(emoji); onClose() }}
              className="text-3xl p-1 rounded-lg active:scale-90 transition-transform hover:bg-gray-100"
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
