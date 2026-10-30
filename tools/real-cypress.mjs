#!/usr/bin/env node
// Run a lesson's Cypress specs two ways and compare test by test:
//   1. real Cypress 16.2.0 (Docker image cypress/included:16.2.0) against the real Vite dev server
//   2. the slides' in-browser runner (CyRunner) against the live preview
//   node tools/real-cypress.mjs cypress-react cypress-assertions
// Prints both results per checkpoint; exit 1 if they disagree or a test fails.
import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync, symlinkSync, readdirSync } from 'node:fs'
import { execFileSync, spawn } from 'node:child_process'
import { createRequire } from 'node:module'
import { createHash } from 'node:crypto'
import net from 'node:net'
import path from 'node:path'
import os from 'node:os'
import { fileURLToPath } from 'node:url'
import { serve, launch } from '../tests/helpers.mjs'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const require = createRequire(import.meta.url)
const Course = require(path.join(ROOT, 'shared/course.js'))
globalThis.Course = Course
for (const f of JSON.parse(readFileSync(path.join(ROOT, 'shared/course/manifest.json'), 'utf8'))) await import(path.join(ROOT, 'shared/course', f))

const args = process.argv.slice(2)
const fixitMode = args[0] === '--fixit'
const ids = fixitMode ? args.slice(1) : args
const hasSpecs = (files) => Object.keys(files).some((f) => /^cypress\/e2e\/.+\.cy\.js$/.test(f))
let checkpoints = []
if (!fixitMode) {
  checkpoints = ids.flatMap((id) => Course.get(id).features.map((f) => ({ name: `${id} ${f.id}`, files: Course.checkpoint(Course.get(id), f.id), expect: 'all-pass' })))
    .filter((c) => hasSpecs(c.files))
} else {
  for (const id of ids) {
    await import(path.join(ROOT, 'shared/course', id + '-fixit.js'))
    const lesson = Course.get(id)
    for (const p of globalThis.FIXIT[id]) {
      const apply = (steps) => { const f = { ...Course.checkpoint(lesson, p.base) }; for (const s of steps || []) f[s.file] = Course.applyStep(f[s.file], s); return f }
      const solution = apply(p.solve)
      checkpoints.push({ name: `${id}/${p.id} broken`, files: apply(p.breaks), expect: 'some-fail' })
      checkpoints.push({ name: `${id}/${p.id} solution`, files: solution, expect: 'all-pass' })
      for (const c of p.checks.filter((c) => c.bug)) {
        checkpoints.push({ name: `${id}/${p.id} solution vs app bug (${c.bug.label})`, files: { ...solution, 'src/App.jsx': solution['src/App.jsx'].replace(c.bug.find, '') }, expect: 'fails:' + c.bug.test })
      }
    }
  }
}

// node_modules shared with verify-project.mjs (same dependency union)
const deps = {}, devDeps = {}
for (const c of checkpoints) { const p = JSON.parse(c.files['package.json']); Object.assign(deps, p.dependencies); Object.assign(devDeps, p.devDependencies) }
const key = createHash('sha1').update(JSON.stringify([deps, devDeps])).digest('hex').slice(0, 12)
const cache = path.join(ROOT, '.cache', 'verify-' + key)
if (!existsSync(path.join(cache, 'node_modules'))) {
  mkdirSync(cache, { recursive: true })
  writeFileSync(path.join(cache, 'package.json'), JSON.stringify({ name: 'verify', private: true, type: 'module', dependencies: deps, devDependencies: devDeps }))
  execFileSync('npm', ['install', '--no-audit', '--no-fund', '--loglevel=error'], { cwd: cache, stdio: 'inherit', env: { ...process.env, CYPRESS_INSTALL_BINARY: '0' } })
}

const freePort = () => new Promise((r) => { const s = net.createServer().listen(0, () => { const { port } = s.address(); s.close(() => r(port)) }) })
const waitHttp = async (url) => { for (let k = 0; k < 100; k++) { try { if ((await fetch(url)).ok) return } catch {} await new Promise((r) => setTimeout(r, 200)) } throw new Error('no server at ' + url) }

