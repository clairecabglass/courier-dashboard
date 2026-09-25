import { useState } from 'react'
import { STATUS } from '../mockData'
import { apiUpdateReturnCondition, apiApproveReturn, apiUpdateCreditNo, apiCompleteReturn } from '../api'
import { useAuth } from '../context/AuthContext'

const CONDITIONS = ['Good Condition', 'Damaged', 'Other']

const COND_CLS = {
  'Good Condition': 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-700',
  'Damaged':        'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 border-red-200 dark:border-red-700',
  'Other':          'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-700',
}

function StatusPill({ status }) {
  const cls = {
    'Pending Finance Approval': 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300',
    'Awaiting Return':          'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300',
    'Ready For Quote':          'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300',
    'Quoted':                   'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300',
    'Booking':                  'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300',
    'Booked':                   'bg-cyan-100 dark:bg-cyan-900/40 text-cyan-700 dark:text-cyan-300',
    'Condition Checked':        'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300',
  }[status] || 'bg-slate-100 dark:bg-slate-700 text-slate-500'
  return <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${cls}`}>{status}</span>
}

function ConditionModal({ order, onClose, onConfirm }) {
  const [condition, setCondition] = useState(order.returnCondition || '')
  const [note, setNote] = useState(order.returnNote || '')
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
            <button key={c} onClick={() => { setCondition(c); setErr('') }}
              className={`flex-1 py-2 rounded-xl text-sm font-medium border transition-colors ${
                condition === c
                  ? c === 'Good Condition' ? 'bg-emerald-500 text-white border-emerald-500'
                  : c === 'Damaged' ? 'bg-red-500 text-white border-red-500'
                  : 'bg-amber-500 text-white border-amber-500'
                  : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600 hover:border-slate-400'
              }`}>{c}</button>
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
          <button onClick={handleConfirm} disabled={saving}
            className="px-4 py-2 rounded-xl text-sm font-medium bg-slate-800 dark:bg-slate-100 text-white dark:text-slate-900 hover:bg-slate-700 disabled:opacity-50">
            {saving ? 'Saving…' : 'Confirm Condition'}
          </button>
        </div>
      </div>
    </div>
  )
}

function ReturnCard({ order, canEdit, canFinance, onCondition, onApprove, onComplete, onRefresh }) {
  const [creditNo, setCreditNo] = useState(order.creditNo || '')
  const [savingCredit, setSavingCredit] = useState(false)
  const [approvingReturn, setApprovingReturn] = useState(false)
  const [completing, setCompleting] = useState(false)

  const handleSaveCredit = async () => {
    setSavingCredit(true)
    try { await apiUpdateCreditNo(order.psNo, creditNo); onRefresh() }
    finally { setSavingCredit(false) }
  }

  const handleApprove = async () => {
    setApprovingReturn(true)
    try { await onApprove(order.psNo); onRefresh() }
    finally { setApprovingReturn(false) }
  }

  const handleComplete = async () => {
    setCompleting(true)
    try { await onComplete(order.psNo); onRefresh() }
    finally { setCompleting(false) }
  }

  const isPendingApproval = order.status === STATUS.PENDING_FINANCE_APPROVAL
  const isConditionChecked = order.status === STATUS.CONDITION_CHECKED
  const canRecordCondition = canEdit && (order.status === STATUS.BOOKED || order.status === STATUS.AWAITING_RETURN)

  return (
    <div className={`bg-white dark:bg-slate-800 rounded-2xl border shadow-sm p-4 ${
      isPendingApproval ? 'border-purple-200 dark:border-purple-800' : 'border-slate-200 dark:border-slate-700'
    }`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-xs font-bold bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300 px-2 py-0.5 rounded-full">RTN</span>
            <span className="font-semibold text-slate-800 dark:text-slate-100 text-sm">{order.psNo}</span>
            {order.linkedPs && (
              <span className="text-xs text-slate-400 dark:text-slate-500">← {order.linkedPs}</span>
            )}
            <StatusPill status={order.status} />
            {order.buyerArranges && (
              <span className="text-xs bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded-full">Buyer arranges</span>
            )}
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-300 truncate">{order.customer?.company}</p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
            {[order.address?.city, order.address?.province].filter(Boolean).join(', ')}
          </p>
          {order.returnInitiatedAt && (
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
              Initiated: {new Date(order.returnInitiatedAt).toLocaleString('en-ZA', { dateStyle: 'medium', timeStyle: 'short' })}
            </p>
          )}
        </div>

        <div className="shrink-0 flex flex-col items-end gap-2">
          {order.waybillNo && (
            <p className="text-xs text-slate-500 dark:text-slate-400">Waybill: {order.waybillNo}</p>
          )}

          {/* Finance: approve */}
          {isPendingApproval && canFinance && (
            <button onClick={handleApprove} disabled={approvingReturn}
              className="px-3 py-1.5 rounded-xl text-xs font-medium bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50 transition-colors">
              {approvingReturn ? 'Approving…' : 'Approve Return'}
            </button>
          )}

          {/* Warehouse: record condition */}
          {canRecordCondition && (
            <button onClick={() => onCondition(order)}
              className="px-3 py-1.5 rounded-xl text-xs font-medium bg-slate-800 dark:bg-slate-100 text-white dark:text-slate-900 hover:bg-slate-700 transition-colors">
              Arrived — Record Condition
            </button>
          )}

          {/* Admin/Finance: move to history after condition checked */}
          {isConditionChecked && (canEdit || canFinance) && (
            <button onClick={handleComplete} disabled={completing}
              className="px-3 py-1.5 rounded-xl text-xs font-medium bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors">
              {completing ? 'Moving…' : 'Move to History'}
            </button>
          )}
        </div>
      </div>

      {/* Condition result */}
      {order.returnCondition && (
        <div className={`mt-3 flex items-center gap-2 text-xs px-3 py-2 rounded-xl border ${COND_CLS[order.returnCondition] || COND_CLS['Other']}`}>
          <span className="font-medium">{order.returnCondition}</span>
          {order.returnNote && <span className="text-slate-500 dark:text-slate-400">— {order.returnNote}</span>}
          {order.conditionCheckedAt && (
            <span className="ml-auto text-slate-400 dark:text-slate-500">
              {new Date(order.conditionCheckedAt).toLocaleString('en-ZA', { dateStyle: 'medium', timeStyle: 'short' })}
            </span>
          )}
        </div>
      )}

      {/* Items */}
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

      {/* Credit number — Finance or Admin */}
      {(canFinance || canEdit) && (
        <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Credit Note Number</p>
          <div className="flex gap-2">
            <input
              type="text"
              value={creditNo}
              onChange={e => setCreditNo(e.target.value)}
              placeholder="Enter credit note number…"
              className="flex-1 text-xs px-2.5 py-1.5 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand/30"
            />
            <button onClick={handleSaveCredit} disabled={savingCredit || creditNo === (order.creditNo || '')}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 dark:bg-slate-100 text-white dark:text-slate-900 hover:bg-slate-700 disabled:opacity-40 transition-colors">
              {savingCredit ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function ReturnsTab({ orders, onRefresh }) {
  const { perm, user } = useAuth()
  const canEdit = perm('returns', 'edit')
  const canFinance = user?.role === 'finance' || user?.role === 'admin'
  const [conditionOrder, setConditionOrder] = useState(null)

  const returnOrders = (orders ?? [])
    .filter(o => o.isReturn)
    .sort((a, b) => {
      const rank = s => s === STATUS.PENDING_FINANCE_APPROVAL ? 0 : s === STATUS.CONDITION_CHECKED ? 2 : 1
      return rank(a.status) - rank(b.status) || new Date(b.returnInitiatedAt || b.dateReceived) - new Date(a.returnInitiatedAt || a.dateReceived)
    })

  const handleCondition = async (psNo, condition, note) => {
    await apiUpdateReturnCondition(psNo, condition, note)
    onRefresh()
  }

  const handleApprove = async (psNo) => {
    await apiApproveReturn(psNo)
    onRefresh()
  }

  const handleComplete = async (psNo) => {
    await apiCompleteReturn(psNo)
    onRefresh()
  }

  if (returnOrders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-slate-400 dark:text-slate-500 gap-2">
        <span className="text-4xl">📦</span>
        <p className="text-sm">No active returns</p>
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
        <ReturnCard
          key={order.psNo}
          order={order}
          canEdit={canEdit}
          canFinance={canFinance}
          onCondition={setConditionOrder}
          onApprove={handleApprove}
          onComplete={handleComplete}
          onRefresh={onRefresh}
        />
      ))}
    </div>
  )
}
