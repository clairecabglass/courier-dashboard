import { useState, useEffect, useRef, useCallback } from 'react'
import { Eye, EyeOff, LogIn } from 'lucide-react'

/* ── Injected styles for the dark demo walkthrough ── */
const DEMO_CSS = `
.demo-root{display:flex;flex-direction:column;height:100vh;background:#0c1220;color:#f0f4ff;font-family:'Inter',system-ui,sans-serif;font-size:14px;line-height:1.6;overflow:hidden}
.demo-header{display:flex;align-items:center;gap:16px;padding:12px 20px;background:#1a2540;border-bottom:1px solid #334468;flex-shrink:0;position:sticky;top:0;z-index:50}
.demo-logo-wrap{font-weight:800;font-size:15px;display:flex;align-items:center;gap:8px;flex-shrink:0;letter-spacing:-.2px}
.demo-logo-box{background:#FECD28;color:#111;font-size:11px;font-weight:800;width:24px;height:24px;border-radius:6px;display:flex;align-items:center;justify-content:center;flex-shrink:0}
.demo-step-dots{flex:1;display:flex;align-items:center;gap:4px;overflow-x:auto;scrollbar-width:none}
.demo-step-dots::-webkit-scrollbar{display:none}
.demo-dot{height:4px;border-radius:2px;background:#334468;transition:background .2s,width .2s;flex-shrink:0}
.demo-dot.w-7{width:28px}
.demo-dot.w-10{width:40px}
.demo-dot-done{background:rgba(254,205,40,.5)}
.demo-dot-active{background:#FECD28;width:40px!important}
.demo-role-badge{font-size:11px;font-weight:600;padding:4px 10px;border-radius:20px;border:1px solid;flex-shrink:0}
.demo-role-wh{background:rgba(59,130,246,.15);border-color:rgba(59,130,246,.4);color:#93c5fd}
.demo-role-fin{background:rgba(168,85,247,.15);border-color:rgba(168,85,247,.4);color:#d8b4fe}
.demo-exit{background:none;border:none;color:#8899bb;cursor:pointer;font-size:12px;padding:4px 8px;border-radius:6px;font-family:inherit;flex-shrink:0}
.demo-exit:hover{color:#f0f4ff}
.demo-body{flex:1;display:grid;grid-template-columns:1fr;overflow:hidden}
@media(min-width:860px){.demo-body{grid-template-columns:1fr 320px}}
.demo-main{padding:24px;overflow-y:auto}
.demo-aside{padding:20px;background:#1a2540;border-left:1px solid #334468;overflow-y:auto}
@media(max-width:859px){.demo-aside{border-left:none;border-top:1px solid #334468;max-height:280px}}
.demo-footer{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:12px 20px;background:#1a2540;border-top:1px solid #334468;flex-shrink:0}
.demo-btn-prev,.demo-btn-next{padding:8px 18px;border-radius:8px;font-weight:600;font-size:13px;cursor:pointer;font-family:inherit;border:none;transition:opacity .15s}
.demo-btn-prev{background:#243050;color:#f0f4ff}.demo-btn-prev:hover{opacity:.8}.demo-btn-prev:disabled{opacity:.3;cursor:default}
.demo-btn-next{background:#FECD28;color:#111}.demo-btn-next:hover{opacity:.9}.demo-btn-next:disabled{opacity:.3;cursor:default}
.demo-counter{font-size:12px;color:#8899bb;font-weight:500}
.demo-step-num{font-size:11px;font-weight:700;color:#FECD28;text-transform:uppercase;letter-spacing:.08em;margin-bottom:4px}
.demo-step-title{font-size:22px;font-weight:800;line-height:1.2;margin-bottom:6px}
.demo-step-sub{color:#8899bb;font-size:14px;margin-bottom:20px;max-width:480px}
.dmk{background:#243050;border:1px solid #334468;border-radius:14px;overflow:hidden;margin-bottom:4px}
.dmk-bar{background:#1a2540;border-bottom:1px solid #334468;padding:9px 14px;display:flex;align-items:center;gap:8px}
.dmk-bar-title{font-size:12px;font-weight:600;color:#8899bb}
.dmk-inner{padding:14px}
.dmk-card{background:#1a2540;border:1.5px solid #334468;border-radius:11px;padding:13px 15px;margin-bottom:9px}
.dmk-card:last-child{margin-bottom:0}
.dmk-card-hl{border-color:#FECD28;box-shadow:0 0 0 2px rgba(254,205,40,.1)}
.dmk-row{display:flex;align-items:flex-start;justify-content:space-between;gap:10px;flex-wrap:wrap}
.dmk-main{min-width:0;flex:1}
.dmk-acts{display:flex;flex-direction:column;align-items:flex-end;gap:6px;flex-shrink:0}
.dmk-tag{display:inline-flex;align-items:center;font-size:10px;font-weight:700;padding:2px 8px;border-radius:20px;margin-right:5px;margin-bottom:3px}
.dmk-tag-rtn{background:rgba(249,115,22,.15);color:#f97316;border:1px solid rgba(249,115,22,.3)}
.dmk-tag-ps{background:rgba(59,130,246,.1);color:#93c5fd;border:1px solid rgba(59,130,246,.25)}
.dmk-name{font-size:13px;font-weight:600;margin-bottom:2px}
.dmk-meta{font-size:12px;color:#8899bb}
.dmk-items{margin-top:9px;padding-top:9px;border-top:1px solid #334468}
.dmk-irow{display:flex;justify-content:space-between;font-size:11px;color:#8899bb;padding:2px 0;font-family:monospace}
.sbadge{display:inline-flex;align-items:center;font-size:10px;font-weight:700;padding:2px 8px;border-radius:20px;letter-spacing:.02em;margin-left:4px}
.sb-pending{background:rgba(168,85,247,.15);color:#d8b4fe;border:1px solid rgba(168,85,247,.3)}
.sb-ready{background:rgba(34,197,94,.1);color:#86efac;border:1px solid rgba(34,197,94,.25)}
.sb-await{background:rgba(249,115,22,.1);color:#fdba74;border:1px solid rgba(249,115,22,.25)}
.sb-checked{background:rgba(34,197,94,.15);color:#4ade80;border:1px solid rgba(34,197,94,.3)}
.sb-booked{background:rgba(254,205,40,.1);color:#FECD28;border:1px solid rgba(254,205,40,.25)}
.sb-buyer{background:rgba(100,116,139,.15);color:#94a3b8;border:1px solid rgba(100,116,139,.3)}
.mb{display:inline-flex;align-items:center;gap:5px;font-size:11px;font-weight:600;padding:5px 11px;border-radius:7px;cursor:pointer;border:none;font-family:inherit;transition:opacity .15s;white-space:nowrap}
.mb:hover{opacity:.85}
.mb-brand{background:#FECD28;color:#111}
.mb-ghost{background:#243050;color:#f0f4ff;border:1px solid #334468}
.mb-purple{background:rgba(168,85,247,.2);color:#d8b4fe;border:1px solid rgba(168,85,247,.4)}
.mb-danger{background:rgba(239,68,68,.1);color:#fca5a5;border:1px solid rgba(239,68,68,.3)}
.mb-success{background:rgba(34,197,94,.15);color:#86efac;border:1px solid rgba(34,197,94,.3)}
.mb-sm{font-size:10px;padding:4px 9px;border-radius:6px}
.mb:disabled{opacity:.35;cursor:default}
.confirm-row{display:flex;align-items:center;gap:8px;background:rgba(239,68,68,.08);border:1px solid rgba(239,68,68,.2);border-radius:8px;padding:8px 10px;margin-top:8px}
.confirm-q{font-size:11px;color:#fca5a5;flex:1}
.flash{background:rgba(34,197,94,.12);border:1px solid rgba(34,197,94,.3);border-radius:9px;padding:11px 14px;display:flex;align-items:center;gap:10px;font-size:13px;color:#86efac;font-weight:500;margin-top:10px}
.cond-pills{display:flex;gap:6px;flex-wrap:wrap;margin-top:4px}
.cpill{font-size:11px;font-weight:600;padding:6px 14px;border-radius:20px;cursor:pointer;border:2px solid #334468;background:transparent;color:#8899bb;transition:all .15s;font-family:inherit}
.cpill-good.active{background:#16a34a;border-color:#16a34a;color:#fff}
.cpill-damaged.active{background:#ef4444;border-color:#ef4444;color:#fff}
.cpill-other.active{background:#d97706;border-color:#d97706;color:#fff}
.photo-area{border:2px dashed #334468;border-radius:9px;padding:18px;text-align:center;cursor:pointer;transition:border-color .15s;margin-top:8px}
.photo-area:hover,.photo-area-filled{border-color:#FECD28}
.credit-row{display:flex;gap:8px;align-items:center;margin-top:8px}
.credit-inp{flex:1;background:#243050;border:1.5px solid #334468;border-radius:8px;padding:7px 11px;font-size:12px;color:#f0f4ff;font-family:inherit;outline:none}
.credit-inp:focus{border-color:#FECD28}
.rtn-num{font-family:monospace;font-size:12px;font-weight:700;color:#f97316;background:rgba(249,115,22,.1);border:1px solid rgba(249,115,22,.25);border-radius:5px;padding:1px 7px}
.aside-h{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#FECD28;margin-bottom:8px;margin-top:16px}
.aside-h:first-child{margin-top:0}
.aside-txt{font-size:12px;color:#8899bb;line-height:1.7}
.aside-list{list-style:none;padding:0}
.aside-list li{font-size:12px;color:#8899bb;padding:5px 0;border-bottom:1px solid #334468;display:flex;align-items:baseline;gap:7px}
.aside-list li:last-child{border-bottom:none}
.aside-list li::before{content:'→';color:#FECD28;font-size:11px;flex-shrink:0}
.why-box{background:rgba(254,205,40,.06);border-left:3px solid #FECD28;border-radius:0 7px 7px 0;padding:11px 13px;margin-top:14px}
.why-box p{font-size:12px;color:#f0f4ff;line-height:1.7}
.role-chip{display:flex;align-items:center;gap:7px;background:#243050;border:1px solid #334468;border-radius:9px;padding:8px 12px;margin-bottom:14px;font-size:12px}
.rdot{width:8px;height:8px;border-radius:50%;flex-shrink:0}
.rdot-wh{background:#3b82f6}
.rdot-fin{background:#a855f7}
.ba-wrap{background:#1a2540;border:1px solid #334468;border-radius:13px;padding:18px;margin-bottom:14px}
.ba-cols{display:grid;grid-template-columns:1fr 1fr;gap:12px}
@media(max-width:540px){.ba-cols{grid-template-columns:1fr}}
.ba-title{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;margin-bottom:8px}
.ba-title-bad{color:#ef4444}.ba-title-good{color:#22c55e}
.ba-item{font-size:12px;color:#8899bb;padding:3px 0;display:flex;align-items:baseline;gap:6px}
.ba-item::before{font-size:10px;flex-shrink:0}
.ba-bad::before{content:'✕';color:#ef4444}.ba-good::before{content:'✓';color:#22c55e}
.wc-grid{display:grid;grid-template-columns:1fr 1fr;gap:11px}
@media(max-width:540px){.wc-grid{grid-template-columns:1fr}}
.wc{background:#1a2540;border:1px solid #334468;border-radius:12px;padding:16px 14px}
.wc-icon{font-size:26px;margin-bottom:7px}
.wc-title{font-size:13px;font-weight:700;margin-bottom:3px}
.wc-txt{font-size:12px;color:#8899bb;line-height:1.6}
@keyframes dmFadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
.dfa{animation:dmFadeIn .2s ease-out}
.modal-overlay{position:fixed;inset:0;background:#00000080;display:flex;align-items:center;justify-content:center;padding:16px;z-index:200}
.modal-box{background:#1a2540;border:1px solid #334468;border-radius:16px;padding:22px;width:100%;max-width:400px;box-shadow:0 40px 80px #00000080}
.modal-title{font-weight:700;font-size:15px;margin-bottom:3px}
.modal-sub{color:#8899bb;font-size:12px;margin-bottom:18px}
.modal-label{font-size:11px;font-weight:600;color:#8899bb;text-transform:uppercase;letter-spacing:.06em;margin-bottom:7px}
.check-row{display:flex;align-items:center;gap:9px;padding:7px 0;border-bottom:1px solid #334468;cursor:pointer}
.check-row:last-child{border-bottom:none}
.check-box{width:15px;height:15px;border-radius:4px;border:2px solid #334468;background:transparent;flex-shrink:0;transition:all .15s;display:flex;align-items:center;justify-content:center}
.check-box-on{background:#FECD28;border-color:#FECD28}
.check-lbl{font-size:13px;flex:1}
.check-meta{font-size:11px;color:#8899bb}
.ship-opt{border:2px solid #334468;border-radius:9px;padding:11px 13px;cursor:pointer;margin-bottom:7px;transition:all .15s}
.ship-opt-sel{border-color:#FECD28;background:rgba(254,205,40,.06)}
.ship-opt-title{font-size:13px;font-weight:600;margin-bottom:2px}
.ship-opt-desc{font-size:11px;color:#8899bb}
.modal-acts{display:flex;gap:8px;justify-content:flex-end;margin-top:18px}
.mbtn-cancel{background:#243050;color:#f0f4ff;border:1px solid #334468;border-radius:8px;padding:8px 15px;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit}
.mbtn-ok{background:#FECD28;color:#111;border:none;border-radius:8px;padding:8px 15px;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit}
.mbtn-ok:disabled{opacity:.4;cursor:default}
`

