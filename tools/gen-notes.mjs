#!/usr/bin/env node
// Fill the presenter-notes step tables of a deck from the lesson data, so the
// notes always match what N types.
//   node tools/gen-notes.mjs lecture-1-html-css/slides.html          rewrite in place
//   node tools/gen-notes.mjs --check lecture-1-html-css/slides.html  exit 1 if out of date
// In the deck: <!-- steps:html-css:f2 --><!-- /steps -->
import { readFileSync, writeFileSync, readdirSync } from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const require = createRequire(import.meta.url)
const Course = require(path.join(ROOT, 'shared/course.js'))
globalThis.Course = Course
for (const f of readdirSync(path.join(ROOT, 'shared/course'))) if (f.endsWith('.js')) await import(path.join(ROOT, 'shared/course', f))

const args = process.argv.slice(2)
const check = args[0] === '--check'
const deck = path.join(ROOT, check ? args[1] : args[0])
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const td = 'style="padding:4px 10px;border-bottom:1px solid #34405a;vertical-align:top"'

function table(lessonId, featureId) {
  const lesson = Course.get(lessonId)
  const f = lesson.features.find((x) => x.id === featureId)
  const rows = f.steps.map((s, k) => {
    const first = s.code ? s.code.split('\n').find((l) => l.trim()) .trim() : '(deletes code)'
    const short = first.length > 46 ? first.slice(0, 44) + '…' : first
    return `<tr><td ${td}><b>N ${k + 1}</b></td><td ${td}><code>${esc(s.file)}</code></td><td ${td}><code>${esc(short)}</code></td><td ${td}>${esc(s.say || '')}</td></tr>`
  })
  return `<table style="border-collapse:collapse;font-size:15px;margin:6px 0"><tr><th ${td}>Press</th><th ${td}>File</th><th ${td}>Types</th><th ${td}>Say</th></tr>\n${rows.join('\n')}\n</table>`
}

const src = readFileSync(deck, 'utf8')
const out = src.replace(/<!-- steps:([\w-]+):(f\d+) -->[\s\S]*?<!-- \/steps -->/g, (m, l, f) => `<!-- steps:${l}:${f} -->\n${table(l, f)}\n<!-- /steps -->`)
if (check) {
  if (out !== src) { console.error('Notes are out of date: run node tools/gen-notes.mjs ' + args[1]); process.exit(1) }
  console.log('notes up to date')
} else {
  writeFileSync(deck, out)
  console.log('notes written')
}
