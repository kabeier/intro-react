import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { serve, launch, until } from './helpers.mjs'

let srv, browser
before(async () => { srv = await serve(); browser = await launch() })
after(async () => { await browser?.close(); srv?.close() })

const DECK = '/tests/fixtures/livepad-demo.html'

async function open() {
  const context = await browser.newContext({ viewport: { width: 1600, height: 900 } })
  const page = await context.newPage()
  await page.goto(srv.url + DECK + '#2')
  await until(page, () => window.Livepad && window.Livepad.current() && window.Livepad.current().ready)
  return { context, page }
}
const isSplit = (page) => page.evaluate(() => document.querySelector('.slide.active .livepad').classList.contains('split'))
const popupHas = (popup, sel) => popup.evaluate((sel) => { const f = document.querySelector('iframe'); return !!(f && f.contentDocument && f.contentDocument.querySelector(sel)) }, sel)

test('A opens the live app beside the code, A closes it', async () => {
  const { context, page } = await open()
  assert.equal(await isSplit(page), false)
  await page.keyboard.press('a')
  assert.equal(await isSplit(page), true)
  const ratio = await page.evaluate(() => {
    const pad = document.querySelector('.slide.active .livepad').getBoundingClientRect()
    const pv = document.querySelector('.slide.active .lp-preview').getBoundingClientRect()
    return pv.width / pad.width
  })
  assert.ok(ratio >= 0.4, 'preview takes at least 40% of the pad, got ' + ratio)
  await page.keyboard.press('a')
  assert.equal(await isSplit(page), false)
  await context.close()
})

test('the split stays open on the next code slide', async () => {
  const { context, page } = await open()
  await page.keyboard.press('a')
  await page.keyboard.press('ArrowRight')
  await until(page, () => location.hash === '#3')
  assert.equal(await isSplit(page), true)
  await context.close()
})

test('A typed inside the editor is just a letter', async () => {
  const { context, page } = await open()
  await page.click('.slide.active .lp-editor')
  await page.keyboard.press('Control+End')
  await page.keyboard.type('a')
  assert.equal(await isSplit(page), false)
  const v = await page.evaluate(() => window.Livepad.current().editorValue)
  assert.ok(v.endsWith('a'))
  await context.close()
})

test('the button also toggles the split', async () => {
  const { context, page } = await open()
  await page.click('.slide.active .lp-app')
  assert.equal(await isSplit(page), true)
  await context.close()
})

test('Pop out opens a synced window; the split closes while it is open', async () => {
  const { context, page } = await open()
  await page.keyboard.press('a')
  const [popup] = await Promise.all([context.waitForEvent('page'), page.click('.slide.active .lp-pop')])
  await popup.waitForLoadState()
  await until(popup, () => { const f = document.querySelector('iframe'); return f && f.contentDocument && f.contentDocument.querySelector('h1') })
  assert.equal(await isSplit(page), false)
  assert.match(await page.textContent('.slide.active .lp-pop'), /open/)
  assert.match(await popup.textContent('.pop-title'), /slide 2/)
  await page.mouse.click(5, 5)
  await page.keyboard.press('n')
  const t0 = Date.now()
  await until(popup, () => { const f = document.querySelector('iframe'); return !!f.contentDocument.querySelector('.intro') }, null, 3000)
  assert.ok(Date.now() - t0 < 1500, 'popup followed within ~1 s')
  await context.close()
})

test('the pop-out window title is the page <title>, like a browser tab', async () => {
  const { context, page } = await open()
  const [popup] = await Promise.all([context.waitForEvent('page'), page.click('.slide.active .lp-pop')])
  await popup.waitForLoadState()
  await until(popup, () => document.title === 'Demo page')
  await context.close()
})

test('reloading the deck re-syncs the open pop-out; closing it reopens nothing', async () => {
  const { context, page } = await open()
  const [popup] = await Promise.all([context.waitForEvent('page'), page.click('.slide.active .lp-pop')])
  await popup.waitForLoadState()
  await page.mouse.click(5, 5)
  await page.keyboard.press('n')
  await until(popup, () => { const f = document.querySelector('iframe'); return !!(f.contentDocument && f.contentDocument.querySelector('.intro')) })
  await page.reload()
  await until(page, () => window.Livepad && window.Livepad.current() && window.Livepad.current().ready)
  await until(popup, () => { const f = document.querySelector('iframe'); return !!(f.contentDocument && f.contentDocument.querySelector('h1') && !f.contentDocument.querySelector('.intro')) })
  await until(page, () => /open/.test(document.querySelector('.slide.active .lp-pop').textContent))
  const pages = context.pages().length
  await popup.close()
  await until(page, () => /Pop out/.test(document.querySelector('.slide.active .lp-pop').textContent), null, 4000)
  await page.waitForTimeout(1200)
  assert.equal(context.pages().length, pages - 1)
  await context.close()
})

test('a pop-out that goes silent is shown as closed', async () => {
  const { context, page } = await open()
  const [popup] = await Promise.all([context.waitForEvent('page'), page.click('.slide.active .lp-pop')])
  await popup.waitForLoadState()
  await page.reload()
  await until(page, () => window.Livepad && window.Livepad.current() && window.Livepad.current().ready)
  await until(page, () => /open/.test(document.querySelector('.slide.active .lp-pop').textContent))
  await popup.evaluate(() => { BroadcastChannel.prototype.postMessage = function () {} })
  await popup.close()
  await until(page, () => /Pop out/.test(document.querySelector('.slide.active .lp-pop').textContent), null, 8000)
  await context.close()
})
