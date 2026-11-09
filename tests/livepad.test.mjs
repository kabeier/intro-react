import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { serve, launch, until } from './helpers.mjs'

const require = createRequire(import.meta.url)
const Course = require('../shared/course.js')
globalThis.Course = Course
await import('./fixtures/demo-lesson.js')
const lesson = Course.get('demo')

let srv, browser
before(async () => { srv = await serve(); browser = await launch() })
after(async () => { await browser?.close(); srv?.close() })

const DECK = '/tests/fixtures/livepad-demo.html'

async function openSlide2(opts = {}) {
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } })
  if (opts.blockMonaco) await page.route('**/monaco-editor@*/**', (r) => r.abort())
  await page.goto(srv.url + DECK + '#2')
  await until(page, () => window.Livepad && window.Livepad.current() && window.Livepad.current().ready)
  return page
}
const state = (page) => page.evaluate(() => { const c = window.Livepad.current(); return { files: c.files, status: c.status, editor: c.editorValue, tab: c.tab } })
const previewColor = (page, sel) => page.evaluate((sel) => {
  const f = document.querySelector('.slide.active .livepad iframe')
  const el = f.contentDocument.querySelector(sel)
  return el ? f.contentWindow.getComputedStyle(el).color : null
}, sel)

test('opens with the start files in tabs and an up-to-date status', async () => {
  const page = await openSlide2()
  const tabs = await page.$$eval('.slide.active .lp-tab', (b) => b.map((x) => x.textContent.trim()))
  assert.deepEqual(tabs, ['index.html', 'styles.css'])
  const s = await state(page)
  assert.deepEqual(s.files, Course.filesAt(lesson, 'f1s1'))
  await until(page, () => /up to date/.test(window.Livepad.current().status))
  assert.equal(await previewColor(page, 'h1'), 'rgb(0, 0, 255)')
  await page.close()
})

test('a step that removes code shows it in red first; the next N deletes it and types', async () => {
  const page = await openSlide2()
  await page.keyboard.press('n')
  await until(page, () => !window.Livepad.current().busy)
  const before = (await state(page)).files
  await page.keyboard.press('n') // f2s2 replaces rgb(0, 0, 255)
  await until(page, () => /red goes next/.test(window.Livepad.current().status))
  assert.deepEqual((await state(page)).files, before, 'nothing deleted yet')
  assert.equal(await page.locator('.slide.active .lp-gone-t').allTextContents().then((t) => t.join('').replace(/\u00a0/g, ' ')), '0, 0, 255')
  await page.keyboard.press('n')
  await until(page, () => !window.Livepad.current().busy && window.Livepad.current().step === 2)
  assert.deepEqual((await state(page)).files, Course.filesAt(lesson, 'f2s2'))
  assert.equal(await page.locator('.slide.active .lp-gone-t').count(), 0)
  await page.close()
})

test('N types the steps (two presses for one that removes code); preview follows', async () => {
  const page = await openSlide2()
  for (let k = 0; k < 4; k++) {
    await page.keyboard.press('n')
    await until(page, () => !window.Livepad.current().busy)
  }
  const s = await state(page)
  assert.deepEqual(s.files, Course.filesAt(lesson, 'f2s3'))
  assert.equal(s.editor, s.files[s.tab])
  await until(page, () => {
    const f = document.querySelector('.slide.active .livepad iframe')
    const h = f.contentDocument.querySelector('h1')
    return h && f.contentWindow.getComputedStyle(h).color === 'rgb(255, 0, 0)'
  })
  await page.close()
})

test('typing in the editor updates the preview (hot reload)', async () => {
  const page = await openSlide2()
  await page.click('.slide.active .lp-tab[data-file="index.html"]')
  await page.click('.slide.active .lp-editor')
  await page.keyboard.press('Control+End')
  await page.keyboard.type('\n<p id="x">hi</p>')
  await until(page, () => !!document.querySelector('.slide.active .livepad iframe').contentDocument.querySelector('#x'), null, 3000)
  await page.close()
})

