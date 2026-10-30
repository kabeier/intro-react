// Livepad: a VS Code-style editor with a live preview of the page being built.
// Needs course.js (window.Course) and a registered lesson.
//
// In a deck:  <div class="livepad" data-lesson="html-css" data-start="f1s3"
//                  data-steps="f2s1 f2s2" data-files="index.html styles.css"></div>
//   N        type the next step (short chunk) into the editor
//   Shift+N  reset this slide to its start
// On a page:  Livepad.mount(el, { files, editable: true, onChange(files) })
(() => {
  const MONACO = 'https://cdn.jsdelivr.net/npm/monaco-editor@0.52.2/min/'
  const POPOUT = new URL('popout.html', document.currentScript.src).href
  const channel = new BroadcastChannel('livepad')
  let splitOpen = false
  let popWin = null, popOpen = false, lastSent = 0
  const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  const langOf = (f) => (f.endsWith('.css') ? 'css' : f.endsWith('.js') ? 'javascript' : f.endsWith('.html') ? 'html' : 'plaintext')
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
  const pads = []

  // ---------- Monaco, loaded once from the CDN (null if it can't load) ----------
  let monacoPromise = null
  function loadMonaco() {
    if (monacoPromise) return monacoPromise
    monacoPromise = new Promise((resolve) => {
      const give = (m) => { clearTimeout(timer); resolve(m) }
      const timer = setTimeout(() => give(null), 20000)
      window.MonacoEnvironment = { getWorkerUrl: () => URL.createObjectURL(new Blob([`self.MonacoEnvironment={baseUrl:'${MONACO}'};importScripts('${MONACO}vs/base/worker/workerMain.js');`], { type: 'text/javascript' })) }
      const s = document.createElement('script')
      s.src = MONACO + 'vs/loader.js'
      s.onerror = () => give(null)
      s.onload = () => {
        window.require.config({ paths: { vs: MONACO + 'vs' } })
        window.require(['vs/editor/editor.main'], () => {
          const m = window.monaco
          m.editor.defineTheme('cp-dark', { base: 'vs-dark', inherit: true, rules: [], colors: {
            'editor.background': '#1f1f1f', 'editor.lineHighlightBackground': '#2a2d2e', 'editor.lineHighlightBorder': '#2a2d2e',
            'editorLineNumber.foreground': '#6e7681', 'editorLineNumber.activeForeground': '#cccccc' } })
          give(m)
        }, () => give(null))
      }
      document.head.append(s)
    })
    return monacoPromise
  }

  // ---------- Two editor kinds with one small API ----------
  function monacoEditor(m, host, pad) {
    const models = {}
    for (const f of pad.tabs) {
      models[f] = m.editor.createModel(pad.files[f] || '', langOf(f))
      models[f].onDidChangeContent(() => { if (!pad.applying) pad.edited(f, models[f].getValue()) })
    }
    const ed = m.editor.create(host, {
      model: models[pad.tab], theme: 'cp-dark', automaticLayout: true, minimap: { enabled: false }, scrollBeyondLastLine: false,
      fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: pad.fontSize, lineHeight: Math.round(pad.fontSize * 1.45),
      tabSize: 2, insertSpaces: true, detectIndentation: false, padding: { top: 6, bottom: 6 }, overviewRulerLanes: 0,
      scrollbar: { verticalScrollbarSize: 10, horizontalScrollbarSize: 10, alwaysConsumeMouseWheel: false },
      readOnly: !pad.editable, stickyScroll: { enabled: false }, renderWhitespace: 'none',
      // Type-what-you-see: no auto-closing, so typing from the notes comes out exactly as written
      autoIndent: 'none', autoClosingBrackets: 'never', autoClosingQuotes: 'never', autoClosingDelete: 'never',
      autoClosingOvertype: 'never', autoSurround: 'never', formatOnType: false, formatOnPaste: false,
      acceptSuggestionOnEnter: 'off', tabCompletion: 'off', quickSuggestions: false, suggestOnTriggerCharacters: false,
    })
    ed.addCommand(m.KeyCode.Escape, () => document.activeElement && document.activeElement.blur())
    let deco = null
    return {
      get value() { return models[pad.tab].getValue() },
      set(file, text) { if (models[file].getValue() !== text) models[file].setValue(text) },
      show(file) { ed.setModel(models[file]) },
      flash(lines) {
        if (deco) deco.clear()
        deco = ed.createDecorationsCollection(lines.map((l) => ({ range: new m.Range(l, 1, l, 1), options: { isWholeLine: true, className: 'lp-new-m' } })))
        if (lines.length) ed.revealLineInCenterIfOutsideViewport(lines[lines.length - 1])
      },
    }
  }

  // Offline on a page where students must type (Fix It): a plain textarea.
  function textEditor(host, pad) {
    const ta = document.createElement('textarea')
    ta.className = 'lp-fallback'
    ta.spellcheck = false
    ta.value = pad.files[pad.tab] || ''
    ta.addEventListener('input', () => pad.edited(pad.tab, ta.value))
    host.append(ta)
    return {
      get value() { return ta.value },
      set(file, text) { if (file === pad.tab && ta.value !== text) ta.value = text },
      show(file) { ta.value = pad.files[file] || '' },
      flash() {},
    }
  }

  function preEditor(host, pad) {
    const pre = document.createElement('pre')
    pre.className = 'lp-fallback'
    host.append(pre)
    let lit = []
    const draw = () => {
      pre.innerHTML = (pad.files[pad.tab] || '').split('\n')
        .map((l, k) => `<span class="lp-line${lit.includes(k + 1) ? ' lp-new' : ''}">${esc(l) || ' '}</span>`).join('\n')
    }
    draw()
    return {
      get value() { return pad.files[pad.tab] || '' },
      set() { draw() },
      show() { lit = []; draw() },
      flash(lines) { lit = lines; draw() },
    }
  }

  // ---------- One pad ----------
  function createPad(el, opts) {
    const pad = {
      el, lesson: opts.lesson || null, steps: opts.steps || [], idx: 0, start: opts.start ?? null,
      files: { ...opts.files }, assets: opts.assets || {}, tabs: opts.tabs, tab: opts.tabs[0], editable: opts.editable !== false,
      fontSize: opts.fontSize || 18, onChange: opts.onChange || null, typeable: !!opts.typeable,
      busy: false, ready: false, applying: false, status: '', err: null, editor: null, timer: null,
    }
    el.classList.add('livepad')
    el.innerHTML = `<div class="lp-bar"><div class="lp-tabs">${pad.tabs.map((f) => `<button type="button" class="lp-tab" data-file="${esc(f)}">${esc(f)}</button>`).join('')}</div>` +
      `<span class="lp-status"></span><button type="button" class="lp-btn lp-app" title="Show the live app (A)">A · App</button>` +
      `<button type="button" class="lp-btn lp-pop" title="Open the live app in its own window">↗ Pop out</button></div><div class="lp-body"><div class="lp-editor"></div><div class="lp-preview"><iframe title="Live app"></iframe></div></div>` +
      `<div class="lp-console" hidden><div class="lp-console-head">Console</div><div class="lp-console-lines"></div></div>`
    const statusEl = el.querySelector('.lp-status')
    const host = el.querySelector('.lp-editor')
    pad.iframe = el.querySelector('iframe')

    pad.setStatus = (s, bad) => { pad.status = s; statusEl.textContent = s; statusEl.classList.toggle('bad', !!bad) }
    const consoleEl = el.querySelector('.lp-console')
    const linesEl = el.querySelector('.lp-console-lines')
    // Lines are queued and drawn once per frame, so a loop that logs 20,000 times can't freeze the deck.
    const KEEP = 200
    let queue = [], total = 0, drawing = false
    const draw = () => {
      drawing = false
      const rows = queue.slice(-KEEP)
      queue = []
      const frag = document.createDocumentFragment()
      for (const [level, text] of rows) {
        const row = document.createElement('div')
        row.className = 'lp-log' + (level === 'error' ? ' err' : level === 'warn' ? ' warn' : '')
        row.textContent = text
        frag.append(row)
      }
      linesEl.append(frag)
      while (linesEl.childElementCount > KEEP) linesEl.firstChild.remove()
      consoleEl.hidden = false
      consoleEl.querySelector('.lp-console-head').textContent = 'Console (' + total + ')'
      linesEl.scrollTop = linesEl.scrollHeight
    }
    pad.log = (level, text) => {
      total++
      queue.push([level, text])
      if (queue.length > KEEP) queue.shift()
      if (!drawing) { drawing = true; requestAnimationFrame(draw) }
    }
    pad.clearLog = () => { linesEl.textContent = ''; queue = []; total = 0; consoleEl.hidden = true }
    pad.refresh = () => {
      pad.err = null
      pad.clearLog()
      pad.setStatus('loading…')
      pad.iframe.srcdoc = Course.buildDoc(pad.files, pad.assets)
      if (pad === active()) broadcast()
    }
    pad.iframe.addEventListener('load', () => {
      if (pad.err) pad.setStatus('✕ ' + pad.err, true)
      else pad.setStatus('app ✓ up to date')
    })
    // A file that a step deleted hides its tab (Shift+N brings it back).
    pad.syncTabs = () => {
      el.querySelectorAll('.lp-tab').forEach((b) => (b.hidden = !(b.dataset.file in pad.files)))
      if (!(pad.tab in pad.files)) { const first = pad.tabs.find((f) => f in pad.files); if (first) pad.showTab(first) }
    }
    pad.showTab = (f) => {
      pad.tab = f
      el.querySelectorAll('.lp-tab').forEach((b) => b.classList.toggle('on', b.dataset.file === f))
      if (pad.editor) pad.editor.show(f)
    }
    pad.edited = (f, text) => {
      pad.files[f] = text
      clearTimeout(pad.timer)
      // A React project reloads the whole preview (Babel + React), so wait a bit longer after typing.
      const wait = pad.files['src/main.jsx'] != null ? 700 : 300
      pad.timer = setTimeout(() => { pad.refresh(); if (pad.onChange) pad.onChange({ ...pad.files }) }, wait)
    }
    pad.setFile = (f, text) => {
      pad.files[f] = text
      if (pad.editor && pad.tabs.includes(f)) { pad.applying = true; pad.editor.set(f, text); pad.applying = false }
    }
    pad.setFiles = (files) => {
      pad.files = { ...files }
      pad.syncTabs()
      for (const f of pad.tabs) pad.setFile(f, pad.files[f] || '')
      if (pad.editor) pad.editor.show(pad.tab)
      pad.refresh()
    }

    pad.next = async () => {
      if (pad.busy || pad.idx >= pad.steps.length) return
      const step = pad.steps[pad.idx]
      if (step.mode === 'delete') {
        delete pad.files[step.file]
        pad.syncTabs()
        pad.idx++
        pad.refresh()
        return
      }
      const old = pad.files[step.file] || ''
      let text
      try { text = Course.applyStep(old, step) } catch (e) {
        if (e instanceof Course.StepMismatch) return pad.setStatus(/more than once/.test(e.message)
          ? "✕ can't apply the next step: the line it needs is in your code twice. Shift+N resets this slide"
          : "✕ can't apply the next step: your code changed. Shift+N resets this slide", true)
        throw e
      }
      pad.busy = true
      if (!(step.file in pad.files)) { pad.files[step.file] = ''; pad.syncTabs() }
      pad.showTab(step.file)
      // Type only the part that changes, a few characters per frame.
      let p = 0
      while (p < old.length && p < text.length && old[p] === text[p]) p++
      let s = 0
      while (s < old.length - p && s < text.length - p && old[old.length - 1 - s] === text[text.length - 1 - s]) s++
      const head = text.slice(0, p), mid = text.slice(p, text.length - s), tail = text.slice(text.length - s)
      const frames = Math.max(1, Math.min(60, Math.ceil(mid.length / 3)))
      for (let k = 1; k <= frames; k++) {
        pad.setFile(step.file, head + mid.slice(0, Math.ceil((mid.length * k) / frames)) + tail)
        if (!pad.editor || pad.editor.set === undefined) break
        await sleep(20)
      }
      pad.setFile(step.file, text)
      const first = head.split('\n').length
      const last = first + mid.split('\n').length - 1
      if (pad.editor) pad.editor.flash(Array.from({ length: last - first + 1 }, (_, k) => first + k))
      pad.idx++
      pad.refresh()
      pad.busy = false
    }
    pad.reset = () => {
      if (pad.busy || !pad.lesson) return
      pad.idx = 0
      pad.setFiles(Course.filesAt(pad.lesson, pad.start))
      if (pad.editor) pad.editor.flash([])
    }

    el.querySelectorAll('.lp-tab').forEach((b) => (b.onclick = () => { b.blur(); pad.showTab(b.dataset.file) }))
    el.querySelector('.lp-app').onclick = (e) => { e.currentTarget.blur(); toggleSplit() }
    el.querySelector('.lp-pop').onclick = (e) => { e.currentTarget.blur(); popOut() }
    paint(pad)
    pad.showTab(pad.tab)
    pad.refresh()
    loadMonaco().then((m) => {
      pad.editor = m ? monacoEditor(m, host, pad) : pad.typeable ? textEditor(host, pad) : preEditor(host, pad)
      pad.showTab(pad.tab)
      pad.ready = true
    })
    pads.push(pad)
    return pad
  }

  // Errors reported by a preview (see Course.buildDoc)
  addEventListener('message', (e) => {
    const t = e.data && e.data.type
    if (!t || !/^livepad-/.test(t)) return
    const pad = pads.find((p) => p.iframe.contentWindow === e.source)
    if (!pad) return
    if (t === 'livepad-error') { pad.err = e.data.message; pad.setStatus('✕ ' + e.data.message, true) }
    else if (t === 'livepad-console') pad.log(e.data.level, e.data.text)
    else if (t === 'livepad-reload') pad.refresh() // a form was submitted: the page reloads, like a real browser
  })

  const active = () => pads.find((p) => p.el.closest('.slide.active')) || pads.find((p) => !p.el.closest('.slide'))

  // ---------- Split (A) and pop-out window (↗) ----------
  function paint(pad) {
    pad.el.classList.toggle('split', splitOpen && !popOpen)
    pad.el.querySelector('.lp-app').classList.toggle('on', splitOpen && !popOpen)
    pad.el.querySelector('.lp-pop').textContent = popOpen ? '↗ open' : '↗ Pop out'
  }
  const paintAll = () => pads.forEach(paint)
  function toggleSplit() {
    if (popOpen) return
    splitOpen = !splitOpen
    paintAll()
  }
  const slideNo = (pad) => {
    const s = pad.el.closest('.slide')
    return s ? [...document.querySelectorAll('.slide')].indexOf(s) + 1 : null
  }
  function broadcast() {
    const pad = active()
    if (!pad) return
    lastSent = Date.now()
    channel.postMessage({ type: 'doc', lesson: pad.lesson && pad.lesson.id, slide: slideNo(pad), doc: Course.buildDoc(pad.files, pad.assets) })
  }
  const setPop = (open) => { popOpen = open; paintAll() }
  function readGeom() {
    try { return JSON.parse(localStorage.getItem('livepad-popout-geom') || 'null') } catch { return null }
  }
  function popOut() {
    if (popWin && !popWin.closed) { popWin.focus(); return }
    const g = readGeom() || { w: Math.round(screen.availWidth / 2), h: screen.availHeight, x: Math.round(screen.availWidth / 2), y: 0 }
    popWin = window.open(POPOUT, 'livepad-popout', `popup=yes,width=${g.w},height=${g.h},left=${g.x},top=${g.y}`)
    if (popWin) setPop(true)
  }
  let lastHello = 0
  channel.onmessage = (e) => {
    const t = e.data && e.data.type
    if (t === 'hello') { lastHello = Date.now(); if (!popOpen) setPop(true); if (document.hasFocus() || !lastSent) broadcast() }
    else if (t === 'bye') { popWin = null; setPop(false) }
  }
  // Is the pop-out still there? (Its "bye" can be lost, e.g. during a reload.)
  setInterval(() => {
    if (popWin && popWin.closed) { popWin = null; setPop(false); return }
    if (popOpen && !popWin) {
      if (Date.now() - lastHello > 3500) setPop(false)
      else channel.postMessage({ type: 'ping' })
    }
  }, 1000)
  // Back on this tab: show this page in the pop-out again.
  addEventListener('focus', () => broadcast())
  document.addEventListener('visibilitychange', () => { if (!document.hidden) broadcast() })

  addEventListener('keydown', (e) => {
    if (e.target.closest && e.target.closest('.monaco-editor, input, textarea, select, [contenteditable]')) return
    if (e.ctrlKey || e.metaKey || e.altKey) return
    const pad = active()
    if (!pad) return
    if (e.key === 'n' && !e.shiftKey && pad.lesson) { e.preventDefault(); pad.next() }
    else if (e.key === 'N' && e.shiftKey && pad.lesson) { e.preventDefault(); pad.reset() }
    else if (e.key === 'a' || e.key === 'A') { e.preventDefault(); toggleSplit() }
  })

  // A slide change sends the new slide's app to the pop-out.
  let shown = null
  const slideWatch = new MutationObserver(() => {
    const s = document.querySelector('.slide.active')
    if (s !== shown) { shown = s; broadcast() }
  })
  document.querySelectorAll('.slide').forEach((s) => slideWatch.observe(s, { attributes: true, attributeFilter: ['class'] }))

  function fromMarkup(el) {
    const lesson = Course.get(el.dataset.lesson)
    if (!lesson) { el.textContent = `Livepad: no lesson "${el.dataset.lesson}"`; return }
    const start = el.dataset.start && el.dataset.start !== 'null' ? el.dataset.start : null
    const all = lesson.features.flatMap((f) => f.steps)
    const steps = (el.dataset.steps || '').split(/\s+/).filter(Boolean).map((id) => all.find((s) => s.id === id))
    const files = Course.filesAt(lesson, start)
    const tabs = (el.dataset.files || Object.keys(files).join(' ')).split(/\s+/).filter(Boolean)
    createPad(el, { lesson, start, steps, files, assets: Course.assetsOf(lesson), tabs, fontSize: Number(el.dataset.font || 18) })
  }

  function current() {
    const pad = active()
    if (!pad) return null
    return {
      lesson: pad.lesson && pad.lesson.id, files: { ...pad.files }, doc: Course.buildDoc(pad.files, pad.assets),
      status: pad.status, busy: pad.busy, ready: pad.ready, tab: pad.tab,
      editorValue: pad.editor ? pad.editor.value : null, step: pad.idx,
    }
  }

  function mount(el, opts) {
    const tabs = opts.tabs || Course.tabOrder(Object.keys(opts.files))
    const pad = createPad(el, { files: opts.files, assets: opts.assets, tabs, editable: opts.editable, typeable: opts.editable !== false, onChange: opts.onChange, fontSize: opts.fontSize || 16 })
    return { setFiles: pad.setFiles, getFiles: () => ({ ...pad.files }), preview: pad.iframe, pad }
  }

  window.Livepad = { current, mount, pads }
  // A pop-out left open from before a reload answers this with "hello".
  const init = () => { document.querySelectorAll('.livepad[data-lesson]').forEach(fromMarkup); channel.postMessage({ type: 'ping' }) }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init)
  else init()
})()
