import { test } from 'node:test'
import { execFileSync } from 'node:child_process'
import { readdirSync } from 'node:fs'
import path from 'node:path'
import { ROOT } from './helpers.mjs'

const files = [...readdirSync(path.join(ROOT, 'shared')).filter((f) => f.endsWith('.js')).map((f) => 'shared/' + f),
  ...readdirSync(path.join(ROOT, 'shared/course')).filter((f) => f.endsWith('.js')).map((f) => 'shared/course/' + f)]
for (const f of files) test('parses: ' + f, () => { execFileSync('node', ['--check', path.join(ROOT, f)], { stdio: 'pipe' }) })
