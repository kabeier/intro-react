// Slow (Docker + real Cypress): RUN_CYPRESS=1 node --test tests/real-cypress.test.mjs
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import path from 'node:path'
import { ROOT } from './helpers.mjs'

test('the slides runner and real Cypress 16.2.0 agree on every unit 3 checkpoint', { skip: !process.env.RUN_CYPRESS }, () => {
  const out = execFileSync('node', [path.join(ROOT, 'tools/real-cypress.mjs'), 'cypress-react', 'cypress-assertions'], { cwd: ROOT, encoding: 'utf8', timeout: 1200000 })
  assert.match(out, /runner and real Cypress agree; every expectation met/)
})

test('every unit 3 Fix It variant behaves the same in real Cypress (broken fails, solution passes, weak tests caught)', { skip: !process.env.RUN_CYPRESS }, () => {
  const out = execFileSync('node', [path.join(ROOT, 'tools/real-cypress.mjs'), '--fixit', 'cypress-react', 'cypress-assertions'], { cwd: ROOT, encoding: 'utf8', timeout: 3600000 })
  assert.match(out, /runner and real Cypress agree; every expectation met/)
})
