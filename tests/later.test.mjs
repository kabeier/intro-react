import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { readFileSync } from 'node:fs'
import { serve, launch, until } from './helpers.mjs'

const require = createRequire(import.meta.url)
const Course = require('../shared/course.js')
globalThis.Course = Course
for (const f of JSON.parse(readFileSync(new URL('../shared/course/manifest.json', import.meta.url)))) await import('../shared/course/' + f)

const stepOf = (lesson, ref) => {
  const [lid, sid] = ref.includes(':') ? ref.split(':') : [lesson.id, ref]
  const l = Course.get(lid)
  return l && l.features.flatMap((f) => f.steps).find((s) => s.id === sid)
}

// "For now" code (later:) says what replaces it and where; each fixes: points at real for-now code.
test('every later: has how and where, and every fixes: names a step that has later:', () => {
  let laters = 0
  for (const l of Course.all()) for (const f of l.features) for (const s of f.steps) {
    if (s.later) { laters++; assert.ok(s.later.how && s.later.where, `${l.id} ${s.id}`) }
    for (const r of s.fixes || []) assert.ok(stepOf(l, r)?.later, `${l.id} ${s.id} fixes ${r}`)
  }
  assert.ok(laters >= 8)
})

let srv, browser
before(async () => { srv = await serve(); browser = await launch() })
after(async () => { await browser?.close(); srv?.close() })

test('a code slide warns while for-now code is on screen, and says so when the right way replaces it', async () => {
  const deck = readFileSync(new URL('../lecture-12-router-pages/slides.html', import.meta.url), 'utf8')
  const idx = deck.slice(0, deck.indexOf('data-steps="f4s1')).split('<section class="slide').length - 1
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } })
  await page.goto(srv.url + '/lecture-12-router-pages/slides.html#' + idx)
  await until(page, () => window.Livepad && window.Livepad.current() && window.Livepad.current().ready, null, 30000)
  const notice = () => page.evaluate(() => { const b = document.querySelector('.slide.active .lp-later'); return b.hidden ? '' : b.className + ' ' + b.textContent })
  const step = async (k) => { await page.keyboard.press('n'); await until(page, (n) => window.Livepad.current().step === n, k, 10000) }
  await step(1)
  assert.equal(await notice(), '')
  await step(2)
  assert.match(await notice(), /warn .*For now, not the final way: Plain <a> links/)
  for (let k = 3; k <= 6; k++) await step(k)
  assert.match(await notice(), /fixed .*The right way now/)
  await page.close()
})
