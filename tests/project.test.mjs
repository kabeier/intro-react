import { test } from 'node:test'
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import path from 'node:path'
import { ROOT } from './helpers.mjs'

test('every checkpoint of every lesson builds and lints as a real Vite project', () => {
  const out = execFileSync('node', [path.join(ROOT, 'tools/verify-project.mjs'), 'react-vite', 'async-requests', 'cypress-react', 'cypress-assertions'], { cwd: ROOT, encoding: 'utf8', timeout: 600000 })
  assert.match(out, /all \d+ checkpoints build and lint/)
})
