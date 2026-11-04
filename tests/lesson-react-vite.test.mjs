import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { serve, launch, until } from './helpers.mjs'

const require = createRequire(import.meta.url)
const Course = require('../shared/course.js')
globalThis.Course = Course
await import('../shared/course/create-vite-react.js')
await import('../shared/course/react-vite.js')
const lesson = Course.get('react-vite')
const steps = lesson.features.flatMap((f) => f.steps)
const notes = steps.flatMap((s) => s.notes || [])

test('starts from the exact create-vite template', () => {
  assert.equal(Course.filesAt(lesson, null)['src/main.jsx'], CREATE_VITE_REACT['src/main.jsx'])
  assert.match(Course.filesAt(lesson, null)['package.json'], /"dev": "vite"/)
})

test('features f1..f7 with a why; every step applies, is short, has a say', () => {
  assert.deepEqual(lesson.features.map((f) => f.id), ['f1', 'f2', 'f3', 'f4', 'f5', 'f6', 'f7'])
  for (const f of lesson.features) assert.ok(f.why && f.why.length > 10, f.id)
  for (const s of steps) {
    assert.doesNotThrow(() => Course.filesAt(lesson, s.id), s.id)
    assert.ok(s.code.split('\n').length <= 6, s.id + ' short')
    assert.ok(s.say, s.id + ' say')
  }
})

test('package.json stays as Vite made it, apart from --host (no engines block)', () => {
  for (const s of steps) assert.doesNotMatch(Course.filesAt(lesson, s.id)['package.json'], /"engines"/, s.id)
})

test('every Docker instruction, docker flag and JSX idea has a note', () => {
  for (const k of ['FROM node:24', 'WORKDIR', 'COPY . .', 'RUN npm install', 'EXPOSE 5173', 'CMD [', '--host', '-p 5173:5173', '-v "$(pwd)":/app', '-v /app/node_modules',
    '--name react-container', 'docker build', '<>', '{message}', '{sayHello()}', 'className=', 'style={{', "import './App.css'", 'export default App', 'function App()'])
    assert.ok(notes.some((n) => n.match.includes(k) || k.includes(n.match)), 'note for ' + k)
  for (const n of notes) assert.ok(n.what && n.why, n.match)
})

let srv, browser
before(async () => { srv = await serve(); browser = await launch() })
after(async () => { await browser?.close(); srv?.close() })

const expect = { null: 'Get started', f1: 'Get started', f2: 'Get started', f3: 'Pokemon Project', f4: 'Hello Pokemon trainers', f5: 'Hello from a function', f6: 'Hello Pokemon trainers', f7: 'Hello Pokemon trainers' }
test('every checkpoint renders in the preview with no errors', async () => {
  for (const [fid, text] of Object.entries(expect)) {
    const files = fid === 'null' ? Course.filesAt(lesson, null) : Course.checkpoint(lesson, fid)
    const page = await browser.newPage({ viewport: { width: 1400, height: 900 } })
    await page.goto(srv.url + '/tests/fixtures/mount.html')
    await page.evaluate(([f, a]) => window.mountFiles(f, a), [files, lesson.assets])
    await until(page, (t) => (document.querySelector('.lp-preview iframe').contentDocument.body?.textContent || '').includes(t), text, 20000)
    const errs = await page.evaluate(() => [...document.querySelectorAll('.lp-console .err')].map((e) => e.textContent))
    assert.deepEqual(errs, [], fid)
    await page.close()
  }
})

test('className and the inline style really apply at the end', async () => {
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } })
  await page.goto(srv.url + '/tests/fixtures/mount.html')
  await page.evaluate(([f, a]) => window.mountFiles(f, a), [Course.checkpoint(lesson, 'f7'), lesson.assets])
  await until(page, () => !!document.querySelector('.lp-preview iframe').contentDocument.querySelector('.myText'), null, 20000)
  const st = await page.evaluate(() => { const d = document.querySelector('.lp-preview iframe').contentDocument; const p = d.querySelector('.myText'); const c = d.defaultView.getComputedStyle(p); return [c.fontSize, c.color] })
  assert.deepEqual(st, ['50px', 'rgb(255, 0, 0)'])
  await page.close()
})
