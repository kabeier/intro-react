import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const Course = require('../shared/course.js')

const lesson = {
  id: 'demo',
  title: 'Demo',
  files: { 'index.html': '<p>start</p>', 'styles.css': '' },
  features: [
    {
      id: 'f1', title: 'List', why: 'show a list',
      steps: [
        { id: 'f1s1', file: 'index.html', mode: 'append', code: '<ul>\n  <li>one</li>\n</ul>',
          notes: [{ match: '<ul>', what: 'an unordered list', why: 'bullets' }, { match: '<li>', what: 'a list item', why: 'one row' }] },
        { id: 'f1s2', file: 'styles.css', mode: 'append', code: 'ul {\n  color: red;\n}',
          notes: [{ match: 'color', what: 'text colour', why: 'see it', api: { name: 'color', does: 'sets text colour', params: [['red', 'a colour', 'any named colour']] } }] },
      ],
    },
    {
      id: 'f2', title: 'Ordered', why: 'numbers',
      steps: [
        { id: 'f2s1', file: 'index.html', mode: 'replace', find: '<ul>', code: '<ol>' },
        { id: 'f2s2', file: 'index.html', mode: 'replace', find: '</ul>', code: '</ol>' },
        { id: 'f2s3', file: 'index.html', mode: 'insertAfter', find: '<li>one</li>', code: '  <li>two</li>',
          notes: [{ match: '<li>', what: 'second item', why: 'more rows' }] },
      ],
    },
  ],
}
Course.register(lesson)

test('applyStep append adds a blank line before code on non-empty text', () => {
  assert.equal(Course.applyStep('a', { mode: 'append', code: 'b' }), 'a\n\nb')
})

test('applyStep append on empty text is just the code', () => {
  assert.equal(Course.applyStep('', { mode: 'append', code: 'b' }), 'b')
})

test('applyStep replace swaps the match', () => {
  assert.equal(Course.applyStep('x y w', { mode: 'replace', find: 'x', code: 'z' }), 'z y w')
})

test('applyStep insertAfter adds a line after the line containing find', () => {
  assert.equal(Course.applyStep('a\nb\nc', { mode: 'insertAfter', find: 'b', code: 'B' }), 'a\nb\nB\nc')
})

test('applyStep set replaces everything', () => {
  assert.equal(Course.applyStep('old', { mode: 'set', code: 'new' }), 'new')
})

test('applyStep throws StepMismatch when find is missing', () => {
  assert.throws(() => Course.applyStep('abc', { id: 's', mode: 'replace', find: 'zzz', code: 'q' }),
    (e) => e instanceof Course.StepMismatch && e.step.id === 's')
})

test('get returns the registered lesson', () => {
  assert.equal(Course.get('demo'), lesson)
})

test('filesAt null is the starting files', () => {
  assert.deepEqual(Course.filesAt(lesson, null), { 'index.html': '<p>start</p>', 'styles.css': '' })
})

test('filesAt applies steps in order up to and including stepId', () => {
  const f = Course.filesAt(lesson, 'f1s2')
  assert.equal(f['index.html'], '<p>start</p>\n\n<ul>\n  <li>one</li>\n</ul>')
  assert.equal(f['styles.css'], 'ul {\n  color: red;\n}')
})

test('checkpoint is filesAt the feature last step', () => {
  assert.deepEqual(Course.checkpoint(lesson, 'f2'), Course.filesAt(lesson, 'f2s3'))
  assert.equal(Course.checkpoint(lesson, 'f2')['index.html'], '<p>start</p>\n\n<ol>\n  <li>one</li>\n  <li>two</li>\n</ol>')
})

test('origins tags each line with the step that introduced it', () => {
  const o = Course.origins(lesson, 'f1s2')
  assert.deepEqual(o['index.html'].map((x) => x.stepId), [null, 'f1s1', 'f1s1', 'f1s1', 'f1s1'])
  assert.deepEqual(o['styles.css'].map((x) => x.stepId), ['f1s2', 'f1s2', 'f1s2'])
})

test('origins: replace re-tags only the changed line', () => {
  const o = Course.origins(lesson, 'f2s1')
  assert.deepEqual(o['index.html'].map((x) => x.stepId), [null, 'f1s1', 'f2s1', 'f1s1', 'f1s1'])
})

test('noteFor returns the matching note and the introducing step', () => {
  const r = Course.noteFor(lesson, 'f1s2', 'styles.css', 2)
  assert.equal(r.note.what, 'text colour')
  assert.equal(r.stepId, 'f1s2')
  assert.equal(r.featureId, 'f1')
})

test('noteFor on a blank line returns null note', () => {
  const r = Course.noteFor(lesson, 'f1s2', 'index.html', 2)
  assert.equal(r.note, null)
})

test('noteFor on a closing tag returns the note of the step that opened it', () => {
  const r = Course.noteFor(lesson, 'f1s1', 'index.html', 5) // "</ul>"
  assert.equal(r.note.what, 'an unordered list')
  assert.equal(r.stepId, 'f1s1')
})

test('noteFor uses the note of the step that introduced the line', () => {
  const r = Course.noteFor(lesson, 'f2s3', 'index.html', 5) // "  <li>two</li>"
  assert.equal(r.note.what, 'second item')
  assert.equal(r.featureId, 'f2')
})

