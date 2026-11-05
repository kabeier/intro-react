// Every Cypress test talks to the live PokeAPI: no cy.intercept, no fixtures, no stubbing on the slides.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { readFileSync, readdirSync } from 'node:fs'

const require = createRequire(import.meta.url)
const Course = require('../shared/course.js')
globalThis.Course = Course
for (const f of JSON.parse(readFileSync(new URL('../shared/course/manifest.json', import.meta.url)))) await import('../shared/course/' + f)

const STUB = /cy\.intercept|stub|cypress\/fixtures\/\w/i

test('no lesson step stubs the API or adds a fixture', () => {
  for (const lesson of Course.all()) {
    for (const s of lesson.features.flatMap((f) => f.steps)) {
      assert.ok(!/^cypress\/fixtures\//.test(s.file), `${lesson.id} ${s.id} adds ${s.file}`)
      if (/^cypress\//.test(s.file)) assert.doesNotMatch(s.code || '', /cy\.intercept|fixture/, `${lesson.id} ${s.id}`)
    }
    const files = Course.filesAt(lesson, lesson.features.at(-1).steps.at(-1).id)
    for (const [name, text] of Object.entries(files)) {
      assert.ok(!name.startsWith('cypress/fixtures/'), `${lesson.id} ends with ${name}`)
      if (name.startsWith('cypress/')) assert.doesNotMatch(text, /cy\.intercept|fixture/, `${lesson.id} ${name}`)
    }
  }
})

test('the slides and the landing page never talk about stubbing', () => {
  const root = new URL('../', import.meta.url)
  const pages = ['index.html', ...readdirSync(root).filter((d) => d.startsWith('lecture-')).map((d) => d + '/slides.html')]
  for (const p of pages) {
    const text = readFileSync(new URL(p, root), 'utf8')
    for (const line of text.split('\n')) assert.doesNotMatch(line, STUB, `${p}: ${line.trim().slice(0, 120)}`)
  }
})
