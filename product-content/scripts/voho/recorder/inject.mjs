// Page injections shared by the recordings: drawn cursor, audio taps, fake microphone.
export const INIT = `
(() => {
  // ---- drawn cursor
  const css = document.createElement('style')
  css.textContent = \`
    #__cur{position:fixed;left:0;top:0;width:22px;height:30px;pointer-events:none;z-index:2147483647;
      transform:translate(-3px,-2px);transition:none;filter:drop-shadow(0 1px 2px rgba(0,0,0,.35))}
    #__rip{position:fixed;width:36px;height:36px;border-radius:50%;pointer-events:none;z-index:2147483646;
      border:2.5px solid rgba(20,20,20,.55);opacity:0;transform:translate(-50%,-50%) scale(.3)}
    #__rip.go{animation:__ripple .45s ease-out}
    @keyframes __ripple{0%{opacity:.9;transform:translate(-50%,-50%) scale(.3)}100%{opacity:0;transform:translate(-50%,-50%) scale(1.15)}}
  \`
  const cur = document.createElement('div'); cur.id = '__cur'
  cur.innerHTML = '<svg width="22" height="30" viewBox="0 0 22 30"><path d="M2 2 L2 24 L8 18.5 L12 27 L15.5 25.5 L11.5 17 L19 17 Z" fill="#111" stroke="#fff" stroke-width="1.6" stroke-linejoin="round"/></svg>'
  const rip = document.createElement('div'); rip.id = '__rip'
  const mount = () => { if (document.body) { document.body.append(cur, rip) } else { requestAnimationFrame(mount) } }
  mount()
  window.addEventListener('mousemove', (e) => { cur.style.left = e.clientX + 'px'; cur.style.top = e.clientY + 'px' }, true)
  window.addEventListener('mousedown', (e) => {
    rip.style.left = e.clientX + 'px'; rip.style.top = e.clientY + 'px'
    rip.classList.remove('go'); void rip.offsetWidth; rip.classList.add('go')
  }, true)

  // ---- audio taps
  const recs = new Map()  // ctx -> { dest, recorder }
  let nextId = 0
  function tap(ctx, label) {
    if (recs.has(ctx)) return recs.get(ctx)
    const dest = ctx.createMediaStreamDestination()
    const id = label + '-' + (nextId++)
    const recorder = new MediaRecorder(dest.stream, { mimeType: 'audio/webm;codecs=opus', audioBitsPerSecond: 128000 })
    let seq = 0
    const startMs = Date.now()
    recorder.ondataavailable = async (ev) => {
      if (!ev.data.size) return
      const buf = new Uint8Array(await ev.data.arrayBuffer())
      let s = ''; for (let i = 0; i < buf.length; i += 0x8000) s += String.fromCharCode.apply(null, buf.subarray(i, i + 0x8000))
      window.__chunk(id, seq++, startMs, btoa(s))
    }
    recorder.start(1000)
    const entry = { dest, recorder, id, startMs }
    recs.set(ctx, entry)
    return entry
  }
  window.__flushAudio = () => new Promise((res) => {
    const all = [...recs.values()]
    if (!all.length) return res()
    let n = all.length
    for (const r of all) {
      if (r.recorder.state === 'inactive') { if (--n === 0) res(); continue }
      r.recorder.onstop = () => { if (--n === 0) res() }
      r.recorder.requestData(); r.recorder.stop()
    }
    setTimeout(res, 3000)
  })

  // Anything the app plays through a context's destination is also recorded.
  const origConnect = AudioNode.prototype.connect
  AudioNode.prototype.connect = function (target, ...rest) {
    if (target instanceof AudioDestinationNode) {
      const entry = tap(this.context, 'speaker')
      origConnect.call(this, entry.dest)
    }
    return origConnect.call(this, target, ...rest)
  }

  // When the agent's last scheduled fragment will finish playing.
  window.__agentAudioEndsAt = 0
  const origStart = AudioBufferSourceNode.prototype.start
  AudioBufferSourceNode.prototype.start = function (when, ...rest) {
    try {
      const ctx = this.context
      const at = Math.max(when ?? ctx.currentTime, ctx.currentTime)
      const end = Date.now() + (at - ctx.currentTime + (this.buffer?.duration ?? 0)) * 1000
      if (end > window.__agentAudioEndsAt) window.__agentAudioEndsAt = end
    } catch {}
    return origStart.call(this, when, ...rest)
  }

  // ---- fake microphone
  let micCtx = null, micDest = null
  const origGUM = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices)
  navigator.mediaDevices.getUserMedia = async (constraints) => {
    if (!constraints || !constraints.audio) return origGUM(constraints)
    micCtx = new AudioContext({ sampleRate: 48000 })
    micDest = micCtx.createMediaStreamDestination()
    // Keep the graph alive with a silent source so the stream is never empty.
    const g = micCtx.createGain(); g.gain.value = 0
    const osc = micCtx.createOscillator(); osc.connect(g); g.connect(micDest); osc.start()
    window.__micReadyAt = Date.now()
    return micDest.stream
  }
  window.__say = (b64) => new Promise(async (res, rej) => {
    if (!micCtx) return rej(new Error('mic not open'))
    const bin = atob(b64); const bytes = new Uint8Array(bin.length)
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
    const buf = await micCtx.decodeAudioData(bytes.buffer)
    const src = micCtx.createBufferSource(); src.buffer = buf
    src.connect(micDest)
    src.connect(tap(micCtx, 'caller').dest)
    src.onended = () => res(buf.duration)
    src.start()
  })
})()
`
