import { useState, useEffect, createContext, useContext } from 'react'
import { Eye, EyeOff, LogIn, ChevronRight, ChevronLeft } from 'lucide-react'
import { AuthProvider } from '../context/AuthContext'
import { ActivityProvider } from '../context/ActivityContext'
import { Dashboard } from '../App'

/* Demo user — full admin perms so all tabs are visible */
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

/* Tutorial steps */
const STEPS = [
  {
    title: 'Welcome to the Returns & Rebin demo',
    body: 'This is the real CabGlass courier dashboard. Click Next and we\'ll walk you through the returns and rebinning workflow.',
    selector: null,
    placement: 'center',
  },
  {
    title: 'Returns tab',
    body: 'The Returns tab shows all active return requests. Returns are completely separate from normal outbound orders.',
    selector: '[data-tab="returns"]',
    placement: 'bottom',
  },
  {
    title: 'Finance approval gate',
    body: 'Every return lands here first as "Pending Finance Approval". Finance must approve before any collection courier is booked — preventing unauthorised returns.',
    selector: '[data-tab="returns"]',
    placement: 'bottom',
  },
  {
    title: 'Creating a return',
    body: 'Go to History, find the original order, and click "Create Return". Tick the items being returned and choose: does CabGlass book the collection, or does the buyer ship it back themselves?',
    selector: '[data-tab="history"]',
    placement: 'bottom',
  },
  {
    title: 'Multiple returns per order',
    body: 'You can create a 2nd or 3rd return for the same order — each gets its own RTN number (RTN-2-25354, RTN-2-25354-2). Each has its own approval, courier booking, and credit note.',
    selector: '[data-tab="history"]',
    placement: 'bottom',
  },
  {
    title: 'Buyer arranges shipping',
    body: 'When the customer ships it back themselves, no courier is booked. Status becomes "Awaiting Return" — warehouse just watches for inbound stock to arrive without a waybill.',
    selector: '[data-tab="returns"]',
    placement: 'bottom',
  },
  {
    title: 'Rebin — when stock arrives',
    body: 'When returned stock physically arrives, go to the Rebin tab. Select condition (Good / Damaged / Other), write an optional note, and upload photos as evidence.',
    selector: '[data-tab="rebin"]',
    placement: 'bottom',
  },
  {
    title: 'Photos create a paper trail',
    body: 'Photos are optional but powerful — they create an undisputable timestamped record of condition. If a customer disputes a credit amount, the proof is right here.',
    selector: '[data-tab="rebin"]',
    placement: 'bottom',
  },
  {
    title: 'Finance closes the loop',
    body: 'Finance sees the condition warehouse recorded. They raise the credit note in the accounting system, log the number here, and click "Move to History" — the return is complete.',
    selector: '[data-tab="returns"]',
    placement: 'bottom',
  },
  {
    title: 'Full audit trail',
    body: 'Every completed return in History shows who requested it, when Finance approved it, the condition, photos, and the credit note — all linked to the original order. Nothing falls through the cracks.',
    selector: '[data-tab="history"]',
    placement: 'bottom',
  },
]

function useElementRect(selector, step) {
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
    const t = setTimeout(update, 400)
    return () => clearTimeout(t)
  }, [selector, step])
  return rect
}

