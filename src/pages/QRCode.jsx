import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import QRCodeLib from 'qrcode'
import config from '../config'

export default function QRCode() {
  const canvasRef = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    QRCodeLib.toCanvas(canvasRef.current, config.siteUrl, {
      width: 300,
      margin: 2,
      color: { dark: '#000000', light: '#FFFFFF' },
    })
  }, [])

  return (
    <div
      className="flex flex-col items-center justify-center min-h-screen gap-6 px-6 text-center"
      style={{
        backgroundColor: config.theme.background,
        paddingTop: 'max(1.5rem, env(safe-area-inset-top))',
        paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))',
      }}
    >
      {/* Back button — hidden when printing */}
      <button
        onClick={() => navigate('/')}
        className="no-print self-start text-sm font-semibold px-4 py-2 rounded-full border-2 min-h-[44px] flex items-center"
        style={{ borderColor: config.theme.primary, color: config.theme.primary }}
        aria-label="Back to gallery"
      >
        ← Back
      </button>

      {/* Party name */}
      <div className="flex flex-col items-center gap-2">
        <h1
          className="text-4xl font-extrabold leading-tight"
          style={{ color: config.theme.primary }}
        >
          {config.partyName}
        </h1>
        <p className="text-gray-500 text-lg">{config.subtitle}</p>
      </div>

      {/* QR code card */}
      <div
        className="bg-white p-8 rounded-3xl shadow-xl flex flex-col items-center gap-4"
        style={{ border: `3px solid ${config.theme.primary}` }}
      >
        <canvas ref={canvasRef} />
        <p className="text-gray-500 text-sm font-semibold">Scan to join the fun!</p>
      </div>

      <p className="text-gray-400 text-sm max-w-xs">
        Take a photo, add stickers, and see it appear in the gallery instantly.
      </p>

      <p className="text-xs text-gray-300 break-all">{config.siteUrl}</p>

      {/* Print button — hidden when printing */}
      <button
        onClick={() => window.print()}
        className="no-print mt-2 px-6 py-3 rounded-full text-white font-semibold shadow active:scale-95 transition-transform min-h-[44px]"
        style={{ backgroundColor: config.theme.primary }}
        aria-label="Print QR code page"
      >
        🖨 Print this page
      </button>
    </div>
  )
}
