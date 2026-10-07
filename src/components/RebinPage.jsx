import { useState, useRef } from 'react'
import { PackageCheck, Camera, X, ArrowLeft } from 'lucide-react'
import { STATUS } from '../mockData'

const CONDITIONS = ['Good Condition', 'Damaged', 'Other']

const COND_STYLES = {
  'Good Condition': {
    idle:     'border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200',
    active:   'border-emerald-500 bg-emerald-500 text-white',
    badge:    'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-700',
  },
  'Damaged': {
    idle:     'border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200',
    active:   'border-red-500 bg-red-500 text-white',
    badge:    'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 border-red-200 dark:border-red-700',
  },
  'Other': {
    idle:     'border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200',
    active:   'border-amber-500 bg-amber-500 text-white',
    badge:    'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-700',
  },
}

const REBINNABLE = [STATUS.BOOKED, STATUS.AWAITING_RETURN, STATUS.CONDITION_CHECKED]

function RebinModal({ order, onClose, onConfirm }) {
  const [condition,  setCondition]  = useState(order.returnCondition || '')
  const [note,       setNote]       = useState(order.returnNote      || '')
  const [photos,     setPhotos]     = useState([])
  const [saving,     setSaving]     = useState(false)
  const [err,        setErr]        = useState('')
  const fileRef = useRef(null)

  const handleFiles = (e) => {
    const files = Array.from(e.target.files)
    files.forEach(f => {
      const reader = new FileReader()
      reader.onload = ev => setPhotos(p => [...p, { name: f.name, src: ev.target.result }])
      reader.readAsDataURL(f)
    })
    e.target.value = ''
  }

  const handleConfirm = async () => {
    if (!condition) { setErr('Select a condition'); return }
    if (condition === 'Other' && !note.trim()) { setErr('A note is required for "Other"'); return }
    setSaving(true)
    try {
      await onConfirm(order, condition, note.trim())
      onClose()
    } catch (e) {
      setErr(e.message || 'Failed to save')
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-slate-800 rounded-t-3xl sm:rounded-3xl shadow-2xl w-full sm:max-w-lg mx-0 sm:mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6 sm:p-8">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 mb-1">Record Condition &amp; Rebin</h2>
          <p className="text-base text-slate-500 dark:text-slate-400 mb-6">
            {order.psNo} — {order.customer?.company}
          </p>

          <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3">Condition</p>
          <div className="flex gap-3 mb-6">
            {CONDITIONS.map(c => (
              <button key={c} onClick={() => { setCondition(c); setErr('') }}
                className={`flex-1 py-4 rounded-2xl text-base font-bold border-2 transition-all ${
                  condition === c ? COND_STYLES[c].active : COND_STYLES[c].idle
                }`}>
                {c}
              </button>
            ))}
          </div>

          <textarea
            className="w-full rounded-2xl border-2 border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 p-4 text-base resize-none mb-5 focus:outline-none focus:border-amber-400"
            rows={3}
            placeholder={condition === 'Other' ? 'Describe the condition (required)…' : 'Optional note…'}
            value={note}
            onChange={e => { setNote(e.target.value); setErr('') }}
          />

          {/* Photo upload */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                Photos <span className="normal-case font-normal">(optional)</span>
              </p>
              <button type="button" onClick={() => fileRef.current?.click()}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold border-2 border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:border-slate-400 transition-colors">
                <Camera size={15} /> Add photo
              </button>
              <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFiles} />
            </div>
            {photos.length > 0 && (
              <div className="flex flex-wrap gap-3">
                {photos.map((p, i) => (
                  <div key={i} className="relative group">
                    <img src={p.src} alt={p.name} className="w-20 h-20 object-cover rounded-xl border-2 border-slate-200 dark:border-slate-600" />
                    <button onClick={() => setPhotos(ps => ps.filter((_, j) => j !== i))}
                      className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center">
                      <X size={11} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {err && <p className="text-base text-red-500 mb-4 font-semibold">{err}</p>}

          <div className="flex gap-3">
            <button onClick={onClose}
              className="flex-1 py-4 rounded-2xl text-base font-bold border-2 border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300">
              Cancel
            </button>
            <button data-demo="rebin-confirm-btn" onClick={handleConfirm} disabled={saving}
              className="flex-1 py-4 rounded-2xl text-base font-bold bg-slate-900 dark:bg-white text-white dark:text-slate-900 disabled:opacity-50 transition-opacity">
              {saving ? 'Saving…' : 'Confirm & Rebin'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function RebinCard({ order, onRebin }) {
  const alreadyRebinned = order.rebinned
  const styles = alreadyRebinned
    ? 'border-emerald-200 dark:border-emerald-800 bg-white dark:bg-slate-800'
    : 'border-orange-200 dark:border-orange-700 bg-white dark:bg-slate-800'

  return (
    <div className={`rounded-2xl border-2 shadow-sm p-5 sm:p-6 transition-all ${styles} ${alreadyRebinned ? 'opacity-70' : ''}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          {/* Header row */}
          <div className="flex items-center gap-2 flex-wrap mb-2">
            <span className="text-xs font-bold bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300 px-2.5 py-1 rounded-full uppercase tracking-wide">RTN</span>
            <span className="text-xl font-bold text-slate-900 dark:text-slate-100">{order.psNo}</span>
            {order.linkedPs && (
              <span className="text-sm text-slate-400 dark:text-slate-500">← {order.linkedPs}</span>
            )}
            {alreadyRebinned && (
              <span className="text-xs font-bold bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 px-2.5 py-1 rounded-full">Rebinned</span>
            )}
          </div>

          <p className="text-lg font-semibold text-slate-800 dark:text-slate-100">{order.customer?.company}</p>
          <p className="text-base text-slate-500 dark:text-slate-400 mt-0.5">
            {[order.address?.city, order.address?.province].filter(Boolean).join(', ')}
          </p>

          {order.items?.length > 0 && (
            <div className="mt-3 space-y-1">
              {order.items.map((it, i) => (
                <p key={i} className="text-base font-mono text-slate-600 dark:text-slate-300">
                  {it.sku} <span className="font-sans text-slate-400">× {it.qty}</span>
                </p>
              ))}
            </div>
          )}

          {alreadyRebinned && (
            <div className="mt-4 flex items-center gap-2 flex-wrap">
              {order.returnCondition && (
                <span className={`px-3 py-1 rounded-full border text-sm font-bold ${COND_STYLES[order.returnCondition]?.badge || COND_STYLES['Other'].badge}`}>
                  {order.returnCondition}
                </span>
              )}
              {order.returnNote && <span className="text-sm text-slate-500 dark:text-slate-400">— {order.returnNote}</span>}
              {order.rebinnedAt && (
                <span className="ml-auto text-sm text-slate-400 dark:text-slate-500">
                  {new Date(order.rebinnedAt).toLocaleString('en-ZA', { dateStyle: 'medium', timeStyle: 'short' })}
                </span>
              )}
            </div>
          )}
        </div>

        {!alreadyRebinned && (
          <button
            data-demo="rebin-btn"
            onClick={() => onRebin(order)}
            className="shrink-0 flex flex-col items-center justify-center gap-2 px-5 py-4 rounded-2xl text-base font-bold bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:opacity-90 transition-opacity min-w-[120px]"
          >
            <PackageCheck size={22} />
            <span>Record &amp;<br />Rebin</span>
          </button>
        )}
      </div>
    </div>
  )
}

export default function RebinPage({ orders = [], onRebin }) {
  const [modal, setModal] = useState(null)

  const rebinnableOrders = orders
    .filter(o => o.isReturn && REBINNABLE.includes(o.status))
    .sort((a, b) => {
      if (a.rebinned !== b.rebinned) return a.rebinned ? 1 : -1
      return new Date(b.returnInitiatedAt || b.dateReceived) - new Date(a.returnInitiatedAt || a.dateReceived)
    })

  const handleConfirm = async (order, condition, note) => {
    if (onRebin) await onRebin(order.id, condition, note)
    setModal(null)
  }

  if (rebinnableOrders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-slate-400 dark:text-slate-500 gap-3">
        <span className="text-5xl">🗂️</span>
        <p className="text-lg font-semibold">No returns to rebin right now</p>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto">
      {modal && (
        <RebinModal order={modal} onClose={() => setModal(null)} onConfirm={handleConfirm} />
      )}

      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Rebin</h2>
        <p className="text-base text-slate-500 dark:text-slate-400 mt-1">
          Record condition and assign a bin location for returned stock.
        </p>
      </div>

      <div className="space-y-4">
        {rebinnableOrders.map(order => (
          <RebinCard key={order.psNo} order={order} onRebin={setModal} />
        ))}
      </div>
    </div>
  )
}
