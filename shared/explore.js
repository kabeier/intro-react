// Code Explorer: a lesson's app at any feature, the changes that built it,
// and the story of every line. Reads the same lesson data as the slides.
//   explore.html?lesson=html-css&at=f3
(() => {
  const q = new URLSearchParams(location.search)
  // ?view=commands shows the terminal commands (explore-commands.js) instead of a lecture.
  const commandsView = q.get('view') === 'commands' && !!Course.commands
  const lesson = commandsView ? null : Course.get(q.get('lesson')) || Course.all()[0]
  const feats = lesson ? lesson.features : []
  let at = feats.some((f) => f.id === q.get('at')) ? q.get('at') : feats[0]?.id
  let showBefore = false
  const assets = lesson ? Course.assetsOf(lesson) : {}
  let tab = lesson ? Course.tabOrder(Object.keys(lesson.files))[0] : null
  let picked = null
  const channel = new BroadcastChannel('livepad')
  let popWin = null, opening = false

  const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  const featOf = (id) => feats.find((f) => f.id === id)
  const lastStep = (f) => f.steps[f.steps.length - 1].id
  const filesAfter = (fid) => Course.checkpoint(lesson, fid)
  const filesBefore = (fid) => {
    const k = feats.findIndex((f) => f.id === fid)
    return k > 0 ? Course.checkpoint(lesson, feats[k - 1].id) : Course.filesAt(lesson, null)
  }
  const lessonName = (l) => l.label || 'Lecture ' + (Course.all().indexOf(l) + 1)
  const stepLabel = (stepId, from = lesson) => {
    for (const [k, f] of from.features.entries()) {
      const n = f.steps.findIndex((s) => s.id === stepId)
      if (n >= 0) {
        const pre = from === lesson ? '' : `${lessonName(from)} (${from.title}): `
        return { feature: f, lesson: from, text: `${pre}Feature ${k + 1} (${f.title}), step ${n + 1}` }
      }
    }
    return null
  }

  // Light syntax colouring for HTML and CSS.
  function paint(line, file) {
    let h = esc(line)
    if (file.endsWith('.css')) {
      return h.replace(/^(\s*)([a-z-]+)(\s*:)/, '$1<span class="t-prop">$2</span>$3')
        .replace(/^(\s*)([^\s{][^{]*)(\{)/, '$1<span class="t-sel">$2</span>$3')
    }
    // One pass, so the spans we add are never coloured again.
    return h.replace(/(&lt;\/?)([a-zA-Z][\w-]*)|([\w-]+)=("[^"]*")/g, (m, lt, tag, attr, str) =>
      lt ? `${lt}<span class="t-tag">${tag}</span>` : `<span class="t-attr">${attr}</span>=<span class="t-str">${str}</span>`)
  }

  const featuresEl = document.querySelector('.ex-features')
  const mainEl = document.querySelector('.ex-main')
  const storyEl = document.querySelector('.ex-story')

  // Left column: the lectures. The features of the open lecture sit in a row above the main content.
  function renderFeatures() {
    const cmds = Course.commands
    featuresEl.innerHTML = (cmds ? `<a class="ex-cmd-link${commandsView ? ' on' : ''}" href="?view=commands"${commandsView ? ' aria-current="page"' : ''}>⌨ Terminal commands</a>` : '') +
      (Course.codeRepo ? `<a class="ex-cmd-link ex-repo-link" href="${Course.codeRepo.page}">⎇ All the code on GitHub</a>` : '') +
      '<h2>Lectures</h2><div class="ex-lessons">' + Course.all().map((l) =>
      `<a class="ex-lesson${l === lesson ? ' on' : ''}" href="?lesson=${l.id}&at=${l.features[0].id}"${l === lesson ? ' aria-current="page"' : ''}>${esc(lessonName(l))}: ${esc(l.title)}</a>`).join('') + '</div>' +
      // Phones: one dropdown instead of the long list.
      '<select class="ex-lesson-select" aria-label="Lecture">' + Course.all().map((l) =>
      `<option value="${l.id}"${l === lesson ? ' selected' : ''}>${esc(lessonName(l))}: ${esc(l.title)}</option>`).join('') + '</select>'
    const sel = featuresEl.querySelector('.ex-lesson-select')
    if (commandsView) sel.insertAdjacentHTML('afterbegin', '<option value="" selected>Pick a lecture…</option>')
    sel.onchange = () => { const l = Course.get(sel.value); if (l) location.href = `?lesson=${l.id}&at=${l.features[0].id}` }
  }
  const featureBar = () => `<nav class="ex-featbar" aria-label="Features of this lecture"><span class="ex-featbar-label">Features</span>` + feats.map((f, k) =>
    `<button type="button" class="ex-feature${f.id === at ? ' on' : ''}" data-feature="${f.id}"${f.id === at ? ' aria-current="step"' : ''}><b>${k + 1}</b> ${esc(f.title)}</button>`).join('') + '</nav>'

  function renderMain() {
    const f = featOf(at)
    const k = feats.indexOf(f)
    const files = filesAfter(at)
    if (!(tab in files)) tab = Course.tabOrder(Object.keys(files))[0]
    const origins = Course.origins(lesson, lastStep(f))
    const mine = new Set(f.steps.map((s) => s.id))
    mainEl.innerHTML = featureBar() + `
      <section class="ex-card">
        <p class="ex-kicker">Feature ${k + 1} of ${feats.length}</p>
        <h2>${esc(f.title)}</h2>
        <p class="ex-why">${esc(f.why)}</p>
        ${f.steps.filter((x) => x.later).map((x) => `<p class="ex-later">⚠ <b>For now:</b> ${esc(x.later.how)} Fixed in: ${esc(x.later.where)}.</p>`).join('')}
        <div class="ex-tools">
          <button type="button" class="ex-before${showBefore ? ' on' : ''}">Before</button>
          <button type="button" class="ex-after${showBefore ? '' : ' on'}">After</button>
          <button type="button" class="ex-pop">↗ Pop out the app</button>
          <button type="button" class="ex-download">⬇ Download the code at this feature</button>
          ${Course.codeRepo ? `<a class="ex-get" href="${Course.codeRepo.page}#${lesson.id}">⎇ Start this lecture from GitHub</a>` : ''}
        </div>
        <div class="ex-preview"><iframe title="The app ${showBefore ? 'before' : 'after'} this feature"></iframe></div>
        <div class="ex-console" hidden><p class="ex-console-head">Console</p><div class="ex-console-lines"></div></div>
      </section>
      <section class="ex-card ex-changes">
        <h3>What changed, step by step</h3>
        ${f.steps.map((s, n) => `
          <div class="ex-change" data-step="${s.id}">
            <p class="ex-step"><b>Step ${n + 1}</b> · <code>${esc(s.file)}</code> · ${esc(s.say || '')}</p>
            ${s.code ? `<pre class="ex-snippet">${s.code.split('\n').map((l) => paint(l, s.file)).join('\n')}</pre>` : '<p class="ex-removed">(this step deletes code)</p>'}
            ${(s.notes || []).length ? `<ul class="ex-notes">${s.notes.map((n2) => `<li><code>${esc(n2.match)}</code> ${esc(n2.what)} <span class="muted">${esc(n2.why)}</span></li>`).join('')}</ul>` : ''}
          </div>`).join('')}
      </section>
      <section class="ex-card">
        <h3>All the code after this feature</h3>
        <p class="muted">Green lines were added in this feature. Click any line.</p>
        <div class="ex-tabs">${Course.tabOrder(Object.keys(files)).map((n) => `<button type="button" class="ex-tab${n === tab ? ' on' : ''}" data-file="${esc(n)}">${esc(n)}</button>`).join('')}
          <button type="button" class="ex-copy">Copy file</button></div>
        <div class="ex-code">${(files[tab] || '').split('\n').map((l, n) => {
          const o = (origins[tab] || [])[n]
          return `<div class="ex-line${o && mine.has(o.stepId) ? ' ex-new' : ''}${picked === n + 1 ? ' picked' : ''}" data-line="${n + 1}"><span class="ln">${n + 1}</span><span class="src">${paint(l, tab) || ' '}</span></div>`
        }).join('')}</div>
      </section>`
    const frame = mainEl.querySelector('.ex-preview iframe')
    frame.srcdoc = Course.buildDoc(showBefore ? filesBefore(at) : files, assets)
    send()
    mainEl.querySelector('.ex-before').onclick = () => { showBefore = true; renderMain() }
    mainEl.querySelector('.ex-after').onclick = () => { showBefore = false; renderMain() }
    mainEl.querySelector('.ex-download').onclick = download
    mainEl.querySelector('.ex-pop').onclick = popOut
    mainEl.querySelector('.ex-copy').onclick = (e) => {
      try { navigator.clipboard.writeText(files[tab]); e.target.textContent = 'Copied ✓' } catch { e.target.textContent = 'Select and copy' }
    }
    mainEl.querySelectorAll('.ex-feature').forEach((b) => (b.onclick = () => go(b.dataset.feature)))
    mainEl.querySelectorAll('.ex-tab').forEach((b) => (b.onclick = () => { tab = b.dataset.file; picked = null; renderMain(); storyHint() }))
    mainEl.querySelectorAll('.ex-line').forEach((d) => (d.onclick = () => pick(Number(d.dataset.line))))
  }

  function storyHint() {
    storyEl.innerHTML = '<p class="ex-hint">Click a line of code to see <b>what</b> it does, <b>why</b> it\'s there and <b>when</b> we added it.</p>'
  }

  function pick(n) {
    picked = n
    mainEl.querySelectorAll('.ex-line').forEach((d) => d.classList.toggle('picked', Number(d.dataset.line) === n))
    const text = (filesAfter(at)[tab] || '').split('\n')[n - 1] || ''
    const r = Course.noteFor(lesson, lastStep(featOf(at)), tab, n)
    const from = Course.get(r.lessonId) || lesson
    const when = r.stepId ? stepLabel(r.stepId, from) : null
    const whenHtml = when ? `<p class="ex-when">Added in <a href="?lesson=${when.lesson.id}&at=${when.feature.id}">${esc(when.text)}</a></p>` : ''
    const head = `<p class="ex-line-shown"><code>${esc(text.trim()) || '(blank line)'}</code></p>`
    if (text.trim() === '') {
      storyEl.innerHTML = head + '<p class="ex-boiler">Blank line</p><h3>What</h3><p>An empty line. The computer ignores it.</p><h3>Why</h3><p>Blank lines split the code into groups (imports, state, functions, the JSX), like paragraphs in a text, so it is easier to read.</p>'
      return
    }
    if (!r.note) {
      storyEl.innerHTML = head + whenHtml + '<p>This line is part of the block around it: click the line that opens the block (the one ending in { or ( ) to see what it does.</p>'
      return
    }
    const n2 = r.note
    const api = n2.api
    const src = r.stepId && from.features.flatMap((f) => f.steps).find((x) => x.id === r.stepId)
    const laterHtml = src && src.later ? `<p class="ex-later">⚠ <b>For now, not the final way.</b> ${esc(src.later.how)} Fixed in: ${esc(src.later.where)}.</p>` : ''
    storyEl.innerHTML = head + `
      ${laterHtml}
      ${n2.boilerplate ? '<p class="ex-boiler" title="Setup code that comes with the template or a tool. You rarely change it, but here is what it does.">Boilerplate · setup code from the template or a tool</p>' : ''}
      <h3>What</h3><p>${esc(n2.what)}</p>
      <h3>Why</h3><p>${esc(n2.why)}</p>
      ${whenHtml}
      ${n2.breaks ? `<h3>If you remove it</h3><p>${esc(n2.breaks)}</p>` : ''}
      ${api ? `<h3>${esc(api.name)}</h3><p>${esc(api.does)}</p>
        <table class="ex-api"><tr><th>Argument</th><th>Means</th><th>How to pick it</th></tr>
        ${api.params.map(([a, m, h]) => `<tr><td><code>${esc(a)}</code></td><td>${esc(m)}</td><td>${esc(h)}</td></tr>`).join('')}</table>
        ${api.returns ? `<p><b>Gives back:</b> ${esc(api.returns)}</p>` : ''}
        ${(api.mistakes || []).length ? `<h3>Common mistakes</h3><ul>${api.mistakes.map((m) => `<li>${esc(m)}</li>`).join('')}</ul>` : ''}` : ''}`
  }

  async function download() {
    const files = filesAfter(at)
    const zip = new JSZip()
    for (const [name, text] of Object.entries(files)) zip.file(name, text)
    for (const [name, src] of Object.entries(assets)) {
      try { zip.file(name, await (await fetch(src)).blob()) } catch {}
    }
    const blob = await zip.generateAsync({ type: 'blob' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `${lesson.id}-${at}.zip`
    document.body.append(a); a.click(); a.remove()
    setTimeout(() => URL.revokeObjectURL(a.href), 5000)
  }

  function send() {
    channel.postMessage({ type: 'doc', slide: null, doc: Course.buildDoc(showBefore ? filesBefore(at) : filesAfter(at), assets) })
  }
  function popOut() {
    if (popWin && !popWin.closed) return popWin.focus()
    opening = true // the new window takes the focus: answer its hello anyway
    popWin = window.open('shared/popout.html', 'livepad-popout', 'popup=yes,width=900,height=800')
  }
  // Messages from the preview: console lines, and a form submit nobody prevented (reload, like a real browser).
  addEventListener('message', (e) => {
    const f = document.querySelector('.ex-preview iframe')
    if (!f || e.source !== f.contentWindow || !e.data) return
    if (e.data.type === 'livepad-reload') { clearConsole(); const d = f.srcdoc; f.removeAttribute('srcdoc'); f.srcdoc = d }
    if (e.data.type === 'livepad-console') {
      const box = document.querySelector('.ex-console'), lines = document.querySelector('.ex-console-lines')
      if (!box || lines.childElementCount >= 200) return
      box.hidden = false
      const row = document.createElement('div')
      row.className = 'ex-log' + (e.data.level === 'error' ? ' err' : '')
      row.textContent = e.data.text
      lines.append(row)
    }
  })
  const clearConsole = () => { const l = document.querySelector('.ex-console-lines'); if (l) l.textContent = '' }
  // Answer the pop-out only while this tab is the one being used.
  channel.onmessage = (e) => { if (e.data && e.data.type === 'hello' && (document.hasFocus() || opening)) { opening = false; send() } }
  addEventListener('focus', send)

  function go(fid) {
    at = fid; showBefore = false; picked = null
    const u = new URL(location.href); u.searchParams.set('at', at); u.searchParams.set('lesson', lesson.id)
    history.replaceState(null, '', u)
    renderFeatures(); renderMain(); storyHint()
  }

  if (commandsView) { renderFeatures(); window.renderCommands(mainEl, storyEl, esc); return }
  document.title = lesson.title + ' · Code Explorer'
  renderFeatures(); renderMain()
})()
