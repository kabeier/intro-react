import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { serve, launch, until } from './helpers.mjs'

let srv, browser
before(async () => { srv = await serve(); browser = await launch() })
after(async () => { await browser?.close(); srv?.close() })

// Lecture 13, slide 5: the details page exists, so /pokemon/25 is a real route.
const DECK = '/lecture-13-router-hooks/slides.html#5'

async function open() {
  const context = await browser.newContext({ viewport: { width: 1600, height: 900 } })
  const page = await context.newPage()
  await page.goto(srv.url + DECK)
  await until(page, () => window.Livepad && window.Livepad.current() && window.Livepad.current().ready, null, 20000)
  return { context, page }
}
const previewPath = (page) => page.evaluate(() => {
  const f = document.querySelector('.slide.active .lp-preview iframe')
  const r = f && f.contentWindow && f.contentWindow.__ROUTER
  return r ? r.state.location.pathname : null
})

test('an app with a router shows a typeable address bar', async () => {
  const { context, page } = await open()
  await page.keyboard.press('a')
  assert.equal(await page.isVisible('.slide.active .lp-addr'), true)
  assert.equal(await page.inputValue('.slide.active .lp-url'), 'localhost:5173/')
  await context.close()
})

test('typing a path + Enter loads that page; letters typed there are not shortcuts', async () => {
  const { context, page } = await open()
  await page.keyboard.press('a')
  const step = await page.evaluate(() => window.Livepad.current().step)
  await page.click('.slide.active .lp-url')
  await page.keyboard.press('Control+a')
  await page.keyboard.type('localhost:5173/pokemon/25')
  await page.keyboard.press('Enter')
  await until(page, () => {
    const f = document.querySelector('.slide.active .lp-preview iframe')
    return f.contentWindow.__ROUTER && f.contentWindow.__ROUTER.state.location.pathname === '/pokemon/25'
  })
  assert.equal(await previewPath(page), '/pokemon/25')
  assert.equal(await page.evaluate(() => window.Livepad.current().step), step, 'n in "pokemon" did not run a step')
  assert.equal(await page.inputValue('.slide.active .lp-url'), 'localhost:5173/pokemon/25')
  await context.close()
})

test('a bare path without the slash works too', async () => {
  const { context, page } = await open()
  await page.keyboard.press('a')
  await page.fill('.slide.active .lp-url', 'about')
  await page.press('.slide.active .lp-url', 'Enter')
  await until(page, () => {
    const f = document.querySelector('.slide.active .lp-preview iframe')
    return f.contentWindow.__ROUTER && f.contentWindow.__ROUTER.state.location.pathname === '/about'
  })
  await context.close()
})

test('the pop-out has the address bar too, and typing there moves both', async () => {
  const { context, page } = await open()
  const [popup] = await Promise.all([context.waitForEvent('page'), page.click('.slide.active .lp-pop')])
  await popup.waitForLoadState()
  await until(popup, () => !document.querySelector('.pop-addr').hidden)
  assert.equal(await popup.inputValue('.pop-addr'), 'localhost:5173/')
  await popup.fill('.pop-addr', '/about')
  await popup.press('.pop-addr', 'Enter')
  await until(popup, () => {
    const f = document.querySelector('iframe')
    return f.contentWindow.__ROUTER && f.contentWindow.__ROUTER.state.location.pathname === '/about'
  })
  await until(page, () => document.querySelector('.slide.active .lp-url').value === 'localhost:5173/about')
  assert.equal(await popup.inputValue('.pop-addr'), 'localhost:5173/about')
  await context.close()
})