const STEPS = [
  { num: 'Overview', role: null,        title: 'A better way to handle returns',       sub: 'Before this system, returns were tracked on paper and WhatsApp. Now every return has a structured, auditable workflow.' },
  { num: 'Step 1',   role: 'warehouse', title: 'Creating a return request',             sub: 'Warehouse or sales finds the original order in history and requests a return. Finance sees it only after it\'s submitted.' },
  { num: 'Step 2',   role: 'finance',   title: 'Finance reviews and approves',          sub: 'The return sits in a Finance-only queue. Finance can approve it — releasing it for courier booking — or cancel it.' },
  { num: 'Step 3',   role: 'finance',   title: 'Cancelling a return',                   sub: 'Any return that hasn\'t had a label bought can be cancelled by Finance, with a confirmation step to prevent accidents.' },
  { num: 'Step 4',   role: 'warehouse', title: 'Buyer arranges their own shipping',      sub: 'When the buyer ships it back themselves, we skip the courier booking and just wait for the stock to arrive.' },
  { num: 'Step 5',   role: 'warehouse', title: 'Multiple returns, one order',            sub: 'A customer can return different items at different times — each gets its own RTN number linked to the original order.' },
  { num: 'Step 6',   role: 'warehouse', title: 'Receiving the return & rebinning',       sub: 'When stock arrives back in the warehouse, condition is recorded and the item is put back into inventory.' },
  { num: 'Step 7',   role: 'finance',   title: 'Issuing the credit & closing the return', sub: 'Finance records the credit note number and moves the return to history — completing the loop.' },
]

