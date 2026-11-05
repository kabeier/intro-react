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

test("Bootstrap's gap-5 beats Tailwind's until `important`, like a real Vite build", async () => {
  const before = await open('utilities-bootstrap', 'f1s4')
  assert.equal(await settle(before.frame, '#poke-container', 'columnGap', '48px'), '48px')
  await before.page.close()
  const after = await open('utilities-bootstrap', 'f1')
  assert.equal(await settle(after.frame, '#poke-container', 'columnGap', '20px'), '20px')
  await after.page.close()
})

test('after the Bootstrap lecture the components are React Bootstrap and Tailwind keeps the layout', async () => {
  const { page, frame } = await open('utilities-bootstrap', 'f3')
  await until(page, () => { const f = [...document.querySelectorAll('iframe')].pop(); return f && f.contentDocument.querySelector('#pikachu-card.card') }, null, 30000)
  const look = await frame.evaluate(() => ({
    header: document.querySelector('header').className,
    input: document.querySelector('#pokemon-name').className,
    label: document.querySelector('label[for=pokemon-name]') !== null,
    search: document.querySelector('button[type=submit]').className,
    click: [...document.querySelectorAll('button')].find((b) => b.textContent === 'Click me!').className,
  }))
  assert.match(look.header, /\bcard\b.*\bbg-dark\b|\bbg-dark\b.*\bcard\b/)
  assert.match(look.input, /\bform-control\b/)
  assert.ok(look.label, 'the label is linked to the input')
  assert.match(look.search, /\bbtn-success\b/)
  assert.match(look.click, /\bbtn-primary\b/)
  assert.equal(await settle(frame, '#poke-container', 'display', 'flex'), 'flex')
  assert.equal(await settle(frame, '#poke-container', 'columnGap', '20px'), '20px')
  assert.equal(await settle(frame, 'main', 'maxWidth', '1024px'), '1024px')
  await page.close()
})

test('React Bootstrap components render (react-bootstrap/Card etc.) with one React', async () => {
  const { page, frame } = await open('utilities-bootstrap', 'f2')
  await until(page, () => { const f = [...document.querySelectorAll('iframe')].pop(); return f && f.contentDocument.querySelector('#pikachu-card.card .badge') }, null, 30000)
  assert.match(await frame.evaluate(() => document.querySelector('#pikachu-card').textContent), /Pokédex #25/)
  const errors = await page.evaluate(() => document.querySelector('.lp-console')?.textContent || '')
  assert.doesNotMatch(errors, /Invalid hook call|more than one copy of React/)
  await page.close()
})

test('without tailwindcss() in vite.config.js nothing is styled, like Vite', async () => {
  const lesson = Course.get('utilities-tailwind')
  const files = { ...Course.checkpoint(lesson, 'f4'), 'vite.config.js': "import react from '@vitejs/plugin-react'\nimport { defineConfig } from 'vite'\n\nexport default defineConfig({\n  plugins: [react()],\n})" }
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } })
  await page.goto(srv.url + '/tests/fixtures/mount.html')
  await page.evaluate(([f]) => window.mountFiles(f, {}), [files])
  await until(page, () => { const f = [...document.querySelectorAll('iframe')].pop(); return f && f.contentDocument.querySelector('header h1') }, null, 30000)
  const frame = page.frames().find((f) => f !== page.mainFrame() && f.url() === 'about:srcdoc')
  await new Promise((r) => setTimeout(r, 3000))
  assert.equal(await style(frame, '#poke-container', 'display'), 'block')
  await page.close()
})
