import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { readFileSync } from 'node:fs'
import { serve, launch, until } from './helpers.mjs'

const require = createRequire(import.meta.url)
const Course = require('../shared/course.js')
globalThis.Course = Course
for (const f of JSON.parse(readFileSync(new URL('../shared/course/manifest.json', import.meta.url)))) await import('../shared/course/' + f)
const lesson = Course.get('async-requests')
const steps = lesson.features.flatMap((f) => f.steps)
const notes = steps.flatMap((s) => s.notes || [])
const lines = (code) => code.replace(/\n$/, '').split('\n').length

test('starts from the end of lecture 2.1', () => {
  assert.deepEqual(Course.filesAt(lesson, null), Course.checkpoint(Course.get('react-vite'), 'f7'))
})

test('features f1..f7; every step applies, is short, has a say', () => {
  assert.deepEqual(lesson.features.map((f) => f.id), ['f1', 'f2', 'f3', 'f4', 'f5', 'f6', 'f7'])
  for (const s of steps) {
    assert.doesNotThrow(() => Course.filesAt(lesson, s.id), s.id)
    assert.ok(lines(s.code) <= 6, s.id + ' short')
    assert.ok(s.say, s.id + ' say')
  }
})

test('every new idea has a note', () => {
  for (const k of ['"axios"', 'htmlFor=', 'onSubmit={', 'event.preventDefault()', 'Object.fromEntries', '.toLowerCase()', 'if (!name) return', "import axios from 'axios'",
    'axios.get(', '.then(', '.catch(', '.finally(', 'response.data', 'event.target.reset()', 'createElement', 'data.sprites.front_default', 'async (name)', 'await axios.get',
    'try {', '} catch (error) {', '} finally {', 'alert(', 'getElementById(`${data.name}-card`)', 'display: flex'])
    assert.ok(notes.some((n) => n.match.includes(k) || k.includes(n.match)), 'note for ' + k)
})

let srv, browser
before(async () => { srv = await serve(); browser = await launch() })
after(async () => { await browser?.close(); srv?.close() })

test('the finished app works against the real PokeAPI', async () => {
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } })
  await page.goto(srv.url + '/tests/fixtures/mount.html')
  await page.evaluate(([f, a]) => window.mountFiles(f, a), [Course.checkpoint(lesson, 'f7'), lesson.assets || {}])
  await page.keyboard.press('a')
  assert.equal(await page.evaluate(() => document.querySelector('.lp-tab').dataset.file), 'src/App.jsx', 'App.jsx is the first tab')
  await until(page, () => !!document.querySelector('.lp-preview iframe').contentDocument.querySelector('#pokemon-name'), null, 20000)
  const f = page.frames().find((x) => x.url() === 'about:srcdoc')
  const alerts = []
  page.on('dialog', (d) => { alerts.push(d.message()); d.dismiss() })
  const search = async (name) => { await f.fill('#pokemon-name', name); await f.click('button[type=submit]') }
  await search('')
  await page.waitForTimeout(500)
  assert.equal(await f.locator('#poke-container > *').count(), 0, 'empty search adds nothing')
  await search('Pikachu')
  await f.waitForSelector('#pikachu-card img', { timeout: 15000 })
  assert.equal(await f.inputValue('#pokemon-name'), '', 'input cleared')
  assert.equal(await f.getAttribute('#pikachu-card img', 'alt'), 'pikachu')
  assert.doesNotMatch(await f.getAttribute('#pikachu-card img', 'src'), /shiny/)
  await search('pikachu')
  await page.waitForTimeout(2000)
  assert.equal(await f.locator('[id="pikachu-card"]').count(), 1, 'no duplicate')
  await search('pikachoo')
  await until(page, (a) => true, null, 100)
  for (let k = 0; k < 50 && !alerts.length; k++) await page.waitForTimeout(200)
  assert.deepEqual(alerts, ['Pokemon Does not Exist'])
  await page.close()
})
