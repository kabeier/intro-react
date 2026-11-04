// Buttons on the code slide (for students following along) and in the presenter window:
// "Next line" does what N does, "Reset" does what Shift+N does.
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
const START = Course.filesAt(lesson, 'f1s1')
const state = (page) => page.evaluate(() => { const c = window.Livepad.current(); return { files: c.files, status: c.status, editor: c.editorValue, tab: c.tab } })
const cur = (page) => page.evaluate(() => { const c = window.Livepad.current(); return { files: c.files, step: c.step, busy: c.busy, status: c.status, editor: c.editorValue, tab: c.tab } })
const btn = (page, cls) => page.evaluate((cls) => { const b = document.querySelector('.slide.active .livepad ' + cls); return b && { shown: !b.hidden && b.offsetWidth > 0, disabled: b.disabled, text: b.textContent } }, cls)

async function open(hash = '#2') {
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } })
  await page.goto(srv.url + DECK + hash)
  await until(page, () => window.Livepad && window.Livepad.current() && window.Livepad.current().ready)
  return page
}

test('a code slide has Next line and Reset buttons; Next line types the steps one by one', async () => {
  const page = await open()
  assert.ok((await btn(page, '.lp-next')).shown, 'Next line is on the slide')
  assert.ok((await btn(page, '.lp-reset')).shown, 'Reset is on the slide')
  assert.match((await btn(page, '.lp-next')).text, /Next line/)
  for (let k = 1; k <= 3; k++) {
    await page.click('.slide.active .lp-next')
    await until(page, (k) => window.Livepad.current().step === k && !window.Livepad.current().busy, k)
  }
  const s = await cur(page)
  assert.deepEqual(s.files, Course.filesAt(lesson, 'f2s3'))
  assert.equal(s.editor, s.files[s.tab])
  assert.ok((await btn(page, '.lp-next')).disabled, 'nothing left to type: Next line is greyed out')
  await page.close()
})

test('Reset puts the code back to how the slide started and the steps start over', async () => {
  const page = await open()
  await page.click('.slide.active .lp-next'); await until(page, () => window.Livepad.current().step === 1 && !window.Livepad.current().busy)
  await page.click('.slide.active .lp-next'); await until(page, () => window.Livepad.current().step === 2 && !window.Livepad.current().busy)
  await page.click('.slide.active .lp-reset')
  let s = await cur(page)
  assert.equal(s.step, 0)
  assert.deepEqual(s.files, START)
  assert.equal(s.editor, s.files[s.tab], 'the editor shows the start code')
  assert.ok(!(await btn(page, '.lp-next')).disabled)
  await page.click('.slide.active .lp-next'); await until(page, () => window.Livepad.current().step === 1 && !window.Livepad.current().busy)
  assert.deepEqual((await cur(page)).files, Course.filesAt(lesson, lesson.features.flatMap((f) => f.steps)[1].id), 'the first step again')
  await page.close()
})

