import { useState } from 'react'
import { STATUS } from '../mockData'
import { apiUpdateReturnCondition } from '../api'
import { useAuth } from '../context/AuthContext'

const CONDITIONS = ['Good Condition', 'Damaged', 'Other']

function ConditionModal({ order, onClose, onConfirm }) {
  const [condition, setCondition] = useState('')
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')

  const handleConfirm = async () => {
    if (!condition) { setErr('Please select a condition'); return }
    if (condition === 'Other' && !note.trim()) { setErr('A note is required for Other'); return }
    setSaving(true)
    try {
      await onConfirm(order.psNo, condition, note.trim())
      onClose()
    } catch (e) {
      setErr(e.message || 'Failed to save')
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-6 w-full max-w-md mx-4">
        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-1">Record Return Condition</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">{order.psNo} — {order.customer?.company}</p>

        <div className="flex gap-2 mb-4">
          {CONDITIONS.map(c => (
            <button
              key={c}
              onClick={() => { setCondition(c); setErr('') }}
              className={`flex-1 py-2 rounded-xl text-sm font-medium border transition-colors ${
                condition === c
                  ? c === 'Good Condition'
                    ? 'bg-emerald-500 text-white border-emerald-500'
                    : c === 'Damaged'
                    ? 'bg-red-500 text-white border-red-500'
                    : 'bg-amber-500 text-white border-amber-500'
                  : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600 hover:border-slate-400'
              }`}
            >{c}</button>
          ))}
        </div>

        <textarea
          className="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 p-3 text-sm resize-none mb-4 focus:outline-none focus:ring-2 focus:ring-amber-400"
          rows={3}
          placeholder={condition === 'Other' ? 'Describe the condition (required)…' : 'Optional note about the return…'}
          value={note}
          onChange={e => { setNote(e.target.value); setErr('') }}
        />

        {err && <p className="text-sm text-red-500 mb-3">{err}</p>}

        <div className="flex gap-2 justify-end">
          <button onClick={onClose} className="px-4 py-2 rounded-xl text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700">Cancel</button>
          <button
            onClick={handleConfirm}
            disabled={saving}
            className="px-4 py-2 rounded-xl text-sm font-medium bg-slate-800 dark:bg-slate-100 text-white dark:text-slate-900 hover:bg-slate-700 dark:hover:bg-slate-200 disabled:opacity-50"
          >{saving ? 'Saving…' : 'Confirm & Move to History'}</button>
        </div>
      </div>
    </div>
  )
}

export default function ReturnsTab({ orders, onRefresh }) {
  const { perm } = useAuth()
  const canEdit = perm('returns', 'edit')
  const [conditionOrder, setConditionOrder] = useState(null)

  const returnOrders = (orders ?? []).filter(o => o.isReturn && o.status === STATUS.BOOKED)

  const handleCondition = async (psNo, condition, note) => {
    await apiUpdateReturnCondition(psNo, condition, note)
    onRefresh()
  }

  if (returnOrders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-slate-400 dark:text-slate-500 gap-2">
        <span className="text-4xl">📦</span>
        <p className="text-sm">No returns in transit</p>
      </div>
    )
  }

  return (
    <div className="p-4 max-w-3xl mx-auto space-y-3">
      {conditionOrder && (
        <ConditionModal
          order={conditionOrder}
          onClose={() => setConditionOrder(null)}
          onConfirm={handleCondition}
        />
      )}

      {returnOrders.map(order => (
        <div key={order.psNo} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300 px-2 py-0.5 rounded-full">RTN</span>
                <span className="font-semibold text-slate-800 dark:text-slate-100 text-sm">{order.psNo}</span>
                {order.linkedPs && (
                  <span className="text-xs text-slate-400 dark:text-slate-500">← {order.linkedPs}</span>
                )}
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-300 truncate">{order.customer?.company}</p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                {[order.address?.city, order.address?.province].filter(Boolean).join(', ')}
              </p>
            </div>
            <div className="text-right shrink-0">
              {order.waybillNo && (
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Waybill: {order.waybillNo}</p>
              )}
              {canEdit && (
                <button
                  onClick={() => setConditionOrder(order)}
                  className="px-3 py-1.5 rounded-xl text-xs font-medium bg-slate-800 dark:bg-slate-100 text-white dark:text-slate-900 hover:bg-slate-700 dark:hover:bg-slate-200 transition-colors"
                >
                  Arrived — Record Condition
                </button>
              )}
            </div>
          </div>

          {order.items && order.items.length > 0 && (
            <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700 space-y-1">
              {order.items.map((it, i) => (
                <div key={i} className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
                  <span className="font-mono">{it.sku}</span>
                  <span>Qty {it.qty}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
