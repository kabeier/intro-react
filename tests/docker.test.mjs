// Slow (builds an image): run on its own with RUN_DOCKER=1 node --test tests/docker.test.mjs
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { execFileSync, spawn } from 'node:child_process'
import { createRequire } from 'node:module'
import { mkdtempSync, writeFileSync, mkdirSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'

const require = createRequire(import.meta.url)
const Course = require('../shared/course.js')
globalThis.Course = Course
await import('../shared/course/create-vite-react.js')
await import('../shared/course/react-vite.js')

test('the lesson Dockerfile + run_container.sh serve the app on port 5173', { skip: !process.env.RUN_DOCKER }, async () => {
  const files = Course.checkpoint(Course.get('react-vite'), 'f7')
  const dir = mkdtempSync(path.join(os.tmpdir(), 'dock-'))
  for (const [n, t] of Object.entries(files)) { mkdirSync(path.dirname(path.join(dir, n)), { recursive: true }); writeFileSync(path.join(dir, n), t + '\n') }
  execFileSync('docker', ['rm', '-f', 'react-container'], { stdio: 'ignore' })
  const run = spawn('bash', ['run_container.sh'], { cwd: dir, stdio: 'ignore' })
  let html = ''
  for (let k = 0; k < 120 && !html.includes('id="root"'); k++) {
    await new Promise((r) => setTimeout(r, 2000))
    try { html = await (await fetch('http://localhost:5173/')).text() } catch {}
  }
  const app = await (await fetch('http://localhost:5173/src/App.jsx')).text()
  execFileSync('docker', ['rm', '-f', 'react-container'], { stdio: 'ignore' })
  run.kill()
  assert.match(html, /<title>Pokemon Project<\/title>/)
  assert.match(app, /Hello Pokemon trainers/)
})
