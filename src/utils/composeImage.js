/**
 * Composites photo + stickers + caption onto a canvas and returns a JPEG Blob.
 * @param {string} imageSrc - data URL of the captured photo
 * @param {Array<{emoji: string, xPct: number, yPct: number}>} stickers - positions as % of image dimensions
 * @param {string} caption
 * @returns {Promise<Blob>}
 */
export function composeImage(imageSrc, stickers, caption) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.width
      canvas.height = img.height
      const ctx = canvas.getContext('2d')

      // Draw photo
      ctx.drawImage(img, 0, 0)

      // Draw stickers
      const stickerSize = Math.round(img.width * 0.12)
      ctx.font = `${stickerSize}px serif`
      ctx.textBaseline = 'middle'
      ctx.textAlign = 'center'
      for (const { emoji, xPct, yPct } of stickers) {
        ctx.fillText(emoji, (xPct / 100) * img.width, (yPct / 100) * img.height)
      }

      // Draw caption band at bottom
      if (caption && caption.trim()) {
        const fontSize = Math.round(img.width * 0.045)
        const padV = Math.round(img.width * 0.04)
        const bandH = fontSize + padV * 2

        ctx.fillStyle = 'rgba(0,0,0,0.45)'
        ctx.fillRect(0, img.height - bandH, img.width, bandH)

        ctx.fillStyle = '#ffffff'
        ctx.font = `${fontSize}px sans-serif`
        ctx.textBaseline = 'middle'
        ctx.textAlign = 'center'
        ctx.fillText(caption.trim(), img.width / 2, img.height - bandH / 2, img.width - padV * 2)
      }

      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error('Canvas toBlob failed'))),
        'image/jpeg',
        0.92
      )
    }
    img.onerror = reject
    img.src = imageSrc
  })
}
