import { supabase } from '../supabaseClient'

export default function PolaroidCard({ photo }) {
  const imageUrl = supabase.storage.from('photos').getPublicUrl(photo.storage_path).data.publicUrl

  return (
    <div className="bg-white p-3 pb-8 shadow-md rounded-sm flex flex-col gap-2" style={{ fontFamily: "'Patrick Hand', cursive" }}>
      <img
        src={imageUrl}
        alt={photo.caption || 'Party photo'}
        className="w-full aspect-square object-cover"
        loading="lazy"
      />
      {photo.caption && (
        <p className="text-center text-sm text-gray-600 px-1 leading-snug">{photo.caption}</p>
      )}
    </div>
  )
}
