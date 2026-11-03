import { useState, useCallback, useRef } from 'react'
import { Upload, Download, AlertTriangle, CheckCircle2, XCircle, Info } from 'lucide-react'
import * as XLSX from 'xlsx'

// Column indices in the EPX Excel file (0-based)
const COL_WAYBILL   = 0
const COL_CONSIGNEE = 7
const COL_SUBTOTAL  = 14
const COL_TOTAL_INC = 16  // inc VAT
const COL_REFERENCE = 17  // PS number

function fmt(n) {
  if (n == null || n === '') return '—'
  return 'R ' + Number(n).toFixed(2)
}

function variance(epx, app) {
  if (app == null) return null
  return epx - app
}

function rowStatus(epxAmt, appAmt) {
  if (appAmt == null) return 'no_quote'
  const diff = epxAmt - appAmt
  const pct  = Math.abs(diff) / epxAmt
  if (Math.abs(diff) < 0.01) return 'match'
  if (diff > 0) return pct > 0.1 ? 'over_high' : 'over_low'
  return pct > 0.1 ? 'under_high' : 'under_low'
}

const STATUS_META = {
  match:      { label: 'Match',          bg: 'bg-green-50 dark:bg-green-900/10',  text: 'text-green-700 dark:text-green-400',  badge: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  over_low:   { label: 'Overcharged',    bg: 'bg-amber-50 dark:bg-amber-900/10',  text: 'text-amber-700 dark:text-amber-400',  badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  over_high:  { label: '⚠ Overcharged',  bg: 'bg-red-50 dark:bg-red-900/10',     text: 'text-red-700 dark:text-red-400',      badge: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
  under_low:  { label: 'Undercharged',   bg: 'bg-blue-50 dark:bg-blue-900/10',   text: 'text-blue-700 dark:text-blue-400',    badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  under_high: { label: '⚠ Undercharged', bg: 'bg-purple-50 dark:bg-purple-900/10',text: 'text-purple-700 dark:text-purple-400',badge: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' },
  no_quote:   { label: 'No app quote',   bg: 'bg-slate-50 dark:bg-slate-800/50',  text: 'text-slate-500',                      badge: 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400' },
  not_found:  { label: 'Not found',      bg: 'bg-red-50 dark:bg-red-900/10',     text: 'text-red-700 dark:text-red-400',      badge: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
}

export default function EPXReconcilePage({ orders = [], history = [] }) {
  const [rows,       setRows]       = useState(null)
  const [filename,   setFilename]   = useState('')
  const [incVat,     setIncVat]     = useState(true)
  const [dragging,   setDragging]   = useState(false)
  const [error,      setError]      = useState('')
  const fileRef = useRef()

  // Build a lookup: psNo → epxQuote (search orders + history)
  const appLookup = useCallback(() => {
    const map = {}
    ;[...orders, ...history].forEach(o => {
      if (o.psNo) map[String(o.psNo).trim().toLowerCase()] = o.epxQuote ?? null
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
        // Skip header row
        const lookup = appLookup()
        const parsed = data.slice(1).filter(r => String(r[COL_WAYBILL] || '').trim()).map(r => {
          const waybill   = String(r[COL_WAYBILL]   || '').trim()
          const psNo      = String(r[COL_REFERENCE]  || '').trim()
          const consignee = String(r[COL_CONSIGNEE]  || '').trim()
          const subtotal  = parseFloat(r[COL_SUBTOTAL])  || 0
          const totalInc  = parseFloat(r[COL_TOTAL_INC]) || 0
          const appQuote  = psNo ? (lookup[psNo.toLowerCase()] ?? null) : null
          const found     = psNo ? (psNo.toLowerCase() in lookup) : false
          return { waybill, psNo, consignee, subtotal, totalInc, appQuote, found }
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
    const header = ['Waybill', 'PS Number', 'Consignee', epxCol, 'App Quote (EPX)', 'Variance', 'Status']
    const body = rows.map(r => {
      const epxAmt = incVat ? r.totalInc : r.subtotal
      const status = !r.found ? 'Not found' : STATUS_META[rowStatus(epxAmt, r.appQuote)].label
      const v = variance(epxAmt, r.appQuote)
      return [r.waybill, r.psNo || '—', r.consignee, epxAmt.toFixed(2), r.appQuote != null ? r.appQuote.toFixed(2) : '—', v != null ? v.toFixed(2) : '—', status]
    })
    // Totals row
    const epxTotal  = rows.reduce((s, r) => s + (incVat ? r.totalInc : r.subtotal), 0)
    const appTotal  = rows.reduce((s, r) => s + (r.appQuote ?? 0), 0)
    const varTotal  = rows.filter(r => r.appQuote != null).reduce((s, r) => s + variance(incVat ? r.totalInc : r.subtotal, r.appQuote), 0)
    body.push(['', '', 'TOTAL', epxTotal.toFixed(2), appTotal.toFixed(2), varTotal.toFixed(2), ''])

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
        <>
          {/* Toolbar */}
          <div className="flex items-center gap-3 flex-wrap">
            <div>
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{filename}</p>
              <p className="text-xs text-slate-400">{rows.length} waybills · {issues} issue{issues !== 1 ? 's' : ''}</p>
            </div>
            <div className="ml-auto flex items-center gap-3 flex-wrap">
              {/* VAT toggle */}
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
            </div>
          </div>

          {/* Summary tiles */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label: 'EPX Invoice Total', value: fmt(epxTotal), sub: incVat ? 'inc VAT' : 'excl VAT' },
              { label: 'App Quotes Total',  value: fmt(appTotal), sub: 'EPX quotes from app' },
              { label: 'Total Variance',    value: fmt(varTotal), sub: varTotal > 0 ? 'overcharged' : varTotal < 0 ? 'undercharged' : 'balanced',
                highlight: Math.abs(varTotal) > 0.01 },
              { label: 'Issues',            value: issues, sub: `of ${rows.length} waybills` },
            ].map(t => (
              <div key={t.label} className={`rounded-xl border p-4 ${t.highlight ? 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/10' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800'}`}>
                <p className="text-xs text-slate-400 mb-1">{t.label}</p>
                <p className={`text-xl font-bold tabular-nums ${t.highlight ? 'text-red-600 dark:text-red-400' : 'text-slate-800 dark:text-slate-200'}`}>{t.value}</p>
                <p className="text-xs text-slate-400 mt-0.5">{t.sub}</p>
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-2 text-xs">
            {Object.entries(STATUS_META).map(([k, m]) => (
              <span key={k} className={`px-2 py-0.5 rounded-full border ${m.badge}`}>{m.label}</span>
            ))}
          </div>

          {/* Table */}
          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                  {['Waybill', 'PS Number', 'Consignee', incVat ? 'EPX (inc VAT)' : 'EPX (excl VAT)', 'App Quote', 'Variance', 'Status'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {rows.map((r, i) => {
                  const epxAmt = incVat ? r.totalInc : r.subtotal
                  const status = !r.found ? 'not_found' : rowStatus(epxAmt, r.appQuote)
                  const meta   = STATUS_META[status]
                  const v      = r.found ? variance(epxAmt, r.appQuote) : null
                  return (
                    <tr key={i} className={`${meta.bg} transition-colors`}>
                      <td className="px-4 py-3 font-mono text-xs text-slate-700 dark:text-slate-300 whitespace-nowrap">{r.waybill}</td>
                      <td className="px-4 py-3 font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap">{r.psNo || '—'}</td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-400 max-w-[200px] truncate" title={r.consignee}>{r.consignee}</td>
                      <td className="px-4 py-3 tabular-nums font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap">{fmt(epxAmt)}</td>
                      <td className="px-4 py-3 tabular-nums text-slate-600 dark:text-slate-400 whitespace-nowrap">{r.appQuote != null ? fmt(r.appQuote) : <span className="text-slate-400 italic">no quote</span>}</td>
                      <td className={`px-4 py-3 tabular-nums font-semibold whitespace-nowrap ${meta.text}`}>
                        {v != null ? (v > 0 ? '+' : '') + fmt(v) : '—'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
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
              {/* Totals */}
              <tfoot>
                <tr className="border-t-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                  <td colSpan={3} className="px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Total</td>
                  <td className="px-4 py-3 tabular-nums font-bold text-slate-800 dark:text-slate-200">{fmt(epxTotal)}</td>
                  <td className="px-4 py-3 tabular-nums font-bold text-slate-800 dark:text-slate-200">{fmt(appTotal)}</td>
                  <td className={`px-4 py-3 tabular-nums font-bold ${Math.abs(varTotal) > 0.01 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                    {varTotal > 0 ? '+' : ''}{fmt(varTotal)}
                  </td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
