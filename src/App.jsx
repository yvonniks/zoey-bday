import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import config from './config'
import Camera from './pages/Camera'
import Gallery from './pages/Gallery'
import QRCode from './pages/QRCode'

export default function App() {
  return (
    <div
      className="min-h-screen"
      style={{
        backgroundColor: config.backgroundColor,
        '--accent': config.accentColor,
        '--bg-color': config.backgroundColor,
        paddingLeft: 'env(safe-area-inset-left)',
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
