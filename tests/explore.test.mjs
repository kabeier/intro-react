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

test('the explorer runs a React lesson: App.jsx first, live preview, line stories with arguments', async () => {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
  await page.goto(srv.url + '/explore.html?lesson=async-requests&at=f7')
  await until(page, () => { const f = document.querySelector('.ex-preview iframe'); return f && f.contentDocument && f.contentDocument.querySelector('#pokemon-name') }, null, 20000)
  assert.equal(await page.getAttribute('.ex-tab.on', 'data-file'), 'src/App.jsx')
  const lines = Course.checkpoint(Course.get('async-requests'), 'f7')['src/App.jsx'].split('\n')
  await page.click(`.ex-code .ex-line[data-line="${lines.findIndex((l) => l.includes('await axios.get')) + 1}"]`)
  const story = await page.textContent('.ex-story')
  assert.match(story, /Waits for the request/)
  assert.match(story, /How to pick it/)
  await page.close()
})

test('lecture 2.1 lines inherited by lecture 2.2 link back to lecture 2.1', async () => {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
  await page.goto(srv.url + '/explore.html?lesson=async-requests&at=f1')
  await until(page, () => !!document.querySelector('.ex-code'), null, 20000)
  const lines = Course.checkpoint(Course.get('async-requests'), 'f1')['src/App.jsx'].split('\n')
  await page.click(`.ex-code .ex-line[data-line="${lines.findIndex((l) => l.includes('export default App')) + 1}"]`)
  assert.match(await page.textContent('.ex-story'), /Unit 2 · Lecture 1/)
  assert.ok(await page.$('.ex-story a[href*="lesson=react-vite"]'))
  await page.close()
})
