import { useState } from 'react'
import { PackageCheck } from 'lucide-react'
import { STATUS } from '../mockData'

const CONDITIONS = ['Good Condition', 'Damaged', 'Other']

const COND_CLS = {
  'Good Condition': 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-700',
  'Damaged':        'bg-red-100    dark:bg-red-900/40    text-red-700    dark:text-red-300    border-red-200    dark:border-red-700',
  'Other':          'bg-amber-100  dark:bg-amber-900/40  text-amber-700  dark:text-amber-300  border-amber-200  dark:border-amber-700',
}

const REBINNABLE = [STATUS.BOOKED, STATUS.AWAITING_RETURN, STATUS.CONDITION_CHECKED]

function RebinModal({ order, onClose, onConfirm }) {
  const [condition,  setCondition]  = useState(order.returnCondition || '')
  const [note,       setNote]       = useState(order.returnNote      || '')
  const [saving,     setSaving]     = useState(false)
  const [err,        setErr]        = useState('')

  const handleConfirm = async () => {
    if (!condition) { setErr('Select a condition'); return }
    if (condition === 'Other' && !note.trim()) { setErr('A note is required for Other'); return }
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-6 w-full max-w-md mx-4">
        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-1">Record Condition & Rebin</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
          {order.psNo} — {order.customer?.company}
        </p>

        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">Condition</p>
        <div className="flex gap-2 mb-4">
          {CONDITIONS.map(c => (
            <button key={c} onClick={() => { setCondition(c); setErr('') }}
              className={`flex-1 py-2 rounded-xl text-sm font-medium border transition-colors ${
                condition === c
                  ? c === 'Good Condition' ? 'bg-emerald-500 text-white border-emerald-500'
                  : c === 'Damaged'        ? 'bg-red-500    text-white border-red-500'
                  :                          'bg-amber-500  text-white border-amber-500'
                  : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600 hover:border-slate-400'
              }`}>{c}</button>
          ))}
        </div>

        <textarea
          className="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 p-3 text-sm resize-none mb-4 focus:outline-none focus:ring-2 focus:ring-brand/40"
          rows={2}
          placeholder={condition === 'Other' ? 'Describe the condition (required)…' : 'Optional note…'}
          value={note}
          onChange={e => { setNote(e.target.value); setErr('') }}
        />

{err && <p className="text-sm text-red-500 mb-3">{err}</p>}

        <div className="flex gap-2 justify-end">
          <button onClick={onClose} className="px-4 py-2 rounded-xl text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700">Cancel</button>
          <button onClick={handleConfirm} disabled={saving}
            className="px-4 py-2 rounded-xl text-sm font-medium bg-slate-800 dark:bg-slate-100 text-white dark:text-slate-900 hover:bg-slate-700 disabled:opacity-50">
            {saving ? 'Saving…' : 'Confirm & Rebin'}
          </button>
        </div>
      </div>
    </div>
  )
}

function RebinCard({ order, onRebin }) {
  const alreadyRebinned = order.rebinned

  return (
    <div className={`bg-white dark:bg-slate-800 rounded-2xl border shadow-sm p-4 ${
      alreadyRebinned
        ? 'border-emerald-200 dark:border-emerald-800 opacity-70'
        : 'border-orange-200 dark:border-orange-800'
    }`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-xs font-bold bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300 px-2 py-0.5 rounded-full">RTN</span>
            <span className="font-semibold text-slate-800 dark:text-slate-100 text-sm">{order.psNo}</span>
            {order.linkedPs && (
              <span className="text-xs text-slate-400 dark:text-slate-500">← {order.linkedPs}</span>
            )}
            {alreadyRebinned && (
              <span className="text-xs font-medium bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-full">Rebinned</span>
            )}
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-300">{order.customer?.company}</p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
            {[order.address?.city, order.address?.province].filter(Boolean).join(', ')}
          </p>

          {order.items?.length > 0 && (
            <div className="mt-2 space-y-0.5">
              {order.items.map((it, i) => (
                <p key={i} className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                  {it.sku} <span className="font-sans">× {it.qty}</span>
                </p>
              ))}
            </div>
          )}

          {alreadyRebinned && (
            <div className="mt-3 flex items-center gap-2 text-xs">
              {order.returnCondition && (
                <span className={`px-2 py-0.5 rounded-full border font-medium ${COND_CLS[order.returnCondition] || COND_CLS['Other']}`}>
                  {order.returnCondition}
                </span>
              )}
              {order.returnNote && <span className="text-slate-500 dark:text-slate-400">— {order.returnNote}</span>}
              {order.rebinnedAt && (
                <span className="ml-auto text-slate-400 dark:text-slate-500">
                  {new Date(order.rebinnedAt).toLocaleString('en-ZA', { dateStyle: 'medium', timeStyle: 'short' })}
                </span>
              )}
            </div>
          )}
        </div>

        {!alreadyRebinned && (
          <button
            onClick={() => onRebin(order)}
            className="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium bg-slate-800 dark:bg-slate-100 text-white dark:text-slate-900 hover:bg-slate-700 transition-colors"
          >
            <PackageCheck size={14} />
            Record & Rebin
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
      // Pending rebin first, already rebinned last
      if (a.rebinned !== b.rebinned) return a.rebinned ? 1 : -1
      return new Date(b.returnInitiatedAt || b.dateReceived) - new Date(a.returnInitiatedAt || a.dateReceived)
    })

  const handleConfirm = async (order, condition, note) => {
    if (onRebin) await onRebin(order.id, condition, note)
    setModal(null)
  }

  if (rebinnableOrders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-slate-400 dark:text-slate-500 gap-2">
        <span className="text-4xl">🗂️</span>
        <p className="text-sm">No returns to rebin right now</p>
      </div>
    )
  }

  return (
    <div className="p-4 max-w-3xl mx-auto">
      {modal && (
        <RebinModal order={modal} onClose={() => setModal(null)} onConfirm={handleConfirm} />
      )}

      <div className="mb-4">
        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Rebin</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          Record condition and assign a bin location for returned stock.
        </p>
      </div>

      <div className="space-y-3">
        {rebinnableOrders.map(order => (
          <RebinCard key={order.psNo} order={order} onRebin={setModal} />
        ))}
      </div>
    </div>
  )
}
