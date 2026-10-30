import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { readFileSync, existsSync } from 'node:fs'

const require = createRequire(import.meta.url)
const Course = require('../shared/course.js')
globalThis.Course = Course
for (const f of JSON.parse(readFileSync(new URL('../shared/course/manifest.json', import.meta.url)))) await import('../shared/course/' + f)
if (existsSync(new URL('../shared/course/glossary.js', import.meta.url))) await import('../shared/course/glossary.js')

// The Code Explorer must explain every line a student can click (no "nothing to explain").
for (const lesson of Course.all()) {
  test(`${lesson.id}: every line of every checkpoint has an explanation`, () => {
    const missing = []
    for (const f of lesson.features) {
      const stepId = f.steps[f.steps.length - 1].id
      for (const [file, text] of Object.entries(Course.filesAt(lesson, stepId))) {
        if (typeof text !== 'string') continue
        text.split('\n').forEach((line, i) => {
          if (line.trim() && !Course.noteFor(lesson, stepId, file, i + 1).note) missing.push(`${f.id} ${file}:${i + 1} ${line.trim()}`)
        })
      }
    }
    assert.deepEqual(missing.slice(0, 20), [], `${missing.length} unexplained lines`)
  })
}

test('glossary notes say what and why, and mark template lines as boilerplate', () => {
  const l = Course.get('react-vite')
  const step = l.features[0].steps[l.features[0].steps.length - 1].id
  const files = Course.filesAt(l, step)
  const i = files['index.html'].split('\n').findIndex((x) => x.includes('<div id="root">'))
  const r = Course.noteFor(l, step, 'index.html', i + 1)
  assert.match(r.note.what, /React draws/)
  assert.ok(r.note.why)
  assert.equal(r.note.boilerplate, true)
})
