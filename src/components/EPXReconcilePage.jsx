import { useState, useCallback, useRef, useEffect } from 'react'
import { Upload, Download, AlertTriangle, CheckCircle2, XCircle, Info, Printer } from 'lucide-react'
import * as XLSX from 'xlsx'

const PRINT_STYLES = `
@media print {
  body > * { display: none !important; }
  #epx-print-root { display: block !important; }
  #epx-print-root .no-print { display: none !important; }
  #epx-print-root { font-family: system-ui, sans-serif; font-size: 11px; color: #000; }
  #epx-print-root table { width: 100%; border-collapse: collapse; }
  #epx-print-root th, #epx-print-root td { border: 1px solid #ccc; padding: 4px 6px; text-align: left; white-space: nowrap; }
  #epx-print-root th { background: #f0f0f0; font-weight: 600; }
  #epx-print-root tfoot td { background: #f0f0f0; font-weight: 700; }
  #epx-print-root .print-title { font-size: 14px; font-weight: 700; margin-bottom: 8px; }
  #epx-print-root .print-meta { font-size: 10px; color: #555; margin-bottom: 12px; }
  @page { margin: 1.5cm; size: landscape; }
}`

// Column indices in the EPX Excel file (0-based)
const COL_WAYBILL     = 0
const COL_CONSIGNEE   = 7
const COL_ACTUAL_MASS = 10
const COL_VOL_MASS    = 11
const COL_CHRG_MASS   = 13
const COL_SUBTOTAL    = 14
const COL_TOTAL_INC   = 16
const COL_REFERENCE   = 17  // PS number

function fmt(n) {
  if (n == null || n === '') return '—'
  return 'R ' + Number(n).toFixed(2)
}

function fmtKg(n) {
  if (n == null || n === '') return '—'
  return Number(n).toFixed(2) + ' kg'
}

function variance(epx, app) {
  if (app == null) return null
  return epx - app
}

// Parse total declared weight from itemSummary cell
// Format: "SKU | H | W | L | KG | QTY | SOURCE\n..."
function parseAppWeight(itemSummary) {
  if (!itemSummary) return null
  let total = 0
  let found = false
  const lines = String(itemSummary).split('\n')
  for (const line of lines) {
    const parts = line.split('|').map(s => s.trim())
    // parts: SKU, H, W, L, KG, QTY, SOURCE
    if (parts.length >= 6) {
      const kg  = parseFloat(parts[4])
      const qty = parseFloat(parts[5])
      if (!isNaN(kg) && !isNaN(qty) && kg > 0) {
        total += kg * qty
        found = true
      }
    }
  }
  return found ? total : null
}

function rowStatus(epxAmt, appAmt) {
  if (appAmt == null) return 'no_quote'
  const diff = epxAmt - appAmt
  const pct  = Math.abs(diff) / epxAmt
  if (Math.abs(diff) < 0.01) return 'match'
  if (diff > 0) return pct > 0.1 ? 'over_high' : 'over_low'
  return pct > 0.1 ? 'under_high' : 'under_low'
}

function weightStatus(epxKg, appKg) {
  if (appKg == null) return null
  const diff = Math.abs(epxKg - appKg)
  if (diff < 0.5) return 'ok'
  if (epxKg > appKg) return 'heavier'
  return 'lighter'
}