test('a step that no longer fits hand-edited code is refused; Shift+N resets', async () => {
  const page = await openSlide2()
  await page.keyboard.press('n') // f2s1
  await until(page, () => !window.Livepad.current().busy)
  await page.click('.slide.active .lp-tab[data-file="styles.css"]')
  await page.click('.slide.active .lp-editor')
  await page.keyboard.press('Control+A')
  await page.keyboard.type('h1 { color: green; }')
  await page.waitForTimeout(400)
  await page.mouse.click(5, 5) // leave the editor so N goes to the deck
  const before = (await state(page)).files['styles.css']
  await page.keyboard.press('n') // f2s2 needs "rgb(0, 0, 255)"
  await page.waitForTimeout(300)
  const s = await state(page)
  assert.match(s.status, /can't apply/i)
  assert.equal(s.files['styles.css'], before)
  await page.keyboard.press('Shift+N')
  await until(page, () => !window.Livepad.current().busy)
  assert.deepEqual((await state(page)).files, Course.filesAt(lesson, 'f1s1'))
  await page.close()
})

test('without Monaco the slide falls back to a <pre> and N still works', async () => {
  const page = await openSlide2({ blockMonaco: true })
  await until(page, () => !!document.querySelector('.slide.active .lp-fallback'))
  await page.keyboard.press('n')
  await until(page, () => !window.Livepad.current().busy)
  await until(page, () => !!document.querySelector('.slide.active .livepad iframe').contentDocument.querySelector('.intro'))
  const pre = await page.$eval('.slide.active .lp-fallback', (p) => p.textContent)
  assert.match(pre, /class="intro"/)
  await page.close()
})

test('a JS error in the page shows in the status line', async () => {
  const page = await openSlide2()
  await page.click('.slide.active .lp-tab[data-file="index.html"]')
  await page.click('.slide.active .lp-editor')
  await page.keyboard.press('Control+End')
  await page.keyboard.type('\n<script>nope()</script>')
  await until(page, () => /nope/.test(window.Livepad.current().status), null, 3000)
  await page.close()
})

test('a clicked file tab does not keep focus, so Enter/Space act once (deck only)', async () => {
  const page = await openSlide2()
  await page.click('.slide.active .lp-tab[data-file="styles.css"]')
  assert.equal(await page.evaluate(() => !!document.activeElement.closest('.lp-tab')), false)
  await page.close()
})

test('typing while N auto-types is ignored, so the step lands cleanly', async () => {
  const page = await openSlide2()
  await page.click('.slide.active .lp-tab[data-file="index.html"]')
  await page.mouse.click(5, 5)
  await page.keyboard.press('n')
  await page.click('.slide.active .lp-editor')
  await page.keyboard.type('zzz')
  await until(page, () => !window.Livepad.current().busy)
  const s = await state(page)
  assert.deepEqual(s.files, Course.filesAt(lesson, 'f2s1'))
  await page.close()
})

const setPage = (page, html) => page.evaluate((h) => {
  const pad = window.Livepad.pads.find((p) => p.el.closest('.slide.active'))
  pad.setFiles({ ...pad.files, 'index.html': h })
}, html)
const consoleText = (page) => page.evaluate(() => document.querySelector('.slide.active .lp-console')?.textContent || '')

test('console.log in the page shows in the console panel, Node style', async () => {
  const page = await openSlide2()
  await setPage(page, '<body><script>console.log("hi", [1, 2], { a: 1 })</script></body>')
  await until(page, () => /hi \[ 1, 2 \] \{ a: 1 \}/.test(document.querySelector('.slide.active .lp-console')?.textContent || ''))
  await page.close()
})

test('an uncaught error shows in red in the console panel', async () => {
  const page = await openSlide2()
  await setPage(page, '<body><script>nope()</script></body>')
  await until(page, () => { const e = document.querySelector('.slide.active .lp-console .err'); return e && /nope is not defined/.test(e.textContent) })
  await page.close()
})

test('the console panel clears when the page reloads', async () => {
  const page = await openSlide2()
  await setPage(page, '<body><script>console.log("first")</script></body>')
  await until(page, () => /first/.test(document.querySelector('.slide.active .lp-console')?.textContent || ''))
  await setPage(page, '<body><script>console.log("second")</script></body>')
  await until(page, () => { const t = document.querySelector('.slide.active .lp-console')?.textContent || ''; return /second/.test(t) && !/first/.test(t) })
  await page.close()
})

const previewFrame = async (page) => {
  for (const f of page.frames()) { try { if (f !== page.mainFrame() && await f.$('form')) return f } catch {} }
}

test('a form submit without preventDefault reloads the page (typed text is gone)', async () => {
  const page = await openSlide2()
  await setPage(page, '<body><form><input id="t"><button>Go</button></form></body>')
  await page.keyboard.press('a')
  await page.waitForTimeout(500)
  let f = await previewFrame(page)
  await f.fill('#t', 'abc')
  await f.click('button')
  await page.waitForTimeout(800)
  f = await previewFrame(page)
  assert.equal(await f.inputValue('#t'), '')
  await page.close()
})

test('with preventDefault the page does not reload', async () => {
  const page = await openSlide2()
  await setPage(page, '<body><form><input id="t"><button>Go</button></form><script>document.querySelector("form").addEventListener("submit", (e) => e.preventDefault())</script></body>')
  await page.keyboard.press('a')
  await page.waitForTimeout(500)
  const f = await previewFrame(page)
  await f.fill('#t', 'abc')
  await f.click('button')
  await page.waitForTimeout(800)
  assert.equal(await (await previewFrame(page)).inputValue('#t'), 'abc')
  await page.close()
})

const setFiles = (page, files) => page.evaluate((f) => {
  const pad = window.Livepad.pads.find((p) => p.el.closest('.slide.active'))
  pad.setFiles({ ...pad.files, ...f })
}, files)
const inPreview = (page, fn) => page.evaluate((src) => {
  const f = document.querySelector('.slide.active .livepad iframe')
  return new Function('doc', 'return (' + src + ')(doc)')(f.contentDocument)
}, fn.toString())

test('a deferred script that waits for DOMContentLoaded still runs', async () => {
  const page = await openSlide2()
  await setFiles(page, { 'index.html': '<head><script src="a.js" defer></script></head><body><h1 id="x"></h1></body>',
    'a.js': 'document.addEventListener("DOMContentLoaded", () => { document.getElementById("x").textContent = "ok" })' })
  await until(page, () => document.querySelector('.slide.active .livepad iframe').contentDocument.querySelector('#x')?.textContent === 'ok')
  await page.close()
})

test('console shows events, dates, sets, text nodes and classList usefully', async () => {
  const page = await openSlide2()
  await setFiles(page, { 'index.html': '<body><p class="a b" id="p">hi</p><script>' +
    'const p = document.getElementById("p");' +
    'console.log(new MouseEvent("click"));' +
    'console.log(new Date(0));' +
    'console.log(new Set([1, 2]));' +
    'console.log(p.firstChild);' +
    'console.log(p.classList)</script></body>' })
  await until(page, () => (document.querySelector('.slide.active .lp-console')?.textContent || '').includes('DOMTokenList'))
  const t = await consoleText(page)
  assert.match(t, /MouseEvent \{ type: 'click'/)
  assert.match(t, /1970-01-01T00:00:00\.000Z/)
  assert.match(t, /Set\(2\) \{ 1, 2 \}/)
  assert.match(t, /#text "hi"/)
  assert.match(t, /DOMTokenList\(2\) \[ 'a', 'b' \]/)
  await page.close()
})

test('console.log never throws into the page', async () => {
  const page = await openSlide2()
  await setFiles(page, { 'index.html': '<body><script>console.log({ get x() { throw new Error("boom") } }); document.body.dataset.after = "yes"</script></body>' })
  await until(page, () => document.querySelector('.slide.active .livepad iframe').contentDocument.body?.dataset.after === 'yes')
  await page.close()
})

test('20,000 logs do not freeze the deck', async () => {
  const page = await openSlide2()
  const t0 = Date.now()
  await setFiles(page, { 'index.html': '<body><script>for (let i = 0; i < 20000; i++) console.log("line", i)</script></body>' })
  await until(page, () => /Console \(20000\)/.test(document.querySelector('.slide.active .lp-console-head')?.textContent || ''), null, 8000)
  assert.ok(Date.now() - t0 < 3000, 'took ' + (Date.now() - t0) + ' ms')
  assert.ok(await page.evaluate(() => document.querySelectorAll('.slide.active .lp-log').length) <= 200)
  await page.close()
})

test('stopPropagation in a submit handler, or preventDefault on window, still means no reload', async () => {
  for (const js of ['document.querySelector("form").addEventListener("submit", (e) => { e.stopPropagation(); e.preventDefault() })',
    'window.addEventListener("submit", (e) => e.preventDefault())']) {
    const page = await openSlide2()
    await setPage(page, '<body><form><input id="t"><button>Go</button></form><script>' + js + '</script></body>')
    await page.keyboard.press('a')
    await page.waitForTimeout(500)
    const f = await previewFrame(page)
    await f.fill('#t', 'abc')
    await f.click('button')
    await page.waitForTimeout(800)
    assert.equal(await (await previewFrame(page)).inputValue('#t'), 'abc', js)
    await page.close()
  }
})

// Colors as in VS Code's default dark theme (Dark+): tag blue, component teal, attribute light blue, string orange.
const colorsOf = (page, code, lang) => page.evaluate(async ([code, lang]) => {
  const d = document.createElement('div')
  d.className = 'monaco-editor'
  d.innerHTML = await window.monaco.editor.colorize(code, lang)
  document.body.append(d)
  const hex = (c) => '#' + c.match(/\d+/g).slice(0, 3).map((x) => (+x).toString(16).padStart(2, '0')).join('')
  const out = Object.fromEntries([...d.querySelectorAll('span span')].filter((s) => s.textContent.trim()).map((s) => [s.textContent.trim(), hex(getComputedStyle(s).color)]))
  d.remove()
  return out
}, [code, lang])

test('JSX, JSON and CSS get VS Code Dark+ colors', async () => {
  const page = await openSlide2()
  const jsx = await colorsOf(page, 'const x = <Card title="Hi" />\nconst y = <div></div>', 'jsx')
  assert.deepEqual([jsx.const, jsx.Card, jsx.title, jsx['"Hi"'], jsx.div], ['#569cd6', '#4ec9b0', '#9cdcfe', '#ce9178', '#569cd6'])
  const json = await colorsOf(page, '{ "name": "app", "n": 1 }', 'cp-json')
  assert.deepEqual([json['"name"'], json['"app"'], json['1']], ['#9cdcfe', '#ce9178', '#b5cea8'])
  const css = await colorsOf(page, '.card { color: red; }', 'css')
  assert.deepEqual([css['.card'], css.color, css.red], ['#d7ba7d', '#9cdcfe', '#ce9178'])
  await page.close()
})

test('if the VS Code colors cannot load, the editor still works with Monaco colors', async () => {
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } })
  await page.route('**/{shiki,@shikijs}*/**', (r) => r.abort())
  await page.goto(srv.url + DECK + '#2')
  await until(page, () => window.Livepad && window.Livepad.current() && window.Livepad.current().ready)
  assert.ok(await page.$('.slide.active .monaco-editor'))
  await page.keyboard.press('n')
  await until(page, () => /up to date/.test(window.Livepad.current().status))
  await page.close()
})
