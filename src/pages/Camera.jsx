import { useRef, useState, useCallback } from 'react'
import Webcam from 'react-webcam'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import config from '../config'

const VIDEO_CONSTRAINTS = {
  facingMode: { ideal: 'environment' },
  width: { ideal: 1280 },
  height: { ideal: 960 },
}

export default function Camera() {
  const webcamRef = useRef(null)
  const fileInputRef = useRef(null)
  const navigate = useNavigate()

  const [capturedImage, setCapturedImage] = useState(null) // data URL
  const [caption, setCaption] = useState('')
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState(null)
  const [useFilePicker, setUseFilePicker] = useState(false)

  const handleCapture = useCallback(() => {
    const imageSrc = webcamRef.current?.getScreenshot()
    if (imageSrc) setCapturedImage(imageSrc)
  }, [])

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => setCapturedImage(ev.target.result)
    reader.readAsDataURL(file)
  }

  const handleRetake = () => {
    setCapturedImage(null)
    setCaption('')
    setError(null)
  }

  const dataURLtoBlob = (dataURL) => {
    const [header, data] = dataURL.split(',')
    const mime = header.match(/:(.*?);/)[1]
    const binary = atob(data)
    const array = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) array[i] = binary.charCodeAt(i)
    return new Blob([array], { type: mime })
  }

  const handleUpload = async () => {
    if (!capturedImage) return
    setUploading(true)
    setError(null)
    try {
      const blob = dataURLtoBlob(capturedImage)
      const filename = `photo_${Date.now()}.jpg`
      const { error: storageError } = await supabase.storage
        .from('photos')
        .upload(filename, blob, { contentType: 'image/jpeg', upsert: false })
      if (storageError) throw storageError

      const { error: dbError } = await supabase
        .from('photos')
        .insert({ storage_path: filename, caption: caption.trim() || null })
      if (dbError) throw dbError

      navigate('/')
    } catch (err) {
      setError(err.message || 'Upload failed. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="flex flex-col items-center min-h-screen" style={{ backgroundColor: config.backgroundColor }}>
      {/* Header */}
      <div className="w-full flex items-center justify-between px-4 py-3">
        <button
          onClick={() => navigate('/')}
          className="text-2xl"
          aria-label="Back to gallery"
        >
          ←
        </button>
        <h1 className="text-lg font-semibold" style={{ color: config.accentColor }}>
          {config.partyName}
        </h1>
        <div className="w-8" />
      </div>

      <div className="flex-1 flex flex-col items-center w-full max-w-lg px-4 pb-8 gap-4">
        {!capturedImage ? (
          <>
            {!useFilePicker ? (
              <div className="relative w-full rounded-2xl overflow-hidden bg-black">
                <Webcam
                  ref={webcamRef}
                  audio={false}
                  screenshotFormat="image/jpeg"
                  videoConstraints={VIDEO_CONSTRAINTS}
                  className="w-full"
                  onUserMediaError={() => setUseFilePicker(true)}
                />
              </div>
            ) : (
              <div
                className="w-full rounded-2xl flex flex-col items-center justify-center gap-4 py-16 cursor-pointer border-2 border-dashed"
                style={{ borderColor: config.accentColor }}
                onClick={() => fileInputRef.current?.click()}
              >
                <span className="text-5xl">📷</span>
                <p className="text-gray-500">Tap to choose a photo</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </div>
            )}

            <button
              onClick={handleCapture}
              disabled={useFilePicker}
              className="w-16 h-16 rounded-full border-4 border-white shadow-lg active:scale-95 transition-transform"
              style={{ backgroundColor: config.accentColor }}
              aria-label="Take photo"
            />

            {!useFilePicker && (
              <button
                onClick={() => setUseFilePicker(true)}
                className="text-sm text-gray-400 underline"
              >
                Use file picker instead
              </button>
            )}
          </>
        ) : (
          <>
            <img
              src={capturedImage}
              alt="Preview"
              className="w-full rounded-2xl object-cover shadow-lg"
            />

            <input
              type="text"
              placeholder="Add a caption… (optional)"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              maxLength={120}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2"
              style={{ '--tw-ring-color': config.accentColor }}
            />

            {error && (
              <p className="text-red-500 text-sm text-center">{error}</p>
            )}

            <div className="flex gap-3 w-full">
              <button
                onClick={handleRetake}
                disabled={uploading}
                className="flex-1 py-3 rounded-xl border border-gray-300 text-gray-600 font-medium active:scale-95 transition-transform"
              >
                Retake
              </button>
              <button
                onClick={handleUpload}
                disabled={uploading}
                className="flex-1 py-3 rounded-xl text-white font-medium active:scale-95 transition-transform disabled:opacity-60"
                style={{ backgroundColor: config.accentColor }}
              >
                {uploading ? 'Posting…' : 'Post 🎉'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
