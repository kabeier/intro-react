import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { createRequire } from 'node:module'
import path from 'node:path'
import { serve, launch, until, ROOT } from './helpers.mjs'

const require = createRequire(import.meta.url)
const Course = require('../shared/course.js')
globalThis.Course = Course
for (const f of JSON.parse(readFileSync(new URL('../shared/course/manifest.json', import.meta.url)))) await import('../shared/course/' + f)
await import('../shared/course/code-repo.js')
globalThis.window = globalThis.window || {}
new Function('window', readFileSync(path.join(ROOT, 'code-repo/lectures.js'), 'utf8'))(globalThis.window)
const rows = globalThis.window.LECTURES

let srv, browser
before(async () => { srv = await serve(); browser = await launch() })
after(async () => { await browser?.close(); srv?.close() })

test('every lecture has a row, and each starts from the branch of the lecture before it', () => {
  assert.deepEqual(rows.map((r) => r.id), Course.all().map((l) => l.id))
  const main = rows.filter((r) => r.label.startsWith('Unit'))
  assert.equal(main.length, 16)
  assert.equal(main[0].start, 'start')
  for (let k = 1; k < main.length; k++) assert.equal(main[k].start, main[k - 1].branch, main[k].id)
  assert.equal(new Set(rows.map((r) => r.branch)).size, rows.length, 'one branch per lecture')
  for (const r of rows) assert.equal(r.branch, Course.codeRepo.branch(Course.get(r.id)))
})

test('the repo has exactly those branches, and no Claude in its history', { skip: !existsSync(path.join(ROOT, '..', 'intro-react-code/.git')) }, () => {
  const cwd = path.join(ROOT, '..', 'intro-react-code')
  const branches = execFileSync('git', ['for-each-ref', '--format=%(refname:short)', 'refs/heads'], { cwd, encoding: 'utf8' }).trim().split('\n').filter((b) => !b.startsWith('origin'))
  for (const r of rows) { assert.ok(branches.includes(r.branch), r.branch); assert.ok(branches.includes(r.start), r.start) }
  assert.ok(branches.includes('main'))
  assert.doesNotMatch(execFileSync('git', ['log', '--all', '--format=%an %ae %s %b'], { cwd, encoding: 'utf8' }), /claude|anthropic/i)
  assert.equal(execFileSync('git', ['rev-parse', 'main'], { cwd, encoding: 'utf8' }), execFileSync('git', ['rev-parse', rows.find((r) => r.id === 'ci-actions').branch], { cwd, encoding: 'utf8' }), 'main is the finished app')
})

test('the page: pick a lecture and get its commands; the Explorer links to the right lecture', async () => {
  const page = await browser.newPage({ viewport: { width: 1300, height: 900 } })
  const errs = []
  page.on('pageerror', (e) => errs.push(e.message))
  await page.goto(srv.url + '/explore.html?lesson=hooks-usestate&at=f2')
  await page.waitForSelector('.ex-get')
  await page.click('.ex-get')
  await page.waitForFunction(() => document.querySelector('#start-cmd') && document.querySelector('#start-cmd').textContent)
  assert.equal(await page.inputValue('#lecture'), 'hooks-usestate')
  assert.equal(await page.textContent('#start-cmd'), 'git switch unit-3-lecture-2-cypress-assertions\ngit switch -c my-unit-4-lecture-1\nnpm install')
  assert.equal(await page.textContent('#end-cmd'), 'git switch unit-4-lecture-1-hooks-usestate\nnpm install')
  assert.match(await page.textContent('#explain'), /Unit 3 · Lecture 2/)
  assert.equal(await page.locator('#all tr.on').count(), 1)
  await page.selectOption('#lecture', 'react-vite')
  assert.match(await page.textContent('#start-cmd'), /^git switch start\n/)
  assert.match(await page.textContent('#explain'), /create-vite template/)
  await page.selectOption('#lecture', 'extra-css-modules')
  assert.match(await page.textContent('#start-cmd'), /^git switch start-optional-css-modules\ngit switch -c my-optional\n/)
  assert.equal(await page.locator('#all tr[data-id]').count(), 17)
  await page.setViewportSize({ width: 390, height: 800 })
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= 390), 'no sideways scroll on a phone')
  await page.goto(srv.url + '/explore.html?view=commands')
  assert.equal(await page.locator('.ex-repo-link').first().getAttribute('href'), 'code-repo/')
  assert.deepEqual(errs, [])
  await page.close()
})
