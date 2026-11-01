import { useState } from 'react'

/**
 * LazyImage — Image component with skeleton loading placeholder,
 * native lazy loading, and smooth fade-in transition.
 */
export default function LazyImage({
  src,
  alt,
  className = '',
  width,
  height,
  fallback = '/guns/pistol.svg',
  ...props
}) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [hasError, setHasError] = useState(false)

  const handleLoad = () => {
    setIsLoaded(true)
    console.info(
      `%c[LazyImage] 🖼️ Gambar berhasil di-lazy load: ${src || fallback}`,
      'color: #8e44ad; font-weight: bold;',
    )
  }

  const handleError = () => {
    setHasError(true)
    setIsLoaded(true)
  }

  const displaySrc = hasError || !src ? fallback : src

  return (
    <div className={`lazy-img-container ${className}`}>
      {!isLoaded && <div className="lazy-img-skeleton" />}
      <img
        src={displaySrc}
        alt={alt}
        width={width}
        height={height}
        loading="lazy"
        decoding="async"
        onLoad={handleLoad}
        onError={handleError}
        className={`lazy-img ${isLoaded ? 'lazy-img--loaded' : 'lazy-img--loading'}`}
        {...props}
      />
    </div>
  )
}
