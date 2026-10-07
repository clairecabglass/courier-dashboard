// Sandbox — only visible to Claire (name === 'Claire').
// Test orders live entirely in localStorage, never touch the API or the sheet.

import { useState, useCallback } from 'react'
import { STATUS } from '../mockData'

let _rtnSeq = null
function nextRtnSeq(orders, history) {
  if (_rtnSeq !== null) { _rtnSeq++; return _rtnSeq }
  const all = [...orders, ...history]
  const nums = all
    .filter(o => o.isReturn && o.psNo.startsWith('RTN-TEST-'))
    .map(o => parseInt(o.psNo.replace('RTN-TEST-', ''), 10))
    .filter(n => !isNaN(n))
  _rtnSeq = nums.length ? Math.max(...nums) + 1 : 1
  return _rtnSeq
}

const STORAGE_KEY = 'cabglass_test_orders_v1'
const HISTORY_KEY = 'cabglass_test_history_v1'

function load(key) {
  try { return JSON.parse(localStorage.getItem(key)) || [] } catch { return [] }
}
function save(key, data) {
  try { localStorage.setItem(key, JSON.stringify(data)) } catch {}
}

let _seq = null
function nextSeq(orders, history) {
  if (_seq !== null) { _seq++; return _seq }
  const all = [...orders, ...history]
  const nums = all.map(o => parseInt(o.psNo.replace('TEST-', ''), 10)).filter(n => !isNaN(n))
  _seq = nums.length ? Math.max(...nums) + 1 : 1
  return _seq
}

