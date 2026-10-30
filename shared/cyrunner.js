// CyRunner: runs Cypress-style specs against a livepad's live preview, in the browser.
// It covers the commands this course uses and words its errors like Cypress, so a
// test that passes (or fails) here does the same in real Cypress (checked in tests/).
//   CyRunner.run({ pad, spec, fixtures }) → Promise<{ tests: [{ title, state, error, ms }], passed, failed }>
;(() => {
  const TIMEOUT = 4000
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
  const q = (s) => "'" + String(s) + "'"
  class AssertionError extends Error { constructor(m) { super(m); this.name = 'AssertionError' } }

  // ---------- a tiny chai-style expect (for cy.on callbacks and .then) ----------
  function expect(actual) {
    const fail = (m) => { throw new AssertionError(m) }
    const show = (v) => (typeof v === 'string' ? q(v) : JSON.stringify(v))
    const api = {
      equal: (x) => { if (actual !== x) fail(`expected ${show(actual)} to equal ${show(x)}`) },
      include: (x) => { if (!String(actual).includes(x)) fail(`expected ${show(actual)} to include ${show(x)}`) },
      length: (n) => { if (!actual || actual.length !== n) fail(`expected ${show(actual)} to have a length of ${n}`) },
    }
    api.eq = api.equal
    api.contain = api.include
    const chain = { to: { equal: api.equal, eq: api.eq, include: api.include, contain: api.contain, have: { length: api.length }, be: {} } }
    Object.defineProperty(chain.to.be, 'true', { get: () => { if (actual !== true) fail(`expected ${show(actual)} to be true`) } })
    return chain
  }

  // ---------- element helpers ----------
  const visible = (el) => {
    if (!el || !el.isConnected) return false
    const win = el.ownerDocument.defaultView
    for (let e = el; e && e.nodeType === 1; e = e.parentElement) {
      const cs = win.getComputedStyle(e)
      if (cs.display === 'none' || cs.visibility === 'hidden' || cs.opacity === '0') return false
    }
    const r = el.getBoundingClientRect()
    return r.width > 0 && r.height > 0
  }
  const describeEls = (els) => (els.length ? '[ ' + els.slice(0, 3).map((e) => '<' + e.tagName.toLowerCase() + (e.id ? '#' + e.id : '') + '>').join(', ') + (els.length > 3 ? `, ${els.length - 3} more…` : '') + ' ]' : '[]')
  const textOf = (el) => (el.textContent || '').replace(/\s+/g, ' ')
  const setNative = (el, value) => {
    const proto = el.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype
    const desc = Object.getOwnPropertyDescriptor(el.ownerDocument.defaultView[el.tagName === 'TEXTAREA' ? 'HTMLTextAreaElement' : 'HTMLInputElement'].prototype, 'value') || Object.getOwnPropertyDescriptor(proto, 'value')
    desc.set.call(el, value)
    el.dispatchEvent(new el.ownerDocument.defaultView.Event('input', { bubbles: true }))
  }

  // ---------- assertions on a subject ----------
  // Subjects: { els: Element[] } or { value: any }. Returns nothing or throws.
  function check(subject, args, ctx) {
    let [chainer, ...rest] = args
    const not = chainer.startsWith('not.')
    const name = not ? chainer.slice(4) : chainer
    const els = subject.els
    const ok = (cond, msgPos, msgNeg) => { if (cond === not) throw new AssertionError(not ? msgNeg : msgPos) }
    if (name === 'have.length') {
      const n = rest[0]
      if (els.length !== n && !not) throw new AssertionError(els.length < n ? `Not enough elements found. Found '${els.length}', expected '${n}'.` : `Too many elements found. Found '${els.length}', expected '${n}'.`)
      if (els.length === n && not) throw new AssertionError(`expected ${describeEls(els)} not to have a length of ${n}`)
      return subject
    }
    if (name === 'exist') { ok(els.length > 0, `Expected to find element: \`${ctx.selector}\`, but never found it.`, `Expected <${ctx.selector}> not to exist in the DOM, but it was continuously found.`); return subject }
    if (name === 'be.visible') {
      if (!els.length) throw new AssertionError(`Expected to find element: \`${ctx.selector}\`, but never found it.`)
      ok(els.every(visible), `expected ${describeEls(els)} to be visible`, `expected ${describeEls(els)} not to be visible`); return subject
    }
    if (name === 'have.value') { ok(els[0] && els[0].value === rest[0], `expected ${describeEls(els)} to have value ${q(rest[0])}, but the value was ${q(els[0] && els[0].value)}`, `expected ${describeEls(els)} not to have value ${q(rest[0])}`); return subject }
    if (name === 'have.text') { ok(els[0] && els[0].textContent === rest[0], `expected ${describeEls(els)} to have text ${q(rest[0])}, but the text was ${q(els[0] && els[0].textContent)}`, `expected ${describeEls(els)} not to have text ${q(rest[0])}`); return subject }
    if (name === 'have.class') { ok(els[0] && els[0].classList.contains(rest[0]), `expected ${describeEls(els)} to have class ${q(rest[0])}`, `expected ${describeEls(els)} not to have class ${q(rest[0])}`); return subject }
    if (name === 'have.attr') {
      if (!els.length) throw new AssertionError(`Expected to find element: \`${ctx.selector}\`, but never found it.`)
      const v = els[0].getAttribute(rest[0])
      if (rest.length > 1) { ok(v === rest[1], `expected ${describeEls(els)} to have attribute ${q(rest[0])} with the value ${q(rest[1])}, but the value was ${q(v)}`, `expected ${describeEls(els)} not to have attribute ${q(rest[0])} with the value ${q(rest[1])}`); return subject }
      ok(v !== null, `expected ${describeEls(els)} to have attribute ${q(rest[0])}`, `expected ${describeEls(els)} not to have attribute ${q(rest[0])}`)
      return not ? subject : { value: v }
    }
    if (name === 'contain' || name === 'include') {
      if (els) { ok(els.some((e) => textOf(e).includes(rest[0])), `expected ${describeEls(els)} to contain ${q(rest[0])}`, `expected ${describeEls(els)} not to contain ${q(rest[0])}`); return subject }
      ok(String(subject.value).includes(rest[0]), `expected ${q(subject.value)} to include ${q(rest[0])}`, `expected ${q(subject.value)} not to include ${q(rest[0])}`); return subject
    }
    if (name === 'eq' || name === 'equal') {
      const v = els ? els : subject.value
      ok(v === rest[0], `expected ${q(v)} to equal ${q(rest[0])}`, `expected ${q(v)} not to equal ${q(rest[0])}`); return subject
    }
    throw new Error(`CyRunner: the assertion '${chainer}' is not supported here`)
  }

  // ---------- the runner ----------
  function makeRunner(pad, fixtures, log) {
    const queue = []
    let current = null // the test being run: { alertHandlers }
    const routes = []
    const intercepted = {}

    const win = () => pad.iframe.contentWindow
    const doc = () => pad.iframe.contentDocument

    async function visit() {
      pad.routes = routes.map((r) => ({ method: r.method, url: r.url, status: r.status, body: r.body, alias: r.alias }))
      await new Promise((resolve) => {
        const done = () => { pad.iframe.removeEventListener('load', done); resolve() }
        pad.iframe.addEventListener('load', done)
        pad.refresh()
      })
      const w = win()
      w.alert = (m) => { current.alerts.push(String(m)); for (const fn of current.alertHandlers) fn(String(m)) }
      const root = doc().getElementById('root')
      for (let t = 0; root && !root.childElementCount && t < 8000; t += 50) await sleep(50)
    }

    // A chain = the ops from one cy.* call and the methods chained on it.
    function chain(first) {
      const ops = [first]
      const api = {}
      const add = (op) => { ops.push(op); return proxy }
      api.should = (...args) => add({ kind: 'assert', args })
      api.and = (...args) => add({ kind: 'assert', args })
      api.children = (sel) => add({ kind: 'query', name: 'children', run: (s) => ({ els: s.els.flatMap((e) => [...e.children].filter((c) => !sel || c.matches(sel))) }) })
      api.first = () => add({ kind: 'query', name: 'first', run: (s) => ({ els: s.els.slice(0, 1) }) })
      api.last = () => add({ kind: 'query', name: 'last', run: (s) => ({ els: s.els.slice(-1) }) })
      api.eq = (i) => add({ kind: 'query', name: 'eq', run: (s) => ({ els: s.els.slice(i, i + 1) }) })
      api.find = (sel) => add({ kind: 'query', name: 'find', sel, run: (s) => ({ els: s.els.flatMap((e) => [...e.querySelectorAll(sel)]) }) })
      api.contains = (a, b) => add(containsOp(a, b, true))
      api.type = (text) => add({ kind: 'action', name: 'type', run: async (s) => { await typeInto(s.els[0], text); return s } })
      api.clear = () => add({ kind: 'action', name: 'clear', run: async (s) => { setNative(s.els[0], ''); return s } })
      api.click = () => add({ kind: 'action', name: 'click', run: async (s) => { s.els[0].click(); await sleep(0); return s } })
      api.as = (alias) => { const r = routes[routes.length - 1]; if (first.name === 'intercept' && r) r.alias = alias; return proxy }
      // Anything else is not a Cypress command: fail like Cypress does.
      const proxy = new Proxy(api, { get: (t, k) => (k in t ? t[k] : typeof k === 'string' && k !== 'then' ? undefined : undefined) })
      queue.push(ops)
      return proxy
    }

    function containsOp(a, b, scoped) {
      const sel = b === undefined ? null : a
      const text = b === undefined ? a : b
      return { kind: 'query', name: 'contains', text, scoped, selector: sel ? `${sel}` : null, run: (s) => {
        const roots = scoped && s && s.els ? s.els : [doc().body]
        const cands = roots.flatMap((r) => [r, ...r.querySelectorAll(sel || '*')]).filter((e) => (!sel || e.matches(sel)) && textOf(e).includes(text))
        // deepest match, like Cypress (unless a selector is given)
        const best = sel ? cands : cands.filter((e) => ![...e.children].some((c) => textOf(c).includes(text)))
        return { els: best.slice(0, 1), contains: text }
      } }
    }

    async function typeInto(el, text) {
      el.focus()
      const parts = text.split(/(\{[a-z]+\})/i).filter(Boolean)
      for (const p of parts) {
        if (/^\{enter\}$/i.test(p)) {
          const form = el.form
          el.dispatchEvent(new (win().KeyboardEvent)('keydown', { key: 'Enter', bubbles: true }))
          if (form) form.requestSubmit()
        } else if (/^\{selectall\}$/i.test(p)) el.select()
        else for (const ch of p) setNative(el, el.value + ch)
        await sleep(0)
      }
    }

    const cy = {
      visit: () => chain({ kind: 'action', name: 'visit', start: true, run: async () => { await visit(); return { els: [] } } }),
      get: (sel) => {
        if (typeof sel === 'string' && sel.startsWith('@')) {
          const [alias, all] = sel.slice(1).split('.')
          return chain({ kind: 'query', name: 'get', selector: sel, start: true, run: () => ({ els: all === 'all' ? [...(intercepted[alias] || [])] : (intercepted[alias] || []).slice(-1) }) })
        }
        return chain({ kind: 'query', name: 'get', selector: sel, start: true, run: () => ({ els: [...doc().querySelectorAll(sel)] }) })
      },
      contains: (a, b) => chain({ ...containsOp(a, b, false), start: true }),
      url: () => chain({ kind: 'query', name: 'url', start: true, run: () => ({ value: pad.url || (pad.baseUrl || 'http://localhost:5173/') }) }),
      on: (event, fn) => chain({ kind: 'action', name: 'on', start: true, run: async () => { if (event === 'window:alert') current.alertHandlers.push(fn); return { els: [] } } }),
      intercept: (method, url, response) => {
        const body = response && response.fixture ? JSON.parse(fixtures[response.fixture.replace(/^(?!.*\.json$)(.*)$/, '$1.json')] || 'null') : response && response.body
        routes.push({ method, url, status: (response && response.statusCode) || 200, body, alias: null })
        return chain({ kind: 'action', name: 'intercept', start: true, run: async () => ({ els: [] }) })
      },
      wait: (alias) => chain({ kind: 'query', name: 'wait', selector: alias, start: true, run: () => ({ els: (intercepted[alias.slice(1)] || []) }) }),
    }
    const Cypress = { config: (k) => ({ baseUrl: 'http://localhost:5173/' })[k] }

    // Network calls the preview stubbed (posted by the preview agent).
    addEventListener('message', (e) => {
      if (!e.data || e.data.type !== 'cy-intercepted' || e.source !== win()) return
      ;(intercepted[e.data.alias] = intercepted[e.data.alias] || []).push({ url: e.data.url, tagName: 'REQUEST' })
    })

    async function runChain(ops) {
      let subject = { els: [] }
      let i = 0
      while (i < ops.length) {
        const op = ops[i]
        if (op.kind === 'action' && op.name !== 'type' && op.name !== 'clear' && op.name !== 'click') { subject = await op.run(subject); i++; continue }
        // A segment = queries + assertions up to the next action; retried as one.
        let j = i
        while (j < ops.length && ops[j].kind !== 'action') j++
        const seg = ops.slice(i, j)
        const action = ops[j]
        const asserts = seg.filter((o) => o.kind === 'assert')
        const queries = seg.filter((o) => o.kind === 'query')
        const lastQ = queries[queries.length - 1]
        const ctx = { selector: (queries.find((o) => o.selector) || {}).selector || (lastQ && lastQ.sel) || '' }
        const start = subject
        const end = Date.now() + TIMEOUT
        let lastErr
        for (;;) {
          try {
            let s = queries.length && seg[0].kind === 'query' && seg[0].start ? null : start
            for (const o of seg) {
              if (o.kind === 'query') s = o.run(s)
              else s = check(s, o.args, ctx)
            }
            const needsEl = queries.length && (!asserts.length || action)
            if (needsEl && s.els && !s.els.length && lastQ.name === 'wait') throw new AssertionError(`cy.wait() timed out waiting ${TIMEOUT}ms for the 1st request to the route: \`${lastQ.selector.slice(1)}\`. No request ever occurred.`)
            if (needsEl && s.els && !s.els.length) {
              if (lastQ.name === 'contains') throw new AssertionError(`Expected to find content: ${q(lastQ.text)}${lastQ.selector ? ` within the selector: \`${lastQ.selector}\`` : ''} but never did.`)
              throw new AssertionError(`Expected to find element: \`${ctx.selector}\`, but never found it.`)
            }
            if (action && s.els && s.els.length > 1 && action.name !== 'type') throw new AssertionError(`cy.${action.name}() can only be called on a single element. Your subject contained ${s.els.length} elements.`)
            subject = s
            break
          } catch (e) {
            lastErr = e
            if (!(e instanceof AssertionError) || Date.now() > end) throw new AssertionError(`Timed out retrying after ${TIMEOUT}ms: ${e.message}`)
            await sleep(50)
          }
        }
        i = j
        if (action) { subject = await action.run(subject); i++ }
      }
    }

    async function runTest(t, hooks) {
      queue.length = 0
      routes.length = 0
      for (const k of Object.keys(intercepted)) delete intercepted[k]
      current = { alerts: [], alertHandlers: [], errors: [] }
      const t0 = Date.now()
      try {
        for (const h of hooks) {
          h()
          for (const ops of queue.splice(0)) await runChain(ops)
        }
        t.fn()
        for (const ops of queue.splice(0)) await runChain(ops)
        if (current.errors.length) throw current.errors[0]
        return { title: t.title, state: 'passed', ms: Date.now() - t0 }
      } catch (e) {
        return { title: t.title, state: 'failed', error: (e && e.message) || String(e), ms: Date.now() - t0 }
      }
    }

    return { cy, Cypress, runTest, setAlertError: (e) => current && current.errors.push(e) }
  }

  // Collect describe/it/beforeEach from the spec text.
  function collect(spec, env) {
    const tests = []
    const stack = [{ title: '', hooks: [] }]
    const describe = (title, fn) => { stack.push({ title, hooks: [] }); fn(); stack.pop() }
    const it = (title, fn) => {
      const titles = stack.map((s) => s.title).filter(Boolean).concat(title)
      tests.push({ title: titles.join(' '), fn, hooks: stack.flatMap((s) => s.hooks) })
    }
    const beforeEach = (fn) => { stack[stack.length - 1].hooks.push(fn) }
    describe.only = describe; it.only = it; it.skip = () => {}
    // eslint-disable-next-line no-new-func
    new Function('describe', 'context', 'it', 'specify', 'beforeEach', 'cy', 'Cypress', 'expect', spec)(describe, describe, it, it, beforeEach, env.cy, env.Cypress, expect)
    return tests
  }

  function panel(pad) {
    let el = pad.el.querySelector('.lp-tests')
    if (!el) { el = document.createElement('div'); el.className = 'lp-tests'; pad.el.append(el) }
    return el
  }
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;')

  async function run({ pad, spec, fixtures = {}, title = 'Tests' }) {
    const out = panel(pad)
    out.hidden = false
    out.innerHTML = `<div class="lp-tests-head">${esc(title)}: running…</div>`
    const runner = makeRunner(pad, fixtures)
    // A failing expect inside cy.on('window:alert') fails the test.
    const env = { cy: new Proxy(runner.cy, { get: (t, k) => t[k] }), Cypress: runner.Cypress }
    const wrap = (fn) => (...a) => { try { return fn(...a) } catch (e) { runner.setAlertError(e) } }
    const origOn = env.cy.on
    runner.cy.on = (ev, fn) => origOn(ev, wrap(fn))
    let tests
    try { tests = collect(spec, env) } catch (e) {
      out.innerHTML = `<div class="lp-tests-head bad">Error in the spec file</div><div class="lp-test fail">${esc(e.message)}</div>`
      return { tests: [], passed: 0, failed: 1, error: e.message }
    }
    const results = []
    for (const t of tests) {
      // Chained calls on a missing command throw while the test function runs: report like Cypress.
      const r = await runner.runTest({ title: t.title, fn: () => {
        try { t.fn() } catch (e) {
          if (e instanceof TypeError) {
            const m = e.message.match(/(\w+) is not a function/) || e.message.match(/\.(\w+) is not a function/)
            throw new TypeError(m ? e.message.replace(/^.*?(\w+)\.(\w+) is not a function.*$/, 'cy.$1(...).$2 is not a function') : e.message)
          }
          throw e
        }
      } }, t.hooks)
      results.push(r)
      const line = r.state === 'passed' ? `<div class="lp-test pass">✓ ${esc(r.title)} <span>(${r.ms}ms)</span></div>` : `<div class="lp-test fail">✗ ${esc(r.title)}<pre>${esc(r.error)}</pre></div>`
      out.insertAdjacentHTML('beforeend', line)
    }
    const passed = results.filter((r) => r.state === 'passed').length
    const failed = results.length - passed
    out.querySelector('.lp-tests-head').outerHTML = `<div class="lp-tests-head ${failed ? 'bad' : 'good'}">${esc(title)} · Passing: ${passed} · Failing: ${failed}</div>`
    return { tests: results, passed, failed }
  }

  window.CyRunner = { run, expect }
})()
