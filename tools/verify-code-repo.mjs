#!/usr/bin/env node
// Prove the code repo works the way the code-repo page says: every lecture branch holds exactly the
// lesson's finished files, and a fresh checkout installs from its lockfile, builds and lints.
//   node tools/verify-code-repo.mjs [repo folder]        (default ../intro-react-code)
import { readFileSync, rmSync, mkdtempSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { createRequire } from 'node:module'
import path from 'node:path'
import os from 'node:os'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const require = createRequire(import.meta.url)
const Course = require(path.join(ROOT, 'shared/course.js'))
globalThis.Course = Course
for (const f of JSON.parse(readFileSync(path.join(ROOT, 'shared/course/manifest.json'), 'utf8'))) await import(path.join(ROOT, 'shared/course', f))
await import(path.join(ROOT, 'shared/course/code-repo.js'))
const REPO = path.resolve(process.argv[2] || path.join(ROOT, '..', 'intro-react-code'))
const run = (cmd, args, cwd, env = {}) => execFileSync(cmd, args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], env: { ...process.env, ...env } })

let bad = 0
for (const l of Course.all()) {
  const branch = Course.codeRepo.branch(l)
  const files = Course.checkpoint(l, l.features.at(-1).id)
  const tmp = mkdtempSync(path.join(os.tmpdir(), 'code-repo-'))
  try {
    run('git', ['clone', '-q', '--branch', branch, '--single-branch', REPO, tmp], ROOT)
    for (const [name, text] of Object.entries(files)) {
      const got = readFileSync(path.join(tmp, name), 'utf8')
      if (got !== text) throw new Error('differs from the lesson: ' + name)
    }
    const tracked = run('git', ['ls-files'], tmp).trim().split('\n')
    const extra = tracked.filter((f) => !(f in files) && !(f in Course.assetsOf(l)) && !['README.md', 'package-lock.json'].includes(f))
    if (extra.length) throw new Error('extra files: ' + extra.join(' '))
    run('npm', ['ci', '--ignore-scripts', '--no-audit', '--no-fund', '--loglevel=error'], tmp)
    run('npm', ['run', 'build'], tmp)
    run('npm', ['run', 'lint'], tmp)
    console.log('ok  ', branch)
  } catch (e) { bad++; console.log('FAIL', branch, String(e.stderr || e.message).slice(-300)) } finally { rmSync(tmp, { recursive: true, force: true }) }
}
console.log(bad ? bad + ' failed' : 'all branches ok')
process.exit(bad ? 1 : 0)
