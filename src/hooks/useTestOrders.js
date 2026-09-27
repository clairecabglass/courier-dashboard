// Sandbox — only visible to Claire (name === 'Claire').
// Test orders live entirely in localStorage, never touch the API or the sheet.

import { useState, useCallback } from 'react'
import { STATUS } from '../mockData'

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

export function useTestOrders(isClaire) {
  const [testOrders,  setTO] = useState(() => { try { return isClaire ? load(STORAGE_KEY) : [] } catch { return [] } })
  const [testHistory, setTH] = useState(() => { try { return isClaire ? load(HISTORY_KEY) : [] } catch { return [] } })

  const persist = useCallback((orders, history) => {
    save(STORAGE_KEY, orders)
    save(HISTORY_KEY, history)
    setTO(orders)
    setTH(history)
  }, [])

  const createTestOrder = useCallback(() => {
    if (!isClaire) return
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
  }, [isClaire, persist])

  const updateTestOrder = useCallback((id, changes) => {
    if (!isClaire) return
    const to = load(STORAGE_KEY)
    const order = to.find(o => o.id === id)
    let extra = {}
    if (order && changes.buyLabel === true && (changes.approved ?? order.approved)) {
      extra = { status: STATUS.BOOKED, waybillNo: `FAKE-${Math.random().toString(36).slice(2,8).toUpperCase()}`, bookedAt: new Date().toISOString() }
    }
    if (order && changes.selectedCourier && !order.tcgQuote) {
      extra.tcgQuote = (Math.random() * 200 + 80).toFixed(2)
      if (!extra.status) extra.status = STATUS.QUOTED
    }
    persist(to.map(o => o.id === id ? { ...o, ...changes, ...extra } : o), load(HISTORY_KEY))
  }, [isClaire, persist])

  const saveTestNote = useCallback((id, note) => {
    if (!isClaire) return
    const to = load(STORAGE_KEY)
    persist(to.map(o => o.id === id ? { ...o, note } : o), load(HISTORY_KEY))
  }, [isClaire, persist])

  const archiveTestOrder = useCallback((id) => {
    if (!isClaire) return
    const to = load(STORAGE_KEY); const th = load(HISTORY_KEY)
    const hit = to.find(o => o.id === id)
    if (!hit) return
    persist(to.filter(o => o.id !== id), [{ ...hit, archivedAt: new Date().toISOString() }, ...th])
  }, [isClaire, persist])

  const restoreTestOrder = useCallback((id) => {
    if (!isClaire) return
    const to = load(STORAGE_KEY); const th = load(HISTORY_KEY)
    const hit = th.find(o => o.id === id)
    if (!hit) return
    persist([{ ...hit, archivedAt: undefined }, ...to], th.filter(o => o.id !== id))
  }, [isClaire, persist])

  const deleteTestOrder = useCallback((id) => {
    if (!isClaire) return
    const to = load(STORAGE_KEY); const th = load(HISTORY_KEY)
    persist(to.filter(o => o.id !== id), th.filter(o => o.id !== id))
  }, [isClaire, persist])

  return {
    testOrders:      isClaire ? testOrders  : [],
    testHistory:     isClaire ? testHistory : [],
    createTestOrder,
    updateTestOrder,
    saveTestNote,
    archiveTestOrder,
    restoreTestOrder,
    deleteTestOrder,
    isTestId: (id) => typeof id === 'string' && id.startsWith('test-'),
  }
}
