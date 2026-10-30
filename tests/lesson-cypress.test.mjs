import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { readFileSync } from 'node:fs'

const require = createRequire(import.meta.url)
const Course = require('../shared/course.js')
globalThis.Course = Course
for (const f of JSON.parse(readFileSync(new URL('../shared/course/manifest.json', import.meta.url)))) await import('../shared/course/' + f)
const lines = (code) => code.replace(/\n$/, '').split('\n').length

for (const [id, base, feats] of [['cypress-react', ['async-requests', 'f7'], 3], ['cypress-assertions', ['cypress-react', 'f3'], 4]]) {
  const lesson = Course.get(id)
  const steps = lesson.features.flatMap((f) => f.steps)
  test(id + ': starts where the previous lesson ended; features, short steps, says', () => {
    assert.deepEqual(Course.filesAt(lesson, null), Course.checkpoint(Course.get(base[0]), base[1]))
    assert.equal(lesson.features.length, feats)
    for (const f of lesson.features) assert.ok(f.why && f.why.length > 10, f.id)
    for (const s of steps) {
      assert.doesNotThrow(() => Course.filesAt(lesson, s.id), s.id)
      // One whole it() test may run to 8 lines; anything else is typed in steps of up to 6.
      assert.ok(lines(s.code) <= (/^\n?it\(/.test(s.code) ? 8 : 6), s.id + ' short')
      assert.ok(s.say, s.id + ' say')
    }
  })
  test(id + ': the app code does not change (unit 3 only adds tests and config)', () => {
    const start = Course.filesAt(lesson, null)
    const end = Course.checkpoint(lesson, lesson.features.at(-1).id)
    for (const f of Object.keys(start).filter((f) => f.startsWith('src/'))) assert.equal(end[f], start[f], f)
  })
}

test('every Cypress idea used in the specs has a note', () => {
  const notes = ['cypress-react', 'cypress-assertions'].flatMap((id) => Course.get(id).features.flatMap((f) => f.steps).flatMap((s) => s.notes || []))
  for (const k of ['"cypress"', '"cy:open"', '"cy:run"', 'defineConfig', 'e2e: {', 'baseUrl', 'supportFile: false', 'viewportWidth', 'cypress/videos', '"overrides"',
    'beforeEach(', "cy.visit('/')", 'it(', "cy.get('header')", ".should('be.visible')", '.children()', ".type('Bulbasaur')", '.click()', '{enter}',
    ".should('have.attr', 'src')", '[id="bulbasaur-card"]', "cy.on('window:alert'", 'cy.wrap(alerts)', 'cy.intercept(', "cy.wait('@bulbasaur')", '"sprites"'])
    assert.ok(notes.some((n) => n.match.includes(k) || k.includes(n.match)), 'note for ' + k)
})
