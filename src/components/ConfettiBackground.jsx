import { useEffect, useRef } from 'react'
import config from '../config'

// Lightweight animated confetti canvas rendered as a fixed background layer.
// ~35 rectangular pieces in the party theme colors drift slowly downward.
// Respects prefers-reduced-motion — renders static pieces instead of animating.

const PIECE_COUNT = 35

function makePiece(canvasWidth, canvasHeight, fromTop = false) {
  const colors = [config.theme.primary, config.theme.secondary, config.theme.accent]
  return {
    x: Math.random() * canvasWidth,
    y: fromTop ? -20 - Math.random() * canvasHeight : Math.random() * canvasHeight,
    w: 6 + Math.random() * 10,
    h: 4 + Math.random() * 6,
    angle: Math.random() * Math.PI * 2,
    spin: (Math.random() - 0.5) * 0.04,
    vy: 0.4 + Math.random() * 0.7,   // downward drift speed
    vx: (Math.random() - 0.5) * 0.3, // slight horizontal drift
    color: colors[Math.floor(Math.random() * colors.length)],
    opacity: 0.55 + Math.random() * 0.35,
  }
}

export default function ConfettiBackground() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    let pieces = []
    let animId = null

    const resize = () => {
      canvas.width = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
      // Re-seed pieces on resize so they fill the new dimensions
      pieces = Array.from({ length: PIECE_COUNT }, () =>
        makePiece(canvas.width, canvas.height, false)
      )
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      for (const p of pieces) {
        ctx.save()
        ctx.globalAlpha = p.opacity
        ctx.translate(p.x, p.y)
        ctx.rotate(p.angle)
        ctx.fillStyle = p.color
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h)
        ctx.restore()
      }
    }

    const tick = () => {
      for (const p of pieces) {
        p.x += p.vx
        p.y += p.vy
        p.angle += p.spin
        // Reset to top when it falls off the bottom
        if (p.y > canvas.height + 20) {
          Object.assign(p, makePiece(canvas.width, canvas.height, true))
        }
      }
      draw()
      animId = requestAnimationFrame(tick)
    }

    resize()
    window.addEventListener('resize', resize)

    if (reduced) {
      // Static render — no animation loop
      draw()
    } else {
      animId = requestAnimationFrame(tick)
    }

    return () => {
      window.removeEventListener('resize', resize)
      if (animId) cancelAnimationFrame(animId)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 0,
      }}
    />
  )
}
