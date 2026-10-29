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
    for (const step of steps.slice(0, stop + 1)) files[step.file] = applyLines(files[step.file] || [], step)
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
      return keys.length ? pre + '{ ' + keys.map(function (k) { return k + ': ' + fmt(v[k], d + 1) }).join(', ') + ' }' : pre + '{}'
    }
    var safe = function (a) { try { return fmt(a) } catch (e) { return '[unprintable]' } }
    ;['log', 'info', 'warn', 'error'].forEach(function (k) {
      var orig = console[k]
      console[k] = function () {
        try { post({ type: 'livepad-console', level: k, text: [].map.call(arguments, safe).join(' ') }) } catch (e) {}
        return orig.apply(console, arguments)
      }
    })
    window.onerror = function (m, s, l) {
      post({ type: 'livepad-error', message: String(m), line: l })
      post({ type: 'livepad-console', level: 'error', text: String(m) })
    }
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
  const IMPORTS = {
    react: 'https://esm.sh/react@19.3.1',
    'react/jsx-runtime': 'https://esm.sh/react@19.3.1/jsx-runtime',
    'react/jsx-dev-runtime': 'https://esm.sh/react@19.3.1/jsx-dev-runtime',
    'react-dom': 'https://esm.sh/react-dom@19.3.1?deps=react@19.3.1',
    'react-dom/client': 'https://esm.sh/react-dom@19.3.1/client?deps=react@19.3.1',
    axios: 'https://esm.sh/axios@1.20.0',
  }
  const BABEL = 'https://cdn.jsdelivr.net/npm/@babel/standalone@7.28.4/babel.min.js'
  // Site root (for lesson assets): the folder above shared/.
  const ROOT = typeof document !== 'undefined' && document.currentScript ? new URL('..', document.currentScript.src).href : ''

  // Runs inside the preview (as source text, so it must be self-contained): turn the
  // project's files into ES modules the browser can load, like Vite does on your laptop.
  function reactRunner(FILES, ASSETS, ENTRY) {
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
    var cssDone = {}, mods = {}
    var assetUrl = function (path) {
      if (ASSETS[path] != null) return ASSETS[path]
      return blobUrl(FILES[path], /\.svg$/i.test(path) ? 'image/svg+xml' : 'application/octet-stream')
    }
    var load = function (path) {
      if (mods[path]) return mods[path]
      var code
      try {
        code = Babel.transform(FILES[path], { presets: [['react', { runtime: 'automatic' }]], filename: '/' + path, sourceType: 'module' }).code
      } catch (e) { throw new Error(e.message) }
      code = code.replace(/(^|\n)(\s*)import\s+(?:([\w$]+)\s+from\s+)?(?:[^'"]*?\s+from\s+)?(['"])(\.{1,2}\/[^'"]+)\4;?/g, function (m, nl, sp, name, q, spec) {
        var target = find(path, spec)
        if (!target) throw new Error('/' + path + ': cannot find "' + spec + '"')
        if (/\.css$/i.test(target)) {
          if (!cssDone[target]) { cssDone[target] = 1; var st = document.createElement('style'); st.setAttribute('data-file', target); st.textContent = FILES[target]; document.head.append(st) }
          return nl
        }
        if (ASSET.test(target)) return nl + sp + (name ? 'const ' + name + ' = ' + JSON.stringify(assetUrl(target)) + ';' : '')
        return m.replace(q + spec + q, q + load(target) + q)
      })
      mods[path] = blobUrl(withPublic(code), 'text/javascript')
      return mods[path]
    }
    try {
      import(load(ENTRY)).catch(function (e) { console.error(String(e && e.message || e)) })
    } catch (e) { console.error(e.message) }
  }

  const viteEntry = (html) => { const m = html.match(/<script\b[^>]*type\s*=\s*["']module["'][^>]*\bsrc\s*=\s*["']\/?(src\/[^"']+\.jsx?)["'][^>]*>\s*<\/script>/i); return m && m[1] }
  const safeJson = (v) => JSON.stringify(v).replace(/</g, '\\u003c')

  function buildReactDoc(files, assets, entry) {
    const abs = {}
    for (const [k, v] of Object.entries(assets || {})) abs[k] = ROOT ? new URL(v, ROOT).href : v
    let doc = files['index.html'].replace(/<script\b[^>]*type\s*=\s*["']module["'][^>]*\bsrc\s*=\s*["']\/?src\/[^"']+["'][^>]*>\s*<\/script>/i, '')
    doc = doc.replace(/<link\b[^>]*rel\s*=\s*["']icon["'][^>]*>/i, '')
    const head = REPORTER + '<script type="importmap">' + JSON.stringify({ imports: IMPORTS }) + '</script><script src="' + BABEL + '"></script>'
    const run = '<script>(' + reactRunner.toString() + ')(' + safeJson(files) + ',' + safeJson(abs) + ',' + JSON.stringify(entry) + ')</script>'
    doc = /<head[^>]*>/i.test(doc) ? doc.replace(/<head[^>]*>/i, (h) => h + head) : head + doc
    return /<\/body>/i.test(doc) ? doc.replace(/<\/body>/i, run + '</body>') : doc + run
  }

  // One HTML document for an iframe srcdoc: linked CSS/JS files are inlined.
  function buildDoc(files, assets) {
    const html = files['index.html'] || ''
    const entry = viteEntry(html)
    if (entry && files[entry] != null) return buildReactDoc(files, assets, entry)
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
    return /<head[^>]*>/i.test(doc) ? doc.replace(/<head[^>]*>/i, (h) => h + REPORTER) : REPORTER + doc
  }

  return { register, get, all, applyStep, filesAt, checkpoint, origins, noteFor, buildDoc, StepMismatch }
})