test('buildDoc inlines linked css and scripts and adds the error reporter', () => {
  const doc = Course.buildDoc({
    'index.html': '<head><link rel="stylesheet" href="styles.css"></head><body><script src="script.js"></script><img src="a.png"></body>',
    'styles.css': 'p{color:red}',
    'script.js': 'console.log(1)',
  })
  assert.match(doc, /<style>p\{color:red\}<\/style>/)
  assert.match(doc, /<script>console\.log\(1\)<\/script>/)
  assert.match(doc, /<img src="a\.png">/)
  assert.match(doc, /livepad-error/)
  assert.doesNotMatch(doc, /href="styles\.css"/)
})

test('buildDoc keeps defer meaning: a deferred script runs after the page is parsed', () => {
  const doc = Course.buildDoc({ 'index.html': '<head><script src="script.js" defer></script></head><body><p>x</p></body>', 'script.js': 'go()' })
  assert.match(doc, /<p>x<\/p><script>go\(\)<\/script><\/body>/)
})

test('buildDoc also inlines ./styles.css', () => {
  const doc = Course.buildDoc({ 'index.html': '<link rel="stylesheet" href="./styles.css">', 'styles.css': 'b{}' })
  assert.match(doc, /<style>b\{\}<\/style>/)
})

test('buildDoc leaves a link without rel=stylesheet alone', () => {
  const doc = Course.buildDoc({ 'index.html': '<link href="styles.css">', 'styles.css': 'b{}' })
  assert.match(doc, /<link href="styles\.css">/)
})

test('replace keeps the origin of lines it does not change', () => {
  const l = { id: 'keep', files: { 'a.css': '' }, features: [
    { id: 'f1', title: 't', why: 'w', steps: [{ id: 's1', file: 'a.css', mode: 'append', code: 'body {\n  margin: 0;\n}' }] },
    { id: 'f2', title: 't', why: 'w', steps: [{ id: 's2', file: 'a.css', mode: 'replace', find: 'body {', code: '* {\n  box-sizing: border-box;\n}\n\nbody {' }] },
  ] }
  assert.deepEqual(Course.origins(l, 's2')['a.css'].map((x) => x.stepId), ['s2', 's2', 's2', 's2', 's1', 's1', 's1'])
})

test('noteFor falls back to the earlier step whose note matches the line', () => {
  const l = { id: 'fb', files: { 'i.html': '' }, features: [
    { id: 'f1', title: 't', why: 'w', steps: [{ id: 's1', file: 'i.html', mode: 'append', code: '<h1 id="t">Hi</h1>', notes: [{ match: 'id="t"', what: 'an id', why: 'w' }] }] },
    { id: 'f2', title: 't', why: 'w', steps: [
      { id: 's2', file: 'i.html', mode: 'replace', find: '<h1 id="t">', code: '<h1 id="t" style="x">' },
      { id: 's3', file: 'i.html', mode: 'replace', find: ' style="x"', code: '' },
    ] },
  ] }
  const r = Course.noteFor(l, 's3', 'i.html', 1)
  assert.equal(r.note.what, 'an id')
  assert.equal(r.stepId, 's1')
  assert.equal(r.featureId, 'f1')
})

test('buildDoc keeps link clicks and form submits inside the preview', () => {
  const doc = Course.buildDoc({ 'index.html': '<head></head><body></body>' })
  assert.match(doc, /preventDefault/)
  assert.match(doc, /scrollIntoView/)
})

test('insertAfter refuses when the anchor line appears more than once', () => {
  assert.throws(() => Course.applyStep('</head>\nx\n</head>', { id: 'd', mode: 'insertAfter', find: '</head>', code: 'y' }),
    (e) => e instanceof Course.StepMismatch && /more than once/.test(e.message))
})

test('replace refuses when find appears more than once', () => {
  assert.throws(() => Course.applyStep('a b a', { id: 'd', mode: 'replace', find: 'a', code: 'z' }),
    (e) => e instanceof Course.StepMismatch && /more than once/.test(e.message))
})

test('a lesson built on another lesson tells the stories of the inherited lines', () => {
  const base = Course.register({ id: 'base1', title: 'Base', files: { 'i.html': '' }, features: [
    { id: 'f1', title: 'Heading', why: 'w', steps: [{ id: 'f1s1', file: 'i.html', mode: 'append', code: '<h1>Hi</h1>', notes: [{ match: '<h1>', what: 'a heading', why: 'w' }] }] }] })
  const next = Course.register({ id: 'next1', title: 'Next', base: { lesson: 'base1', feature: 'f1' },
    files: { ...Course.checkpoint(base, 'f1'), 'a.js': '' }, features: [
    { id: 'f1', title: 'Script', why: 'w', steps: [{ id: 'f1s1', file: 'i.html', mode: 'replace', find: '<h1>Hi</h1>', code: '<p>new</p>\n<h1>Hi</h1>' }] }] })
  const r = Course.noteFor(next, 'f1s1', 'i.html', 2)
  assert.equal(r.note.what, 'a heading')
  assert.equal(r.lessonId, 'base1')
  assert.equal(r.featureId, 'f1')
})

test('a delete step removes the file from the checkpoint', () => {
  const l = Course.register({ id: 'del', title: 'Del', files: { 'a.txt': 'x', 'b.txt': 'y' }, features: [
    { id: 'f1', title: 't', why: 'w', steps: [{ id: 's1', file: 'b.txt', mode: 'delete', code: '' }] }] })
  assert.deepEqual(Course.filesAt(l, 's1'), { 'a.txt': 'x' })
})
