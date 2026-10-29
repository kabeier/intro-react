#!/usr/bin/env node
// Prove every checkpoint of a lesson is a working Vite project: write it to disk,
// link one shared node_modules, run `npm run build` and `npm run lint`.
//   node tools/verify-project.mjs react-vite [more lessons…]
// Exit 1 if any checkpoint fails. Lesson files load in shared/course/manifest.json order.
import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync, symlinkSync, copyFileSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { createRequire } from 'node:module'
import { createHash } from 'node:crypto'
import path from 'node:path'
import os from 'node:os'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const require = createRequire(import.meta.url)
const Course = require(path.join(ROOT, 'shared/course.js'))
globalThis.Course = Course
for (const f of JSON.parse(readFileSync(path.join(ROOT, 'shared/course/manifest.json'), 'utf8'))) await import(path.join(ROOT, 'shared/course', f))

const ids = process.argv.slice(2)
if (!ids.length) { console.error('usage: node tools/verify-project.mjs <lesson…>'); process.exit(2) }

const checkpoints = []
for (const id of ids) {
  const lesson = Course.get(id)
  if (!lesson) { console.error('no lesson ' + id); process.exit(2) }
  if (!lesson.base) checkpoints.push({ name: id + ' start', lesson, files: Course.filesAt(lesson, null) })
  for (const f of lesson.features) checkpoints.push({ name: `${id} ${f.id} ${f.title}`, lesson, files: Course.checkpoint(lesson, f.id) })
}

// One install for all checkpoints: the union of every checkpoint's dependencies.
const deps = {}, devDeps = {}
for (const c of checkpoints) {
  const pkg = JSON.parse(c.files['package.json'])
  Object.assign(deps, pkg.dependencies || {}); Object.assign(devDeps, pkg.devDependencies || {})
}
const key = createHash('sha1').update(JSON.stringify([deps, devDeps])).digest('hex').slice(0, 12)
const cache = path.join(ROOT, '.cache', 'verify-' + key)
if (!existsSync(path.join(cache, 'node_modules'))) {
  mkdirSync(cache, { recursive: true })
  writeFileSync(path.join(cache, 'package.json'), JSON.stringify({ name: 'verify', private: true, type: 'module', dependencies: deps, devDependencies: devDeps }, null, 2))
  console.log('installing', key, '…')
  execFileSync('npm', ['install', '--no-audit', '--no-fund', '--loglevel=error'], { cwd: cache, stdio: 'inherit' })
}

const work = path.join(os.tmpdir(), 'verify-project')
let bad = 0
for (const c of checkpoints) {
  const dir = path.join(work, c.name.split(' ').slice(0, 2).join('-'))
  rmSync(dir, { recursive: true, force: true })
  for (const [name, text] of Object.entries(c.files)) {
    mkdirSync(path.dirname(path.join(dir, name)), { recursive: true })
    writeFileSync(path.join(dir, name), text.endsWith('\n') || text === '' ? text : text + '\n')
  }
  for (const [name, src] of Object.entries(c.lesson.assets || {})) {
    mkdirSync(path.dirname(path.join(dir, name)), { recursive: true })
    copyFileSync(path.join(ROOT, src), path.join(dir, name))
  }
  symlinkSync(path.join(cache, 'node_modules'), path.join(dir, 'node_modules'))
  let ok = true
  for (const script of ['build', 'lint']) {
    try {
      execFileSync('npm', ['run', script, '--silent'], { cwd: dir, stdio: 'pipe' })
    } catch (e) {
      ok = false
      console.log(`FAIL ${c.name}: npm run ${script}\n${(e.stdout || '') + (e.stderr || '')}`.slice(0, 2000))
    }
  }
  if (ok) console.log('ok  ', c.name)
  else bad++
}
console.log(bad ? `${bad} failure(s)` : `all ${checkpoints.length} checkpoints build and lint`)
process.exit(bad ? 1 : 0)