const INIT_STATE = {
  returnCreated: false, returnApproved: false,
  returnCancelled: false, confirmCancel: false,
  secondReturnCreated: false,
  conditionSelected: '', rebinDone: false, rebinCondition: '',
  hasPhoto: false, creditNo: '', creditSaved: false, completed: false,
  modalChecked: ['124621'], modalShipMode: 'we', modalOpen: false,
}

/* ── render helpers (return HTML strings) ── */
function renderAside(stepIdx) {
  switch (stepIdx) {
    case 0: return `
      <div class="aside-h">What you'll see</div>
      <ul class="aside-list">
        <li>Warehouse or sales creates a return request</li>
        <li>Finance reviews and approves (or cancels)</li>
        <li>We book the collection — or the buyer ships it back</li>
        <li>Warehouse records condition &amp; optional photos</li>
        <li>Finance closes with a credit note number</li>
      </ul>
      <div class="aside-h">Multiple returns, same order</div>
      <div class="aside-txt">You can create a second or third return for the same order — each gets its own RTN number (RTN-2-25354, RTN-2-25354-2, …).</div>`
    case 1: return `
      <div class="role-chip"><div class="rdot rdot-wh"></div><strong>Warehouse / Sales role</strong></div>
      <div class="aside-h">What they do</div>
      <div class="aside-txt">Find the invoiced order, click Create Return, tick the items being returned, and choose how it's coming back.</div>
      <div class="aside-h">Two shipping options</div>
      <ul class="aside-list">
        <li><strong>We ship:</strong> CabGlass books a collection from the customer</li>
        <li><strong>Buyer arranges:</strong> customer ships it themselves — we just wait</li>
      </ul>
      <div class="why-box"><p>Finance never sees this until it's submitted. The request lands in a dedicated Returns queue, separate from normal orders.</p></div>`
    case 2: return `
      <div class="role-chip"><div class="rdot rdot-fin"></div><strong>Finance role only</strong></div>
      <div class="aside-h">The approval gate</div>
      <div class="aside-txt">No one can book a courier for a return until Finance approves it. This prevents unauthorised collections and credit notes.</div>
      <div class="aside-h">After approval</div>
      <ul class="aside-list">
        <li>Status moves to <em>Ready For Quote</em></li>
        <li>TCG and EPX automatically quote the collection</li>
        <li>Warehouse selects a courier and buys the label</li>
      </ul>
      <div class="why-box"><p>If Finance disagrees with the return, they cancel it here — no label is ever bought, no credit note is ever raised.</p></div>`
    case 3: return `
      <div class="role-chip"><div class="rdot rdot-fin"></div><strong>Finance role</strong></div>
      <div class="aside-h">When you'd cancel</div>
      <ul class="aside-list">
        <li>Customer changes their mind</li>
        <li>Return was requested in error</li>
        <li>Items don't qualify for return</li>
      </ul>
      <div class="aside-h">Cancellable statuses</div>
      <ul class="aside-list">
        <li>Pending Finance Approval</li><li>Ready For Quote</li>
        <li>Quoted</li><li>Awaiting Return (buyer arranges)</li>
      </ul>
      <div class="why-box"><p>Once a label is bought the return can't be cancelled here — contact the courier directly at that point.</p></div>`
    case 4: return `
      <div class="role-chip"><div class="rdot rdot-wh"></div><strong>Warehouse role</strong></div>
      <div class="aside-h">How it works</div>
      <div class="aside-txt">The return is created with "Buyer arranges" selected. Finance approves it (the gate still applies), then the status becomes <em>Awaiting Return</em>.</div>
      <div class="aside-h">No label, no courier cost</div>
      <ul class="aside-list">
        <li>No courier quote is fetched</li>
        <li>No label is purchased</li>
        <li>Status stays "Awaiting Return" until stock physically arrives</li>
      </ul>
      <div class="why-box"><p>The "Buyer arranges" badge keeps this visible so warehouse knows to watch for inbound stock without a waybill.</p></div>`
    case 5: return `
      <div class="role-chip"><div class="rdot rdot-wh"></div><strong>Warehouse role</strong></div>
      <div class="aside-h">How numbering works</div>
      <div class="aside-txt">
        First return: <span class="rtn-num">RTN-2-25354</span><br>
        Second return: <span class="rtn-num">RTN-2-25354-2</span><br>
        Each is fully independent — its own approval, courier, and credit note.
      </div>
      <div class="aside-h">Common scenario</div>
      <ul class="aside-list">
        <li>Customer returns 2 items this week</li>
        <li>Returns 1 more item next week</li>
        <li>Both tracked, both credited, no confusion</li>
      </ul>`
    case 6: return `
      <div class="role-chip"><div class="rdot rdot-wh"></div><strong>Warehouse role</strong></div>
      <div class="aside-h">What happens here</div>
      <ul class="aside-list">
        <li>Select condition: Good / Damaged / Other</li>
        <li>Add a note (required for "Other")</li>
        <li>Upload photos — optional, any number</li>
        <li>Confirm &amp; Rebin marks item back in stock</li>
      </ul>
      <div class="aside-h">Condition informs Finance</div>
      <div class="aside-txt">The condition recorded here feeds directly into the credit note decision — damaged stock gets a partial credit, not a full one.</div>
      <div class="why-box"><p>Photos create an undisputable record of the item's condition. This matters for disputed credit amounts.</p></div>`
    case 7: return `
      <div class="role-chip"><div class="rdot rdot-fin"></div><strong>Finance role</strong></div>
      <div class="aside-h">Final steps</div>
      <ul class="aside-list">
        <li>Finance sees the condition recorded by warehouse</li>
        <li>Raises the credit note in the accounting system</li>
        <li>Logs the credit note number here</li>
        <li>Clicks "Move to History" — done</li>
      </ul>
      <div class="aside-h">Full audit trail</div>
      <div class="aside-txt">Every return in History shows who requested it, when it was approved, the condition, photos, and credit note — all in one place.</div>
      <div class="why-box"><p>Nothing falls through the cracks. If a customer disputes a credit, the record is right here.</p></div>`
    default: return ''
  }
}