function parseJunit(xml) {
  const out = []
  for (const m of xml.matchAll(/<testcase name="([^"]*)"[^>]*?(\/>|>([\s\S]*?)<\/testcase>)/g)) {
    const name = m[1].replace(/&apos;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    out.push({ title: name, state: m[3] && /<failure/.test(m[3]) ? 'failed' : 'passed' })
  }
  return out
}

const work = path.join(os.tmpdir(), 'real-cypress')
let bad = 0
const site = await serve(ROOT)
const browser = await launch()
for (const c of checkpoints) {
  const dir = path.join(work, c.name.replace(/[^\w-]+/g, '-'))
  rmSync(dir, { recursive: true, force: true })
  for (const [n, t] of Object.entries(c.files)) { mkdirSync(path.dirname(path.join(dir, n)), { recursive: true }); writeFileSync(path.join(dir, n), t + '\n') }
  symlinkSync(path.join(cache, 'node_modules'), path.join(dir, 'node_modules'))
  const port = await freePort()
  const vite = spawn(path.join(cache, 'node_modules/.bin/vite'), ['--port', String(port), '--strictPort', '--host', '127.0.0.1'], { cwd: dir, stdio: 'ignore' })
  const real = []
  try {
    await waitHttp(`http://127.0.0.1:${port}/`)
    const specs = readdirSync(path.join(dir, 'cypress/e2e')).sort()
    for (const spec of specs) {
      const report = path.join(dir, `results-${spec}.xml`)
      try {
        execFileSync('docker', ['run', '--rm', '--network', 'host', '-v', `${dir}:${dir}`, '-v', `${cache}:${cache}`, '-w', dir, 'cypress/included:16.2.0',
          '--spec', `cypress/e2e/${spec}`, '--config', `baseUrl=http://127.0.0.1:${port}/,video=false`, '--reporter', 'junit', '--reporter-options', `mochaFile=${report}`],
          { stdio: 'pipe', timeout: 300000 })
      } catch {}
      const xml = existsSync(report) ? readFileSync(report, 'utf8') : ''
      real.push(...parseJunit(xml).map((t) => ({ ...t, spec })))
    }
  } finally { vite.kill() }

  // The same specs in the slides' runner.
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } })
  page.on('dialog', (d) => d.dismiss())
  await page.goto(site.url + '/tests/fixtures/mount.html')
  await page.addScriptTag({ url: site.url + '/shared/cyrunner.js' })
  await page.evaluate(([f]) => window.mountFiles(f, {}), [c.files])
  await page.waitForFunction(() => window.pad && window.pad.pad, null, { timeout: 20000 })
  const mine = (await page.evaluate(() => window.pad.pad.runTests())).flatMap((r) => r.tests)
  await page.close()

  const realMap = new Map(real.map((t) => [t.title, t.state]))
  let differ = real.length !== mine.length
  const lines = mine.map((t) => {
    const rs = realMap.get(t.title)
    const same = rs === t.state
    if (!same) differ = true
    return `  ${same ? '=' : '≠'} ${t.title}: runner ${t.state}, real Cypress ${rs || 'missing'}${t.error && t.state !== 'passed' ? '\n      ' + t.error.split('\n')[0] : ''}`
  })
  if (real.length !== mine.length) lines.push(`  ≠ test count: runner ${mine.length}, real Cypress ${real.length}`)
  // What this variant is supposed to do (judged on real Cypress).
  const allPass = real.length > 0 && real.every((t) => t.state === 'passed')
  const met = c.expect === 'all-pass' ? allPass
    : c.expect === 'some-fail' ? !allPass
    : real.some((t) => t.title === c.expect.slice(6) && t.state === 'failed')
  if (differ || !met) bad++
  console.log(`${c.name}  [expect ${c.expect}: ${met ? 'yes' : 'NO'}${differ ? ', runner differs' : ''}]\n` + lines.join('\n'))
}
await browser.close(); site.close()
console.log(bad ? `${bad} difference(s) or unmet expectation(s)` : 'runner and real Cypress agree; every expectation met')
process.exit(bad ? 1 : 0)
