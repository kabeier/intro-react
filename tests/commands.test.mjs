import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { serve, launch, until, ROOT } from './helpers.mjs'

globalThis.Course = globalThis.Course || {}
await import(ROOT + '/shared/course/commands.js')
const C = globalThis.Course.commands
const cmds = C.groups.flatMap((g) => g.commands)

test('commands: every part is in its command, in order, and is explained', () => {
  for (const c of cmds) {
    let i = 0
    for (const [p, means, change] of c.parts) {
      const at = c.cmd.indexOf(p, i)
      assert.ok(at >= 0, `"${p}" in order in: ${c.cmd}`)
      assert.ok(means && change, `${c.cmd}: ${p} explained`)
      i = at + p.length
    }
    assert.ok(['both', 'docker', 'laptop'].includes(c.track), c.cmd)
    assert.ok(c.does, c.cmd)
  }
})

test('commands: every command on the landing page (homework) is in the list', () => {
  const html = readFileSync(ROOT + '/index.html', 'utf8')
  const blocks = [...html.matchAll(/<pre[^>]*>([\s\S]*?)<\/pre>/g)].map((m) => m[1].replace(/<[^>]+>/g, '').replace(/&amp;/g, '&'))
  const lines = blocks.flatMap((b) => b.split('\n')).map((l) => l.trim().replace(/my-project/g, 'pokemon-app')).filter(Boolean)
  assert.ok(lines.length >= 8)
  for (const l of lines) assert.ok(cmds.some((c) => c.cmd === l), 'in the command list: ' + l)
})

let srv, browser
before(async () => { srv = await serve(); browser = await launch() })
after(async () => { await browser?.close(); srv?.close() })

test('Code Explorer: Terminal commands view filters by setup and explains any part', async () => {
  const page = await browser.newPage({ viewport: { width: 1500, height: 900 } })
  const errs = []
  page.on('pageerror', (e) => errs.push(e.message))
  await page.goto(srv.url + '/explore.html?lesson=react-vite&at=f1')
  await page.click('.ex-cmd-link')
  await until(page, () => document.querySelectorAll('.ex-cmd').length > 0)
  assert.equal(await page.locator('.ex-cmd').count(), cmds.length)
  await page.click('.ex-track button[data-track="docker"]')
  const docker = await page.locator('.ex-cmd').count()
  assert.equal(docker, cmds.filter((c) => c.track !== 'laptop').length)
  assert.equal(await page.locator('.ex-cmd:has-text("npm run dev") .ex-badge.t-laptop').count(), 0, 'npm run dev is hidden with Docker')
  await page.click('.ex-track button[data-track="laptop"]')
  assert.equal(await page.locator('.ex-cmd').count(), cmds.filter((c) => c.track !== 'docker').length)
  await page.click('.ex-track button[data-track="all"]')
  await page.locator('.ex-part', { hasText: '-v /app/node_modules' }).click()
  assert.match(await page.textContent('.ex-story'), /own node_modules/)
  assert.match(await page.textContent('.ex-story'), /vite: not found/)
  // the lectures are one click away
  await page.click('.ex-lesson >> nth=0')
  await until(page, () => document.querySelectorAll('.ex-line').length > 0)
  await page.setViewportSize({ width: 390, height: 800 })
  await page.goto(srv.url + '/explore.html?view=commands')
  await until(page, () => document.querySelectorAll('.ex-cmd').length > 0)
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= 390), 'no sideways scroll on a phone')
  assert.deepEqual(errs, [])
  await page.close()
})
