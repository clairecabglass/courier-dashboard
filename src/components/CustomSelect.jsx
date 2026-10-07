import { useState, useRef, useEffect } from 'react'
import { ChevronDown } from 'lucide-react'

export default function CustomSelect({
  value,
  onChange,
  options,        // [{ value, label }]
  placeholder,
  disabled,
  className,
  size = 'md',    // 'sm' | 'md'
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const current = options.find(o => o.value === value)
  const label   = current?.label || placeholder || 'Select…'
  const isEmpty = !current

  const sm = size === 'sm'

  return (
    <div ref={ref} className={`relative ${className || ''}`}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen(v => !v)}
        className={`flex items-center gap-1.5 border rounded-lg transition-colors focus:outline-none
          ${sm ? 'px-2 py-1 text-xs' : 'px-3 py-1.5 text-sm'}
          ${disabled
            ? 'opacity-50 cursor-not-allowed bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400'
            : open
              ? 'border-brand ring-2 ring-brand/30 bg-white dark:bg-slate-800'
              : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'}
          ${isEmpty ? 'text-slate-400' : 'text-slate-800 dark:text-slate-100 font-medium'}`}>
        <span className="flex-1 text-left truncate">{label}</span>
        <ChevronDown size={sm ? 11 : 13} className={`shrink-0 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 min-w-full bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-lg z-30 overflow-hidden py-1">
          {placeholder && (
            <button
              onClick={() => { onChange(''); setOpen(false) }}
              className="w-full text-left px-3 py-1.5 text-sm text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
              {placeholder}
            </button>
          )}
          {options.map(opt => {
            const active = value === opt.value
            return (
              <button key={opt.value} onClick={() => { onChange(opt.value); setOpen(false) }}
                className={`w-full flex items-center gap-2 px-3 py-1.5 text-sm transition-colors
                  ${active
                    ? 'bg-brand/10 dark:bg-brand/20 text-[#111111] dark:text-brand font-semibold'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'}`}>
                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${active ? 'bg-brand' : 'bg-transparent'}`} />
                {opt.label}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
