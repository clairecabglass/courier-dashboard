import { useState } from 'react'
import { apiCreateReturn } from '../api'

export default function ReturnModal({ order, onClose, onCreated }) {
  const [selected, setSelected] = useState(
    () => new Set(order.items.map((_, i) => i))
  )
  const [buyerArranges, setBuyerArranges] = useState(false)
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')

  const toggle = (i) => {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(i) ? next.delete(i) : next.add(i)
      return next
    })
  }

  const selectedItems = order.items.filter((_, i) => selected.has(i))

  const handleConfirm = async () => {
    if (selectedItems.length === 0) { setErr('Select at least one item to return'); return }
    setSaving(true)
    setErr('')
    try {
      const res = await apiCreateReturn(order.psNo, selectedItems, buyerArranges)
      onCreated(res.rtnPs)
      onClose()
    } catch (e) {
      setErr(e.message || 'Failed to create return')
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-6 w-full max-w-lg mx-4">
        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-1">Create Return</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">{order.psNo} — {order.customer?.company}</p>

        {/* Swapped address summary */}
        <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-3 mb-4 text-xs text-slate-600 dark:text-slate-300 space-y-0.5">
          <p><span className="font-medium">Collecting from:</span> {order.customer?.company} — {[order.address?.street, order.address?.city].filter(Boolean).join(', ')}</p>
          <p><span className="font-medium">Delivering to:</span> CabGlass — 19 Saffier Crescent, Tamsui Industria, George, 6529</p>
        </div>

        {/* Shipment arrangement */}
        <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-600 mb-4 cursor-pointer hover:border-slate-300 dark:hover:border-slate-500 transition-colors">
          <input type="checkbox" className="accent-slate-800 dark:accent-slate-300 w-4 h-4 shrink-0 mt-0.5"
            checked={buyerArranges} onChange={e => setBuyerArranges(e.target.checked)} />
          <div>
            <p className="text-sm font-medium text-slate-800 dark:text-slate-100">Buyer arranges shipment</p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Tick if the customer is organising their own courier back to us. No quote or booking will be generated.</p>
          </div>
        </label>

        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">Select items to return</p>

        <div className="space-y-2 mb-4 max-h-60 overflow-y-auto">
          {order.items.map((it, i) => (
            <label key={i} className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500 cursor-pointer transition-colors">
              <input
                type="checkbox"
                className="accent-slate-800 dark:accent-slate-300 w-4 h-4 shrink-0"
                checked={selected.has(i)}
                onChange={() => toggle(i)}
              />
              <div className="flex-1 min-w-0">
                <span className="font-mono text-sm text-slate-800 dark:text-slate-100">{it.sku}</span>
                <span className="text-xs text-slate-400 dark:text-slate-500 ml-2">Qty {it.qty} · {it.h}×{it.w}×{it.l}cm · {it.kg}kg</span>
              </div>
            </label>
          ))}
        </div>

        {err && <p className="text-sm text-red-500 mb-3">{err}</p>}

        <div className="flex gap-2 justify-end">
          <button onClick={onClose} className="px-4 py-2 rounded-xl text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700">Cancel</button>
          <button
            onClick={handleConfirm}
            disabled={saving || selectedItems.length === 0}
            className="px-4 py-2 rounded-xl text-sm font-medium bg-slate-800 dark:bg-slate-100 text-white dark:text-slate-900 hover:bg-slate-700 dark:hover:bg-slate-200 disabled:opacity-50"
          >
            {saving ? 'Creating…' : `Confirm Return (${selectedItems.length} item${selectedItems.length !== 1 ? 's' : ''})`}
          </button>
        </div>
      </div>
    </div>
  )
}
