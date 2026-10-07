import { useState, useEffect, useRef } from 'react'
import { Eye, EyeOff, LogIn, ChevronRight, ChevronLeft } from 'lucide-react'
import { AuthProvider } from '../context/AuthContext'
import { ActivityProvider } from '../context/ActivityContext'
import { Dashboard } from '../App'

const DEMO_USER = {
  id: 999,
  name: 'Demo User',
  username: 'demo',
  role: 'admin',
  permissions: {
    orders:     { view: 1, edit: 1 },
    upload:     { view: 1, edit: 1 },
    staged:     { view: 1, edit: 1 },
    dispatch:   { view: 1, edit: 1 },
    wh:         { view: 1, edit: 1 },
    rebin:      { view: 1, edit: 1 },
    pricing:    { view: 1, edit: 1 },
    returns:    { view: 1, edit: 1 },
    admin:      { view: 1, edit: 1 },
    loudSounds: { view: 0, edit: 0 },
  },
}

/* Each step:
   selector       — element to highlight (null = centre modal)
   clickToAdvance — if true, clicking the highlighted element auto-advances
   action         — text shown on the "click here" CTA label
   title / body   — tooltip content
   placement      — 'bottom' | 'top' | 'center'
*/
const STEPS = [
  {
    title: 'Welcome to the Returns & Rebin tour',
    body: 'This is the real CabGlass courier dashboard. I\'ll guide you through exactly how returns and rebinning work. Click "Let\'s go" to start.',
    selector: null,
    placement: 'center',
    clickToAdvance: false,
  },
  {
    title: 'Step 1 — Open the Orders menu',
    body: 'Returns live under the Orders menu. Click the Orders button in the top nav to open the dropdown.',
    selector: '[data-nav="orders-menu"]',
    placement: 'bottom',
    clickToAdvance: true,
    action: '👆 Click here to open Orders',
  },
  {
    title: 'Step 2 — Go to Returns',
    body: 'You can see Orders, Upload, History and Returns here. Click Returns to see all active return requests.',
    selector: '[data-tab="returns"]',
    placement: 'bottom',
    clickToAdvance: true,
    action: '👆 Click Returns',
  },
  {
    title: 'Step 3 — The Finance approval gate',
    body: 'Every return starts as "Pending Finance Approval". No courier is booked until Finance approves — this prevents unauthorised collections and credit notes. Click Next to continue.',
    selector: '[data-tab="returns"]',
    placement: 'bottom',
    clickToAdvance: false,
  },
  {
    title: 'Step 4 — Go to History to create a return',
    body: 'Returns are created from the original order. Open the Orders menu and click History.',
    selector: '[data-nav="orders-menu"]',
    placement: 'bottom',
    clickToAdvance: true,
    action: '👆 Open the Orders menu',
  },
  {
    title: 'Step 5 — Click History',
    body: 'History shows all completed orders. From here you can create a return against any invoiced order.',
    selector: '[data-tab="history"]',
    placement: 'bottom',
    clickToAdvance: true,
    action: '👆 Click History',
  },
  {
    title: 'Step 6 — Creating a return',
    body: 'Find an order and click "Create Return" in the side panel. You\'ll select which items are being returned and whether CabGlass books the collection or the buyer ships it themselves. Click Next to continue.',
    selector: null,
    placement: 'center',
    clickToAdvance: false,
  },
  {
    title: 'Step 7 — Open the Warehouse menu',
    body: 'When returned stock physically arrives, it gets rebinned from the Warehouse menu. Click Warehouse.',
    selector: '[data-nav="warehouse-menu"]',
    placement: 'bottom',
    clickToAdvance: true,
    action: '👆 Click Warehouse',
  },
  {
    title: 'Step 8 — Go to Rebin',
    body: 'The Rebin tab shows all returns waiting to be received. Click Rebin to see it.',
    selector: '[data-tab="rebin"]',
    placement: 'bottom',
    clickToAdvance: true,
    action: '👆 Click Rebin',
  },
  {
    title: 'Step 9 — Recording condition',
    body: 'Click "Record & Rebin" on any return to record its condition (Good / Damaged / Other), add a note, and optionally upload photos. Finance sees this when deciding the credit amount. Click Next to continue.',
    selector: null,
    placement: 'center',
    clickToAdvance: false,
  },
  {
    title: 'Step 10 — Back to Returns to close',
    body: 'After rebinning, Finance logs the credit note number and clicks "Move to History" — completing the loop. Open Orders and go to Returns to see the final step.',
    selector: '[data-nav="orders-menu"]',
    placement: 'bottom',
    clickToAdvance: true,
    action: '👆 Open Orders menu',
  },
  {
    title: 'Step 11 — Returns',
    body: 'Returns in "Condition Checked" status are waiting for Finance to enter the credit note number and close them.',
    selector: '[data-tab="returns"]',
    placement: 'bottom',
    clickToAdvance: true,
    action: '👆 Click Returns',
  },
  {
    title: '✅ Tour complete!',
    body: 'That\'s the full returns and rebin workflow:\n\n1. Warehouse creates a return\n2. Finance approves\n3. Courier is booked (or buyer ships)\n4. Warehouse records condition + photos on arrival\n5. Finance logs the credit note and closes\n\nEvery step is tracked, auditable, and linked to the original order.',
    selector: null,
    placement: 'center',
    clickToAdvance: false,
  },
]

