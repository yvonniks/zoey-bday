import { useEffect } from 'react'

/**
 * Attaches an IntersectionObserver to a ref element.
 * When the element enters the viewport, adds the 'revealed' CSS class.
 * Works with the .scroll-reveal + .revealed classes in index.css.
 */
export function useScrollReveal(ref, options = {}) {
  useEffect(() => {
    const el = ref.current
    if (!el) return

    // Fallback: browser doesn't support IntersectionObserver
    if (!('IntersectionObserver' in window)) {
      el.classList.add('revealed')
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add('revealed')
          observer.unobserve(el) // only reveal once
        }
      },
      { threshold: options.threshold ?? 0.1, ...options }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [ref, options.threshold])
}
