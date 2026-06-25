import { useEffect, useRef, useState } from 'react'
import { ChevronDown } from 'lucide-react'

export const BRANDS = ['Burger King', 'Popeyes', "Arby's"]

export function PriceSelect({ id, label, value, onChange, options, placeholder = 'Seçiniz', hideLabel = false }) {
  const [open, setOpen] = useState(false)
  const wrapRef = useRef(null)

  useEffect(() => {
    if (!open) return undefined
    const onDoc = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open])

  const selected = options.find((o) => o.value === value)

  return (
    <div className={`pc-form__field ${hideLabel ? 'pc-form__field--noLabel' : ''}`}>
      {hideLabel ? null : (
        <label className="pc-form__label" htmlFor={id}>
          {label}
        </label>
      )}
      <div className={`pc-dd ${open ? 'pc-dd--open' : ''}`} ref={wrapRef}>
        <button
          type="button"
          id={id}
          className="pc-dd__trigger"
          aria-haspopup="listbox"
          aria-expanded={open}
          onClick={() => setOpen((p) => !p)}
        >
          <span className={`pc-dd__triggerText ${!selected ? 'pc-dd__triggerText--placeholder' : ''}`}>
            {selected ? selected.label : placeholder}
          </span>
          <ChevronDown size={16} className="pc-dd__chev" aria-hidden />
        </button>
        {open ? (
          <ul className="pc-dd__panel" role="listbox" aria-label={label || placeholder}>
            {options.map((opt) => (
              <li key={opt.value} role="option" aria-selected={opt.value === value}>
                <button
                  type="button"
                  className={`pc-dd__option ${opt.value === value ? 'pc-dd__option--active' : ''}`}
                  onClick={() => {
                    onChange(opt.value)
                    setOpen(false)
                  }}
                >
                  {opt.label}
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </div>
  )
}
