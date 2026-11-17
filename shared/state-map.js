// "Where state lives": a hand-built model of the PokeSearch app for lecture 14.
// Pages mount and unmount in the Outlet, state resets with the component that owns it,
// and "⬆ App" moves a piece of state up so it travels through <Outlet context>.
// Usage: <div class="sm"></div> on a slide.
;(function () {
  const KEYS = ['count', 'pokemonList', 'pokemonName', 'username']
  const INIT = { count: 0, pokemonList: [], pokemonName: '', username: '' }
  const INIT_TEXT = { count: '0', pokemonList: '[]', pokemonName: "''", username: "''" }
  const SETTER = { count: 'setCount', pokemonList: 'setPokemonList', pokemonName: 'setPokemonName', username: 'setUsername' }
  const USER = { count: 'Counter', pokemonList: 'PokeSearch', pokemonName: 'PokeSearch', username: 'LoginPage' } // who uses it
  const PAGE_OF = { Counter: '/', PokeSearch: '/', LoginPage: '/login' }
  const PAGES = [['/', 'HomePage'], ['/about', 'AboutPage'], ['/login', 'LoginPage'], ['/pokemon/:id', 'PokemonDetailsPage'], ['*', 'NotFoundPage']]
  const PAGE = { '/': 'HomePage', '/about': 'AboutPage', '/login': 'LoginPage' }
  const LANE = { count: 0, pokemonList: 1, pokemonName: 2, username: 3 }
  const FETCH_MS = 800
  const PULSE_MS = 420
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c])
  const wait = (ms) => new Promise((r) => setTimeout(r, ms))

  function fresh() {
    return { path: '/', owner: Object.fromEntries(KEYS.map((k) => [k, 'local'])), v: structuredClone(INIT), shiny: {}, mountId: 0, busy: false }
  }
  const show = (k, v) => k === 'pokemonList' ? `[${v.join(', ')}]` : typeof v === 'string' ? JSON.stringify(v) : String(v)

  function create(root) {
    let st = fresh()
    let edges = {}
    root.innerHTML = '<div class="sm-main"><div class="sm-tree"></div><svg class="sm-wires"></svg></div>' +
      '<div class="sm-side"><h3>router.jsx: the pages</h3><div class="sm-shelf"></div>' +
      '<h3>Mount log</h3><ol class="sm-log"></ol><button class="sm-reset">Reset diagram</button></div>'
    const main = root.querySelector('.sm-main'), tree = root.querySelector('.sm-tree')
    const svg = root.querySelector('.sm-wires'), shelf = root.querySelector('.sm-shelf'), logEl = root.querySelector('.sm-log')

    // ---------- markup ----------
    function tag(k, where) {
      const inApp = where === 'App', ctx = !inApp && st.owner[k] === 'App'
      const src = ctx ? 'useOutletContext()' : `useState(${INIT_TEXT[k]})`
      const btn = inApp ? '<button class="sm-move" title="move it back down">⬇ back</button>' : ctx ? '' : '<button class="sm-move" title="move it up to App">⬆ App</button>'
      return `<span class="sm-tag k-${k}${ctx ? ' ctx' : ''}" data-key="${k}" data-where="${where}"><b>${k}</b> <span class="sm-val">${esc(show(k, st.v[k]))}</span> <small>${src}</small>${btn}</span>`
    }
    const pill = (k, name, fn) => `<span class="sm-pill k-${k}${fn ? ' fn' : ''}" data-prop="${name}">${name}</span>`
    const box = (comp, head, body = '', cls = '') => `<div class="sm-box ${cls}" data-comp="${comp}"><div class="sm-head"><span class="sm-name">${comp}</span>${head}</div>${body}</div>`

    function card(name) {
      const shiny = !!st.shiny[name]
      return `<div class="sm-box sm-card${shiny ? ' shiny' : ''}" data-comp="PokeCard" data-name="${esc(name)}">` +
        `<div class="sm-head"><span class="sm-name">PokeCard</span><span class="sm-tags">${pill('pokemonList', 'rmData', true)}${pill('pokemonList', 'pokemon')}</span></div>` +
        `<div class="poke">${esc(name)}</div>` +
        `<div class="sm-row" style="gap:6px;align-items:center"><span class="sm-tag k-shiny" data-key="shiny"><b>shiny</b> <span class="sm-val">${shiny}</span></span>` +
        `<button class="sm-shiny">Shiny</button><button class="sm-rm">Remove</button></div></div>`
    }
    function page() {
      if (st.path === '/about') return box('AboutPage', '', '<div class="sm-note">No state in here.</div>', 'sm-page')
      if (st.path === '/login') return box('LoginPage', `<input class="sm-user-input" placeholder="username" value="${esc(st.v.username)}"><span class="sm-tags">${tag('username', 'LoginPage')}</span>`, '', 'sm-page')
      const list = st.v.pokemonList
      return box('HomePage', '',
        box('Counter', `<button class="sm-count-btn">Click me!</button><span class="sm-tags">${tag('count', 'Counter')}</span>`) +
        box('PokeSearch', `<span class="sm-tags stack">${tag('pokemonName', 'PokeSearch')}${tag('pokemonList', 'PokeSearch')}</span>`,
          box('PokeForm', `<input class="sm-name-input" placeholder="pokemon name" value="${esc(st.v.pokemonName)}"><button class="sm-search">Search</button><span class="sm-tags">${pill('pokemonList', 'handleSubmit', true)}${pill('pokemonName', 'setPokemonName', true)}${pill('pokemonName', 'pokemonName')}</span>`) +
          box('PokeContainer', `<span class="sm-tags">${pill('pokemonList', 'rmData', true)}${pill('pokemonList', 'pokemonList')}</span>`,
            `<div class="sm-cards">${list.length ? list.map(card).join('') : '<div class="sm-note" style="margin-top:8px">no cards</div>'}</div>`)),
        'sm-page')
    }
    function outletLabel() {
      const up = KEYS.filter((k) => st.owner[k] === 'App')
      if (!up.length) return '<span>&lt;Outlet /&gt;</span>'
      return '<span>&lt;Outlet context={{ </span>' +
        up.map((k, i) => `<span class="sm-pill k-${k}" data-prop="${k}">${k}, ${SETTER[k]}${i < up.length - 1 ? ',' : ''}</span>`).join('') +
        '<span> }} /&gt;</span>'
    }
    function build(entering) {
      const appTags = KEYS.filter((k) => st.owner[k] === 'App').map((k) => tag(k, 'App')).join('')
      const links = [['/', 'Home'], ['/about', 'About'], ['/login', 'Log In']]
        .map(([to, t]) => `<button data-go="${to}"${st.path === to ? ' class="cur"' : ''}>${t}</button>`).join('')
      tree.innerHTML = `<div class="sm-box sm-app" data-comp="App"><div class="sm-head"><span class="sm-name">App</span><span class="sm-tags stack">${appTags}</span></div>` +
        `<div class="sm-row"><div class="sm-box sm-navbar sm-nav" data-comp="NavBar"><span class="sm-name">NavBar</span>${links}</div>` +
        `<div class="sm-box sm-heading" data-comp="Heading"><span class="sm-name">Heading</span></div></div>` +
        `<div class="sm-outlet"><div class="sm-outlet-label">${outletLabel()}</div>${page()}</div></div>`
      shelf.innerHTML = PAGES.map(([p, name]) => `<div data-page="${name}"${PAGE[st.path] === name ? ' class="in-outlet"' : ''}>${name} <span>${PAGE[st.path] === name ? '→ in the Outlet' : p}</span></div>`).join('')
      root.dataset.path = st.path
      fit()
      if (entering) {
        tree.querySelector('.sm-page').classList.add('entering')
        svg.classList.add('off')
        setTimeout(() => { draw(); svg.classList.remove('off') }, 380)
      } else draw()
    }

    // ---------- wires ----------
    const q = (sel) => tree.querySelector(sel)
    function chain(k) {
      const user = USER[k]
      const out = [q(`.sm-tag[data-key="${k}"][data-where="App"]`), q(`.sm-outlet-label [data-prop="${k}"]`), q(`.sm-tag[data-key="${k}"][data-where="${user}"]`)]
      if (k === 'pokemonName') out.push(q('[data-comp="PokeForm"] [data-prop="pokemonName"]'))
      if (k === 'pokemonList') out.push(q('[data-comp="PokeContainer"] > .sm-head [data-prop="pokemonList"]'), ...tree.querySelectorAll('.sm-card [data-prop="pokemon"]'))
      return out.filter(Boolean)
    }
    function rect(el) {
      const m = main.getBoundingClientRect(), r = el.getBoundingClientRect(), s = m.width / main.offsetWidth || 1
      return { x: (r.left - m.left) / s, y: (r.top - m.top) / s, w: r.width / s, h: r.height / s }
    }
    // Every wire runs down its own lane at the right edge (a bus). It leaves a tag from the
    // tag's right side and comes in from the right too; a card is entered from above.
    function pathD(a, b, lane) {
      const ra = rect(a), rb = rect(b), r = 8
      const gx = main.offsetWidth - 54 + lane * 12
      const x1 = ra.x + ra.w, y1 = ra.y + ra.h / 2
      const tx = rb.x + rb.w / 2, ty = rb.y - 13 - lane * 3
      if (!b.closest('.sm-card') || ty - y1 < 2 * r) {
        const y2 = rb.y + rb.h / 2
        return `M${x1} ${y1} H${gx - r} Q${gx} ${y1} ${gx} ${y1 + r} V${y2 - r} Q${gx} ${y2} ${gx - r} ${y2} H${rb.x + rb.w + 2}`
      }
      return `M${x1} ${y1} H${gx - r} Q${gx} ${y1} ${gx} ${y1 + r} V${ty - r} Q${gx} ${ty} ${gx - r} ${ty} H${tx + r} Q${tx} ${ty} ${tx} ${ty + r} V${rb.y - 2}`
    }
    // with lots of state moved up and many cards the tree can be taller than the slide: shrink it
    function fit() {
      tree.style.transform = ''
      tree.style.width = ''
      const k = Math.min(1, main.clientHeight / tree.scrollHeight)
      if (k < 1) { tree.style.transform = `scale(${k})`; tree.style.width = `${100 / k}%`; tree.style.setProperty('--gut', `${64 / k}px`) } else tree.style.removeProperty('--gut')
    }
    function draw() {
      if (!root.closest('.slide')?.classList.contains('active') && root.closest('.slide')) return
      fit()
      svg.innerHTML = '<defs>' + KEYS.map((k) => `<marker id="sm-arr-${k}" class="k-${k}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10z" style="fill:var(--k);stroke:none;opacity:1"/></marker>`).join('') + '</defs>'
      edges = {}
      for (const k of KEYS) {
        const els = chain(k)
        const list = (edges[k] = [])
        // the last tag/pill fans out to every card
        const cardPills = k === 'pokemonList' ? [...tree.querySelectorAll('.sm-card [data-prop="pokemon"]')] : []
        const line = els.filter((e) => !cardPills.includes(e))
        const pairs = line.slice(1).map((to, i) => [line[i], to])
        if (cardPills.length && line.length) cardPills.forEach((p) => pairs.push([line[line.length - 1], p]))
        for (const [from, to] of pairs) {
          const p = document.createElementNS('http://www.w3.org/2000/svg', 'path')
          p.setAttribute('d', pathD(from, to, LANE[k]))
          p.setAttribute('class', `k-${k}`)
          p.setAttribute('marker-end', `url(#sm-arr-${k})`)
          svg.appendChild(p)
          list.push({ from, to, path: p })
        }
      }
    }

    // ---------- pulses ----------
    function travel(edge, back, k) {
      return new Promise((resolve) => {
        let len = 0
        try { len = edge.path.getTotalLength() } catch {}
        if (!len || !edge.path.isConnected) return resolve()
        const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle')
        dot.setAttribute('r', 9)
        dot.setAttribute('class', `sm-pulse k-${k}`)
        svg.appendChild(dot)
        const t0 = performance.now()
        const step = (now) => {
          const f = Math.min(1, (now - t0) / PULSE_MS)
          let pt
          try { pt = edge.path.getPointAtLength((back ? 1 - f : f) * len) } catch { pt = null }
          if (pt) { dot.setAttribute('cx', pt.x); dot.setAttribute('cy', pt.y) }
          if (f < 1 && pt) requestAnimationFrame(step)
          else { dot.remove(); resolve() }
        }
        requestAnimationFrame(step)
      })
    }
    async function down(k) {
      const list = edges[k] || []
      let frontier = [chain(k)[0]]
      while (frontier.length) {
        const es = list.filter((e) => frontier.includes(e.from))
        if (!es.length) break
        await Promise.all(es.map((e) => travel(e, false, k)))
        frontier = es.map((e) => e.to)
      }
    }
    async function up(k, from, color = k) {
      let cur = from
      for (;;) {
        const e = (edges[k] || []).find((x) => x.to === cur)
        if (!e) break
        await travel(e, true, color)
        cur = e.from
      }
    }
    function bump(k) {
      tree.querySelectorAll(`.sm-tag[data-key="${k}"]`).forEach((t) => {
        t.querySelector('.sm-val').textContent = show(k, st.v[k])
        t.classList.remove('bump'); void t.offsetWidth; t.classList.add('bump')
      })
    }
    const userTag = (k) => q(`.sm-tag[data-key="${k}"][data-where="${USER[k]}"]`)
    const throttled = {}
    function upOnce(k, from) { // typing: one pulse at a time
      if (throttled[k]) return
      throttled[k] = up(k, from).then(() => { throttled[k] = null })
    }

    // ---------- log ----------
    function log(text, cls = '') {
      const li = document.createElement('li')
      li.className = cls + (text.startsWith('  ') ? ' sub' : '')
      li.textContent = text.trim()
      logEl.appendChild(li)
      while (logEl.children.length > 16) logEl.firstChild.remove()
    }
    function treeNames(path) {
      if (path === '/') return `HomePage › Counter, PokeSearch, PokeForm, PokeContainer${st.v.pokemonList.length ? `, PokeCard ×${st.v.pokemonList.length}` : ''}`
      return PAGE[path]
    }

    // ---------- the app's behaviour ----------
    function mounted(first) {
      if (first) log('▲ mount App › NavBar, Heading, Outlet', 'mount')
      log(`▲ mount ${treeNames(st.path)}`, 'mount')
      if (st.path !== '/') return
      const id = ++st.mountId
      log('  PokeSearch effect: fetch pikachu', 'fx')
      setTimeout(() => { if (id === st.mountId && st.path === '/') addPokemon('pikachu') }, FETCH_MS) // if (!ignore)
    }
    function addPokemon(name) {
      if (!st.v.pokemonList.includes(name)) st.v.pokemonList = [...st.v.pokemonList, name]
      build(false)
      bump('pokemonList')
      return down('pokemonList')
    }
    async function navigate(to) {
      if (st.busy || to === st.path) return
      st.busy = true
      root.dataset.busy = '1'
      const leaving = tree.querySelector('.sm-page')
      log(`▼ unmount ${treeNames(st.path)}`, 'unmount')
      st.mountId++ // the cleanup: a pending pikachu answer is ignored
      for (const k of KEYS) {
        if (PAGE_OF[USER[k]] !== st.path || st.owner[k] === 'App') continue
        const was = show(k, st.v[k])
        st.v[k] = structuredClone(INIT[k])
        if (was !== show(k, st.v[k])) log(`  ${k}: ${was} → ${show(k, st.v[k])} (thrown away)`, `k k-${k}`)
        const t = userTag(k)
        if (t) t.classList.add('dying')
      }
      const shinies = Object.values(st.shiny).filter(Boolean).length
      if (shinies) log(`  shiny: true → false (×${shinies} card${shinies > 1 ? 's' : ''})`, 'k k-shiny')
      st.shiny = {}
      svg.classList.add('off')
      leaving.classList.add('leaving')
      await wait(700)
      st.path = to
      build(true)
      mounted(false)
      st.busy = false
      delete root.dataset.busy
    }
    function move(k, where) {
      if (st.busy) return
      if (where === 'App') {
        st.owner[k] = 'local'
        if (PAGE_OF[USER[k]] !== st.path) {
          log(`  ${k} moved back into ${USER[k]}, which is not mounted: ${show(k, st.v[k])} → ${show(k, INIT[k])}`, `k k-${k}`)
          st.v[k] = structuredClone(INIT[k])
        } else log(`  ${k} now lives in ${USER[k]} (useState)`, `k k-${k}`)
      } else {
        st.owner[k] = 'App'
        log(`  ${k} now lives in App, sent through <Outlet context>`, `k k-${k}`)
      }
      build(false)
      down(k)
    }

    // ---------- events ----------
    root.addEventListener('click', async (e) => {
      const b = e.target.closest('button')
      if (!b || !root.contains(b)) return
      if (b.classList.contains('sm-reset')) return reset()
      if (st.busy) return
      if (b.dataset.go) return navigate(b.dataset.go)
      if (b.classList.contains('sm-move')) { const t = b.closest('.sm-tag'); return move(t.dataset.key, t.dataset.where) }
      if (b.classList.contains('sm-count-btn')) {
        // the value changes now; the dots show the setter going up and the value coming down
        st.v.count++
        bump('count')
        if (!throttled.count) throttled.count = up('count', userTag('count')).then(() => down('count')).then(() => { throttled.count = null })
        return
      }
      if (b.classList.contains('sm-shiny')) {
        const c = b.closest('.sm-card'), name = c.dataset.name
        st.shiny[name] = !st.shiny[name]
        c.classList.toggle('shiny', st.shiny[name])
        c.querySelector('[data-key="shiny"] .sm-val').textContent = String(st.shiny[name])
        return
      }
      if (b.classList.contains('sm-rm')) {
        const c = b.closest('.sm-card'), name = c.dataset.name
        const s0 = st
        await up('pokemonList', c.querySelector('[data-prop="pokemon"]'))
        if (st !== s0 || st.busy) return
        st.v.pokemonList = st.v.pokemonList.filter((n) => n !== name)
        delete st.shiny[name]
        build(false)
        bump('pokemonList')
        return down('pokemonList')
      }
      if (b.classList.contains('sm-search')) return search()
    })
    root.addEventListener('keydown', (e) => { if (e.key === 'Enter' && e.target.classList.contains('sm-name-input')) { e.preventDefault(); search() } })
    root.addEventListener('input', (e) => {
      const k = e.target.classList.contains('sm-name-input') ? 'pokemonName' : e.target.classList.contains('sm-user-input') ? 'username' : null
      if (!k) return
      st.v[k] = e.target.value
      bump(k)
      upOnce(k, k === 'pokemonName' ? q('[data-comp="PokeForm"] [data-prop="pokemonName"]') : userTag(k))
    })
    async function search() {
      const name = st.v.pokemonName.trim().toLowerCase()
      if (!name) return
      // handleSubmit is PokeSearch's: the call travels up from PokeForm
      const s0 = st, id = st.mountId
      await up('pokemonName', q('[data-comp="PokeForm"] [data-prop="pokemonName"]'), 'pokemonList')
      if (st !== s0 || id !== st.mountId) return
      st.v.pokemonName = ''
      const input = q('.sm-name-input')
      if (input) input.value = ''
      bump('pokemonName')
      log(`  PokeSearch: fetch ${name}`, 'fx')
      await up('pokemonList', userTag('pokemonList'))
      await wait(250)
      if (st === s0 && id === st.mountId && st.path === '/') addPokemon(name)
    }
    function reset() {
      st.mountId++
      st = fresh()
      logEl.innerHTML = ''
      build(false)
      mounted(true)
    }

    let started = false
    const slide = root.closest('.slide')
    function wake() {
      if (slide && !slide.classList.contains('active')) return
      if (!started) { started = true; reset() } else draw()
    }
    if (slide) new MutationObserver(wake).observe(slide, { attributes: true, attributeFilter: ['class'] })
    addEventListener('resize', () => started && draw())
    wake()
  }

  function init() { document.querySelectorAll('.sm').forEach(create) }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init)
  else init()
})()
