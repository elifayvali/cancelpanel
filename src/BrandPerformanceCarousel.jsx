import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { getBrandLogoUrl } from './brandLogos'

/**
 * Carousel: oklar, viewport genişliğine göre 2 veya 3 kart / sayfa, px hizalı kaydırma, noktalar, ARIA.
 *
 * @typedef {{ brand: string, openPct: number, closedCount: number }} BrandPerformanceSlide
 * @param {{ slides: BrandPerformanceSlide[] }} props
 */
export default function BrandPerformanceCarousel({ slides }) {
  const n = slides.length
  const viewportRef = useRef(null)
  const { perView, viewportContentWidth } = useCarouselViewport(viewportRef)
  const pages = useMemo(() => {
    const out = []
    for (let i = 0; i < n; i += perView) {
      out.push(slides.slice(i, i + perView))
    }
    return out
  }, [slides, n, perView])

  const numPages = pages.length
  const [pageIdx, setPageIdx] = useState(0)
  const maxP = Math.max(0, numPages - 1)
  const safePage = Math.min(pageIdx, maxP)

  const go = useCallback(
    (dir) => {
      setPageIdx((prev) => {
        const cur = Math.min(prev, Math.max(0, numPages - 1))
        let next = cur + dir
        if (next < 0) next = numPages - 1
        if (next >= numPages) next = 0
        return next
      })
    },
    [numPages],
  )

  useEffect(() => {
    const onKey = (e) => {
      if (numPages <= 1) return
      if (e.key === 'ArrowLeft') {
        e.preventDefault()
        go(-1)
      } else if (e.key === 'ArrowRight') {
        e.preventDefault()
        go(1)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [go, numPages])

  /** 5 sn içinde sayfa değişmezse sonraki gruba geç; her geçişte süre sıfırlanır */
  useEffect(() => {
    if (numPages <= 1) return
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return
    }
    const ms = 5000
    const id = window.setInterval(() => {
      setPageIdx((prev) => {
        const cur = Math.min(prev, Math.max(0, numPages - 1))
        let next = cur + 1
        if (next >= numPages) next = 0
        return next
      })
    }, ms)
    return () => window.clearInterval(id)
  }, [numPages, safePage])

  /**
   * Kaydırma adımı = ceil(w): kesirli viewport’ta sonraki slayttan sızıntı olmaz.
   * Slayt kutusu w’den geniş olduğu için (ör. 501 vs 500.7) saf overflow kartı keser;
   * (ceil(w) − w) kadar padding-right ile içerik alanı tam w olur, çerçeveler görünür kalır.
   */
  const slideSpanPx = useMemo(
    () => (viewportContentWidth > 0 ? Math.max(1, Math.ceil(viewportContentWidth)) : 0),
    [viewportContentWidth],
  )
  const pageEndPadPx = useMemo(
    () =>
      viewportContentWidth > 0 && slideSpanPx > 0 ?
        Math.max(0, slideSpanPx - viewportContentWidth)
      : 0,
    [viewportContentWidth, slideSpanPx],
  )

  if (n === 0) return null

  return (
    <div
      className="rkd-brand-carousel"
      role="region"
      aria-roledescription="carousel"
      aria-label={`Marka performans analizi, grup ${safePage + 1} / ${numPages}`}
      aria-live="polite"
    >
      <div className="rkd-brand-carousel__chrome">
        <button
          type="button"
          className="rkd-brand-carousel__arrow rkd-brand-carousel__arrow--prev"
          onClick={() => go(-1)}
          disabled={numPages <= 1}
          aria-label="Önceki grup"
        >
          ‹
        </button>

        <div ref={viewportRef} className="rkd-brand-carousel__viewport">
          <ul
            className="rkd-brand-carousel__track"
            style={
              slideSpanPx > 0 ?
                { transform: `translate3d(-${safePage * slideSpanPx}px, 0, 0)` }
              : undefined
            }
          >
            {pages.map((pageSlides, pi) => (
              <li
                key={pageSlides.map((s) => s.brand).join('|')}
                className="rkd-brand-carousel__page"
                style={
                  slideSpanPx > 0 ?
                    {
                      flex: `0 0 ${slideSpanPx}px`,
                      width: slideSpanPx,
                      minWidth: slideSpanPx,
                      maxWidth: slideSpanPx,
                      boxSizing: 'border-box',
                      paddingRight: pageEndPadPx,
                    }
                  : undefined
                }
                aria-hidden={pi !== safePage}
              >
                {pageSlides.map((s) => (
                  <div key={s.brand} className="rkd-brand-carousel__slide-cell">
                    <BrandPerformanceCard slide={s} />
                  </div>
                ))}
              </li>
            ))}
          </ul>
        </div>

        <button
          type="button"
          className="rkd-brand-carousel__arrow rkd-brand-carousel__arrow--next"
          onClick={() => go(1)}
          disabled={numPages <= 1}
          aria-label="Sonraki grup"
        >
          ›
        </button>
      </div>

      {numPages > 1 && (
        <div className="rkd-brand-carousel__dots" role="tablist" aria-label="Grup seçimi">
          {pages.map((pageSlides, i) => (
            <button
              key={pageSlides.map((s) => s.brand).join('|')}
              type="button"
              role="tab"
              className={`rkd-brand-carousel__dot${i === safePage ? ' rkd-brand-carousel__dot--active' : ''}`}
              aria-selected={i === safePage}
              tabIndex={i === safePage ? 0 : -1}
              onClick={() => setPageIdx(i)}
              aria-label={`Grup ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}

/**
 * Kart sayısı + görünür alan: viewport içerik kutusu (padding hariç), kesirli genişlik korunur.
 * Slayt px genişliği bileşende ceil ile türetilir (floor burada sızıntıya yol açıyordu).
 */
function useCarouselViewport(viewportRef) {
  const [perView, setPerView] = useState(3)
  const [viewportContentWidth, setViewportContentWidth] = useState(0)

  useEffect(() => {
    const el = viewportRef.current
    if (!el) return

    const choose = (w) => (w < 1000 ? 2 : 3)

    const ro = new ResizeObserver((entries) => {
      const entry = entries[entries.length - 1]
      const cw = entry.contentRect.width
      setViewportContentWidth(cw > 0 ? cw : 0)
      setPerView((prev) => {
        const next = choose(cw)
        return next === prev ? prev : next
      })
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [viewportRef])

  return { perView, viewportContentWidth }
}

/** @param {{ slide: { brand: string, openPct: number, closedCount: number } }} props */
function BrandPerformanceCard({ slide }) {
  const { brand, openPct, closedCount } = slide
  const logoSrc = getBrandLogoUrl(brand)
  const { dot, bar } = openPctVisual(openPct)
  const pctLabel = `${Number(openPct).toLocaleString('tr-TR', { maximumFractionDigits: 1, minimumFractionDigits: 0 })}%`

  return (
    <article className="rkd-brand-card">
      <BrandLogo brand={brand} src={logoSrc} />
      <h3 className="rkd-brand-card__name">{brand.toUpperCase()}</h3>
      <div className="rkd-brand-card__metric">
        <span className="rkd-brand-card__metric-label">Açık %</span>
        <span className="rkd-brand-card__metric-value" style={{ color: dot }}>
          <span className="rkd-brand-card__status-dot" style={{ background: dot }} aria-hidden />
          {pctLabel}
        </span>
      </div>
      <div className="rkd-brand-card__bar-track" aria-hidden>
        <div
          className="rkd-brand-card__bar-fill"
          style={{ width: `${Math.min(100, Math.max(0, openPct))}%`, background: bar }}
        />
      </div>
      <div className="rkd-brand-card__row">
        <span className="rkd-brand-card__row-label">Kapalı Sayı:</span>
        <strong className="rkd-brand-card__row-value">{formatStatNumber(closedCount)}</strong>
      </div>
    </article>
  )
}

/** @param {{ brand: string, src: string | null }} props */
function BrandLogo({ brand, src }) {
  const [failed, setFailed] = useState(false)
  const showImg = src && !failed
  const initials = String(brand)
    .trim()
    .slice(0, 2)
    .toUpperCase() || '—'

  return (
    <div className="rkd-brand-card__logo-wrap">
      <div className="rkd-brand-card__logo-disc">
        {showImg ?
          <img
            className="rkd-brand-card__logo-img"
            src={src}
            alt=""
            loading="lazy"
            decoding="async"
            onError={() => setFailed(true)}
          />
        : <span className="rkd-brand-card__logo-fallback">{initials}</span>}
      </div>
    </div>
  )
}

function openPctVisual(openPct) {
  if (openPct >= 85) return { dot: 'rgb(27, 201, 128)', bar: 'rgb(27, 201, 128)' }
  if (openPct >= 50) return { dot: 'rgb(246, 183, 18)', bar: 'rgb(246, 183, 18)' }
  return { dot: 'rgb(223, 71, 71)', bar: 'rgb(223, 71, 71)' }
}

function formatStatNumber(n) {
  return Number(n).toLocaleString('tr-TR')
}