function renderMain(stepIdx, s) {
  switch (stepIdx) {
    case 0: return `
      <div class="ba-wrap dfa">
        <div class="ba-cols">
          <div>
            <div class="ba-title ba-title-bad">Before</div>
            ${['Returns tracked on WhatsApp','No finance approval gate','Lost returns with no follow-up','No condition record','Credit notes raised without evidence','No link to original order'].map(t=>`<div class="ba-item ba-bad">${t}</div>`).join('')}
          </div>
          <div>
            <div class="ba-title ba-title-good">Now</div>
            ${['Structured digital request flow','Finance must approve before collection','Every return tracked to completion','Condition + photos on arrival','Credit note logged against the return','Linked to original order by PS number'].map(t=>`<div class="ba-item ba-good">${t}</div>`).join('')}
          </div>
        </div>
      </div>
      <div class="wc-grid">
        <div class="wc"><div class="wc-icon">🏭</div><div class="wc-title">Warehouse / Sales</div><div class="wc-txt">Creates the return request. Picks the items, chooses the shipping method.</div></div>
        <div class="wc"><div class="wc-icon">💼</div><div class="wc-title">Finance</div><div class="wc-txt">Approves or cancels. Records the credit note when the return is complete.</div></div>
        <div class="wc"><div class="wc-icon">🚚</div><div class="wc-title">We-Ship Returns</div><div class="wc-txt">CabGlass books the collection. TCG or EPX automatically quoted.</div></div>
        <div class="wc"><div class="wc-icon">📦</div><div class="wc-title">Buyer-Arranges</div><div class="wc-txt">Customer ships it themselves. Status shows "Awaiting Return".</div></div>
      </div>`

    case 1:
      if (s.returnCreated) return `
        <div class="dmk dfa"><div class="dmk-bar"><div class="dmk-bar-title">History — Order 2-25354</div></div>
        <div class="dmk-inner">
          <div class="dmk-card">
            <div class="dmk-row"><div class="dmk-main">
              <div><span class="dmk-tag dmk-tag-ps">PS</span><strong>2-25354</strong></div>
              <div class="dmk-name">BS Glass &amp; Windscreen</div>
              <div class="dmk-meta">Honeydew, Johannesburg</div>
            </div><div class="dmk-acts"><button class="mb mb-ghost" disabled>Create Return</button></div></div>
          </div>
          <div class="flash"><span style="font-size:18px">✅</span>
            <div><strong>Return request created</strong><br><span style="font-size:12px;color:#8899bb"><span class="rtn-num">RTN-2-25354</span> is now pending Finance approval</span></div>
          </div>
        </div></div>`
      return `
        <div class="dmk dfa"><div class="dmk-bar"><div class="dmk-bar-title">History — Order 2-25354</div></div>
        <div class="dmk-inner">
          <div class="dmk-card">
            <div class="dmk-row"><div class="dmk-main">
              <div><span class="dmk-tag dmk-tag-ps">PS</span><strong>2-25354</strong></div>
              <div class="dmk-name">BS Glass &amp; Windscreen</div>
              <div class="dmk-meta">Honeydew, Johannesburg · Invoiced</div>
              <div class="dmk-items">
                <div class="dmk-irow"><span>124621</span><span>48×3×89cm · 5kg · Qty 1</span></div>
                <div class="dmk-irow"><span>124500</span><span>30×4×60cm · 2kg · Qty 2</span></div>
              </div>
            </div><div class="dmk-acts"><button class="mb mb-brand" id="d-create-rtn">+ Create Return</button></div></div>
          </div>
        </div></div>
        <p style="font-size:12px;color:#8899bb;margin-top:10px;text-align:center">Click "Create Return" above to see the modal</p>`

    case 2:
      if (s.returnApproved) return `
        <div class="dmk dfa"><div class="dmk-bar"><div class="dmk-bar-title">Returns</div></div>
        <div class="dmk-inner">
          <div class="dmk-card">
            <div class="dmk-row"><div class="dmk-main">
              <div><span class="dmk-tag dmk-tag-rtn">RTN</span><strong>RTN-2-25354</strong><span class="sbadge sb-ready">Ready For Quote</span></div>
              <div class="dmk-name" style="margin-top:5px">BS Glass &amp; Windscreen</div>
              <div class="dmk-meta">← 2-25354 · We ship</div>
            </div><div class="dmk-acts"><button class="mb mb-ghost mb-sm" disabled>Approve Return</button></div></div>
          </div>
          <div class="flash"><span style="font-size:18px">✅</span><div><strong>Return approved</strong><br><span style="font-size:12px;color:#8899bb">TCG &amp; EPX are now automatically quoting the collection</span></div></div>
        </div></div>`
      return `
        <div class="dmk dfa"><div class="dmk-bar"><div class="dmk-bar-title">Returns</div></div>
        <div class="dmk-inner">
          <div class="dmk-card dmk-card-hl">
            <div class="dmk-row"><div class="dmk-main">
              <div><span class="dmk-tag dmk-tag-rtn">RTN</span><strong>RTN-2-25354</strong><span class="sbadge sb-pending">Pending Finance Approval</span></div>
              <div class="dmk-name" style="margin-top:5px">BS Glass &amp; Windscreen</div>
              <div class="dmk-meta">← 2-25354 · Requested today · We ship</div>
              <div class="dmk-items"><div class="dmk-irow"><span>124621</span><span>Qty 1</span></div></div>
            </div><div class="dmk-acts"><button class="mb mb-purple" id="d-approve">Approve Return</button></div></div>
          </div>
        </div></div>
        <p style="font-size:12px;color:#8899bb;margin-top:10px;text-align:center">Finance sees this. No one else does.</p>`

    case 3:
      if (s.returnCancelled) return `
        <div class="dmk dfa"><div class="dmk-bar"><div class="dmk-bar-title">Returns</div></div>
        <div class="dmk-inner" style="text-align:center;padding:32px 16px;color:#8899bb">
          <div style="font-size:36px;margin-bottom:8px">📭</div>
          <div style="font-size:13px;font-weight:600">No active returns</div>
          <div style="font-size:12px;margin-top:4px">RTN-2-25354 was cancelled and removed</div>
        </div></div>`
      if (s.confirmCancel) return `
        <div class="dmk dfa"><div class="dmk-bar"><div class="dmk-bar-title">Returns</div></div>
        <div class="dmk-inner">
          <div class="dmk-card">
            <div><span class="dmk-tag dmk-tag-rtn">RTN</span><strong>RTN-2-25354</strong><span class="sbadge sb-pending">Pending Finance Approval</span></div>
            <div class="confirm-row">
              <span class="confirm-q">Cancel this return permanently?</span>
              <button class="mb mb-danger mb-sm" id="d-cancel-yes">Yes, cancel</button>
              <button class="mb mb-ghost mb-sm" id="d-cancel-no">No</button>
            </div>
          </div>
        </div></div>`
      return `
        <div class="dmk dfa"><div class="dmk-bar"><div class="dmk-bar-title">Returns</div></div>
        <div class="dmk-inner">
          <div class="dmk-card">
            <div class="dmk-row"><div class="dmk-main">
              <div><span class="dmk-tag dmk-tag-rtn">RTN</span><strong>RTN-2-25354</strong><span class="sbadge sb-pending">Pending Finance Approval</span></div>
              <div class="dmk-name" style="margin-top:5px">BS Glass &amp; Windscreen</div>
              <div class="dmk-meta">← 2-25354 · We ship</div>
            </div><div class="dmk-acts"><button class="mb mb-danger" id="d-cancel">Cancel Return</button></div></div>
          </div>
        </div></div>
        <p style="font-size:12px;color:#8899bb;margin-top:10px;text-align:center">Click "Cancel Return" to see the confirmation step</p>`

    case 4: return `
      <div class="dmk dfa"><div class="dmk-bar"><div class="dmk-bar-title">Returns — Awaiting Return</div></div>
      <div class="dmk-inner">
        <div class="dmk-card">
          <div><span class="dmk-tag dmk-tag-rtn">RTN</span><strong>RTN-2-25100</strong><span class="sbadge sb-await">Awaiting Return</span><span class="sbadge sb-buyer">Buyer arranges</span></div>
          <div class="dmk-name" style="margin-top:5px">Cape Town Glass Supply</div>
          <div class="dmk-meta">← 2-25100 · Finance approved 2 days ago</div>
          <div class="dmk-items"><div class="dmk-irow"><span>GS-450</span><span>Qty 3 — awaiting inbound delivery</span></div></div>
        </div>
        <div style="background:rgba(249,115,22,.07);border:1px solid rgba(249,115,22,.2);border-radius:9px;padding:11px 13px;margin-top:6px;font-size:12px;color:#fdba74">
          <strong>No label needed.</strong> Warehouse watches for inbound stock — when it arrives, condition is recorded on the Rebin page.
        </div>
      </div></div>`

    case 5:
      if (s.secondReturnCreated) return `
        <div class="dmk dfa"><div class="dmk-bar"><div class="dmk-bar-title">Returns — Order 2-25354</div></div>
        <div class="dmk-inner">
          <div class="dmk-card" style="opacity:.7">
            <div><span class="dmk-tag dmk-tag-rtn">RTN</span><strong>RTN-2-25354</strong><span class="sbadge sb-booked">Booked</span></div>
            <div class="dmk-meta" style="margin-top:4px">124621 · Qty 1 · Created 3 days ago</div>
          </div>
          <div class="dmk-card dmk-card-hl">
            <div><span class="dmk-tag dmk-tag-rtn">RTN</span><strong>RTN-2-25354-2</strong><span class="sbadge sb-pending">Pending Finance Approval</span></div>
            <div class="dmk-meta" style="margin-top:4px">124500 · Qty 2 · Created just now</div>
          </div>
          <div class="flash"><span style="font-size:18px">✅</span><span>Second return created — <span class="rtn-num">RTN-2-25354-2</span> is now in the queue</span></div>
        </div></div>`
      return `
        <div class="dmk dfa"><div class="dmk-bar"><div class="dmk-bar-title">History — Order 2-25354</div></div>
        <div class="dmk-inner">
          <div class="dmk-card">
            <div class="dmk-row"><div class="dmk-main">
              <div><span class="dmk-tag dmk-tag-ps">PS</span><strong>2-25354</strong></div>
              <div class="dmk-name">BS Glass &amp; Windscreen</div>
              <div class="dmk-meta">Linked return: <span class="rtn-num">RTN-2-25354</span> (already booked)</div>
              <div class="dmk-items">
                <div class="dmk-irow" style="opacity:.4;text-decoration:line-through"><span>124621</span><span>already returned</span></div>
                <div class="dmk-irow"><span>124500</span><span>30×4×60cm · Qty 2 ← returning now</span></div>
              </div>
            </div><div class="dmk-acts"><button class="mb mb-brand" id="d-second-rtn">+ Create Return</button></div></div>
          </div>
        </div></div>
        <p style="font-size:12px;color:#8899bb;margin-top:10px;text-align:center">Same order, different item, new return</p>`

    case 6: {
      const c = s.conditionSelected
      if (s.rebinDone) return `
        <div class="dmk dfa"><div class="dmk-bar"><div class="dmk-bar-title">Rebin</div></div>
        <div class="dmk-inner">
          <div class="dmk-card" style="border-color:#22c55e;opacity:.8">
            <div style="display:flex;align-items:center;justify-content:space-between">
              <div>
                <div><span class="dmk-tag dmk-tag-rtn">RTN</span><strong>RTN-2-25354</strong><span class="sbadge sb-checked">Rebinned</span></div>
                <div class="dmk-meta" style="margin-top:3px">BS Glass &amp; Windscreen</div>
              </div><span style="font-size:20px">✅</span>
            </div>
            <div style="margin-top:8px;padding-top:8px;border-top:1px solid #334468;display:flex;align-items:center;gap:8px;font-size:12px">
              <span style="background:rgba(22,163,74,.2);color:#4ade80;border:1px solid rgba(22,163,74,.3);border-radius:20px;padding:2px 10px;font-weight:600">${s.rebinCondition||'Good Condition'}</span>
              ${s.hasPhoto?'<span style="color:#8899bb">📷 Photo attached</span>':''}
            </div>
          </div>
          <div class="flash"><span style="font-size:18px">📦</span><span>Item rebinned — Finance can now record the credit note</span></div>
        </div></div>`
      return `
        <div class="dmk dfa"><div class="dmk-bar"><div class="dmk-bar-title">Rebin — Stock arrived</div></div>
        <div class="dmk-inner">
          <div class="dmk-card">
            <div><span class="dmk-tag dmk-tag-rtn">RTN</span><strong>RTN-2-25354</strong></div>
            <div class="dmk-name" style="margin-top:4px">BS Glass &amp; Windscreen · 124621 × 1</div>
            <div style="margin-top:12px">
              <div style="font-size:11px;font-weight:600;color:#8899bb;text-transform:uppercase;letter-spacing:.06em;margin-bottom:7px">Condition</div>
              <div class="cond-pills">
                <button class="cpill cpill-good ${c==='Good Condition'?'active':''}" id="d-cp-good">Good Condition</button>
                <button class="cpill cpill-damaged ${c==='Damaged'?'active':''}" id="d-cp-damaged">Damaged</button>
                <button class="cpill cpill-other ${c==='Other'?'active':''}" id="d-cp-other">Other</button>
              </div>
            </div>
            <div style="margin-top:12px">
              <div style="font-size:11px;font-weight:600;color:#8899bb;text-transform:uppercase;letter-spacing:.06em;margin-bottom:5px">Photos <span style="font-weight:400;text-transform:none">(optional)</span></div>
              <div class="photo-area ${s.hasPhoto?'photo-area-filled':''}" id="d-photo-area">
                ${s.hasPhoto
                  ? '<div style="font-size:11px;color:#FECD28">📷 2 photos attached — click to toggle</div>'
                  : '<div style="font-size:22px;margin-bottom:5px">📷</div><div style="font-size:12px;color:#8899bb">Click to add photos</div>'}
              </div>
            </div>
            <div style="margin-top:12px;display:flex;justify-content:flex-end">
              <button class="mb mb-brand" id="d-rebin-confirm" ${!c?'disabled':''}>Confirm &amp; Rebin</button>
            </div>
          </div>
        </div></div>`
    }

    case 7:
      if (s.completed) return `
        <div class="dmk dfa"><div class="dmk-bar"><div class="dmk-bar-title">Returns — History</div></div>
        <div class="dmk-inner">
          <div class="dmk-card" style="opacity:.7">
            <div><span class="dmk-tag dmk-tag-rtn">RTN</span><strong>RTN-2-25354</strong><span class="sbadge" style="background:rgba(100,116,139,.15);color:#94a3b8;border:1px solid rgba(100,116,139,.3)">Completed</span></div>
            <div class="dmk-name" style="margin-top:4px">BS Glass &amp; Windscreen</div>
            <div class="dmk-items">
              <div class="dmk-irow"><span>Condition</span><span style="color:#4ade80">${s.rebinCondition||'Good Condition'}</span></div>
              <div class="dmk-irow"><span>Credit Note</span><span style="color:#FECD28">CN-${s.creditNo||'12345'}</span></div>
            </div>
          </div>
          <div class="flash"><span style="font-size:18px">🎉</span><div><strong>Return complete</strong><br><span style="font-size:12px;color:#8899bb">Moved to History. Full audit trail preserved.</span></div></div>
        </div></div>`
      return `
        <div class="dmk dfa"><div class="dmk-bar"><div class="dmk-bar-title">Returns — Condition Checked</div></div>
        <div class="dmk-inner">
          <div class="dmk-card dmk-card-hl">
            <div><span class="dmk-tag dmk-tag-rtn">RTN</span><strong>RTN-2-25354</strong><span class="sbadge sb-checked">Condition Checked</span></div>
            <div class="dmk-name" style="margin-top:4px">BS Glass &amp; Windscreen</div>
            <div style="margin-top:7px;display:flex;align-items:center;gap:7px;font-size:12px">
              <span style="background:rgba(22,163,74,.2);color:#4ade80;border:1px solid rgba(22,163,74,.3);border-radius:20px;padding:2px 10px;font-weight:600">${s.rebinCondition||'Good Condition'}</span>
              <span style="color:#8899bb">Warehouse recorded condition</span>
            </div>
            <div style="margin-top:12px;padding-top:12px;border-top:1px solid #334468">
              <div style="font-size:11px;font-weight:600;color:#8899bb;text-transform:uppercase;letter-spacing:.06em;margin-bottom:7px">Credit Note Number</div>
              <div class="credit-row">
                <input class="credit-inp" id="d-credit-inp" placeholder="e.g. CN-12345" value="${s.creditNo||''}">
                <button class="mb mb-ghost mb-sm" id="d-save-credit">Save</button>
              </div>
              ${s.creditSaved?'<div style="font-size:11px;color:#4ade80;margin-top:5px">✓ Saved</div>':''}
            </div>
            <div style="margin-top:12px;display:flex;justify-content:flex-end">
              <button class="mb mb-success" id="d-complete">Move to History</button>
            </div>
          </div>
        </div></div>
        <p style="font-size:12px;color:#8899bb;margin-top:10px;text-align:center">Add a credit note and move to History to finish</p>`

    default: return ''
  }
}

