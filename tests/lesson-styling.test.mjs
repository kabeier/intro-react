import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { readFileSync } from 'node:fs'
import { serve, launch, until } from './helpers.mjs'

const require = createRequire(import.meta.url)
const Course = require('../shared/course.js')
globalThis.Course = Course
for (const f of JSON.parse(readFileSync(new URL('../shared/course/manifest.json', import.meta.url)))) await import('../shared/course/' + f)

let srv, browser
before(async () => { srv = await serve(); browser = await launch() })
after(async () => { await browser?.close(); srv?.close() })

// The checkpoint at a step, mounted in the preview; returns the app's frame.
async function open(lessonId, at) {
  const lesson = Course.get(lessonId)
  const files = /s\d+$/.test(at) ? Course.filesAt(lesson, at) : Course.checkpoint(lesson, at)
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } })
  await page.goto(srv.url + '/tests/fixtures/mount.html')
  await page.evaluate(([f]) => window.mountFiles(f, {}), [files])
  await until(page, () => { const f = [...document.querySelectorAll('iframe')].pop(); return f && f.contentDocument.querySelector('header h1') }, null, 30000)
  const frame = page.frames().find((f) => f !== page.mainFrame() && f.url() === 'about:srcdoc')
  return { page, frame }
}
const style = (frame, sel, prop) => frame.evaluate(([s, p]) => { const e = document.querySelector(s); return e && getComputedStyle(e)[p] }, [sel, prop])
const settle = async (frame, sel, prop, want) => { for (let i = 0; i < 100; i++) { if ((await style(frame, sel, prop)) === want) return want; await new Promise((r) => setTimeout(r, 100)) } return style(frame, sel, prop) }

test('Tailwind compiles in the preview: utility classes apply', async () => {
  const { page, frame } = await open('utilities-tailwind', 'f4')
  assert.equal(await settle(frame, '#poke-container', 'display', 'flex'), 'flex')
  assert.equal(await settle(frame, 'header h1', 'fontWeight', '700'), '700')
  assert.equal(await settle(frame, 'button[type=submit]', 'borderRadius', '6px'), '6px')
  await page.close()
})

test('Bootstrap CSS beats Tailwind until `important`, like a real Vite build', async () => {
  const before = await open('utilities-bootstrap', 'f1s4')
  assert.equal(await settle(before.frame, 'header h1', 'fontWeight', '500'), '500')
  assert.equal(await settle(before.frame, 'button[type=submit]', 'borderRadius', '0px'), '0px')
  await before.page.close()
  const after = await open('utilities-bootstrap', 'f1')
  assert.equal(await settle(after.frame, 'header h1', 'fontWeight', '700'), '700')
  assert.equal(await settle(after.frame, 'button[type=submit]', 'borderRadius', '6px'), '6px')
  await after.page.close()
})

test('React Bootstrap components render (react-bootstrap/Card etc.) with one React', async () => {
  const { page, frame } = await open('utilities-bootstrap', 'f2')
  await until(page, () => { const f = [...document.querySelectorAll('iframe')].pop(); return f && f.contentDocument.querySelector('#pikachu-card.card .badge') }, null, 30000)
  assert.match(await frame.evaluate(() => document.querySelector('#pikachu-card').textContent), /Pokédex #25/)
  const errors = await page.evaluate(() => document.querySelector('.lp-console')?.textContent || '')
  assert.doesNotMatch(errors, /Invalid hook call|more than one copy of React/)
  await page.close()
})
