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
  const one = (e) => '<' + e.tagName.toLowerCase() + (e.id ? '#' + e.id : '') + '>'
  const describeEls = (els) => (els.length === 1 ? one(els[0]) : els.length ? '[ ' + els.slice(0, 3).map((e) => '<' + e.tagName.toLowerCase() + (e.id ? '#' + e.id : '') + '>').join(', ') + (els.length > 3 ? `, ${els.length - 3} more…` : '') + ' ]' : '[]')
  // Text as Cypress reads it: <script> and <style> contents are not page text.
  const HIDDEN = /^(SCRIPT|STYLE|TEMPLATE|NOSCRIPT)$/
  const textOf = (el) => {
    if (HIDDEN.test(el.tagName)) return ''
    let out = ''
    for (const n of el.childNodes) out += n.nodeType === 3 ? n.nodeValue : n.nodeType === 1 ? textOf(n) : ''
    return out.replace(/\s+/g, ' ')
  }
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
    if (name === 'have.css') {
      if (!els.length) throw new AssertionError(`Expected to find element: \`${ctx.selector}\`, but never found it.`)
      const v = els[0].ownerDocument.defaultView.getComputedStyle(els[0]).getPropertyValue(rest[0])
      ok(v === rest[1], `expected ${describeEls(els)} to have CSS property ${q(rest[0])} with the value ${q(rest[1])}, but the value was ${q(v)}`, `expected ${describeEls(els)} not to have CSS property ${q(rest[0])} with the value ${q(rest[1])}`)
      return subject
    }
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
      if (Array.isArray(subject.value)) {
        const shown = subject.value.length ? '[ ' + subject.value.map((x) => (typeof x === 'string' ? q(x) : JSON.stringify(x))).join(', ') + ' ]' : '[]'
        ok(subject.value.includes(rest[0]), `expected ${shown} to include ${q(rest[0])}`, `expected ${shown} not to include ${q(rest[0])}`); return subject
      }
      ok(String(subject.value).includes(rest[0]), `expected ${q(subject.value)} to include ${q(rest[0])}`, `expected ${q(subject.value)} not to include ${q(rest[0])}`); return subject
    }
    if (name === 'eq' || name === 'equal') {
      const v = els ? els : subject.value
      ok(v === rest[0], `expected ${q(v)} to equal ${q(rest[0])}`, `expected ${q(v)} not to equal ${q(rest[0])}`); return subject
    }
    throw new Error(`The chainer \`${name.split('.').pop()}\` was not found. Could not build assertion.`)
  }

  // ---------- the runner ----------
  function makeRunner(pad, fixtures, cfg) {
    const queue = []
    let current = null // the test being run: { alertHandlers }
    const routes = []
    const intercepted = {}
    const responded = {}, waited = {}

    const win = () => pad.iframe.contentWindow
    const doc = () => pad.iframe.contentDocument

    // The path a test is on: the router's location (apps with React Router) or the last visit.
    const here = () => {
      const r = win() && win().__ROUTER
      if (r) { const l = r.state.location; return { pathname: l.pathname, search: l.search, hash: l.hash } }
      const m = (pad.path || '/').match(/^([^?#]*)(\?[^#]*)?(#.*)?$/)
      return { pathname: m[1] || '/', search: m[2] || '', hash: m[3] || '' }
    }
    const ORIGIN = 'http://localhost:5173'
    const location = () => { const l = here(); return { ...l, origin: ORIGIN, host: 'localhost:5173', hostname: 'localhost', port: '5173', protocol: 'http:', href: ORIGIN + l.pathname + l.search + l.hash } }
    // A full page load (a plain <a href> click) replaces the window: hook alerts into the new one.
    const hookWindow = () => { const w = win(); if (w && current) w.alert = (m) => { current.alerts.push(String(m)); for (const fn of current.alertHandlers) fn(String(m)) } }
    pad.iframe.addEventListener('load', () => { if (current && current.visited) hookWindow() })

    async function visit(url) {
      let path = String(url || '/')
      if (path.startsWith(ORIGIN)) path = path.slice(ORIGIN.length) || '/'
      if (!path.startsWith('/')) path = '/' + path
      pad.setPath ? pad.setPath(path) : (pad.path = path)
      if (cfg.baseUrl && cfg.baseUrl.replace(/\/?$/, '/') !== 'http://localhost:5173/') {
        throw new Error(`cy.visit() failed trying to load:\n\n${cfg.baseUrl}\n\nWe attempted to make an http request to this URL but the request failed without a response.`)
      }
      pad.routes = routes.map((r) => ({ method: r.method, url: r.url, status: r.status, body: r.body, alias: r.alias }))
      await new Promise((resolve) => {
        const done = () => { pad.iframe.removeEventListener('load', done); resolve() }
        pad.iframe.addEventListener('load', done)
        pad.refresh()
      })
      current.visited = true
      hookWindow()
      const root = doc().getElementById('root')
      for (let t = 0; root && !root.childElementCount && !current.appErrors.length && t < 8000; t += 50) await sleep(50)
      // Like cy.visit waiting for the page to settle: errors the first effects throw land in this test.
      await sleep(100)
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
      api.its = (prop) => add({ kind: 'query', name: 'its', run: (s) => {
        const v = s.value == null ? undefined : s.value[prop]
        if (v === undefined) throw new AssertionError(`cy.its() errored because the property: \`${prop}\` does not exist on your subject.`)
        return { value: v }
      } })
      // .then(fn): run fn with the subject (a window, a value, or the elements).
      api.then = (fn) => add({ kind: 'action', name: 'then', run: async (s) => { const r = await fn(s.value !== undefined ? s.value : s.els); return r === undefined ? s : { value: r } } })
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
      visit: (url) => chain({ kind: 'action', name: 'visit', start: true, run: async () => { await visit(url); return { els: [] } } }),
      location: (key) => chain({ kind: 'query', name: 'location', start: true, run: () => { const l = location(); return { value: key ? l[key] : l } } }),
      window: () => chain({ kind: 'query', name: 'window', start: true, run: () => ({ value: win() }) }),
      // cy.go('back') / cy.go(-1): the router's history (or the page's own).
      go: (n) => chain({ kind: 'action', name: 'go', start: true, run: async () => {
        const d = n === 'back' ? -1 : n === 'forward' ? 1 : n
        const r = win().__ROUTER
        if (r) r.navigate(d); else win().history.go(d)
        await sleep(30)
        return { els: [] }
      } }),
      get: (sel) => {
        if (typeof sel === 'string' && sel.startsWith('@')) {
          const [alias, all] = sel.slice(1).split('.')
          return chain({ kind: 'query', name: 'get', selector: sel, start: true, run: () => ({ els: all === 'all' ? [...(intercepted[alias] || [])] : (intercepted[alias] || []).slice(-1) }) })
        }
        // Like jQuery (which Cypress uses), a plain '#id' finds only the first element with that id.
        if (/^#[\w-]+$/.test(sel)) return chain({ kind: 'query', name: 'get', selector: sel, start: true, run: () => { const e = doc().getElementById(sel.slice(1)); return { els: e ? [e] : [] } } })
        return chain({ kind: 'query', name: 'get', selector: sel, start: true, run: () => ({ els: [...doc().querySelectorAll(sel)] }) })
      },
      contains: (a, b) => chain({ ...containsOp(a, b, false), start: true }),
      wrap: (value) => chain({ kind: 'query', name: 'wrap', start: true, run: () => ({ value }) }),
      url: () => chain({ kind: 'query', name: 'url', start: true, run: () => ({ value: location().href }) }),
      // A failing expect inside the handler fails the test, like Cypress.
      on: (event, fn) => chain({ kind: 'action', name: 'on', start: true, run: async () => {
        if (event === 'window:alert') current.alertHandlers.push((m) => { try { fn(m) } catch (e) { current.errors.push(e) } })
        return { els: [] }
      } }),
      intercept: (method, url, response) => {
        let body = response && response.body
        if (response && response.fixture) {
          const name = /\.\w+$/.test(response.fixture) ? response.fixture : response.fixture + '.json'
          if (fixtures[name] == null) {
            current.errors.push(new Error(`An error was thrown while processing a network event: A fixture file could not be found at any of the following paths:\n\n > cypress/fixtures/${name}\n > cypress/fixtures/${name}{.json,.js,.coffee,.html,.txt,.csv,.png,.jpg,.jpeg,.gif,.tif,.tiff,.zip}`))
          } else body = JSON.parse(fixtures[name])
        }
        routes.push({ method, url, status: (response && response.statusCode) || 200, body, alias: null })
        return chain({ kind: 'action', name: 'intercept', start: true, run: async () => ({ els: [] }) })
      },
      // Each cy.wait('@a') waits for the next response on that route, like Cypress.
      wait: (alias) => {
        const name = alias.slice(1)
        let mine = null
        return chain({ kind: 'query', name: 'wait', selector: alias, start: true, run: () => {
          if (!routes.some((r) => r.alias === name)) throw new Error(`\`cy.wait()\` could not find a registered alias for: \`${alias}\`.\nAvailable aliases are: \`${routes.filter((r) => r.alias).map((r) => r.alias).join(', ') || '(none)'}\`.`)
          if (mine === null) mine = (waited[name] || 0) + 1
          if ((responded[name] || []).length < mine) return { els: [] }
          waited[name] = mine
          return { els: [responded[name][mine - 1]] }
        } })
      },
    }
    const Cypress = { config: (k) => ({ baseUrl: 'http://localhost:5173/' })[k] }

    // Network calls the preview stubbed (posted by the preview agent).
    addEventListener('message', (e) => {
      if (!e.data || e.data.type !== 'cy-intercepted' || e.source !== win()) return
      ;(intercepted[e.data.alias] = intercepted[e.data.alias] || []).push({ url: e.data.url, tagName: 'REQUEST' })
    })
    // Errors the app throws (or promises it rejects without a catch) fail the running test.
    addEventListener('message', (e) => {
      if (!e.data || e.data.type !== 'cy-app-error' || e.source !== win() || !current) return
      const err = appError(e.data)
      // A module that fails to load breaks the page before its load event: that belongs to cy.visit
      // (the hook, if visit is in beforeEach). Errors while React renders come later, in the test.
      err.duringVisit = !!e.data.load
      current.appErrors.push(err)
    })
    addEventListener('message', (e) => {
      if (!e.data || e.data.type !== 'cy-responded' || e.source !== win()) return
      ;(responded[e.data.alias] = responded[e.data.alias] || []).push({ url: e.data.url, tagName: 'RESPONSE' })
    })

    function appError(d) {
      const err = new Error(`The following error originated from your application code, not from Cypress.${d.rejection ? ' It was caused by an unhandled promise rejection.' : ''}\n\n  > ${d.message}\n\nWhen Cypress detects uncaught errors originating from your application it will automatically fail the current test.\n\nThis behavior is configurable, and you can choose to turn this off by listening to the \`uncaught:exception\` event.\n\nhttps://on.cypress.io/uncaught-exception-from-application`)
      err.fromApp = true
      return err
    }
    const checkApp = () => { if (current && current.appErrors.length) throw current.appErrors[0] }

    async function runChain(ops) {
      let subject = { els: [] }
      let i = 0
      while (i < ops.length) {
        const op = ops[i]
        if (op.kind === 'action' && op.name !== 'type' && op.name !== 'clear' && op.name !== 'click') { subject = await op.run(subject); i++; checkApp(); continue }
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
          checkApp()
          try {
            let s = queries.length && seg[0].kind === 'query' && seg[0].start ? null : start
            for (const o of seg) {
              if (o.kind === 'query') {
                // Every query before the last one must find something (Cypress's implicit check).
                if (o !== lastQ && s && s.els && !s.els.length && o !== seg[0]) throw new AssertionError(`Expected to find element: \`${ctx.selector}\`, but never found it.`)
                s = o.run(s)
                if (o !== lastQ && s.els && !s.els.length) throw new AssertionError(o.name === 'contains' ? `Expected to find content: ${q(o.text)} but never did.` : `Expected to find element: \`${o.selector || o.sel || ctx.selector}\`, but never found it.`)
              } else s = check(s, o.args, ctx)
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
            if (!(e instanceof AssertionError)) throw e
            if (Date.now() > end) throw new AssertionError(`Timed out retrying after ${TIMEOUT}ms: ${e.message}`)
            await sleep(50)
          }
        }
        i = j
        // Like Cypress's command queue, give the page a moment after an action: errors it throws then fail the test.
        if (action) { subject = await action.run(subject); i++; await sleep(20) }
        checkApp()
      }
    }

    async function runTest(t, hooks) {
      queue.length = 0
      routes.length = 0
      for (const m of [intercepted, responded, waited]) for (const k of Object.keys(m)) delete m[k]
      current = { alerts: [], alertHandlers: [], errors: [], appErrors: [] }
      // Like Cypress, every test starts on a blank page (cy.visit loads the app).
      await new Promise((resolve) => {
        const done = () => { pad.iframe.removeEventListener('load', done); resolve() }
        pad.iframe.addEventListener('load', done)
        pad.iframe.srcdoc = '<!doctype html><title>about:blank</title><body></body>'
      })
      const t0 = Date.now()
      try {
        try {
          for (const h of hooks) {
            h()
            if (current.errors.length) throw current.errors[0]
            for (const ops of queue.splice(0)) await runChain(ops)
          }
        } catch (e) {
          // An app error during a hook fails the test itself, and the next tests still run.
          if (e && e.fromApp && !e.duringVisit) return { title: t.title, state: 'failed', error: e.message, ms: Date.now() - t0 }
          // Like Cypress: the hook fails, under its own name, and the rest of the file is skipped.
          return { title: `"before each" hook for "${t.title}"`, state: 'failed', error: (e && e.message) || String(e), ms: Date.now() - t0, hookFailed: true }
        }
        t.fn()
        for (const ops of queue.splice(0)) await runChain(ops)
        if (current.errors.length) throw current.errors[0]
        checkApp()
        return { title: t.title, state: 'passed', ms: Date.now() - t0 }
      } catch (e) {
        return { title: t.title, state: 'failed', error: (e && e.message) || String(e), ms: Date.now() - t0 }
      }
    }

    // Commands called while the spec file is read (outside any test) fail like Cypress.
    let collecting = false
    const guarded = new Proxy(cy, { get: (t, k) => (typeof t[k] === 'function' ? (...a) => {
      if (collecting) throw new Error(`Cannot call \`cy.${String(k)}()\` outside a running test.\n\nThis usually happens when you accidentally write commands outside an \`it(...)\` test.`)
      return t[k](...a)
    } : t[k]) })
    return { cy: guarded, Cypress, runTest, setCollecting: (v) => { collecting = v }, setAlertError: (e) => current && current.errors.push(e) }
  }

  // Collect describe/it/beforeEach from the spec text.
  function collect(spec, env) {
    const tests = []
    const stack = [{ title: '', hooks: [] }]
    const describe = (title, fn) => { stack.push({ title, hooks: [] }); fn(); stack.pop() }
    const add = (flag) => (title, fn) => {
      const titles = stack.map((s) => s.title).filter(Boolean).concat(title)
      tests.push({ title: titles.join(' '), fn, hooks: stack.flatMap((s) => s.hooks), flag })
    }
    const it = add(null)
    it.only = add('only')
    it.skip = add('skip')
    const beforeEach = (fn) => { stack[stack.length - 1].hooks.push(fn) }
    describe.only = describe; describe.skip = () => {}
    // eslint-disable-next-line no-new-func
    new Function('describe', 'context', 'it', 'specify', 'beforeEach', 'cy', 'Cypress', 'expect', spec)(describe, describe, it, it, beforeEach, env.cy, env.Cypress, expect)
    return tests.some((t) => t.flag === 'only') ? tests.filter((t) => t.flag === 'only') : tests
  }

  function panel(pad) {
    let el = pad.el.querySelector('.lp-tests')
    if (!el) { el = document.createElement('div'); el.className = 'lp-tests'; pad.el.append(el) }
    return el
  }
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;')

  // The settings a spec run depends on, read from cypress.config.js.
  const readConfig = (text) => (text ? { baseUrl: (text.match(/baseUrl\s*:\s*['"]([^'"]+)['"]/) || [])[1], noSupport: /supportFile\s*:\s*false/.test(text) } : {})

  async function run({ pad, spec, fixtures = {}, title = 'Tests', append = false, config = null, hasSupport = false }) {
    const out = panel(pad)
    out.hidden = false
    const block = document.createElement('div')
    block.className = 'lp-tests-block'
    block.innerHTML = `<div class="lp-tests-head">${esc(title)}: running…</div>`
    if (append) out.append(block)
    else { out.textContent = ''; out.append(block) }
    const cfg = readConfig(config)
    if (config && !cfg.noSupport && !hasSupport) {
      const msg = 'Your `supportFile` is missing or invalid: `cypress/support/e2e.{js,jsx,ts,tsx}`\n\nThe supportFile must be a .js, .ts, .coffee file or be supported by your preprocessor plugin (if configured).\n\nFix your support file, or set supportFile to false if a support file is not necessary for your project.'
      block.innerHTML = `<div class="lp-tests-head bad">${esc(title)}: Cypress could not start</div><div class="lp-test fail"><pre>${esc(msg)}</pre></div>`
      return { tests: [], passed: 0, failed: 1, error: msg }
    }
    const runner = makeRunner(pad, fixtures, cfg)
    // A failing expect inside cy.on('window:alert') fails the test.
    const env = { cy: runner.cy, Cypress: runner.Cypress }
    let tests
    runner.setCollecting(true)
    try { tests = collect(spec, env) } catch (e) {
      runner.setCollecting(false)
      block.innerHTML = `<div class="lp-tests-head bad">${esc(title)}: error in the spec file</div><div class="lp-test fail">✗ An uncaught error was detected outside of a test<pre>${esc(e.message)}</pre></div>`
      return { tests: [{ title: 'An uncaught error was detected outside of a test', state: 'failed', error: e.message }], passed: 0, failed: 1, error: e.message }
    }
    runner.setCollecting(false)
    const results = []
    for (const t of tests) {
      if (t.flag === 'skip') {
        results.push({ title: t.title, state: 'pending' })
        block.insertAdjacentHTML('beforeend', `<div class="lp-test pend">- ${esc(t.title)} <span>(skipped)</span></div>`)
        continue
      }
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
      const stop = r.hookFailed
      const line = r.state === 'passed' ? `<div class="lp-test pass">✓ ${esc(r.title)} <span>(${r.ms}ms)</span></div>` : `<div class="lp-test fail">✗ ${esc(r.title)}<pre>${esc(r.error)}</pre></div>`
      block.insertAdjacentHTML('beforeend', line)
      if (stop) break
    }
    const passed = results.filter((r) => r.state === 'passed').length
    const failed = results.filter((r) => r.state === 'failed').length
    const pending = results.length - passed - failed
    block.querySelector('.lp-tests-head').outerHTML = `<div class="lp-tests-head ${failed ? 'bad' : 'good'}">${esc(title)} · Passing: ${passed} · Failing: ${failed}${pending ? ' · Pending: ' + pending : ''}</div>`
    return { tests: results, passed, failed, pending }
  }

  window.CyRunner = { run, expect }
})()
