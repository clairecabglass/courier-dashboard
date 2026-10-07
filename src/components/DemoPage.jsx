import { useState, useEffect } from 'react'
import { Eye, EyeOff, LogIn, ChevronRight, ChevronLeft } from 'lucide-react'
import { AuthProvider } from '../context/AuthContext'
import { ActivityProvider } from '../context/ActivityContext'
import { Dashboard } from '../App'

const DEMO_USER = {
  id: 999, name: 'Demo User', username: 'demo', role: 'admin',
  permissions: {
    orders: {view:1,edit:1}, upload: {view:1,edit:1}, staged: {view:1,edit:1},
    dispatch: {view:1,edit:1}, wh: {view:1,edit:1}, rebin: {view:1,edit:1},
    pricing: {view:1,edit:1}, returns: {view:1,edit:1}, admin: {view:1,edit:1},
    loudSounds: {view:0,edit:0},
  },
}

/*
  selector       — element to highlight + make clickable
  blurSelector   — element(s) to KEEP visible; everything else dims (null = dim all)
  clickToAdvance — clicking selector auto-advances
  action         — bouncing CTA text
  nextOnAny      — advance when ANY click happens inside blurSelector region
  placement      — tooltip placement: 'bottom' | 'top' | 'center' | 'left'
*/
const STEPS = [
  {
    title: 'Welcome to the Returns & Rebin tour',
    body: 'This is the real CabGlass courier dashboard — nothing is mocked. I\'ll walk you through creating a full return, approving it as Finance, and rebinning the stock when it arrives back.',
    selector: null, blurSelector: null, placement: 'center',
  },
  {
    title: 'Step 1 — Open the Orders menu',
    body: 'Returns live under the Orders menu in the top nav. Click Orders to open it.',
    selector: '[data-nav="orders-menu"]', blurSelector: '[data-nav="orders-menu"]',
    placement: 'bottom', clickToAdvance: true, action: '👆 Click Orders',
  },
  {
    title: 'Step 2 — Go to History',
    body: 'Returns are created from the original completed order. Click History to see past orders.',
    selector: '[data-tab="history"]', blurSelector: '[data-tab="history"]',
    placement: 'bottom', clickToAdvance: true, action: '👆 Click History',
  },
  {
    title: 'Step 3 — Select an order',
    body: 'You can see all completed orders here. Click any order row to open its details on the right.',
    selector: null, blurSelector: '.demo-content-area',
    placement: 'center', nextOnAny: '.demo-content-area',
  },
  {
    title: 'Step 4 — Create a return',
    body: 'The order details panel is open on the right. Scroll down to the bottom of the panel and click "Create Return".',
    selector: '[data-demo="create-return-btn"]', blurSelector: '[data-demo="create-return-btn"]',
    placement: 'top', clickToAdvance: true, action: '👆 Click Create Return',
  },
  {
    title: 'Step 5 — Submit the return request',
    body: 'Select which items are being returned and whether CabGlass books the collection or the buyer ships it back. Then click Confirm Return.',
    selector: '[data-demo="return-modal-submit"]', blurSelector: '.fixed.inset-0',
    placement: 'top', clickToAdvance: true, action: '👆 Confirm Return',
  },
  {
    title: '✅ Return request created!',
    body: 'The return is now sitting in "Pending Finance Approval". No courier is booked until Finance approves — this is the control gate that prevents unauthorised collections.',
    selector: null, blurSelector: null, placement: 'center',
  },
  {
    title: 'Step 6 — Go to Returns as Finance',
    body: 'Now let\'s put on the Finance hat. Open the Orders menu again.',
    selector: '[data-nav="orders-menu"]', blurSelector: '[data-nav="orders-menu"]',
    placement: 'bottom', clickToAdvance: true, action: '👆 Click Orders',
  },
  {
    title: 'Step 7 — Open Returns',
    body: 'Click Returns to see the Finance approval queue.',
    selector: '[data-tab="returns"]', blurSelector: '[data-tab="returns"]',
    placement: 'bottom', clickToAdvance: true, action: '👆 Click Returns',
  },
  {
    title: 'Step 8 — Approve the return',
    body: 'The return we just created is here with status "Pending Finance Approval". Click "Approve Return" to release it for courier booking.',
    selector: '[data-demo="approve-return-btn"]', blurSelector: '.demo-content-area',
    placement: 'top', clickToAdvance: true, action: '👆 Click Approve Return',
  },
  {
    title: '✅ Return approved!',
    body: 'The system will now automatically get courier quotes from TCG and EPX. Once quoted, the courier can be selected and a label bought — just like a normal outbound order.\n\nNow let\'s fast-forward to when the stock arrives back at the warehouse.',
    selector: null, blurSelector: null, placement: 'center',
  },
  {
    title: 'Step 9 — Open Warehouse menu',
    body: 'When returned stock physically arrives, warehouse records it in the Rebin tab. Click Warehouse.',
    selector: '[data-nav="warehouse-menu"]', blurSelector: '[data-nav="warehouse-menu"]',
    placement: 'bottom', clickToAdvance: true, action: '👆 Click Warehouse',
  },
  {
    title: 'Step 10 — Go to Rebin',
    body: 'The Rebin tab shows all returns that are waiting to be received and rebinned into stock.',
    selector: '[data-tab="rebin"]', blurSelector: '[data-tab="rebin"]',
    placement: 'bottom', clickToAdvance: true, action: '👆 Click Rebin',
  },
  {
    title: 'Step 11 — Record condition',
    body: 'You\'ll see the return here. Click "Record & Rebin" to open the condition form.',
    selector: '[data-demo="rebin-btn"]', blurSelector: '.demo-content-area',
    placement: 'top', clickToAdvance: true, action: '👆 Click Record & Rebin',
  },
  {
    title: 'Step 12 — Select condition & confirm',
    body: 'Select the condition (Good / Damaged / Other), optionally add a note and photos, then click Confirm & Rebin. Finance will see this condition when deciding the credit note amount.',
    selector: '[data-demo="rebin-confirm-btn"]', blurSelector: '.fixed.inset-0',
    placement: 'top', clickToAdvance: true, action: '👆 Confirm & Rebin',
  },
  {
    title: '🎉 That\'s the full workflow!',
    body: 'Here\'s what just happened:\n\n1️⃣  Warehouse created a return from the original order\n2️⃣  Finance approved it (the control gate)\n3️⃣  System auto-quoted couriers — label bought\n4️⃣  Stock arrived back — warehouse recorded condition + photos\n5️⃣  Finance logs a credit note number and moves to History\n\nEvery step is tracked, auditable, and linked to the original order. Nothing falls through the cracks.',
    selector: null, blurSelector: null, placement: 'center',
  },
]

