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
      const broken = apply(p.breaks)
      const bugs = p.checks.filter((c) => c.bug)
      // A weak test passes on the real app (that's the problem); the others must lose a test.
      // testsPass: the bug is caught by a check outside the tests (console, a click), so every test passes.
      checkpoints.push({ name: `${id}/${p.id} broken`, files: broken, expect: bugs.length || p.testsPass ? 'all-pass' : 'fewer-pass', racy: p.racy || [] })
      checkpoints.push({ name: `${id}/${p.id} solution`, files: solution, expect: 'all-pass' })
      for (const c of bugs) {
        const withBug = (f) => ({ ...f, 'src/App.jsx': f['src/App.jsx'].replace(c.bug.find, '') })
        checkpoints.push({ name: `${id}/${p.id} broken vs app bug (${c.bug.label})`, files: withBug(broken), expect: 'all-pass' })
        checkpoints.push({ name: `${id}/${p.id} solution vs app bug (${c.bug.label})`, files: withBug(solution), expect: 'fails:' + c.bug.test })
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

// Another dev server on 5173 would answer instead of ours, and every run would test the wrong app.
const portTaken = await new Promise((r) => { const s = net.createServer().once('error', () => r(true)).listen(5173, () => s.close(() => r(false))) })
if (portTaken) { console.error('Port 5173 is in use (a dev server already running?). Stop it first.'); process.exit(2) }

const work = path.join(os.tmpdir(), 'real-cypress')
let bad = 0
const site = await serve(ROOT)
const browser = await launch()
// How many tests the solution has (for "fewer-pass").
for (const c of checkpoints) {
  const sol = checkpoints.find((x) => x.name === c.name.replace(/ broken$/, ' solution'))
  c.solutionCount = sol ? Object.entries(sol.files).filter(([f]) => /^cypress\/e2e\//.test(f)).reduce((n, [, t]) => n + (t.match(/^\s*it(\.only|\.skip)?\(/gm) || []).length, 0) : 0
}
for (const c of checkpoints) {
  const dir = path.join(work, c.name.replace(/[^\w-]+/g, '-'))
  rmSync(dir, { recursive: true, force: true })
  for (const [n, t] of Object.entries(c.files)) { mkdirSync(path.dirname(path.join(dir, n)), { recursive: true }); writeFileSync(path.join(dir, n), t + '\n') }
  symlinkSync(path.join(cache, 'node_modules'), path.join(dir, 'node_modules'))
  // The real config's baseUrl is http://localhost:5173/, so the dev server must be there.
  const port = 5173
  const vite = spawn(path.join(cache, 'node_modules/.bin/vite'), ['--port', String(port), '--strictPort', '--host', 'localhost'], { cwd: dir, stdio: 'ignore' })
  const real = []
  try {
    await waitHttp(`http://localhost:${port}/`)
    const specs = readdirSync(path.join(dir, 'cypress/e2e')).sort()
    for (const spec of specs) {
      const report = path.join(dir, `results-${spec}.xml`)
      // Docker now and then exits without running anything (no report): try once more before comparing.
      for (let attempt = 0; attempt < 2 && !existsSync(report); attempt++) {
        // A named container, so a run that times out can be stopped (a hung one blocks the runs after it).
        const name = `real-cypress-${process.pid}-${Date.now()}`
        try {
          execFileSync('docker', ['run', '--rm', '--name', name, '--network', 'host', '-v', `${dir}:${dir}`, '-v', `${cache}:${cache}`, '-w', dir, 'cypress/included:16.2.0',
            '--spec', `cypress/e2e/${spec}`, '--config', 'video=false', '--reporter', 'junit', '--reporter-options', `mochaFile=${report}`],
            { stdio: 'pipe', timeout: 300000 })
        } catch { try { execFileSync('docker', ['kill', name], { stdio: 'pipe' }) } catch {} }
      }
      // The container runs as root: give its files (reports, screenshots) back to us so the next run can delete them.
      try { execFileSync('docker', ['run', '--rm', '-v', `${dir}:${dir}`, '--entrypoint', 'chown', 'cypress/included:16.2.0', '-R', `${process.getuid()}:${process.getgid()}`, dir], { stdio: 'pipe' }) } catch {}
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
  // Skipped tests are not in Cypress's junit report.
  const mine = (await page.evaluate(() => window.pad.pad.runTests())).flatMap((r) => r.tests).filter((t) => t.state !== 'pending')
  await page.close()

  const realMap = new Map(real.map((t) => [t.title, t.state]))
  // `cypress run` stops before any test when the config or the spec file is broken (no junit
  // report); the runner reports the same failure as failed tests.
  const stoppedEarly = real.length === 0 && mine.length > 0 && mine.every((t) => t.state === 'failed')
  let differ = real.length !== mine.length && !stoppedEarly
  const lines = mine.map((t) => {
    const rs = realMap.get(t.title)
    // A racy test can pass or fail in either, depending on timing.
    const same = rs === t.state || (stoppedEarly && !rs) || c.racy === true || (Array.isArray(c.racy) && c.racy.includes(t.title))
    if (!same) differ = true
    return `  ${same ? '=' : '≠'} ${t.title}: runner ${t.state}, real Cypress ${rs || 'missing'}${t.error && t.state !== 'passed' ? '\n      ' + t.error.split('\n')[0] : ''}`
  })
  if (real.length !== mine.length && !stoppedEarly) lines.push(`  ≠ test count: runner ${mine.length}, real Cypress ${real.length}`)
  // What this variant is supposed to do (judged on real Cypress).
  const allPass = real.length > 0 && real.every((t) => t.state === 'passed')
  const solutionCount = c.solutionCount
  const met = c.expect === 'all-pass' ? allPass
    : c.expect === 'fewer-pass' ? stoppedEarly || real.filter((t) => t.state === 'passed').length < c.solutionCount
    : real.some((t) => t.title === c.expect.slice(6) && t.state === 'failed')
  if (differ || !met) bad++
  console.log(`${c.name}  [expect ${c.expect}: ${met ? 'yes' : 'NO'}${differ ? ', runner differs' : ''}]\n` + lines.join('\n'))
}
await browser.close(); site.close()
console.log(bad ? `${bad} difference(s) or unmet expectation(s)` : 'runner and real Cypress agree; every expectation met')
process.exit(bad ? 1 : 0)
