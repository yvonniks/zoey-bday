import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import config from './config'
import Camera from './pages/Camera'
import Gallery from './pages/Gallery'
import QRCode from './pages/QRCode'

export default function App() {
  const { theme } = config
  return (
    <div
      className={`min-h-screen${theme.corkboard ? ' corkboard-bg' : ''}`}
      style={{
        '--color-primary':    theme.primary,
        '--color-secondary':  theme.secondary,
        '--color-accent':     theme.accent,
        '--color-background': theme.background,
        '--color-surface':    theme.surface,
        '--color-text':       theme.text,
        '--gradient-start':   theme.gradientStart,
        '--gradient-end':     theme.gradientEnd,
        // Legacy aliases kept for any inline style that still uses them
        '--accent':           theme.primary,
        '--bg-color':         theme.background,
        backgroundColor: theme.corkboard ? undefined : theme.background,
        paddingLeft:  'env(safe-area-inset-left)',
        paddingRight: 'env(safe-area-inset-right)',
      }}
    >
      <BrowserRouter basename="/zoey-bday">
        <Routes>
          <Route path="/" element={<Gallery />} />
          <Route path="/camera" element={<Camera />} />
          <Route path="/qr" element={<QRCode />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </div>
  )
}
