import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { readFileSync } from 'node:fs'
import { serve, launch, until } from './helpers.mjs'

const require = createRequire(import.meta.url)
const Course = require('../shared/course.js')
globalThis.Course = Course
for (const f of JSON.parse(readFileSync(new URL('../shared/course/manifest.json', import.meta.url)))) await import('../shared/course/' + f)
await import('../shared/course/react-vite-fixit.js')
await import('../shared/course/async-requests-fixit.js')
await import('../shared/course/cypress-react-fixit.js')
await import('../shared/course/cypress-assertions-fixit.js')
await import('../shared/course/hooks-usestate-fixit.js')
await import('../shared/course/hooks-useeffect-fixit.js')

let srv, browser
before(async () => { srv = await serve(); browser = await launch() })
after(async () => { await browser?.close(); srv?.close() })

const solution = (p, l) => {
  const files = { ...Course.checkpoint(l, p.base) }
  for (const s of p.solve || []) files[s.file] = Course.applyStep(files[s.file], s)
  return files
}
async function open(lessonId, id) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } })
  const page = await context.newPage()
  page.on('dialog', (d) => d.dismiss())
  await page.goto(srv.url + '/fixit.html?lesson=' + lessonId + '&p=' + id)
  await until(page, () => window.FixIt && window.FixIt.ready)
  return { context, page }
}
const press = async (page) => {
  await page.click('.fx-fix')
  return until(page, () => { const r = document.querySelector('.fx-result'); return r && /Fixed|Still broken/.test(r.textContent) && r.textContent }, null, 240000)
}

for (const lessonId of ['react-vite', 'async-requests', 'cypress-react', 'cypress-assertions', 'hooks-usestate', 'hooks-useeffect']) {
  const problems = globalThis.FIXIT[lessonId]
  const lesson = Course.get(lessonId)
  test(lessonId + ': 10 problems, first 6 core', () => {
    assert.equal(problems.length, 10)
    for (const p of problems.slice(6)) assert.match(p.title, /^Bonus:/)
    for (const p of problems.slice(0, 6)) assert.doesNotMatch(p.title, /^Bonus:/)
  })
  test(lessonId + ': each broken app fails, and the solution passes', async () => {
    for (const p of problems) {
      const { context, page } = await open(lessonId, p.id)
      assert.match(await press(page), /Still broken/, p.id + ' broken fails')
      await page.evaluate((f) => window.FixIt.setFiles(f), solution(p, lesson))
      assert.match(await press(page), /Fixed!/, p.id + ' solution passes')
      await context.close()
    }
  })
}

test('no real pop-up appears while checking', async () => {
  const { context, page } = await open('async-requests', 'alert')
  let dialogs = 0
  page.on('dialog', () => dialogs++)
  await page.evaluate((f) => window.FixIt.setFiles(f), Course.checkpoint(Course.get('async-requests'), 'f7'))
  assert.match(await press(page), /Fixed!/)
  assert.equal(dialogs, 0)
  await context.close()
})
