// Web Audio chimes — no audio file needed.
let ctx = null

function getCtx() {
  ctx = ctx || new (window.AudioContext || window.webkitAudioContext)()
  if (ctx.state === 'suspended') ctx.resume()
  return ctx
}

// Soft two-tone chime (existing, for office/general use)
export function playPing() {
  try {
    const c = getCtx()
    const now = c.currentTime
    const notes = [880, 1175] // A5, D6
    notes.forEach((freq, i) => {
      const osc = c.createOscillator()
      const gain = c.createGain()
      osc.type = 'sine'
      osc.frequency.value = freq
      const t = now + i * 0.15
      gain.gain.setValueAtTime(0, t)
      gain.gain.linearRampToValueAtTime(0.25, t + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25)
      osc.connect(gain).connect(c.destination)
      osc.start(t)
      osc.stop(t + 0.3)
    })
  } catch (e) { /* audio not available */ }
}

// Loud three-tone chime for warehouse tablets — same style, just fuller and louder
export function playLoudPing() {
  try {
    const c = getCtx()
    const now = c.currentTime
    const notes = [880, 1175, 1320] // A5, D6, E6
    notes.forEach((freq, i) => {
      const osc = c.createOscillator()
      const gain = c.createGain()
      osc.type = 'sine'
      osc.frequency.value = freq
      const t = now + i * 0.18
      gain.gain.setValueAtTime(0, t)
      gain.gain.linearRampToValueAtTime(0.7, t + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35)
      osc.connect(gain).connect(c.destination)
      osc.start(t)
      osc.stop(t + 0.4)
    })
  } catch (e) { /* audio not available */ }
}
