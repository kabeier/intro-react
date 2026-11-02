import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readdirSync, existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { ROOT } from './helpers.mjs'

const decks = readdirSync(ROOT).filter((d) => existsSync(path.join(ROOT, d, 'slides.html')))

test('the first thing in every slide\'s presenter notes is the plan for that slide', () => {
  assert.ok(decks.length > 0)
  for (const d of decks) {
    const slides = readFileSync(path.join(ROOT, d, 'slides.html'), 'utf8').split(/(?=<section class="slide)/).slice(1)
    slides.forEach((s, k) => {
      const m = /<aside class="notes">\s*<p class="plan"><b>The plan:<\/b> ([^<]+)<\/p>/.exec(s)
      assert.ok(m, `${d} slide ${k + 1}: no plan line first`)
      assert.ok(m[1].split(/\s+/).length <= 30, `${d} slide ${k + 1}: keep it short`)
    })
  }
})
