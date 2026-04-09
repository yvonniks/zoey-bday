import { supabase } from '../supabaseClient'

export default function PolaroidCard({ photo }) {
  const imageUrl = supabase.storage.from('photos').getPublicUrl(photo.storage_path).data.publicUrl

  const handleDownload = async () => {
    try {
      const response = await fetch(imageUrl)
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `zoey-bday-${photo.id}.jpg`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      // fallback: open in new tab
      window.open(imageUrl, '_blank')
    }
  }

  return (
    <div className="bg-white p-3 pb-4 shadow-md rounded-sm flex flex-col gap-2" style={{ fontFamily: "'Patrick Hand', cursive" }}>
      <img
        src={imageUrl}
        alt={photo.caption || 'Party photo'}
        className="w-full aspect-square object-cover"
        loading="lazy"
      />
      {photo.caption && (
        <p className="text-center text-sm text-gray-600 px-1 leading-snug">{photo.caption}</p>
      )}
      <button
        onClick={handleDownload}
        className="w-full text-xs text-gray-400 hover:text-gray-600 transition-colors py-1"
        aria-label="Download photo"
      >
        ⬇ Save
      </button>
    </div>
  )
}