const STATUS_META = {
  match:      { label: 'Match',          bg: 'bg-green-50 dark:bg-green-900/10',   text: 'text-green-700 dark:text-green-400',   badge: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  over_low:   { label: 'Overcharged',    bg: 'bg-amber-50 dark:bg-amber-900/10',   text: 'text-amber-700 dark:text-amber-400',   badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  over_high:  { label: '⚠ Overcharged',  bg: 'bg-red-50 dark:bg-red-900/10',      text: 'text-red-700 dark:text-red-400',       badge: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
  under_low:  { label: 'Undercharged',   bg: 'bg-blue-50 dark:bg-blue-900/10',    text: 'text-blue-700 dark:text-blue-400',     badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  under_high: { label: '⚠ Undercharged', bg: 'bg-purple-50 dark:bg-purple-900/10', text: 'text-purple-700 dark:text-purple-400', badge: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' },
  no_quote:   { label: 'No app quote',   bg: 'bg-slate-50 dark:bg-slate-800/50',   text: 'text-slate-500',                       badge: 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400' },
  not_found:  { label: 'Not found',      bg: 'bg-red-50 dark:bg-red-900/10',      text: 'text-red-700 dark:text-red-400',       badge: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
}

export default function EPXReconcilePage({ orders = [], history = [] }) {
  const [rows,     setRows]     = useState(null)
  const [filename, setFilename] = useState('')
  const [incVat,   setIncVat]   = useState(true)
  const [dragging, setDragging] = useState(false)
  const [error,    setError]    = useState('')
  const fileRef   = useRef()
  const printRoot = useRef()

  useEffect(() => {
    const el = document.createElement('style')
    el.id = 'epx-print-styles'
    el.textContent = PRINT_STYLES
    document.head.appendChild(el)
    return () => el.remove()
  }, [])

  const handlePrint = () => {
    if (!printRoot.current) return
    printRoot.current.id = 'epx-print-root'
    window.print()
  }

  // Build lookup: psNo → { epxQuote, itemSummary } from orders + history
  const appLookup = useCallback(() => {
    const map = {}
    ;[...orders, ...history].forEach(o => {
      if (o.psNo) {
        map[String(o.psNo).trim().toLowerCase()] = {
          epxQuote:    o.epxQuote    ?? null,
          itemSummary: o.itemSummary ?? null,
          psUrl:       o.psUrl       ?? null,
        }
      }
    })
    return map
  }, [orders, history])

  const parseFile = useCallback((file) => {
    setError('')
    if (!file) return
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const wb   = XLSX.read(e.target.result, { type: 'array' })
        const ws   = wb.Sheets[wb.SheetNames[0]]
        const data = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' })
        const lookup = appLookup()
        const parsed = data.slice(1).filter(r => String(r[COL_WAYBILL] || '').trim()).map(r => {
          const waybill    = String(r[COL_WAYBILL]     || '').trim()
          const psNo       = String(r[COL_REFERENCE]   || '').trim()
          const consignee  = String(r[COL_CONSIGNEE]   || '').trim()
          const subtotal   = parseFloat(r[COL_SUBTOTAL])   || 0
          const totalInc   = parseFloat(r[COL_TOTAL_INC])  || 0
          const actualMass = parseFloat(r[COL_ACTUAL_MASS]) || 0
          const volMass    = parseFloat(r[COL_VOL_MASS])    || 0
          const chrgMass   = parseFloat(r[COL_CHRG_MASS])   || 0
          const appData    = psNo ? (lookup[psNo.toLowerCase()] ?? null) : null
          const found      = psNo ? (psNo.toLowerCase() in lookup) : false
          const appWeight  = appData ? parseAppWeight(appData.itemSummary) : null
          return { waybill, psNo, consignee, subtotal, totalInc, actualMass, volMass, chrgMass, appQuote: appData?.epxQuote ?? null, appWeight, psUrl: appData?.psUrl ?? null, found }
        })
        setRows(parsed)
        setFilename(file.name)
      } catch (err) {
        setError('Could not read file: ' + err.message)
      }
    }
    reader.readAsArrayBuffer(file)
  }, [appLookup])

  const onDrop = useCallback((e) => {
    e.preventDefault(); setDragging(false)
    parseFile(e.dataTransfer.files[0])
  }, [parseFile])

  const downloadCSV = () => {
    if (!rows) return
    const epxCol = incVat ? 'EPX Total (inc VAT)' : 'EPX Subtotal (excl VAT)'
    const header = ['Waybill', 'PS Number', 'Consignee', epxCol, 'App Quote (EPX)', 'Variance', 'EPX Chrg Mass', 'App Weight', 'Weight Diff', 'Status']
    const body = rows.map(r => {
      const epxAmt   = incVat ? r.totalInc : r.subtotal
      const status   = !r.found ? 'Not found' : STATUS_META[rowStatus(epxAmt, r.appQuote)].label
      const v        = variance(epxAmt, r.appQuote)
      const wDiff    = r.appWeight != null ? (r.chrgMass - r.appWeight).toFixed(2) : '—'
      return [r.waybill, r.psNo || '—', r.consignee, epxAmt.toFixed(2), r.appQuote != null ? r.appQuote.toFixed(2) : '—', v != null ? v.toFixed(2) : '—', r.chrgMass.toFixed(2), r.appWeight != null ? r.appWeight.toFixed(2) : '—', wDiff, status]
    })
    const epxTotal = rows.reduce((s, r) => s + (incVat ? r.totalInc : r.subtotal), 0)
    const appTotal = rows.reduce((s, r) => s + (r.appQuote ?? 0), 0)
    const varTotal = rows.filter(r => r.appQuote != null).reduce((s, r) => s + variance(incVat ? r.totalInc : r.subtotal, r.appQuote), 0)
    body.push(['', '', 'TOTAL', epxTotal.toFixed(2), appTotal.toFixed(2), varTotal.toFixed(2), '', '', '', ''])

    const csv = [header, ...body].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a'); a.href = url
    a.download = filename.replace(/\.[^.]+$/, '') + '_reconciliation.csv'
    a.click(); URL.revokeObjectURL(url)
  }

  const epxTotal  = rows ? rows.reduce((s, r) => s + (incVat ? r.totalInc : r.subtotal), 0) : 0
  const appTotal  = rows ? rows.reduce((s, r) => s + (r.appQuote ?? 0), 0) : 0
  const varTotal  = rows ? rows.filter(r => r.appQuote != null).reduce((s, r) => s + variance(incVat ? r.totalInc : r.subtotal, r.appQuote), 0) : 0
  const issues    = rows ? rows.filter(r => !r.found || rowStatus(incVat ? r.totalInc : r.subtotal, r.appQuote) !== 'match').length : 0
  const weightIssues = rows ? rows.filter(r => r.appWeight != null && weightStatus(r.chrgMass, r.appWeight) !== 'ok').length : 0

  return (
    <div className="space-y-6">

      {/* Drop zone */}
      {!rows && (
        <div
          onDragOver={e => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          onClick={() => fileRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-16 text-center cursor-pointer transition-colors
            ${dragging
              ? 'border-[#FECD28] bg-yellow-50 dark:bg-yellow-900/10'
              : 'border-slate-200 dark:border-slate-700 hover:border-[#FECD28] hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}
        >
          <Upload size={32} className="mx-auto mb-3 text-slate-400" />
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Drop EPX invoice here</p>
          <p className="text-xs text-slate-400 mt-1">or click to browse — .xlsx files only</p>
          <input ref={fileRef} type="file" accept=".xlsx" className="hidden"
            onChange={e => parseFile(e.target.files[0])} />
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 p-4 rounded-xl bg-red-50 dark:bg-red-900/10 text-red-700 dark:text-red-400 text-sm">
          <XCircle size={16} /> {error}
        </div>
      )}

      {rows && (
        <div ref={printRoot}>
          {/* Print header — only visible when printing */}
          <div className="hidden print:block print-title">EPX Reconciliation — {filename}</div>
          <div className="hidden print:block print-meta">
            {rows.length} waybills · {incVat ? 'Inc VAT' : 'Excl VAT'} · Generated {new Date().toLocaleDateString('en-ZA')}
          </div>

          {/* Toolbar */}
          <div className="flex items-center gap-3 flex-wrap no-print">
            <div>
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{filename}</p>
              <p className="text-xs text-slate-400">{rows.length} waybills · {issues} pricing issue{issues !== 1 ? 's' : ''}{weightIssues > 0 ? ` · ${weightIssues} weight discrepanc${weightIssues !== 1 ? 'ies' : 'y'}` : ''}</p>
            </div>
            <div className="ml-auto flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-1 text-xs bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
                <button onClick={() => setIncVat(true)}
                  className={`px-3 py-1.5 rounded-md font-medium transition-colors ${incVat ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-800 dark:text-slate-200' : 'text-slate-400 hover:text-slate-600'}`}>
                  Inc VAT
                </button>
                <button onClick={() => setIncVat(false)}
                  className={`px-3 py-1.5 rounded-md font-medium transition-colors ${!incVat ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-800 dark:text-slate-200' : 'text-slate-400 hover:text-slate-600'}`}>
                  Excl VAT
                </button>
              </div>
              <button onClick={() => { setRows(null); setFilename('') }}
                className="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800">
                Load new file
              </button>
              <button onClick={downloadCSV}
                className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold rounded-lg bg-[#FECD28] text-slate-900 hover:brightness-95">
                <Download size={13} /> Download CSV
              </button>
              <button onClick={handlePrint}
                className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800">
                <Printer size={13} /> Print / PDF
              </button>
            </div>
          </div>

          {/* Summary tiles */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 no-print">
            {[
              { label: 'EPX Invoice Total',  value: fmt(epxTotal),    sub: incVat ? 'inc VAT' : 'excl VAT' },
              { label: 'App Quotes Total',   value: fmt(appTotal),    sub: 'EPX quotes from app' },
              { label: 'Total Variance',     value: fmt(varTotal),    sub: varTotal > 0 ? 'overcharged' : varTotal < 0 ? 'undercharged' : 'balanced', highlight: Math.abs(varTotal) > 0.01 },
              { label: 'Pricing Issues',     value: issues,           sub: `of ${rows.length} waybills` },
              { label: 'Weight Discrepancies', value: weightIssues,   sub: '> 0.5 kg difference' },
            ].map(t => (
              <div key={t.label} className={`rounded-xl border p-4 ${t.highlight ? 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/10' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800'}`}>
                <p className="text-xs text-slate-400 mb-1">{t.label}</p>
                <p className={`text-xl font-bold tabular-nums ${t.highlight ? 'text-red-600 dark:text-red-400' : 'text-slate-800 dark:text-slate-200'}`}>{t.value}</p>
                <p className="text-xs text-slate-400 mt-0.5">{t.sub}</p>
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-2 text-xs no-print">
            {Object.entries(STATUS_META).map(([k, m]) => (
              <span key={k} className={`px-2 py-0.5 rounded-full border ${m.badge}`}>{m.label}</span>
            ))}
          </div>

          {/* Table */}
          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                  {['Waybill', 'PS No', 'Consignee', incVat ? 'EPX (inc VAT)' : 'EPX (excl VAT)', 'App Quote', 'Variance', 'EPX Chrg Mass', 'App Weight', 'Wt Diff', 'Status'].map(h => (
                    <th key={h} className="text-left px-3 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {rows.map((r, i) => {
                  const epxAmt = incVat ? r.totalInc : r.subtotal
                  const status = !r.found ? 'not_found' : rowStatus(epxAmt, r.appQuote)
                  const meta   = STATUS_META[status]
                  const v      = r.found ? variance(epxAmt, r.appQuote) : null
                  const ws     = weightStatus(r.chrgMass, r.appWeight)
                  const wDiff  = r.appWeight != null ? r.chrgMass - r.appWeight : null
                  return (
                    <tr key={i} className={`${meta.bg} transition-colors`}>
                      <td className="px-3 py-3 font-mono text-xs text-slate-700 dark:text-slate-300 whitespace-nowrap">{r.waybill}</td>
                      <td className="px-3 py-3 font-medium whitespace-nowrap">
                        {r.psUrl
                          ? <a href={r.psUrl} target="_blank" rel="noopener noreferrer"
                              className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1">
                              {r.psNo} <span className="text-[10px]">↗</span>
                            </a>
                          : <span className="text-slate-700 dark:text-slate-300">{r.psNo || '—'}</span>}
                      </td>
                      <td className="px-3 py-3 text-slate-600 dark:text-slate-400 max-w-[160px] truncate" title={r.consignee}>{r.consignee}</td>
                      <td className="px-3 py-3 tabular-nums font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap">{fmt(epxAmt)}</td>
                      <td className="px-3 py-3 tabular-nums text-slate-600 dark:text-slate-400 whitespace-nowrap">{r.appQuote != null ? fmt(r.appQuote) : <span className="text-slate-400 italic text-xs">no quote</span>}</td>
                      <td className={`px-3 py-3 tabular-nums font-semibold whitespace-nowrap ${meta.text}`}>
                        {v != null ? (v > 0 ? '+' : '') + fmt(v) : '—'}
                      </td>
                      <td className="px-3 py-3 tabular-nums text-slate-600 dark:text-slate-400 whitespace-nowrap">{fmtKg(r.chrgMass)}</td>
                      <td className="px-3 py-3 tabular-nums text-slate-600 dark:text-slate-400 whitespace-nowrap">
                        {r.appWeight != null ? fmtKg(r.appWeight) : <span className="text-slate-400 italic text-xs">—</span>}
                      </td>
                      <td className={`px-3 py-3 tabular-nums font-medium whitespace-nowrap
                        ${ws === 'heavier' ? 'text-amber-600 dark:text-amber-400'
                        : ws === 'lighter' ? 'text-blue-600 dark:text-blue-400'
                        : 'text-slate-400'}`}>
                        {wDiff != null ? (wDiff > 0 ? '+' : '') + wDiff.toFixed(2) + ' kg' : '—'}
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${meta.badge}`}>
                          {status === 'match' && <CheckCircle2 size={10} />}
                          {(status === 'over_high' || status === 'not_found') && <AlertTriangle size={10} />}
                          {status === 'no_quote' && <Info size={10} />}
                          {meta.label}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                  <td colSpan={3} className="px-3 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Total</td>
                  <td className="px-3 py-3 tabular-nums font-bold text-slate-800 dark:text-slate-200">{fmt(epxTotal)}</td>
                  <td className="px-3 py-3 tabular-nums font-bold text-slate-800 dark:text-slate-200">{fmt(appTotal)}</td>
                  <td className={`px-3 py-3 tabular-nums font-bold ${Math.abs(varTotal) > 0.01 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                    {varTotal > 0 ? '+' : ''}{fmt(varTotal)}
                  </td>
                  <td colSpan={4} />
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
