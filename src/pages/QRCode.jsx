import { useEffect, useRef } from 'react'
import QRCodeLib from 'qrcode'
import config from '../config'

export default function QRCode() {
  const canvasRef = useRef(null)

  useEffect(() => {
    QRCodeLib.toCanvas(canvasRef.current, config.siteUrl, {
      width: 280,
      margin: 2,
      color: { dark: '#000000', light: '#FFFFFF' },
    })
  }, [])

  return (
    <div
      className="flex flex-col items-center justify-center min-h-screen gap-6 px-6 text-center print:bg-white"
      style={{ backgroundColor: config.backgroundColor }}
    >
      <h1 className="text-3xl font-bold" style={{ color: config.accentColor }}>
        {config.partyName}
      </h1>
      <p className="text-gray-500 text-lg">{config.subtitle}</p>

      <div className="bg-white p-6 rounded-2xl shadow-lg">
        <canvas ref={canvasRef} />
      </div>

      <p className="text-gray-400 text-sm max-w-xs">
        Scan to take a photo and see everyone's memories!
      </p>

      <p className="text-xs text-gray-300 break-all">{config.siteUrl}</p>
    </div>
  )
}