function TutorialOverlay({ onExit }) {
  const [step, setStep] = useState(0)
  const current = STEPS[step]
  const rect = useElementRect(current.selector, step)
  const isLast = step === STEPS.length - 1
  const showArrow = current.placement !== 'center' && rect

  const tooltipPos = () => {
    if (current.placement === 'center' || !rect) {
      return { position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', zIndex: 10001, width: 380 }
    }
    const gap = 14
    const left = Math.max(12, Math.min(rect.left + rect.width / 2 - 190, window.innerWidth - 392))
    return { position: 'fixed', top: rect.top + rect.height + gap, left, zIndex: 10001, width: 380 }
  }

  return (
    <>
      {/* Dimmed overlay with cutout */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 9999, pointerEvents: 'none' }}>
        {rect ? (
          <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
            <defs>
              <mask id="tutorial-cutout">
                <rect width="100%" height="100%" fill="white" />
                <rect x={rect.left - 8} y={rect.top - 8} width={rect.width + 16} height={rect.height + 16} rx="10" fill="black" />
              </mask>
            </defs>
            <rect width="100%" height="100%" fill="rgba(0,0,0,0.6)" mask="url(#tutorial-cutout)" />
          </svg>
        ) : (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)' }} />
        )}
      </div>

      {/* Highlight ring */}
      {rect && (
        <div style={{
          position: 'fixed',
          top: rect.top - 8, left: rect.left - 8,
          width: rect.width + 16, height: rect.height + 16,
          borderRadius: 10,
          border: '2.5px solid #FECD28',
          boxShadow: '0 0 0 4px rgba(254,205,40,0.2)',
          zIndex: 10000,
          pointerEvents: 'none',
          animation: 'tutorialPulse 2s infinite',
        }} />
      )}

      <style>{`
        @keyframes tutorialPulse {
          0%, 100% { box-shadow: 0 0 0 4px rgba(254,205,40,0.2); }
          50% { box-shadow: 0 0 0 8px rgba(254,205,40,0.08); }
        }
      `}</style>

      {/* Tooltip */}
      <div style={tooltipPos()}>
        {showArrow && (
          <div style={{
            width: 0, height: 0,
            borderLeft: '10px solid transparent',
            borderRight: '10px solid transparent',
            borderBottom: '10px solid #1e293b',
            marginLeft: 28,
          }} />
        )}
        <div style={{
          background: '#1e293b',
          border: '1px solid #2d4060',
          borderRadius: 14,
          padding: '18px 20px',
          boxShadow: '0 24px 60px rgba(0,0,0,0.55)',
          color: '#f0f4ff',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          pointerEvents: 'all',
        }}>
          {/* Progress dots + exit */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ display: 'flex', gap: 4 }}>
              {STEPS.map((_, i) => (
                <div key={i} onClick={() => setStep(i)} style={{
                  width: i === step ? 20 : 6, height: 6, borderRadius: 3, cursor: 'pointer',
                  background: i === step ? '#FECD28' : i < step ? 'rgba(254,205,40,0.45)' : '#334468',
                  transition: 'all 0.2s',
                }} />
              ))}
            </div>
            <button onClick={onExit} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: 12, fontFamily: 'inherit', padding: '2px 6px' }}>
              Exit demo ✕
            </button>
          </div>

          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 7, lineHeight: 1.3 }}>{current.title}</div>
          <div style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.65, marginBottom: 16 }}>{current.body}</div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 11, color: '#64748b' }}>{step + 1} / {STEPS.length}</span>
            <div style={{ display: 'flex', gap: 8 }}>
              {step > 0 && (
                <button onClick={() => setStep(s => s - 1)} style={{
                  display: 'flex', alignItems: 'center', gap: 4,
                  padding: '7px 14px', borderRadius: 8,
                  border: '1px solid #334468', background: '#0f172a',
                  color: '#f0f4ff', fontWeight: 600, fontSize: 13,
                  cursor: 'pointer', fontFamily: 'inherit',
                }}>
                  <ChevronLeft size={14} /> Back
                </button>
              )}
              {!isLast ? (
                <button onClick={() => setStep(s => s + 1)} style={{
                  display: 'flex', alignItems: 'center', gap: 4,
                  padding: '7px 18px', borderRadius: 8,
                  border: 'none', background: '#FECD28',
                  color: '#111', fontWeight: 700, fontSize: 13,
                  cursor: 'pointer', fontFamily: 'inherit',
                }}>
                  Next <ChevronRight size={14} />
                </button>
              ) : (
                <button onClick={onExit} style={{
                  padding: '7px 18px', borderRadius: 8,
                  border: 'none', background: '#FECD28',
                  color: '#111', fontWeight: 700, fontSize: 13,
                  cursor: 'pointer', fontFamily: 'inherit',
                }}>
                  Done ✓
                </button>
              )}
            </div>
          </div>
        </div>
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

  /* ── LOGIN PAGE ── */
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

  /* ── REAL DASHBOARD + TUTORIAL OVERLAY ── */
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
            boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
          }}
        >
          📖 Restart tour
        </button>
      )}
    </div>
  )
}