function useElementRect(selector, step, tick) {
  const [rect, setRect] = useState(null)
  useEffect(() => {
    if (!selector) { setRect(null); return }
    const update = () => {
      const el = document.querySelector(selector)
      if (el) {
        const r = el.getBoundingClientRect()
        setRect({ top: r.top, left: r.left, width: r.width, height: r.height })
      } else {
        setRect(null)
      }
    }
    update()
    const t1 = setTimeout(update, 200)
    const t2 = setTimeout(update, 600)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [selector, step, tick])
  return rect
}

function TutorialOverlay({ onExit }) {
  const [step, setStep] = useState(0)
  const [tick, setTick] = useState(0)
  const current = STEPS[step]
  const rect = useElementRect(current.selector, step, tick)
  const isLast = step === STEPS.length - 1

  // Re-measure on scroll/resize
  useEffect(() => {
    const refresh = () => setTick(t => t + 1)
    window.addEventListener('scroll', refresh, true)
    window.addEventListener('resize', refresh)
    return () => {
      window.removeEventListener('scroll', refresh, true)
      window.removeEventListener('resize', refresh)
    }
  }, [])

  // Auto-advance when user clicks the highlighted element
  useEffect(() => {
    if (!current.clickToAdvance || !current.selector) return
    const el = document.querySelector(current.selector)
    if (!el) return
    const handler = () => {
      setTimeout(() => {
        setStep(s => s + 1)
        setTick(t => t + 1)
      }, 180) // tiny delay so the UI updates first
    }
    el.addEventListener('click', handler)
    return () => el.removeEventListener('click', handler)
  }, [step, current, tick])

  const tooltipPos = () => {
    if (current.placement === 'center' || !rect) {
      return { position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 10002, width: 400 }
    }
    if (current.placement === 'top') {
      const left = Math.max(12, Math.min(rect.left + rect.width / 2 - 190, window.innerWidth - 412))
      return { position: 'fixed', top: rect.top - 14, left, zIndex: 10002, width: 380, transform: 'translateY(-100%)' }
    }
    const left = Math.max(12, Math.min(rect.left + rect.width / 2 - 190, window.innerWidth - 412))
    return { position: 'fixed', top: rect.top + rect.height + 14, left, zIndex: 10002, width: 380 }
  }

  const arrowUp   = current.placement === 'bottom' && rect
  const arrowDown = current.placement === 'top'    && rect

  return (
    <>
      <style>{`
        @keyframes tutorialPulse {
          0%,100% { box-shadow: 0 0 0 4px rgba(254,205,40,0.25); }
          50%      { box-shadow: 0 0 0 10px rgba(254,205,40,0.06); }
        }
        @keyframes tutorialBounce {
          0%,100% { transform: translateY(0); }
          50%      { transform: translateY(-5px); }
        }
        .demo-action-btn {
          animation: tutorialBounce 1.2s ease-in-out infinite;
          display: inline-flex; align-items: center; gap: 6px;
          background: #FECD28; color: #111; border: none;
          padding: 8px 16px; border-radius: 8px; font-weight: 700;
          font-size: 13px; cursor: pointer; font-family: inherit;
          margin-top: 10px;
        }
      `}</style>

      {/* Overlay — cutout keeps highlighted element visible AND clickable */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 9999, pointerEvents: 'none' }}>
        {rect ? (
          <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
            <defs>
              <mask id="demo-cutout">
                <rect width="100%" height="100%" fill="white" />
                <rect x={rect.left - 8} y={rect.top - 8}
                  width={rect.width + 16} height={rect.height + 16} rx="10" fill="black" />
              </mask>
            </defs>
            <rect width="100%" height="100%" fill="rgba(0,0,0,0.65)" mask="url(#demo-cutout)" />
          </svg>
        ) : (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.65)' }} />
        )}
      </div>

      {/* Highlight ring — pointer-events: none so clicks pass through to the real element */}
      {rect && (
        <div style={{
          position: 'fixed',
          top: rect.top - 8, left: rect.left - 8,
          width: rect.width + 16, height: rect.height + 16,
          borderRadius: 10,
          border: '2.5px solid #FECD28',
          zIndex: 10000,
          pointerEvents: 'none',
          animation: 'tutorialPulse 1.8s infinite',
        }} />
      )}

      {/* Tooltip */}
      <div style={tooltipPos()}>
        {arrowUp && (
          <div style={{ width: 0, height: 0, borderLeft: '10px solid transparent', borderRight: '10px solid transparent', borderBottom: '10px solid #1e293b', marginLeft: 28 }} />
        )}
        <div style={{
          background: '#1e293b', border: '1px solid #2d4060',
          borderRadius: 14, padding: '18px 20px',
          boxShadow: '0 24px 60px rgba(0,0,0,0.6)',
          color: '#f0f4ff', fontFamily: 'system-ui, -apple-system, sans-serif',
          pointerEvents: 'all',
        }}>
          {/* Progress + exit */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', maxWidth: 260 }}>
              {STEPS.map((_, i) => (
                <div key={i} style={{
                  width: i === step ? 18 : 6, height: 6, borderRadius: 3,
                  background: i === step ? '#FECD28' : i < step ? 'rgba(254,205,40,0.45)' : '#334468',
                  transition: 'all 0.2s', flexShrink: 0,
                }} />
              ))}
            </div>
            <button onClick={onExit} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: 12, fontFamily: 'inherit', padding: '2px 6px', whiteSpace: 'nowrap' }}>
              Exit ✕
            </button>
          </div>

          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 6, lineHeight: 1.3 }}>{current.title}</div>
          <div style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.65, whiteSpace: 'pre-line' }}>{current.body}</div>

          {/* Action CTA — shown when user needs to click something */}
          {current.clickToAdvance && current.action && (
            <div>
              <button className="demo-action-btn" onClick={() => {
                const el = document.querySelector(current.selector)
                if (el) el.click()
              }}>
                {current.action}
              </button>
              <div style={{ fontSize: 11, color: '#64748b', marginTop: 6 }}>or click the highlighted element directly</div>
            </div>
          )}

          {/* Nav buttons */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 16 }}>
            <span style={{ fontSize: 11, color: '#64748b' }}>{step + 1} / {STEPS.length}</span>
            <div style={{ display: 'flex', gap: 8 }}>
              {step > 0 && (
                <button onClick={() => { setStep(s => s - 1); setTick(t => t + 1) }} style={{
                  display: 'flex', alignItems: 'center', gap: 4,
                  padding: '7px 14px', borderRadius: 8, border: '1px solid #334468',
                  background: '#0f172a', color: '#f0f4ff', fontWeight: 600,
                  fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
                }}>
                  <ChevronLeft size={14} /> Back
                </button>
              )}
              {!current.clickToAdvance && !isLast && (
                <button onClick={() => { setStep(s => s + 1); setTick(t => t + 1) }} style={{
                  display: 'flex', alignItems: 'center', gap: 4,
                  padding: '7px 18px', borderRadius: 8, border: 'none',
                  background: '#FECD28', color: '#111', fontWeight: 700,
                  fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
                }}>
                  Next <ChevronRight size={14} />
                </button>
              )}
              {isLast && (
                <button onClick={onExit} style={{
                  padding: '7px 18px', borderRadius: 8, border: 'none',
                  background: '#FECD28', color: '#111', fontWeight: 700,
                  fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
                }}>
                  Finish ✓
                </button>
              )}
            </div>
          </div>
        </div>
        {arrowDown && (
          <div style={{ width: 0, height: 0, borderLeft: '10px solid transparent', borderRight: '10px solid transparent', borderTop: '10px solid #1e293b', marginLeft: 28, marginTop: -1 }} />
        )}
      </div>
    </>
  )
}

