// Fix It: a broken page, an editor, and hidden checks that run on the live page.
//   fixit.html?lesson=html-css&p=css
(() => {
  const q = new URLSearchParams(location.search)
  const lessonId = q.get('lesson') || 'html-css'
  const lesson = Course.get(lessonId)
  const problems = (window.FIXIT || {})[lessonId] || []
  const KEY = 'fixit:' + lessonId
  const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

  const loadSolved = () => { try { return new Set(JSON.parse(localStorage.getItem(KEY) || '[]')) } catch { return new Set() } }
  const solved = loadSolved()
  const saveSolved = () => { try { localStorage.setItem(KEY, JSON.stringify([...solved])) } catch {} }

  const apply = (files, steps) => {
    const out = { ...files }
    for (const s of steps || []) out[s.file] = Course.applyStep(out[s.file], s)
    return out
  }
  const brokenFiles = (p) => apply(Course.checkpoint(lesson, p.base), p.breaks)
  const solutionFiles = (p) => apply(Course.checkpoint(lesson, p.base), p.solve)

  let current = problems.find((p) => p.id === q.get('p')) || problems[0]
  let editor = null
  const listEl = document.querySelector('.fx-list')
  const mainEl = document.querySelector('.fx-main')

  function renderList() {
    const lessons = Course.all().filter((l) => (window.FIXIT || {})[l.id])
    listEl.innerHTML = `<div class="fx-lessons">${lessons.map((l, k) =>
      `<a class="fx-lesson${l === lesson ? ' on' : ''}" href="?lesson=${l.id}">${esc(l.label || 'Lecture ' + (Course.all().indexOf(l) + 1))}: ${esc(l.title)}</a>`).join('')}</div>` +
      '<h2>Problems</h2>' + problems.map((p, k) =>
      `<button type="button" class="fx-item${p === current ? ' on' : ''}" data-id="${p.id}"><span class="fx-mark">${solved.has(p.id) ? '✅' : k + 1}</span> ${esc(p.title)}</button>`).join('')
    listEl.querySelectorAll('.fx-item').forEach((b) => (b.onclick = () => show(problems.find((p) => p.id === b.dataset.id))))
  }

  function show(p) {
    current = p
    const u = new URL(location.href); u.searchParams.set('p', p.id); history.replaceState(null, '', u)
    renderList()
    mainEl.innerHTML = `
      <section class="fx-card">
        <p class="fx-kicker">Problem ${problems.indexOf(p) + 1} of ${problems.length}</p>
        <h2>${esc(p.title)}</h2>
        <p class="fx-symptom"><b>Symptom:</b> ${esc(p.symptom)}</p>
        <div class="fx-pad"></div>
        <div class="fx-buttons">
          <button type="button" class="fx-fix">Fix</button>
          <button type="button" class="fx-hint">Hint</button>
          <button type="button" class="fx-solution">Show solution</button>
          <button type="button" class="fx-reset">Reset</button>
        </div>
        <div class="fx-result" aria-live="polite"></div>
        <p class="fx-hint-text" hidden></p>
        <div class="fx-answer" hidden></div>
      </section>`
    editor = Livepad.mount(mainEl.querySelector('.fx-pad'), { files: brokenFiles(p), assets: Course.assetsOf(lesson), editable: true })
    mainEl.querySelector('.fx-fix').onclick = check
    mainEl.querySelector('.fx-hint').onclick = () => { const h = mainEl.querySelector('.fx-hint-text'); h.hidden = false; h.textContent = '💡 ' + p.hint }
    mainEl.querySelector('.fx-solution').onclick = showSolution
    mainEl.querySelector('.fx-reset').onclick = () => { editor.setFiles(brokenFiles(p)); mainEl.querySelector('.fx-result').textContent = '' }
  }

  // Run the checks on a fresh copy of the page (real layout size, images loaded).
  const checker = document.createElement('iframe')
  checker.className = 'fx-checker'
  checker.setAttribute('aria-hidden', 'true')
  document.body.append(checker)
  // A form submit nobody prevented reloads the checked page too, like a real browser.
  let reloading = null
  addEventListener('message', (e) => {
    if (e.source === checker.contentWindow && e.data && e.data.type === 'livepad-reload') {
      reloading = new Promise((r) => { checker.onload = () => { reloading = null; r() } })
      const d = checker.srcdoc; checker.removeAttribute('srcdoc'); checker.srcdoc = d
    }
  })
  function settle(doc) {
    const imgs = [...doc.images].filter((i) => !i.complete)
    return Promise.race([
      Promise.all(imgs.map((i) => new Promise((r) => { i.addEventListener('load', r); i.addEventListener('error', r) }))),
      new Promise((r) => setTimeout(r, 5000)),
    ])
  }
  let checking = false
  async function check() {
    if (checking) return
    checking = true
    try { await runChecks() } finally { checking = false }
  }
  async function runChecks() {
    const p = current
    const out = mainEl.querySelector('.fx-result')
    out.className = 'fx-result'
    out.textContent = 'Checking…'
    const html = Course.buildDoc(editor.getFiles(), Course.assetsOf(lesson))
    await new Promise((resolve) => { checker.onload = resolve; checker.srcdoc = html })
    const doc = checker.contentDocument, win = checker.contentWindow
    await settle(doc)
    const ctx = { wait: (ms) => new Promise((r) => setTimeout(r, ms)), doc: () => checker.contentDocument,
      settled: async () => { if (reloading) { await reloading; await settle(checker.contentDocument) } } }
    const results = []
    for (const c of p.checks) {
      let ok = false
      try { ok = !!(await c.run(doc, win, ctx)) } catch {}
      results.push({ name: c.name, ok })
    }
    const all = results.every((r) => r.ok)
    if (p !== current) return
    out.className = 'fx-result ' + (all ? 'ok' : 'bad')
    out.innerHTML = (all ? `<b>✅ Fixed!</b> ${esc(p.why)}` : '<b>❌ Still broken.</b> Try again, or press Hint.') +
      `<ul>${results.map((r) => `<li>${r.ok ? '✓' : '✗'} ${esc(r.name)}</li>`).join('')}</ul>`
    if (all) { solved.add(p.id); saveSolved(); renderList() }
  }

  // Lines to change: what is in the broken file but not the solution, and the other way round.
  function diff(a, b) {
    const x = a.split('\n'), y = b.split('\n')
    const L = Array.from({ length: x.length + 1 }, () => new Array(y.length + 1).fill(0))
    for (let i = x.length - 1; i >= 0; i--) for (let j = y.length - 1; j >= 0; j--) L[i][j] = x[i] === y[j] ? L[i + 1][j + 1] + 1 : Math.max(L[i + 1][j], L[i][j + 1])
    const out = []
    let i = 0, j = 0
    while (i < x.length || j < y.length) {
      if (i < x.length && j < y.length && x[i] === y[j]) { i++; j++ }
      else if (i < x.length && (j >= y.length || L[i + 1][j] >= L[i][j + 1])) out.push(['-', x[i++]])
      else out.push(['+', y[j++]])
    }
    return out
  }
  function showSolution() {
    const p = current
    const broken = brokenFiles(p), sol = solutionFiles(p)
    const box = mainEl.querySelector('.fx-answer')
    box.hidden = false
    box.innerHTML = '<h3>The fix</h3>' + Object.keys(sol).filter((f) => broken[f] !== sol[f]).map((f) =>
      `<p class="fx-file">${esc(f)}</p><pre class="fx-diff">${diff(broken[f], sol[f]).map(([k, l]) => `<span class="${k === '+' ? 'add' : 'del'}">${k} ${esc(l)}</span>`).join('')}</pre>`).join('') +
      `<p><b>Why:</b> ${esc(p.why)}</p>`
  }

  window.FixIt = {
    ready: false,
    getFiles: () => editor.getFiles(),
    setFiles: (f) => editor.setFiles(f),
    check,
  }
  document.title = 'Fix It · ' + lesson.title
  if (current) show(current)
  window.FixIt.ready = true
})()
