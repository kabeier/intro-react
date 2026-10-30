// Course data model: a lesson = starting files + features → steps → line notes.
// Slides (livepad.js), the explorer and the Fix-it page all read lessons through
// this file, so they always show the same code.
//   Browser: <script src="../shared/course.js"></script> → window.Course
//   Node:    require('./shared/course.js')
;(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory()
  else root.Course = factory()
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict'

  class StepMismatch extends Error {
    constructor(step, many) {
      super(`Step ${step && step.id} can't apply: "${step && step.find}" is ${many ? 'in ' + (step && step.file) + ' more than once' : 'not in ' + (step && step.file)}`)
      this.name = 'StepMismatch'
      this.step = step
    }
  }

  const lessons = {}
  const register = (lesson) => { lessons[lesson.id] = lesson; return lesson }
  const get = (id) => lessons[id]
  const all = () => Object.values(lessons)
  // Binary files (images) of a lesson and the lessons it is built on.
  const assetsOf = (lesson) => ({ ...(lesson.base && get(lesson.base.lesson) ? assetsOf(get(lesson.base.lesson)) : {}), ...(lesson.assets || {}) })
  // Most useful files first: the components, their CSS, then the page and config.
  const rank = (f) => (f === 'src/App.jsx' ? 0 : /^src\/.*\.jsx?$/.test(f) ? 1 : /^src\/.*\.css$/.test(f) ? 2 : f.startsWith('src/') ? 3
    : f === 'index.html' ? 4 : /\.(js|css)$/.test(f) && !f.includes('/') ? 5 : f === 'package.json' ? 6 : 7)
  const tabOrder = (names) => [...names].sort((a, b) => rank(a) - rank(b))

  const split = (text) => (text === '' ? [] : text.split('\n'))
  const tagged = (text, stepId) => split(text).map((t) => ({ text: t, stepId }))
  const join = (lines) => lines.map((l) => l.text).join('\n')
  const count = (s, ch) => s.split(ch).length - 1

  // Apply one step to a file held as tagged lines; returns new tagged lines.
  function applyLines(lines, step) {
    const id = step.id || null
    const text = join(lines)
    if (step.mode === 'set') return tagged(step.code, id)
    if (step.mode === 'append' || !step.mode) {
      if (text === '') return tagged(step.code, id)
      return [...lines, { text: '', stepId: id }, ...tagged(step.code, id)]
    }
    if (step.mode === 'insertAfter') {
      const at = lines.findIndex((l) => l.text.includes(step.find))
      if (at < 0) throw new StepMismatch(step)
      if (lines.filter((l) => l.text.includes(step.find)).length > 1) throw new StepMismatch(step, true)
      return [...lines.slice(0, at + 1), ...tagged(step.code, id), ...lines.slice(at + 1)]
    }
    if (step.mode === 'replace') {
      const idx = text.indexOf(step.find)
      if (idx < 0) throw new StepMismatch(step)
      if (text.indexOf(step.find, idx + 1) >= 0) throw new StepMismatch(step, true)
      const first = count(text.slice(0, idx), '\n')
      const last = first + count(step.find, '\n')
      const next = text.slice(0, idx) + step.code + text.slice(idx + step.find.length)
      const nextLines = split(next)
      const newLast = first + count(step.code, '\n')
      // Lines inside the replaced block that did not change keep where they came from.
      const oldBlock = lines.slice(first, last + 1)
      const newBlock = nextLines.slice(first, newLast + 1)
      let lead = 0
      while (lead < oldBlock.length && lead < newBlock.length && oldBlock[lead].text === newBlock[lead]) lead++
      let trail = 0
      while (trail < oldBlock.length - lead && trail < newBlock.length - lead &&
        oldBlock[oldBlock.length - 1 - trail].text === newBlock[newBlock.length - 1 - trail]) trail++
      return nextLines.map((t, i) => {
        if (i < first) return { ...lines[i], text: t }
        if (i <= newLast) {
          const k = i - first
          if (k < lead) return { ...oldBlock[k], text: t }
          if (k >= newBlock.length - trail) return { ...oldBlock[oldBlock.length - (newBlock.length - k)], text: t }
          return { text: t, stepId: id }
        }
        return { ...lines[i - newLast + last], text: t }
      })
    }
    throw new Error(`Unknown step mode: ${step.mode}`)
  }

  const applyStep = (text, step) => join(applyLines(tagged(text, null), step))

  const allSteps = (lesson) => lesson.features.flatMap((f) => f.steps.map((s) => ({ ...s, featureId: f.id })))

  function linesAt(lesson, stepId) {
    const files = {}
    for (const [name, text] of Object.entries(lesson.files)) files[name] = tagged(text, null)
    // Built on another lesson: remember where each starting line sits in that lesson.
    const from = lesson.base && get(lesson.base.lesson)
    if (from) {
      const f = from.features.find((x) => x.id === lesson.base.feature)
      const baseFiles = checkpoint(from, f.id)
      for (const name of Object.keys(files)) {
        if (baseFiles[name] === lesson.files[name]) files[name] = files[name].map((l, k) => ({ ...l, baseLine: k + 1 }))
      }
    }
    if (stepId == null) return files
    const steps = allSteps(lesson)
    const stop = steps.findIndex((s) => s.id === stepId)
    if (stop < 0) throw new Error(`No step ${stepId} in lesson ${lesson.id}`)
    for (const step of steps.slice(0, stop + 1)) {
      if (step.mode === 'delete') delete files[step.file]
      else files[step.file] = applyLines(files[step.file] || [], step)
    }
    return files
  }

  const mapFiles = (files, fn) => Object.fromEntries(Object.entries(files).map(([k, v]) => [k, fn(v)]))
  const filesAt = (lesson, stepId) => mapFiles(linesAt(lesson, stepId), join)
  const origins = (lesson, stepId) => mapFiles(linesAt(lesson, stepId), (ls) => ls.map((l) => ({ stepId: l.stepId })))

  function checkpoint(lesson, featureId) {
    const f = lesson.features.find((x) => x.id === featureId)
    if (!f) throw new Error(`No feature ${featureId} in lesson ${lesson.id}`)
    return filesAt(lesson, f.steps[f.steps.length - 1].id)
  }

  // The story of one line: the note of the step that introduced it.
  function noteFor(lesson, stepId, file, lineNo) {
    const line = (linesAt(lesson, stepId)[file] || [])[lineNo - 1]
    const empty = { note: null, stepId: null, featureId: null }
    if (!line) return empty
    const steps = allSteps(lesson)
    const own = steps.find((s) => s.id === line.stepId)
    const base = { stepId: line.stepId, featureId: own ? own.featureId : null, lessonId: lesson.id }
    if (line.text.trim() === '') return { note: null, ...base }
    if (!own) {
      // A line this lesson started with: ask the lesson it was built on.
      const from = lesson.base && get(lesson.base.lesson)
      if (!from) return { note: null, ...base }
      const f = from.features.find((x) => x.id === lesson.base.feature)
      if (!line.baseLine) return { note: null, ...base }
      return { ...noteFor(from, f.steps[f.steps.length - 1].id, file, line.baseLine), lessonId: from.id }
    }
    const hit = (own.notes || []).find((n) => line.text.includes(n.match))
    if (hit) return { note: hit, ...base }
    // A closing tag: show the note of the element it closes (same step first, then earlier steps).
    const close = line.text.match(/^\s*<\/([a-zA-Z][\w-]*)/)
    if (close) {
      const open = '<' + close[1]
      const upto = steps.slice(0, steps.findIndex((s) => s.id === stepId) + 1)
      const order = [own, ...upto.filter((s) => s !== own).reverse()]
      for (const s of order) {
        const n = (s.notes || []).find((x) => x.match.startsWith(open))
        if (n) return { note: n, ...base }
      }
    }
    // The line was edited later (e.g. an attribute removed): use the latest earlier note that fits it.
    const upto = steps.slice(0, steps.findIndex((s) => s.id === stepId) + 1).reverse()
    for (const s of upto) {
      const n = (s.notes || []).find((x) => line.text.includes(x.match))
      if (n) return { note: n, stepId: s.id, featureId: s.featureId, lessonId: lesson.id }
    }
    return { note: null, ...base }
  }

  // Injected into every preview (as source text, so it must be self-contained):
  // - errors and console output go to the editor's console panel
  // - #links scroll inside the preview, http links open a new tab
  // - a form submit that nobody prevented reloads the page, like a real browser
  function previewAgent() {
    var post = function (d) {
      try { parent.postMessage(d, '*') } catch (e) {}
      try { if (opener) opener.postMessage(d, '*') } catch (e) {}
    }
    var nameOf = function (v) { try { return (v.constructor && v.constructor.name) || '' } catch (e) { return '' } }
    var has = function (k) { return typeof window[k] !== 'undefined' }
    var fmt = function (v, d) {
      d = d || 0
      if (typeof v === 'string') return d ? "'" + v + "'" : v
      if (v === null || (typeof v !== 'object' && typeof v !== 'function')) return String(v)
      if (typeof v === 'function') return '[Function: ' + (v.name || '(anonymous)') + ']'
      if (v === window) return '[Window]'
      if (has('Element') && v instanceof Element) {
        return '<' + v.tagName.toLowerCase() + (v.id ? ' id="' + v.id + '"' : '') + (v.className && typeof v.className === 'string' ? ' class="' + v.className + '"' : '') + '>'
      }
      if (has('Node') && v instanceof Node) {
        if (v.nodeType === 3) return '#text ' + JSON.stringify(v.textContent)
        if (v.nodeType === 9) return '#document'
        return v.nodeName
      }
      if (v instanceof Error) return v.name + ': ' + v.message
      if (v instanceof Date) return isNaN(v) ? 'Invalid Date' : v.toISOString()
      if (has('Event') && v instanceof Event) return nameOf(v) + " { type: '" + v.type + "', target: " + fmt(v.target, d + 1) + ' }'
      if (d > 2) return Array.isArray(v) ? '[Array]' : '[Object]'
      var list = function (xs) { return [].map.call(xs, function (x) { return fmt(x, d + 1) }).join(', ') }
      var pairs = function (it) { var out = []; it.forEach(function (x, k) { out.push(fmt(k, d + 1) + ' => ' + fmt(x, d + 1)) }); return out.join(', ') }
      if (Array.isArray(v)) return v.length ? '[ ' + list(v) + ' ]' : '[]'
      if (v instanceof Map) return 'Map(' + v.size + ') { ' + pairs(v) + ' }'
      if (v instanceof Set) return 'Set(' + v.size + ') { ' + list(Array.from(v)) + ' }'
      if (has('FormData') && v instanceof FormData) {
        var e = []; v.forEach(function (x, k) { e.push(k + ': ' + fmt(x, d + 1)) }); return 'FormData { ' + e.join(', ') + ' }'
      }
      if ((has('NodeList') && v instanceof NodeList) || (has('HTMLCollection') && v instanceof HTMLCollection) || (has('DOMTokenList') && v instanceof DOMTokenList)) {
        return nameOf(v) + '(' + v.length + ') [ ' + list(v) + ' ]'
      }
      var keys = Object.keys(v)
      var cn = nameOf(v)
      var pre = cn && cn !== 'Object' ? cn + ' ' : ''
      // A big object inside a log (a whole PokeAPI answer) is cut short so the console stays readable.
      var shown = d >= 1 && keys.length > 6 ? keys.slice(0, 4) : keys
      var more = keys.length - shown.length
      return keys.length ? pre + '{ ' + shown.map(function (k) { return k + ': ' + fmt(v[k], d + 1) }).join(', ') + (more ? ', … ' + more + ' more' : '') + ' }' : pre + '{}'
    }
    var safe = function (a) { try { return fmt(a) } catch (e) { return '[unprintable]' } }
    // console.log("a %s b %d", x, y): fill the placeholders like DevTools does.
    var printf = function (args) {
      if (typeof args[0] === 'string' && /%[sdifoOc%]/.test(args[0])) {
        var rest = args.slice(1)
        var head = args[0].replace(/%([sdifoOc%])/g, function (m, t) {
          if (t === '%') return '%'
          if (!rest.length) return ''
          var v = rest.shift()
          if (t === 'c') return ''
          if (t === 'd' || t === 'i') return String(parseInt(v, 10))
          if (t === 'f') return String(Number(v))
          return typeof v === 'string' ? v : safe(v)
        })
        return [head].concat(rest.map(safe)).join(' ').replace(/\s+$/, '')
      }
      return args.map(safe).join(' ')
    }
    ;['log', 'info', 'warn', 'error'].forEach(function (k) {
      var orig = console[k]
      console[k] = function () {
        try { post({ type: 'livepad-console', level: k, text: printf([].slice.call(arguments)) }) } catch (e) {}
        return orig.apply(console, arguments)
      }
    })
    // cy.intercept: answer matching requests (fetch and XHR, which axios uses) with the stub.
    var routes = window.__CY_ROUTES || []
    var globRe = function (p) { return new RegExp('^' + p.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*\*/g, '\u0000').replace(/\*/g, '[^/]*').replace(/\u0000/g, '.*') + '$') }
    var match = function (method, url) {
      for (var i = 0; i < routes.length; i++) {
        var r = routes[i]
        if (r.method && String(r.method).toUpperCase() !== String(method || 'GET').toUpperCase()) continue
        if (r.url === url || (r.url.indexOf('*') >= 0 && globRe(r.url).test(url))) return r
      }
      return null
    }
    var tell = function (r, url) { post({ type: 'cy-intercepted', alias: r.alias, url: url }) }
    // After the page has handled the stubbed response (what cy.wait waits for).
    var done = function (r, url) { setTimeout(function () { post({ type: 'cy-responded', alias: r.alias, url: url }) }, 0) }
    if (routes.length) {
      var realFetch = window.fetch
      window.fetch = function (input, init) {
        var url = typeof input === 'string' ? input : input.url
        var r = match((init && init.method) || (input && input.method) || 'GET', new URL(url, location.href).href)
        if (!r) return realFetch.apply(this, arguments)
        tell(r, url)
        done(r, url)
        return Promise.resolve(new Response(JSON.stringify(r.body), { status: r.status, headers: { 'Content-Type': 'application/json' } }))
      }
      var open = XMLHttpRequest.prototype.open, send = XMLHttpRequest.prototype.send
      XMLHttpRequest.prototype.open = function (method, url) { this.__lp = { method: method, url: new URL(url, location.href).href }; return open.apply(this, arguments) }
      XMLHttpRequest.prototype.send = function () {
        var r = this.__lp && match(this.__lp.method, this.__lp.url)
        if (!r) return send.apply(this, arguments)
        var x = this, text = JSON.stringify(r.body), url = this.__lp.url
        tell(r, url)
        setTimeout(function () {
          var json = x.responseType === 'json'
          var props = { readyState: 4, status: r.status, statusText: r.status === 200 ? 'OK' : '', responseURL: url, responseText: json ? '' : text, response: json ? r.body : text }
          Object.keys(props).forEach(function (k) { Object.defineProperty(x, k, { configurable: true, value: props[k] }) })
          x.getAllResponseHeaders = function () { return 'content-type: application/json\r\n' }
          x.getResponseHeader = function (h) { return /content-type/i.test(h) ? 'application/json' : null }
          ;['readystatechange', 'load', 'loadend'].forEach(function (t) { x.dispatchEvent(new ProgressEvent(t)) })
          done(r, url)
        }, 10)
      }
    }
    window.onerror = function (m, s, l, c, err) {
      post({ type: 'livepad-error', message: String(m), line: l })
      post({ type: 'livepad-console', level: 'error', text: String(m) })
      // For the Cypress runner: an uncaught app error fails the running test.
      post({ type: 'cy-app-error', message: err && err.message ? err.message : String(m).replace(/^Uncaught (\w*Error: )?/, '') })
    }
    // A rejected promise nobody caught (an axios error without .catch): the browser logs it like this.
    window.addEventListener('unhandledrejection', function (e) {
      var r = e.reason
      var text = r && r.message ? (r.name || 'Error') + ': ' + r.message : String(r)
      post({ type: 'livepad-console', level: 'error', text: 'Uncaught (in promise) ' + text })
      post({ type: 'cy-app-error', message: r && r.message ? r.message : String(r), rejection: true })
    })
    document.addEventListener('click', function (e) {
      var a = e.target.closest && e.target.closest('a[href]')
      if (!a) return
      var h = a.getAttribute('href')
      e.preventDefault()
      if (h.charAt(0) === '#') { var t = document.getElementById(h.slice(1)); if (t) t.scrollIntoView() }
      else if (/^https?:/.test(h)) window.open(h, '_blank', 'noopener')
    }, true)
    // Always stop the real navigation (it would load the site into the preview), and
    // after every listener has run, reload only if the page itself never called preventDefault().
    var realPrevent = Event.prototype.preventDefault
    Event.prototype.preventDefault = function () {
      try { this.__livepadPrevented = true } catch (e) {}
      return realPrevent.call(this)
    }
    window.addEventListener('submit', function (e) {
      realPrevent.call(e)
      setTimeout(function () { if (!e.__livepadPrevented) post({ type: 'livepad-reload' }) }, 0)
    }, true)
  }
  const REPORTER = '<script>(' + previewAgent.toString() + ')()</script>'

  // ---------- React / Vite projects ----------
  // Pinned packages the preview may import (an import map; esm.sh keeps a single React).
  // Development builds (?dev), so React's warnings read like they do with Vite on a laptop.
  const DEPS = 'deps=react@19.3.1,scheduler@0.28.0'
  const IMPORTS = {
    react: 'https://esm.sh/react@19.3.1?dev',
    'react/jsx-runtime': 'https://esm.sh/react@19.3.1/jsx-runtime?dev',
    'react/jsx-dev-runtime': 'https://esm.sh/react@19.3.1/jsx-dev-runtime?dev',
    'react-dom': 'https://esm.sh/react-dom@19.3.1?dev&' + DEPS,
    'react-dom/client': 'https://esm.sh/react-dom@19.3.1/client?dev&' + DEPS,
    axios: 'https://esm.sh/axios@1.20.0',
  }
  const BABEL = 'https://cdn.jsdelivr.net/npm/@babel/standalone@7.28.4/babel.min.js'
  // Site root (for lesson assets): the folder above shared/.
  const ROOT = typeof document !== 'undefined' && document.currentScript ? new URL('..', document.currentScript.src).href : ''

  // Runs inside the preview (as source text, so it must be self-contained): turn the
  // project's files into ES modules the browser can load, like Vite does on your laptop.
  function reactRunner(FILES, ASSETS, ENTRY) {
    if (typeof Babel === 'undefined') {
      console.error("Can't load React tools from the internet (offline, or the CDN is blocked). The live preview needs a connection.")
      document.body.insertAdjacentHTML('afterbegin', '<p style="font:16px system-ui;padding:12px;background:#fde2e1;margin:0">Offline? The live preview needs the internet to load React.</p>')
      return
    }
    var norm = function (p) { var out = []; p.split('/').forEach(function (s) { if (!s || s === '.') return; if (s === '..') out.pop(); else out.push(s) }); return out.join('/') }
    var dirOf = function (p) { return p.split('/').slice(0, -1).join('/') }
    var blobUrl = function (text, type) { return URL.createObjectURL(new Blob([text], { type: type })) }
    var ASSET = /\.(svg|png|jpe?g|gif|webp|ico)$/i
    var publicUrls = {}
    Object.keys(FILES).forEach(function (p) { if (p.indexOf('public/') === 0) publicUrls['/' + p.slice(7)] = blobUrl(FILES[p], /\.svg$/.test(p) ? 'image/svg+xml' : 'text/plain') })
    Object.keys(ASSETS).forEach(function (p) { if (p.indexOf('public/') === 0) publicUrls['/' + p.slice(7)] = ASSETS[p] })
    var withPublic = function (code) {
      Object.keys(publicUrls).forEach(function (k) { code = code.split('"' + k).join('"' + publicUrls[k]).split("'" + k).join("'" + publicUrls[k]) })
      return code
    }
    var find = function (from, spec) {
      var base = norm(dirOf(from) + '/' + spec)
      var tries = [base, base + '.jsx', base + '.js', base + '/index.jsx', base + '/index.js']
      for (var i = 0; i < tries.length; i++) if (FILES[tries[i]] != null || ASSETS[tries[i]] != null) return tries[i]
      return null
    }
    var assetUrl = function (path) {
      if (ASSETS[path] != null) return ASSETS[path]
      return blobUrl(FILES[path], /\.svg$/i.test(path) ? 'image/svg+xml' : 'application/octet-stream')
    }
    // CSS: inline @import of local files, and point url(./x) at the asset.
    var cssOf = function (path, seen) {
      seen = seen || {}
      if (seen[path]) return ''
      seen[path] = 1
      return String(FILES[path] || '')
        .replace(/@import\s+(?:url\()?\s*['"]?(\.{1,2}\/[^'")]+)['"]?\s*\)?\s*;/g, function (m, spec) { var t = find(path, spec); return t ? cssOf(t, seen) : m })
        .replace(/url\(\s*['"]?(\.{1,2}\/[^'")]+)['"]?\s*\)/g, function (m, spec) { var t = find(path, spec); return t && ASSET.test(t) ? 'url("' + assetUrl(t) + '")' : m })
    }
    var cssDone = {}, mods = {}, loading = {}
    var ENV = 'if (!import.meta.env) import.meta.env = { MODE: "development", DEV: true, PROD: false, SSR: false, BASE_URL: "/" };\n'
    var load = function (path, from) {
      if (mods[path]) return mods[path]
      if (loading[path]) throw new Error('/' + from + ' and /' + path + ' import each other. The preview cannot run import cycles: move the shared code into its own file.')
      loading[path] = 1
      var code = Babel.transform(FILES[path], { presets: [['react', { runtime: 'automatic', development: true }]], filename: '/' + path, sourceType: 'module', comments: false, retainLines: true }).code
      var target = function (spec) {
        var t = find(path, spec)
        if (!t) throw new Error('[plugin:vite:import-analysis] Failed to resolve import "' + spec + '" from "' + path + '". Does the file exist?')
        return t
      }
      // import … from './x'  |  import './x'  (CSS, assets, modules)
      code = code.replace(/\bimport\s+((?:[\w$]+\s*,?\s*)?(?:\{[^}]*\}|\*\s+as\s+[\w$]+)?)\s*(?:from\s+)?(['"])(\.{1,2}\/[^'"]+)\2;?/g, function (m, clause, q, spec) {
        var t = target(spec)
        if (/\.css$/i.test(t)) {
          // CSS Modules (*.module.css): every class gets a unique name, like Vite's _heading_1x2y3.
          var names = null, css = cssOf(t)
          if (/\.module\.css$/i.test(t)) {
            names = {}
            var h = 0
            for (var k = 0; k < t.length; k++) h = (h * 31 + t.charCodeAt(k)) >>> 0
            var tag = h.toString(36).slice(0, 5)
            css = css.replace(/([^{}]+)\{/g, function (m, sel) {
              return sel.replace(/\.(-?[_a-zA-Z][\w-]*)/g, function (x, n) { names[n] = '_' + n + '_' + tag; return '.' + names[n] }) + '{'
            })
          }
          if (!cssDone[t]) { cssDone[t] = 1; var st = document.createElement('style'); st.setAttribute('data-file', t); st.textContent = css; document.head.append(st) }
          var name = names && (clause.match(/^\s*([\w$]+)/) || [])[1]
          return name ? 'const ' + name + ' = ' + JSON.stringify(names) + ';' : ''
        }
        if (ASSET.test(t)) {
          var def = (clause.match(/^\s*([\w$]+)/) || [])[1]
          return def ? 'const ' + def + ' = ' + JSON.stringify(assetUrl(t)) + ';' : ''
        }
        return m.replace(q + spec + q, q + load(t, path) + q)
      })
      // export … from './x'
      code = code.replace(/\bexport\s+(\*(?:\s+as\s+[\w$]+)?|\{[^}]*\})\s*from\s*(['"])(\.{1,2}\/[^'"]+)\2/g, function (m, what, q, spec) {
        return m.replace(q + spec + q, q + load(target(spec), path) + q)
      })
      // import('./x')
      code = code.replace(/\bimport\(\s*(['"])(\.{1,2}\/[^'"]+)\1\s*\)/g, function (m, q, spec) { return 'import(' + q + load(target(spec), path) + q + ')' })
      if (/import\.meta\.env/.test(code)) code = ENV + code
      delete loading[path]
      mods[path] = blobUrl(withPublic(code), 'text/javascript')
      return mods[path]
    }
    try {
      // Module errors name blob: URLs; show the file path instead, like Vite does.
      var named = function (msg) { Object.keys(mods).forEach(function (p) { msg = msg.split(mods[p]).join('/' + p) }); return msg }
      import(load(ENTRY, ENTRY)).catch(function (e) { console.error(named(String(e && e.message || e))) })
    } catch (e) { console.error(e.message) }
  }

  const viteEntry = (html) => { const m = html.match(/<script\b[^>]*type\s*=\s*["']module["'][^>]*\bsrc\s*=\s*["']\/?(src\/[^"']+\.jsx?)["'][^>]*>\s*<\/script>/i); return m && m[1] }
  const safeJson = (v) => JSON.stringify(v).replace(/</g, '\\u003c')

  const routesScript = (routes) => (routes && routes.length ? '<script>window.__CY_ROUTES=' + safeJson(routes) + '</script>' : '')

  function buildReactDoc(files, assets, entry, routes) {
    const abs = {}
    for (const [k, v] of Object.entries(assets || {})) abs[k] = ROOT ? new URL(v, ROOT).href : v
    let doc = files['index.html'].replace(/<script\b[^>]*type\s*=\s*["']module["'][^>]*\bsrc\s*=\s*["']\/?src\/[^"']+["'][^>]*>\s*<\/script>/i, '')
    doc = doc.replace(/<link\b[^>]*rel\s*=\s*["']icon["'][^>]*>/i, '')
    const head = routesScript(routes) + REPORTER + '<script type="importmap">' + JSON.stringify({ imports: IMPORTS }) + '</script><script src="' + BABEL + '"></script>'
    const run = '<script>(' + reactRunner.toString() + ')(' + safeJson(files) + ',' + safeJson(abs) + ',' + JSON.stringify(entry) + ')</script>'
    doc = /<head[^>]*>/i.test(doc) ? doc.replace(/<head[^>]*>/i, (h) => h + head) : head + doc
    return /<\/body>/i.test(doc) ? doc.replace(/<\/body>/i, run + '</body>') : doc + run
  }

  // One HTML document for an iframe srcdoc: linked CSS/JS files are inlined.
  function buildDoc(files, assets, opts = {}) {
    const html = files['index.html'] || ''
    const entry = viteEntry(html)
    if (entry && files[entry] != null) return buildReactDoc(files, assets, entry, opts.routes)
    const local = (ref) => files[ref.replace(/^\.\//, '')]
    let doc = html.replace(/<link\b[^>]*>/gi, (tag) => {
      if (!/\brel\s*=\s*["']?stylesheet/i.test(tag)) return tag
      const m = tag.match(/\bhref\s*=\s*["']([^"']+)["']/i)
      const css = m && local(m[1])
      return css == null ? tag : `<style>${css}</style>`
    })
    // defer / module scripts run after the page is parsed, before DOMContentLoaded:
    // the same order as inline scripts placed at the very end of <body>.
    const later = []
    doc = doc.replace(/<script\b([^>]*)\bsrc\s*=\s*["']([^"']+)["']([^>]*)>\s*<\/script>/gi, (tag, a, src, b) => {
      const js = local(src)
      if (js == null) return tag
      const attrs = a + b
      if (/\btype\s*=\s*["']?module/i.test(attrs)) { later.push(`<script type="module">${js}</script>`); return '' }
      if (/\bdefer\b/i.test(attrs)) { later.push(`<script>${js}</script>`); return '' }
      return `<script>${js}</script>`
    })
    if (later.length) doc = /<\/body>/i.test(doc) ? doc.replace(/<\/body>/i, later.join('') + '</body>') : doc + later.join('')
    const agent = routesScript(opts.routes) + REPORTER
    return /<head[^>]*>/i.test(doc) ? doc.replace(/<head[^>]*>/i, (h) => h + agent) : agent + doc
  }

  return { register, get, all, assetsOf, tabOrder, applyStep, filesAt, checkpoint, origins, noteFor, buildDoc, StepMismatch }
})
