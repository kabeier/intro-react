// Packages go in with npm install in a terminal on the slide, never by typing into package.json.
// Scripts ("cy:open", "deploy") are still written by hand.
import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { readFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { serve, launch, until, ROOT } from './helpers.mjs'

const require = createRequire(import.meta.url)
const Course = require('../shared/course.js')
globalThis.Course = Course
for (const f of JSON.parse(readFileSync(new URL('../shared/course/manifest.json', import.meta.url)))) await import('../shared/course/' + f)

const depsOf = (text) => { try { const p = JSON.parse(text); return { ...p.dependencies, ...p.devDependencies } } catch { return null } }
const scriptsOf = (text) => { try { return JSON.parse(text).scripts || {} } catch { return null } }

test('every step that adds a package is an npm install command, and names that package', () => {
  let installs = 0
  for (const lesson of Course.all()) {
    let prev = Course.filesAt(lesson, null), prevRun = null
    for (const s of lesson.features.flatMap((f) => f.steps)) {
      const now = Course.filesAt(lesson, s.id)
      if (s.file === 'package.json') {
        const before = depsOf(prev['package.json'] || '{}'), after = depsOf(now['package.json'])
        const added = Object.keys(after || {}).filter((k) => !(k in (before || {})))
        if (added.length) {
          installs++
          assert.match(s.run || '', /^npm install /, `${lesson.id} ${s.id} adds ${added} by typing into package.json`)
          for (const name of added) assert.ok(s.run.split(/\s+/).map((t) => t.replace(/(.)@.*/, '$1')).includes(name), `${lesson.id} ${s.id}: ${s.run} installs ${name}`)
          if (s.run !== prevRun) assert.ok(s.npm && s.npm.added > 0, `${lesson.id} ${s.id}: npm's real output`) // a two-package install: the output is on its first step
          assert.deepEqual(scriptsOf(now['package.json']), scriptsOf(prev['package.json']), `${lesson.id} ${s.id}: an install step does not touch scripts`)
        } else assert.ok(!s.run, `${lesson.id} ${s.id}: run only on steps that add a package`)
      } else assert.ok(!s.run, `${lesson.id} ${s.id}: run only on package.json`)
      prev = now; prevRun = s.run || null
    }
  }
  assert.ok(installs >= 6, 'axios, cypress, tailwind, bootstrap, router, gh-pages')
})

test('the presenter notes table shows the command in the terminal, one N for a two-package install', () => {
  const out = execFileSync('node', ['tools/gen-notes.mjs', '--check', 'lecture-9-tailwind/slides.html'], { cwd: ROOT }).toString()
  assert.match(out, /up to date/)
  const deck = readFileSync(new URL('../lecture-9-tailwind/slides.html', import.meta.url), 'utf8')
  const table = deck.match(/<!-- steps:utilities-tailwind:f1 -->([\s\S]*?)<!-- \/steps -->/)[1]
  assert.match(table, /terminal/)
  assert.match(table, /npm install tailwindcss @tailwindcss\/vite/)
  assert.equal((table.match(/<b>N \d+<\/b>/g) || []).length, 3, 'tailwind: install (1 press), vite.config.js, index.css')
})

let srv, browser
before(async () => { srv = await serve(); browser = await launch() })
after(async () => { await browser?.close(); srv?.close() })

async function openSlide(deck, lessonId, stepId) {
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } })
  await page.goto(srv.url + '/' + deck + '/slides.html')
  const n = await page.evaluate(([l, s]) => [...document.querySelectorAll('.slide')].findIndex((x) => { const p = x.querySelector('.livepad'); return p && p.dataset.lesson === l && p.dataset.steps.split(' ').includes(s) }) + 1, [lessonId, stepId])
  assert.ok(n > 0)
  await page.goto(srv.url + '/' + deck + '/slides.html#' + n)
  await page.reload()
  await until(page, () => window.Livepad && window.Livepad.current() && window.Livepad.current().ready)
  return page
}
const term = (page) => page.evaluate(() => {
  const t = document.querySelector('.slide.active .lp-term')
  return { shown: !!t && !t.hidden, text: t ? t.querySelector('.lp-term-lines').textContent : '' }
})
const cur = (page) => page.evaluate(() => { const c = window.Livepad.current(); return { files: c.files, step: c.step, busy: c.busy, editor: c.editorValue, tab: c.tab } })