function renderModal(checked, shipMode) {
  return `
    <div class="modal-overlay" id="d-modal-overlay">
      <div class="modal-box dfa">
        <div class="modal-title">Create Return</div>
        <div class="modal-sub">Order 2-25354 — BS Glass &amp; Windscreen</div>
        <div class="modal-label">Select items to return</div>
        ${[
          { sku: '124621', meta: '48×3×89cm · 5kg · Qty 1' },
          { sku: '124500', meta: '30×4×60cm · 2kg · Qty 2' },
        ].map(({ sku, meta }) => `
          <div class="check-row" id="d-cb-${sku}">
            <div class="check-box ${checked.includes(sku)?'check-box-on':''}"></div>
            <div><div class="check-lbl">${sku}</div><div class="check-meta">${meta}</div></div>
          </div>`).join('')}
        <div class="modal-label" style="margin-top:14px">Shipping method</div>
        <div class="ship-opt ${shipMode==='we'?'ship-opt-sel':''}" id="d-ship-we">
          <div class="ship-opt-title">🚚 We ship</div>
          <div class="ship-opt-desc">CabGlass books the collection courier</div>
        </div>
        <div class="ship-opt ${shipMode==='buyer'?'ship-opt-sel':''}" id="d-ship-buyer">
          <div class="ship-opt-title">📦 Buyer arranges</div>
          <div class="ship-opt-desc">Customer ships it back themselves</div>
        </div>
        <div class="modal-acts">
          <button class="mbtn-cancel" id="d-modal-cancel">Cancel</button>
          <button class="mbtn-ok" id="d-modal-ok" ${checked.length===0?'disabled':''}>Submit Return Request</button>
        </div>
      </div>
    </div>`
}

