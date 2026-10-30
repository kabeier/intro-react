import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { serve, launch, until } from './helpers.mjs'

let srv, browser
before(async () => { srv = await serve(); browser = await launch() })
after(async () => { await browser?.close(); srv?.close() })

test('State Hunt: 30 live boxes, answers match each box\'s useState lines, controls work', async () => {
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } })
  const errs = []
  page.on('pageerror', (e) => errs.push(e.message))
  page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()) })
  await page.goto(srv.url + '/state-hunt/index.html')
  await until(page, () => document.querySelectorAll('.box').length === 30, null, 30000)
  assert.equal(await page.locator('.ans').count(), 0, 'answers start hidden')

  await page.click('.bar button:has-text("Show all answers")')
  const boxes = await page.evaluate(() => [...document.querySelectorAll('.box')].map((b) => ({
    n: b.querySelector('.n').textContent, widget: b.querySelector('.w').children.length,
    state: b.querySelectorAll('.ans .yes li').length, code: [...b.querySelectorAll('.ans code')].map((c) => c.textContent) })))
  for (const b of boxes) {
    assert.ok(b.widget > 0, `box ${b.n} renders`)
    assert.ok(b.state >= 1 && b.state <= 2, `box ${b.n} has 1 or 2 pieces of state`)
    assert.equal(b.code.length, b.state, `box ${b.n}: one useState line per piece of state (${b.code.join(' | ')})`)
  }
  assert.deepEqual(boxes.map((b) => b.n), Array.from({ length: 30 }, (_, i) => String(i + 1)))

  // the widgets are live
  await page.click('#box-2 .w button:has-text("+")')
  assert.equal(await page.textContent('#box-2 .big'), '1')
  await page.click('#box-8 .w button:has-text("+")')
  assert.match(await page.textContent('#box-8 .w'), /Total: \$24/)
  await page.fill('#box-26 .w input', 'an')
  assert.equal(await page.textContent('#box-26 .w .muted'), 'banana, mango')

  // go to a box, reset
  await page.click('.bar button:has-text("Hide all answers")')
  await page.fill('.bar input', '17')
  await page.press('.bar input', 'Enter')
  assert.equal(await page.locator('#box-17.focus').count(), 1)
  await page.click('#box-17 footer button')
  assert.equal(await page.locator('.ans').count(), 1, 'one answer revealed')
  await page.click('.bar button:has-text("Reset every box")')
  assert.equal(await page.textContent('#box-2 .big'), '0')
  assert.equal(await page.locator('.ans').count(), 0)

  // phone width: no sideways scroll
  await page.setViewportSize({ width: 390, height: 800 })
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= 390), 'no horizontal scroll on a phone')
  assert.deepEqual(errs, [])
  await page.close()
})