export default function DemoPage() {
  const [loggedIn, setLoggedIn] = useState(false)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loginErr, setLoginErr] = useState('')
  const [showTutorial, setShowTutorial] = useState(true)

  const handleLogin = (e) => {
    e.preventDefault()
    if (username.trim().toLowerCase() === 'demo' && password === 'boss123') {
      setLoggedIn(true)
    } else {
      setLoginErr('Incorrect username or password.')
    }
  }

  if (!loggedIn) {
    return (
      <div className="min-h-screen bg-slate-100 dark:bg-slate-900 flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl overflow-hidden border border-slate-200 dark:border-slate-700">
            <div style={{ backgroundColor: '#FECD28' }} className="px-8 py-6 flex flex-col items-center gap-2">
              <img src="/Cabglass_logo_PNG.avif" alt="CabGlass" className="h-10 w-auto" style={{ filter: 'brightness(0)' }} />
              <p className="text-[#111111]/60 text-sm font-medium">Courier Management</p>
            </div>
            <div className="px-8 py-7">
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-4">Sign in</h2>
              <div className="mb-4 flex items-center gap-2 text-xs bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg px-3 py-2 text-amber-700 dark:text-amber-300">
                <span>🔑</span>
                <span>Demo — username <strong>demo</strong> · password <strong>boss123</strong></span>
              </div>
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">Username</label>
                  <input type="text" value={username} onChange={e => setUsername(e.target.value)} required
                    className="w-full px-3 py-2.5 text-sm border border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-900 dark:text-slate-100 focus:outline-none placeholder:text-slate-400"
                    onFocus={e => e.target.style.boxShadow = '0 0 0 3px rgba(254,205,40,0.3)'}
                    onBlur={e => e.target.style.boxShadow = ''}
                    placeholder="Enter your username" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">Password</label>
                  <div className="relative">
                    <input type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required
                      className="w-full px-3 py-2.5 pr-10 text-sm border border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-900 dark:text-slate-100 focus:outline-none placeholder:text-slate-400"
                      onFocus={e => e.target.style.boxShadow = '0 0 0 3px rgba(254,205,40,0.3)'}
                      onBlur={e => e.target.style.boxShadow = ''}
                      placeholder="Enter your password" />
                    <button type="button" onClick={() => setShowPw(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                      {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>
                {loginErr && (
                  <p className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-3 py-2">{loginErr}</p>
                )}
                <button type="submit" disabled={!username || !password}
                  style={{ backgroundColor: '#FECD28' }}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold text-[#111111] disabled:opacity-50 hover:brightness-95 transition-all mt-2">
                  <LogIn size={15} /> Sign in
                </button>
              </form>
            </div>
          </div>
          <p className="text-center text-xs text-slate-400 mt-4">CabGlass Courier © 2026</p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ position: 'relative' }}>
      <AuthProvider _demoUser={DEMO_USER}>
        <ActivityProvider>
          <Dashboard />
        </ActivityProvider>
      </AuthProvider>

      {showTutorial && <TutorialOverlay onExit={() => setShowTutorial(false)} />}

      {!showTutorial && (
        <button
          onClick={() => setShowTutorial(true)}
          style={{
            position: 'fixed', bottom: 20, right: 20, zIndex: 9998,
            background: '#FECD28', color: '#111', border: 'none',
            borderRadius: 999, padding: '10px 18px',
            fontWeight: 700, fontSize: 13, cursor: 'pointer',
            fontFamily: 'system-ui, sans-serif',
            boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
          }}
        >
          📖 Restart tour
        </button>
      )}
    </div>
  )
}