export function useTestOrders(enabled) {
  const [testOrders,  setTO] = useState(() => { try { return enabled ? load(STORAGE_KEY) : [] } catch { return [] } })
  const [testHistory, setTH] = useState(() => { try { return enabled ? load(HISTORY_KEY) : [] } catch { return [] } })

  const persist = useCallback((orders, history) => {
    save(STORAGE_KEY, orders)
    save(HISTORY_KEY, history)
    setTO(orders)
    setTH(history)
  }, [])

  const createTestOrder = useCallback(() => {
    if (!enabled) return
    const to = load(STORAGE_KEY)
    const th = load(HISTORY_KEY)
    const seq = nextSeq(to, th)
    const psNo = `TEST-${String(seq).padStart(3, '0')}`
    const order = {
      id:           `test-${seq}`,
      psNo,
      isTest:       true,
      dateReceived: new Date().toISOString(),
      status:       STATUS.READY_FOR_QUOTE,
      customer:     { company: 'Test Customer', contact: 'Test Contact', phone: '000 000 0000', email: 'test@example.com' },
      address:      { street: '1 Test Street', suburb: 'Test Suburb', city: 'George', province: 'Western Cape', postalCode: '6529' },
      items:        [{ sku: 'TEST-SKU', h: 10, w: 10, l: 10, kg: 1, qty: 1 }],
      tcgQuote:     null, epxQuote: null, selectedCourier: '',
      approved: false, buyLabel: false, staged: true, packed: false,
      waybillNo: '', waybillUrl: '', note: '', backOrder: false,
      isReturn: false, linkedPs: null,
    }
    persist([order, ...to], th)
  }, [enabled, persist])

  const updateTestOrder = useCallback((id, changes) => {
    if (!enabled) return
    const to = load(STORAGE_KEY)
    const order = to.find(o => o.id === id)
    let extra = {}
    const willApprove  = changes.approved  ?? order.approved
    const willBuyLabel = changes.buyLabel  ?? order.buyLabel
    if (order && willApprove && willBuyLabel && !order.waybillNo) {
      extra = { status: STATUS.BOOKED, waybillNo: `FAKE-${Math.random().toString(36).slice(2,8).toUpperCase()}`, bookedAt: new Date().toISOString() }
    }
    if (order && changes.selectedCourier && !order.tcgQuote) {
      extra.tcgQuote = (Math.random() * 200 + 80).toFixed(2)
      if (!extra.status) extra.status = STATUS.QUOTED
    }
    persist(to.map(o => o.id === id ? { ...o, ...changes, ...extra } : o), load(HISTORY_KEY))
  }, [enabled, persist])

  const saveTestNote = useCallback((id, note) => {
    if (!enabled) return
    const to = load(STORAGE_KEY)
    persist(to.map(o => o.id === id ? { ...o, note } : o), load(HISTORY_KEY))
  }, [enabled, persist])

  const archiveTestOrder = useCallback((id) => {
    if (!enabled) return
    const to = load(STORAGE_KEY); const th = load(HISTORY_KEY)
    const hit = to.find(o => o.id === id)
    if (!hit) return
    persist(to.filter(o => o.id !== id), [{ ...hit, archivedAt: new Date().toISOString() }, ...th])
  }, [enabled, persist])

  const restoreTestOrder = useCallback((id) => {
    if (!enabled) return
    const to = load(STORAGE_KEY); const th = load(HISTORY_KEY)
    const hit = th.find(o => o.id === id)
    if (!hit) return
    persist([{ ...hit, archivedAt: undefined }, ...to], th.filter(o => o.id !== id))
  }, [enabled, persist])

  const deleteTestOrder = useCallback((id) => {
    if (!enabled) return
    const to = load(STORAGE_KEY); const th = load(HISTORY_KEY)
    persist(to.filter(o => o.id !== id), th.filter(o => o.id !== id))
  }, [enabled, persist])

  const createTestReturn = useCallback((parentOrder, items, buyerArranges) => {
    const to = load(STORAGE_KEY)
    const th = load(HISTORY_KEY)
    const seq = nextRtnSeq(to, th)
    const psNo = `RTN-TEST-${String(seq).padStart(3, '0')}`
    const rtn = {
      id:                   `test-${Date.now()}`,
      psNo,
      isTest:               true,
      isReturn:             true,
      linkedPs:             parentOrder.psNo,
      buyerArranges,
      returnInitiatedAt:    new Date().toISOString(),
      dateReceived:         new Date().toISOString(),
      status:               STATUS.PENDING_FINANCE_APPROVAL,
      customer:             parentOrder.customer,
      address:              parentOrder.address,
      items,
      tcgQuote:             null, epxQuote: null, selectedCourier: '',
      approved:             false, buyLabel: false, staged: true, packed: false,
      waybillNo:            '', waybillUrl: '', note: '', backOrder: false,
      returnCondition:      null, returnNote: '', creditNo: '',
      rebinLocation:        '', rebinned: false,
    }
    persist([rtn, ...to], th)
    return psNo
  }, [persist])

  const approveTestReturn = useCallback((id) => {
    const to = load(STORAGE_KEY)
    persist(to.map(o => o.id === id ? { ...o, status: STATUS.READY_FOR_QUOTE } : o), load(HISTORY_KEY))
  }, [persist])

  const conditionTestReturn = useCallback((id, condition, note) => {
    const to = load(STORAGE_KEY)
    persist(to.map(o => o.id === id ? {
      ...o,
      returnCondition:    condition,
      returnNote:         note,
      status:             STATUS.CONDITION_CHECKED,
      conditionCheckedAt: new Date().toISOString(),
    } : o), load(HISTORY_KEY))
  }, [persist])

  const rebinTestOrder = useCallback((id, condition, note) => {
    const to = load(STORAGE_KEY)
    persist(to.map(o => o.id === id ? {
      ...o,
      rebinned:           true,
      rebinnedAt:         new Date().toISOString(),
      returnCondition:    condition || o.returnCondition,
      returnNote:         note      || o.returnNote,
      conditionCheckedAt: new Date().toISOString(),
      status:             STATUS.CONDITION_CHECKED,
    } : o), load(HISTORY_KEY))
  }, [persist])

  const creditNoTestReturn = useCallback((id, creditNo) => {
    const to = load(STORAGE_KEY)
    persist(to.map(o => o.id === id ? { ...o, creditNo } : o), load(HISTORY_KEY))
  }, [persist])

  const completeTestReturn = useCallback((id) => {
    const to = load(STORAGE_KEY); const th = load(HISTORY_KEY)
    const hit = to.find(o => o.id === id)
    if (!hit) return
    persist(to.filter(o => o.id !== id), [{ ...hit, archivedAt: new Date().toISOString() }, ...th])
  }, [persist])

  const cancelTestReturn = useCallback((id) => {
    const to = load(STORAGE_KEY)
    persist(to.filter(o => o.id !== id), load(HISTORY_KEY))
  }, [persist])

  return {
    testOrders:        testOrders,
    testHistory:       testHistory,
    createTestOrder,
    updateTestOrder,
    saveTestNote,
    archiveTestOrder,
    restoreTestOrder,
    deleteTestOrder,
    createTestReturn,
    approveTestReturn,
    conditionTestReturn,
    rebinTestOrder,
    creditNoTestReturn,
    completeTestReturn,
    cancelTestReturn,
    isTestId: (id) => typeof id === 'string' && id.startsWith('test-'),
  }
}
