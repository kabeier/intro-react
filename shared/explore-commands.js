// Code Explorer, "Terminal commands" view (explore.html?view=commands): every command of the
// section in course order, with or without Docker. Click any part of a command to read what it
// means and what you can change. Data: Course.commands (shared/course/commands.js).
window.renderCommands = (mainEl, storyEl, esc) => {
  const C = Course.commands
  const TRACK = { both: 'Docker or not', docker: 'With Docker', laptop: 'Without Docker' }
  let track = 'all', picked = null
  try { track = localStorage.getItem('ex-cmd-track') || 'all' } catch {}

  // The command split into its parts, in order; text between parts (spaces) stays plain.
  const pieces = (c) => {
    const out = []
    let i = 0
    c.parts.forEach(([p], k) => {
      const at = c.cmd.indexOf(p, i)
      if (at < 0) return
      if (at > i) out.push(esc(c.cmd.slice(i, at)))
      out.push(`<button type="button" class="ex-part" data-part="${k}">${esc(p)}</button>`)
      i = at + p.length
    })
    if (i < c.cmd.length) out.push(esc(c.cmd.slice(i)))
    return out.join('')
  }
  const all = C.groups.flatMap((g) => g.commands.map((c) => ({ g, c })))
  const shown = (c) => track === 'all' || !c.track || c.track === 'both' || c.track === track
  const stepText = (s) => (typeof s === 'string' ? s : s.text)

  function render() {
    let n = 0
    const count = all.filter((x) => shown(x.c)).length
    mainEl.innerHTML = `
      <section class="ex-card">
        <p class="ex-kicker">React section · units 2–9</p>
        <h2>Terminal commands</h2>
        <p class="ex-why">Every command we type in the terminal, in the order the course uses them. Click any <b>part</b> of a command to see what it means and what you can change.</p>
        <div class="ex-tools ex-track" role="group" aria-label="Show commands for">
          ${[['all', 'All'], ['docker', 'With Docker'], ['laptop', 'Without Docker']].map(([k, t]) => `<button type="button" data-track="${k}" class="${track === k ? 'on' : ''}" aria-pressed="${track === k}">${t}</button>`).join('')}
        </div>
        <p class="ex-count" aria-live="polite">${track === 'all' ? `Showing all ${all.length} commands` : `Showing ${count} of ${all.length} commands: the ones you use ${track === 'docker' ? 'with Docker' : 'without Docker'}`}</p>
        <div class="ex-flows">${C.flows.filter(shown).map((f) => `<div class="ex-flow"><h3>${esc(f.title)}</h3><ol>${f.steps.filter((s) => typeof s === 'string' || shown(s)).map((s) => `<li>${esc(stepText(s))}</li>`).join('')}</ol></div>`).join('')}</div>
      </section>
      ${C.groups.filter((g) => g.commands.some(shown)).map((g) => {
        const cs = g.commands.filter(shown)
        return `<section class="ex-card ex-cmd-group">
          <p class="ex-kicker">${esc(g.when)}</p>
          <h3>${esc(g.title)}</h3>
          ${g.note ? `<p class="ex-why">${esc(g.note)}</p>` : ''}
          ${cs.map((c) => {
            const id = all.findIndex((x) => x.c === c)
            n += 1
            return `<div class="ex-cmd" data-cmd="${id}">
              <p class="ex-cmd-head"><b>${n}</b> <span class="ex-badge t-${c.track}">${TRACK[c.track]}</span></p>
              <div class="ex-cmdline"><code>${pieces(c)}</code><button type="button" class="ex-copy-cmd">Copy</button></div>
              <p><b>Does:</b> ${esc(c.does)}</p>
              ${c.why ? `<p class="muted">${esc(c.why)}</p>` : ''}
              ${c.expect ? `<p><b>You should see:</b> ${esc(c.expect)}</p>` : ''}
              ${(c.mistakes || []).length ? `<ul class="ex-cmd-mistakes">${c.mistakes.map((m) => `<li>${esc(m)}</li>`).join('')}</ul>` : ''}
              <details><summary>Every part explained</summary>
                <table class="ex-api"><tr><th>Part</th><th>What it means</th><th>Can you change it?</th></tr>
                ${c.parts.map(([p, m, ch]) => `<tr><td><code>${esc(p)}</code></td><td>${esc(m)}</td><td>${esc(ch)}</td></tr>`).join('')}</table>
              </details>
            </div>`
          }).join('')}
        </section>`
      }).join('')}`
    mainEl.querySelectorAll('.ex-track button').forEach((b) => (b.onclick = () => {
      track = b.dataset.track
      try { localStorage.setItem('ex-cmd-track', track) } catch {}
      render()
      // The yellow box only changes if the command it explains was hidden.
      const again = picked && mainEl.querySelector(`.ex-cmd[data-cmd="${picked.cmd}"] .ex-part[data-part="${picked.part}"]`)
      if (again) again.classList.add('picked')
      else if (picked) { picked = null; hint() }
    }))
    mainEl.querySelectorAll('.ex-part').forEach((b) => (b.onclick = () => pick(b)))
    mainEl.querySelectorAll('.ex-copy-cmd').forEach((b) => (b.onclick = () => {
      const c = all[b.closest('.ex-cmd').dataset.cmd].c
      try { navigator.clipboard.writeText(c.cmd); b.textContent = 'Copied ✓' } catch { b.textContent = 'Select and copy' }
    }))
  }

  function hint() {
    storyEl.innerHTML = '<p class="ex-hint">Click any <b>part</b> of a command to see <b>what it means</b> and <b>what you can change</b>.</p>'
  }

  function pick(b) {
    mainEl.querySelectorAll('.ex-part.picked').forEach((x) => x.classList.remove('picked'))
    b.classList.add('picked')
    picked = { cmd: b.closest('.ex-cmd').dataset.cmd, part: b.dataset.part }
    const { g, c } = all[picked.cmd]
    const [p, means, change] = c.parts[b.dataset.part]
    storyEl.innerHTML = `<p class="ex-line-shown"><code>${esc(c.cmd)}</code></p>
      <p class="ex-boiler">${esc(g.when)} · ${TRACK[c.track]}</p>
      <h3><code>${esc(p)}</code></h3>
      <h3>What it means</h3><p>${esc(means)}</p>
      <h3>Can you change it?</h3><p>${esc(change)}</p>
      <h3>The whole command</h3><p>${esc(c.does)}</p>`
  }

  document.title = 'Terminal commands · Code Explorer'
  document.querySelector('.ex-lede').innerHTML = 'Pick your setup. Click any <b>part</b> of a command to see what it means.'
  render(); hint()
}