export default function DemoPage() {
  const [loggedIn, setLoggedIn] = useState(false)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loginErr, setLoginErr] = useState('')
  const [stepIdx, setStepIdx] = useState(0)
  const [demoState, setDS] = useState(INIT_STATE)

  const mainRef  = useRef(null)
  const asideRef = useRef(null)
  const modalRef = useRef(null)

  const upd = useCallback((patch) => setDS(prev => ({ ...prev, ...patch })), [])

  /* inject styles once */
  useEffect(() => {
    const el = document.createElement('style')
    el.id = 'cabglass-demo-css'
    el.textContent = DEMO_CSS
    document.head.appendChild(el)
    return () => el.remove()
  }, [])

  /* render mockup content + wire events */
  useEffect(() => {
    if (!loggedIn) return
    if (asideRef.current) asideRef.current.innerHTML = renderAside(stepIdx)
    if (!mainRef.current)  return

    mainRef.current.innerHTML = renderMain(stepIdx, demoState)
    mainRef.current.classList.remove('dfa')
    void mainRef.current.offsetWidth
    mainRef.current.classList.add('dfa')

    // wire modal trigger
    const btnCreate = document.getElementById('d-create-rtn')
    if (btnCreate) btnCreate.onclick = () => upd({ modalOpen: true, modalChecked: ['124621'], modalShipMode: 'we' })

    // step 2 — approve
    const btnApprove = document.getElementById('d-approve')
    if (btnApprove) btnApprove.onclick = () => upd({ returnApproved: true })

    // step 3 — cancel
    const btnCancel = document.getElementById('d-cancel')
    if (btnCancel) btnCancel.onclick = () => upd({ confirmCancel: true })
    const btnCancelYes = document.getElementById('d-cancel-yes')
    if (btnCancelYes) btnCancelYes.onclick = () => upd({ returnCancelled: true, confirmCancel: false })
    const btnCancelNo = document.getElementById('d-cancel-no')
    if (btnCancelNo) btnCancelNo.onclick = () => upd({ confirmCancel: false })

    // step 5 — second return
    const btnSecond = document.getElementById('d-second-rtn')
    if (btnSecond) btnSecond.onclick = () => upd({ secondReturnCreated: true })

    // step 6 — condition pills + photo + rebin
    const cpGood    = document.getElementById('d-cp-good')
    const cpDamaged = document.getElementById('d-cp-damaged')
    const cpOther   = document.getElementById('d-cp-other')
    if (cpGood)    cpGood.onclick    = () => upd({ conditionSelected: 'Good Condition' })
    if (cpDamaged) cpDamaged.onclick = () => upd({ conditionSelected: 'Damaged' })
    if (cpOther)   cpOther.onclick   = () => upd({ conditionSelected: 'Other' })
    const photoArea = document.getElementById('d-photo-area')
    if (photoArea) photoArea.onclick = () => upd({ hasPhoto: !demoState.hasPhoto })
    const btnRebin = document.getElementById('d-rebin-confirm')
    if (btnRebin) btnRebin.onclick = () => { if (demoState.conditionSelected) upd({ rebinDone: true, rebinCondition: demoState.conditionSelected }) }

    // step 7 — credit + complete
    const btnSaveCredit = document.getElementById('d-save-credit')
    if (btnSaveCredit) btnSaveCredit.onclick = () => {
      const v = document.getElementById('d-credit-inp')?.value?.trim()
      if (v) upd({ creditNo: v, creditSaved: true })
    }
    const btnComplete = document.getElementById('d-complete')
    if (btnComplete) btnComplete.onclick = () => upd({ completed: true })

  }, [loggedIn, stepIdx, demoState, upd])

  /* render modal */
  useEffect(() => {
    if (!loggedIn || !modalRef.current) return
    if (!demoState.modalOpen) { modalRef.current.innerHTML = ''; return }

    modalRef.current.innerHTML = renderModal(demoState.modalChecked, demoState.modalShipMode)

    const overlay = document.getElementById('d-modal-overlay')
    if (overlay) overlay.onclick = (e) => { if (e.target === overlay) upd({ modalOpen: false }) }

    const btnOk = document.getElementById('d-modal-ok')
    if (btnOk) btnOk.onclick = () => upd({ returnCreated: true, modalOpen: false })

    const btnCancel = document.getElementById('d-modal-cancel')
    if (btnCancel) btnCancel.onclick = () => upd({ modalOpen: false })

    ;['124621','124500'].forEach(sku => {
      const row = document.getElementById(`d-cb-${sku}`)
      if (row) row.onclick = () => {
        const next = demoState.modalChecked.includes(sku)
          ? demoState.modalChecked.filter(s => s !== sku)
          : [...demoState.modalChecked, sku]
        upd({ modalChecked: next })
      }
    })

    const shipWe    = document.getElementById('d-ship-we')
    const shipBuyer = document.getElementById('d-ship-buyer')
    if (shipWe)    shipWe.onclick    = () => upd({ modalShipMode: 'we' })
    if (shipBuyer) shipBuyer.onclick = () => upd({ modalShipMode: 'buyer' })

  }, [loggedIn, demoState.modalOpen, demoState.modalChecked, demoState.modalShipMode, upd])

  const handleLogin = (e) => {
    e.preventDefault()
    if (username.trim().toLowerCase() === 'demo' && password === 'boss123') {
      setLoggedIn(true)
    } else {
      setLoginErr('Incorrect username or password.')
    }
  }

  const handleExit = () => {
    setLoggedIn(false)
    setUsername('')
    setPassword('')
    setLoginErr('')
    setStepIdx(0)
    setDS(INIT_STATE)
  }

  /* ── LOGIN ── */
  if (!loggedIn) {
    return (
      <div className="min-h-screen bg-slate-100 dark:bg-slate-900 flex items-center justify-center p-4 transition-colors">
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

  /* ── DEMO WALKTHROUGH ── */
  const step = STEPS[stepIdx]
  const isLast = stepIdx === STEPS.length - 1

  return (
    <div className="demo-root">
      {/* header */}
      <header className="demo-header">
        <div className="demo-logo-wrap">
          <div className="demo-logo-box">CG</div>
          CabGlass
        </div>
        <div className="demo-step-dots">
          {STEPS.map((_, i) => (
            <div key={i} className={`demo-dot w-7 ${i < stepIdx ? 'demo-dot-done' : ''} ${i === stepIdx ? 'demo-dot-active' : ''}`} />
          ))}
        </div>
        {step.role && (
          <div className={`demo-role-badge ${step.role === 'finance' ? 'demo-role-fin' : 'demo-role-wh'}`}>
            {step.role === 'finance' ? 'Finance' : 'Warehouse'}
          </div>
        )}
        <button className="demo-exit" onClick={handleExit}>← Exit</button>
      </header>

      {/* body */}
      <div className="demo-body">
        <div className="demo-main">
          <div className="demo-step-num">{step.num}</div>
          <div className="demo-step-title">{step.title}</div>
          <div className="demo-step-sub">{step.sub}</div>
          <div ref={mainRef} />
        </div>
        <div className="demo-aside" ref={asideRef} />
      </div>

      {/* footer */}
      <footer className="demo-footer">
        <button className="demo-btn-prev" disabled={stepIdx === 0} onClick={() => setStepIdx(i => i - 1)}>← Back</button>
        <span className="demo-counter">{stepIdx + 1} of {STEPS.length}</span>
        <button className="demo-btn-next" disabled={isLast && !demoState.completed}
          onClick={() => { if (!isLast) setStepIdx(i => i + 1) }}>
          {isLast ? 'Done ✓' : 'Next →'}
        </button>
      </footer>

      {/* modal portal */}
      <div ref={modalRef} />
    </div>
  )
}