test('N on the axios step runs npm install axios in the terminal; package.json changes by itself', async () => {
  const page = await openSlide('lecture-2-async-requests', 'async-requests', 'f1s1')
  assert.ok(await page.isVisible('.slide.active .lp-termb'), 'a Terminal button on the bar')
  await page.keyboard.press('n')
  await until(page, () => window.Livepad.current().step === 1 && !window.Livepad.current().busy)
  const t = await term(page)
  assert.ok(t.shown, 'the terminal opens')
  assert.match(t.text, /\$ npm install axios@1\.20\.0/, 'the same command as the curriculum')
  assert.match(t.text, /added 27 packages, and audited 52 packages/)
  assert.match(t.text, /found 0 vulnerabilities/)
  assert.ok(await page.evaluate(() => { const l = document.querySelector('.slide.active .lp-term-lines'), c = [...l.querySelectorAll('.lp-tl.cmd')].pop(); return c.offsetTop >= l.scrollTop && c.offsetTop + c.offsetHeight <= l.scrollTop + l.clientHeight }), 'the command line is in view')
  const s = await cur(page)
  assert.equal(s.files['package.json'], Course.filesAt(Course.get('async-requests'), 'f1s1')['package.json'])
  assert.equal(s.tab, 'package.json', 'package.json is shown, so everyone sees the new line')
  assert.equal(s.editor, s.files['package.json'])
  await page.close()
})

test('a student can type the command into the terminal instead', async () => {
  const page = await openSlide('lecture-2-async-requests', 'async-requests', 'f1s1')
  await page.click('.slide.active .lp-termb')
  await page.fill('.slide.active .lp-term-in', 'npm i axios')
  await page.press('.slide.active .lp-term-in', 'Enter')
  await until(page, () => window.Livepad.current().step === 1 && !window.Livepad.current().busy)
  assert.match((await cur(page)).files['package.json'], /"axios"/)
  await page.fill('.slide.active .lp-term-in', 'npm install lodash')
  await page.press('.slide.active .lp-term-in', 'Enter')
  assert.match((await term(page)).text, /lodash/)
  assert.doesNotMatch((await cur(page)).files['package.json'], /lodash/, 'other packages are not faked')
  await page.close()
})

test('a two-package install is one N; Reset clears the terminal', async () => {
  const page = await openSlide('lecture-9-tailwind', 'utilities-tailwind', 'f1s1')
  await page.keyboard.press('n')
  await until(page, () => !window.Livepad.current().busy && window.Livepad.current().step > 0)
  const s = await cur(page)
  assert.equal(s.step, 2)
  assert.equal(s.files['package.json'], Course.filesAt(Course.get('utilities-tailwind'), 'f1s2')['package.json'])
  assert.match((await term(page)).text, /npm install tailwindcss @tailwindcss\/vite/)
  await page.click('.slide.active .lp-reset')
  assert.equal((await cur(page)).step, 0)
  assert.doesNotMatch((await term(page)).text, /npm install/)
  await page.close()
})

test('typing in the terminal does not change slides or press N', async () => {
  const page = await openSlide('lecture-2-async-requests', 'async-requests', 'f1s1')
  await page.click('.slide.active .lp-termb')
  await page.click('.slide.active .lp-term-in')
  const hash = await page.evaluate(() => location.hash)
  await page.keyboard.type('n ')
  await page.keyboard.press('ArrowRight')
  assert.equal(await page.evaluate(() => location.hash), hash)
  assert.equal((await cur(page)).step, 0)
  await page.close()
})
