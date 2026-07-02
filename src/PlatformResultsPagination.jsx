import { ChevronLeft, ChevronRight } from 'lucide-react'

const PAGE_SIZE_OPTIONS = [10, 25, 50]

function buildPageItems(current, total) {
  if (total <= 1) return [1]
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)

  const items = []
  const add = (v) => items.push(v)

  add(1)
  if (current > 3) add('…')

  const start = Math.max(2, current - 1)
  const end = Math.min(total - 1, current + 1)
  for (let p = start; p <= end; p += 1) add(p)

  if (current < total - 2) add('…')
  if (total > 1) add(total)

  return items.filter((item, idx, arr) => item !== arr[idx - 1])
}

export default function PlatformResultsPagination({
  total,
  page,
  pageSize,
  onPageChange,
  onPageSizeChange,
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize) || 1)
  const safePage = Math.min(page, totalPages)
  const pageItems = buildPageItems(safePage, totalPages)

  return (
    <div className="pc-platform-pager" aria-label="Sonuç sayfalama">
      <span className="pc-platform-pager__total">Toplam {total.toLocaleString('tr-TR')} Ürün</span>

      <div className="pc-platform-pager__controls">
        <label className="pc-platform-pager__size">
          <span className="pc-platform-pager__sizeLabel">Sayfa Başına</span>
          <select
            className="pc-platform-pager__select"
            value={String(pageSize)}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
          >
            {PAGE_SIZE_OPTIONS.map((n) => (
              <option key={n} value={String(n)}>
                {n} Sonuç
              </option>
            ))}
          </select>
        </label>

        <div className="pc-platform-pager__nav">
          <button
            type="button"
            className="pc-platform-pager__arrow"
            onClick={() => onPageChange(safePage - 1)}
            disabled={safePage <= 1 || total === 0}
            aria-label="Önceki sayfa"
          >
            <ChevronLeft size={18} />
          </button>

          {pageItems.map((item, idx) =>
            item === '…' ? (
              <span key={`ellipsis-${idx}`} className="pc-platform-pager__ellipsis" aria-hidden>
                …
              </span>
            ) : (
              <button
                key={item}
                type="button"
                className={`pc-platform-pager__page ${item === safePage ? 'pc-platform-pager__page--active' : ''}`}
                onClick={() => onPageChange(item)}
                aria-current={item === safePage ? 'page' : undefined}
              >
                {item}
              </button>
            ),
          )}

          <button
            type="button"
            className="pc-platform-pager__arrow"
            onClick={() => onPageChange(safePage + 1)}
            disabled={safePage >= totalPages || total === 0}
            aria-label="Sonraki sayfa"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
    </div>
  )
}
