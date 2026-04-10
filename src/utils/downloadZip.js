import JSZip from 'jszip'
import { saveAs } from 'file-saver'
import config from '../eventConfig'

/**
 * Downloads an array of photos as a ZIP file.
 * @param {Array<{url: string, id: string|number}>} photos — each must have a `url` field
 * @param {function(done: number, total: number): void} [onProgress] — called after each fetch
 */
export async function downloadZip(photos, onProgress) {
  const zip = new JSZip()

  await Promise.all(
    photos.map(async (photo, i) => {
      const res = await fetch(photo.url)
      const blob = await res.blob()
      zip.file(`photo-${String(i + 1).padStart(3, '0')}.jpg`, blob)
      onProgress?.(i + 1, photos.length)
    })
  )

  const content = await zip.generateAsync({ type: 'blob' })
  saveAs(content, `${config.eventSlug}-photos.zip`)
}