/* Returns bounding rect of a selector, re-measured on step/tick change */
function useRect(selector, dep) {
  const [rect, setRect] = useState(null)
  useEffect(() => {
    if (!selector) { setRect(null); return }
    const measure = () => {
      const el = document.querySelector(selector)
      if (el) {
        const r = el.getBoundingClientRect()
        setRect({ top: r.top, left: r.left, width: r.width, height: r.height })
      } else {
        setRect(null)
      }
    }
    measure()
    const t1 = setTimeout(measure, 250)
    const t2 = setTimeout(measure, 700)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [selector, dep])
  return rect
}

function TutorialOverlay({ onExit }) {
  const [step, setStep] = useState(0)
  const [tick, setTick] = useState(0)
  const cur = STEPS[step]
  const isLast = step === STEPS.length - 1

  const targetRect  = useRect(cur.selector, `${step}-${tick}`)
  const contentRect = useRect(cur.blurSelector === '.demo-content-area' ? '.demo-content-area' : null, `${step}-${tick}`)

  // Refresh on scroll/resize
  useEffect(() => {
    const fn = () => setTick(t => t + 1)
    window.addEventListener('scroll', fn, true)
    window.addEventListener('resize', fn)
    return () => { window.removeEventListener('scroll', fn, true); window.removeEventListener('resize', fn) }
  }, [])

  // Auto-advance when user clicks the target element
  useEffect(() => {
    if (!cur.clickToAdvance || !cur.selector) return
    const advance = () => setTimeout(() => { setStep(s => s + 1); setTick(t => t + 1) }, 220)
    const el = document.querySelector(cur.selector)
    if (!el) return
    el.addEventListener('click', advance)
    return () => el.removeEventListener('click', advance)
  }, [step, tick, cur])

  // nextOnAny: advance when user clicks inside a region
  useEffect(() => {
    if (!cur.nextOnAny) return
    const container = document.querySelector(cur.nextOnAny)
    if (!container) return
    const advance = () => setTimeout(() => { setStep(s => s + 1); setTick(t => t + 1) }, 220)
    container.addEventListener('click', advance)
    return () => container.removeEventListener('click', advance)
  }, [step, tick, cur])

  /* Decide which rects to cut out of the overlay */
  const cutouts = []
  if (targetRect) cutouts.push({ ...targetRect, pad: 8, rx: 10 })
  // If content area is the blur target, also show it
  if (cur.blurSelector === '.demo-content-area' && contentRect && !targetRect) {
    cutouts.push({ ...contentRect, pad: 0, rx: 6 })
  }

  /* Tooltip positioning */
  const tooltipStyle = () => {
    if (cur.placement === 'center' || !targetRect) {
      return { position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', zIndex: 10002, width: 420 }
    }
    const pad = 14
    const w = 380
    const left = Math.max(12, Math.min(targetRect.left + targetRect.width / 2 - w / 2, window.innerWidth - w - 12))
    if (cur.placement === 'top') {
      return { position: 'fixed', bottom: window.innerHeight - targetRect.top + pad, left, zIndex: 10002, width: w }
    }
    return { position: 'fixed', top: targetRect.top + targetRect.height + pad, left, zIndex: 10002, width: w }
  }

  const arrowUp   = cur.placement === 'bottom' && targetRect
  const arrowDown = cur.placement === 'top'    && targetRect

  const next = () => { setStep(s => s + 1); setTick(t => t + 1) }
  const prev = () => { setStep(s => s - 1); setTick(t => t + 1) }

  return (
    <>
      <style>{`
        @keyframes demoPulse {
          0%,100% { box-shadow: 0 0 0 4px rgba(254,205,40,.25); }
          50%      { box-shadow: 0 0 0 10px rgba(254,205,40,.07); }
        }
        @keyframes demoBounce {
          0%,100% { transform: translateY(0); }
          50%      { transform: translateY(-5px); }
        }
        .demo-cta {
          display:inline-flex; align-items:center; gap:6px;
          background:#FECD28; color:#111; border:none;
          padding:9px 18px; border-radius:9px; font-weight:700;
          font-size:13px; cursor:pointer; font-family:inherit;
          margin-top:12px; animation: demoBounce 1.3s ease-in-out infinite;
        }
      `}</style>

      {/* Dimmed overlay with cutouts */}
      <div style={{ position:'fixed', inset:0, zIndex:9999, pointerEvents:'none' }}>
        {cutouts.length > 0 ? (
          <svg style={{ position:'absolute', inset:0, width:'100%', height:'100%' }}>
            <defs>
              <mask id="demo-mask">
                <rect width="100%" height="100%" fill="white" />
                {cutouts.map((c, i) => (
                  <rect key={i}
                    x={c.left - c.pad} y={c.top - c.pad}
                    width={c.width + c.pad * 2} height={c.height + c.pad * 2}
                    rx={c.rx} fill="black" />
                ))}
              </mask>
            </defs>
            <rect width="100%" height="100%" fill="rgba(0,0,0,0.68)" mask="url(#demo-mask)" />
          </svg>
        ) : (
          <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.68)' }} />
        )}
      </div>

      {/* Yellow highlight ring around target (pointer-events:none so clicks pass through) */}
      {targetRect && (
        <div style={{
          position:'fixed',
          top: targetRect.top - 8, left: targetRect.left - 8,
          width: targetRect.width + 16, height: targetRect.height + 16,
          borderRadius: 10, border: '2.5px solid #FECD28',
          zIndex: 10000, pointerEvents: 'none',
          animation: 'demoPulse 1.8s infinite',
        }} />
      )}

      {/* Tooltip */}
      <div style={tooltipStyle()}>
        {arrowDown && (
          <div style={{ width:0, height:0, borderLeft:'10px solid transparent', borderRight:'10px solid transparent', borderBottom:'10px solid #1e293b', marginLeft:28 }} />
        )}
        <div style={{
          background:'#1e293b', border:'1px solid #2d4060',
          borderRadius:14, padding:'18px 20px',
          boxShadow:'0 24px 64px rgba(0,0,0,0.6)',
          color:'#f0f4ff', fontFamily:'system-ui,-apple-system,sans-serif',
          pointerEvents:'all',
        }}>
          {/* Progress dots */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
            <div style={{ display:'flex', gap:4, flexWrap:'wrap', maxWidth:300 }}>
              {STEPS.map((_,i) => (
                <div key={i} onClick={() => { setStep(i); setTick(t => t+1) }} style={{
                  width: i===step ? 18 : 6, height:6, borderRadius:3, cursor:'pointer',
                  background: i===step ? '#FECD28' : i<step ? 'rgba(254,205,40,.45)' : '#334468',
                  transition:'all .2s', flexShrink:0,
                }} />
              ))}
            </div>
            <button onClick={onExit} style={{ background:'none', border:'none', color:'#64748b', cursor:'pointer', fontSize:12, fontFamily:'inherit', padding:'2px 8px', whiteSpace:'nowrap' }}>
              Exit ✕
            </button>
          </div>

          <div style={{ fontSize:14, fontWeight:700, marginBottom:6, lineHeight:1.3 }}>{cur.title}</div>
          <div style={{ fontSize:13, color:'#94a3b8', lineHeight:1.7, whiteSpace:'pre-line' }}>{cur.body}</div>

          {/* Bouncing CTA for click steps */}
          {cur.clickToAdvance && cur.action && (
            <div>
              <button className="demo-cta" onClick={() => {
                const el = document.querySelector(cur.selector)
                if (el) el.click()
              }}>{cur.action}</button>
              <div style={{ fontSize:11, color:'#475569', marginTop:5 }}>or click the highlighted element directly</div>
            </div>
          )}

          {/* nextOnAny CTA */}
          {cur.nextOnAny && (
            <div style={{ marginTop:10, fontSize:12, color:'#FECD28', fontWeight:600 }}>
              👆 Click any order row to continue
            </div>
          )}

          {/* Nav buttons */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginTop:16 }}>
            <span style={{ fontSize:11, color:'#475569' }}>{step+1} / {STEPS.length}</span>
            <div style={{ display:'flex', gap:8 }}>
              {step > 0 && (
                <button onClick={prev} style={{
                  display:'flex', alignItems:'center', gap:4,
                  padding:'7px 14px', borderRadius:8, border:'1px solid #334468',
                  background:'#0f172a', color:'#f0f4ff', fontWeight:600,
                  fontSize:13, cursor:'pointer', fontFamily:'inherit',
                }}>
                  <ChevronLeft size={14} /> Back
                </button>
              )}
              {!cur.clickToAdvance && !cur.nextOnAny && !isLast && (
                <button onClick={next} style={{
                  display:'flex', alignItems:'center', gap:4,
                  padding:'7px 18px', borderRadius:8, border:'none',
                  background:'#FECD28', color:'#111', fontWeight:700,
                  fontSize:13, cursor:'pointer', fontFamily:'inherit',
                }}>
                  Next <ChevronRight size={14} />
                </button>
              )}
              {isLast && (
                <button onClick={onExit} style={{
                  padding:'7px 18px', borderRadius:8, border:'none',
                  background:'#FECD28', color:'#111', fontWeight:700,
                  fontSize:13, cursor:'pointer', fontFamily:'inherit',
                }}>
                  Finish ✓
                </button>
              )}
            </div>
          </div>
        </div>
        {arrowUp && (
          <div style={{ width:0, height:0, borderLeft:'10px solid transparent', borderRight:'10px solid transparent', borderTop:'10px solid #1e293b', marginLeft:28, marginTop:-1 }} />
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
            <div style={{ backgroundColor:'#FECD28' }} className="px-8 py-6 flex flex-col items-center gap-2">
              <img src="/Cabglass_logo_PNG.avif" alt="CabGlass" className="h-10 w-auto" style={{ filter:'brightness(0)' }} />
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
                    onFocus={e => e.target.style.boxShadow='0 0 0 3px rgba(254,205,40,0.3)'}
                    onBlur={e => e.target.style.boxShadow=''}
                    placeholder="Enter your username" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">Password</label>
                  <div className="relative">
                    <input type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required
                      className="w-full px-3 py-2.5 pr-10 text-sm border border-slate-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-900 dark:text-slate-100 focus:outline-none placeholder:text-slate-400"
                      onFocus={e => e.target.style.boxShadow='0 0 0 3px rgba(254,205,40,0.3)'}
                      onBlur={e => e.target.style.boxShadow=''}
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
                  style={{ backgroundColor:'#FECD28' }}
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
    <div style={{ position:'relative' }}>
      <AuthProvider _demoUser={DEMO_USER}>
        <ActivityProvider>
          <Dashboard />
        </ActivityProvider>
      </AuthProvider>

      {showTutorial && <TutorialOverlay onExit={() => setShowTutorial(false)} />}

      {!showTutorial && (
        <button onClick={() => setShowTutorial(true)} style={{
          position:'fixed', bottom:20, right:20, zIndex:9998,
          background:'#FECD28', color:'#111', border:'none',
          borderRadius:999, padding:'10px 18px', fontWeight:700,
          fontSize:13, cursor:'pointer', fontFamily:'system-ui,sans-serif',
          boxShadow:'0 4px 20px rgba(0,0,0,0.3)',
        }}>
          📖 Restart tour
        </button>
      )}
    </div>
  )
}
