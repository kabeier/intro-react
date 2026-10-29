// Test helpers: serve the site folder and launch Chromium with the playwright-core
// from the npx cache (same approach as the skill's scripts/check-slides.mjs).
import { spawn } from 'node:child_process'
import { createRequire } from 'node:module'
import { existsSync, readdirSync } from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import net from 'node:net'
import { fileURLToPath } from 'node:url'

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

function findPlaywright() {
  const npx = path.join(os.homedir(), '.npm', '_npx')
  if (existsSync(npx)) {
    for (const d of readdirSync(npx)) {
      const t = path.join(npx, d, 'node_modules', 'playwright-core')
      if (existsSync(path.join(t, 'package.json'))) return createRequire(import.meta.url)(t)
    }
  }
  throw new Error('playwright-core not found. Run once: npx -y playwright@latest install chromium')
}

function chromePath() {
  const base = path.join(os.homedir(), '.cache', 'ms-playwright')
  if (!existsSync(base)) return undefined
  for (const d of readdirSync(base).filter((x) => /^chromium-\d+$/.test(x)).sort().reverse()) {
    const p = path.join(base, d, 'chrome-linux64', 'chrome')
    if (existsSync(p)) return p
  }
  return undefined
}

const freePort = () => new Promise((resolve) => {
  const s = net.createServer().listen(0, () => { const { port } = s.address(); s.close(() => resolve(port)) })
})

export async function serve(root = ROOT) {
  const port = await freePort()
  const proc = spawn('python3', ['-m', 'http.server', String(port), '--bind', '127.0.0.1'], { cwd: root, stdio: 'ignore' })
  for (let k = 0; k < 50; k++) {
    try { const r = await fetch(`http://127.0.0.1:${port}/`); if (r.ok) break } catch {}
    await new Promise((r) => setTimeout(r, 100))
  }
  return { url: `http://127.0.0.1:${port}`, close: () => proc.kill() }
}

export async function launch() {
  const { chromium } = findPlaywright()
  try { return await chromium.launch() } catch { return await chromium.launch({ executablePath: chromePath() }) }
}

// Poll fn() in the page until it returns truthy (or time out with the last value).
export async function until(page, fn, arg, ms = 8000) {
  const end = Date.now() + ms
  let last
  while (Date.now() < end) {
    last = await page.evaluate(fn, arg)
    if (last) return last
    await page.waitForTimeout(100)
  }
  throw new Error('timed out; last value: ' + JSON.stringify(last))
}
