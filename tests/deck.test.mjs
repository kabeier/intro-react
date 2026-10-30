import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { readFileSync, mkdtempSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import os from 'node:os'
import path from 'node:path'
import { ROOT } from './helpers.mjs'

const require = createRequire(import.meta.url)
const Course = require('../shared/course.js')
globalThis.Course = Course
import { readFileSync as rf } from 'node:fs'
for (const f of JSON.parse(rf(path.join(ROOT, 'shared/course/manifest.json'), 'utf8'))) await import('../shared/course/' + f)

for (const [DECK, lessonId] of [['lecture-1-react-vite/slides.html', 'react-vite'], ['lecture-2-async-requests/slides.html', 'async-requests'], ['lecture-3-cypress-react/slides.html', 'cypress-react'], ['lecture-4-cypress-assertions/slides.html', 'cypress-assertions'], ['lecture-5-hooks-usestate/slides.html', 'hooks-usestate'], ['lecture-6-hooks-useeffect/slides.html', 'hooks-useeffect'], ['lecture-7-components-props/slides.html', 'components-props'], ['lecture-8-component-state/slides.html', 'component-state']]) {
const lesson = Course.get(lessonId)
const html = readFileSync(path.join(ROOT, DECK), 'utf8')
const slides = html.split('<section class="slide').slice(1)
const test2 = (name, fn) => test(DECK + ': ' + name, fn)

test2('the deck has 14-17 slides, each with presenter notes and a start minute', () => {
  assert.ok(slides.length >= 14 && slides.length <= 17, 'slides: ' + slides.length)
  let last = -1
  for (const [k, s] of slides.entries()) {
    assert.match(s, /<aside class="notes">/, 'notes on slide ' + (k + 1))
    const at = Number((s.match(/data-at="(\d+)"/) || [])[1])
    assert.ok(at >= last, 'minutes go up at slide ' + (k + 1))
    last = at
  }
  assert.ok(last <= 40, 'last slide starts by minute 40')
})

test2('every feature is coded along once, starting where the previous one ended', () => {
  const pads = [...html.matchAll(new RegExp('<div class="livepad" data-lesson="' + lessonId + '" data-start="([^"]*)" data-steps="([^"]*)"', 'g'))]
  assert.equal(pads.length, lesson.features.length)
  pads.forEach(([, start, steps], k) => {
    const f = lesson.features[k]
    const prev = k ? lesson.features[k - 1].steps.at(-1).id : 'null'
    assert.equal(start, prev, f.id + ' start')
    assert.deepEqual(steps.split(' '), f.steps.map((s) => s.id), f.id + ' steps')
  })
})

test2('there is exactly one activity, and it opens the Fix it page', () => {
  const acts = slides.filter((s) => s.startsWith(' activity'))
  assert.equal(acts.length, 1)
  assert.ok(acts[0].includes('href="../fixit.html?lesson=' + lessonId + '"'))
})

test2('the step tables in the notes are generated from the lesson and up to date', () => {
  execFileSync('node', [path.join(ROOT, 'tools/gen-notes.mjs'), '--check', DECK], { cwd: ROOT, stdio: 'pipe' })
})

test2('no slide overflows the 1600x900 stage', () => {
  const shots = mkdtempSync(path.join(os.tmpdir(), 'shots-'))
  const out = execFileSync('node', [path.join(os.homedir(), '.claude/skills/cp-slide-and-lecture-builder/scripts/check-slides.mjs'), ROOT, DECK, shots], { encoding: 'utf8' })
  assert.doesNotMatch(out, /OVERFLOW/)
})

}