test('Reset also undoes hand edits, clears the "can\'t apply" message, and stops a step mid-typing', async () => {
  const page = await open()
  await page.evaluate(() => { const p = window.Livepad.pads.find((x) => x.el.closest('.slide.active')); p.setFiles({ ...p.files, 'index.html': '<p>changed by hand</p>' }) })
  await page.click('.slide.active .lp-next')
  await until(page, () => /can't apply/.test(window.Livepad.current().status))
  await page.click('.slide.active .lp-reset')
  await until(page, () => /up to date/.test(window.Livepad.current().status))
  assert.deepEqual((await cur(page)).files, START)

  await page.click('.slide.active .lp-next')
  await page.click('.slide.active .lp-reset') // while it is still typing
  await page.waitForTimeout(1500)
  const s = await cur(page)
  assert.equal(s.busy, false)
  assert.equal(s.step, 0)
  assert.deepEqual(s.files, START, 'the half-typed step is gone, and it does not finish typing later')
  assert.equal(s.editor, s.files[s.tab])
  await page.close()
})

test('the buttons do not steal the arrow keys: after a click, arrows still change slides', async () => {
  const page = await open()
  await page.click('.slide.active .lp-next'); await until(page, () => !window.Livepad.current().busy)
  await page.keyboard.press('ArrowRight')
  await until(page, () => location.hash === '#3')
  assert.ok(!(await btn(page, '.lp-next')).shown && !(await btn(page, '.lp-reset')).shown, 'a pad with no steps shows neither button')
  await page.close()
})

test('presenter: a Reset button next to "Type next step" does what Shift+N does', async () => {
  const context = await browser.newContext({ viewport: { width: 1600, height: 900 } })
  const page = await context.newPage()
  await page.goto(srv.url + DECK + '#2')
  await until(page, () => window.Livepad && window.Livepad.current() && window.Livepad.current().ready)
  const notes = await context.newPage()
  await notes.goto(srv.url + DECK + '?presenter#2')
  await notes.waitForSelector('#stepb:visible')
  await notes.waitForSelector('#padreset:visible')
  await notes.click('#stepb'); await until(page, () => window.Livepad.current().step === 1 && !window.Livepad.current().busy)
  await notes.click('#stepb'); await until(page, () => window.Livepad.current().step === 2 && !window.Livepad.current().busy)
  await until(notes, () => /2 of 3/.test(document.querySelector('#stepinfo').textContent))
  await notes.click('#padreset')
  await until(page, () => window.Livepad.current().step === 0)
  assert.deepEqual((await cur(page)).files, START)
  await until(notes, () => /0 of 3/.test(document.querySelector('#stepinfo').textContent))
  await context.close()
})

// The presenter window's "Type next step" button (same as in the HTML/CSS/DOM site).
async function openWithPresenter(hash = '#2') {
  const context = await browser.newContext({ viewport: { width: 1600, height: 900 } })
  const page = await context.newPage()
  await page.goto(srv.url + DECK + hash)
  await until(page, () => window.Livepad && window.Livepad.current() && window.Livepad.current().ready)
  const notes = await context.newPage()
  await notes.goto(srv.url + DECK + '?presenter' + hash)
  return { context, page, notes }
}
const stepCount = (page) => page.evaluate(() => window.Livepad.current().step)

test('presenter: the button types the next step, like N, and shows the step count', async () => {
  const { context, page, notes } = await openWithPresenter()
  await notes.waitForSelector('#stepb:visible')
  assert.match(await notes.textContent('#stepinfo'), /0 of 3/)
  await notes.click('#stepb')
  await until(page, () => window.Livepad.current().step === 1 && !window.Livepad.current().busy)
  assert.match((await state(page)).files['index.html'], /intro/)
  await until(notes, () => /1 of 3/.test(document.querySelector('#stepinfo').textContent))
  await notes.keyboard.press('n')
  await until(page, () => window.Livepad.current().step === 2 && !window.Livepad.current().busy)
  await notes.click('#stepb')
  await until(page, () => window.Livepad.current().step === 3 && !window.Livepad.current().busy)
  await until(notes, () => document.querySelector('#stepb').disabled && /All 3 steps/.test(document.querySelector('#stepinfo').textContent))
  await context.close()
})

test('presenter: N in the slides window updates the count; a slide without steps hides the button', async () => {
  const { context, page, notes } = await openWithPresenter()
  await notes.waitForSelector('#stepb:visible')
  await page.keyboard.press('n')
  await until(notes, () => /1 of 3/.test(document.querySelector('#stepinfo').textContent))
  await notes.keyboard.press('ArrowRight')
  await notes.waitForSelector('#stepb', { state: 'hidden' })
  await notes.keyboard.press('ArrowLeft'); await notes.keyboard.press('ArrowLeft')
  await until(notes, () => /Slide one/.test(document.querySelector('.now').textContent))
  await notes.waitForSelector('#stepb', { state: 'hidden' })
  await notes.keyboard.press('n')
  await notes.waitForTimeout(200)
  await notes.keyboard.press('ArrowRight')
  await notes.waitForSelector('#stepb:visible')
  assert.equal(await stepCount(page), 1, 'n on a slide with no pad does nothing')
  await context.close()
})

test('presenter: a step that no longer fits says so in the presenter window', async () => {
  const { context, page, notes } = await openWithPresenter()
  await notes.waitForSelector('#stepb:visible')
  await page.evaluate(() => { const p = window.Livepad.pads.find((x) => x.el.closest('.slide.active')); p.setFiles({ ...p.files, 'index.html': '<p>changed by hand</p>' }) })
  await notes.click('#stepb')
  await until(notes, () => /can't apply/.test(document.querySelector('#stepinfo').textContent))
  assert.equal(await stepCount(page), 0)
  await context.close()
})

