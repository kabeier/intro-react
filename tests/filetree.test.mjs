import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { readdirSync, readFileSync, existsSync } from 'node:fs'
import path from 'node:path'
import { serve, launch, until, ROOT } from './helpers.mjs'

const DECK = 'lecture-1-react-vite/slides.html', LESSON = 'react-vite', PROJECT = 'pokemon-app', OTHER = 'src/main.jsx'
let srv, browser
before(async () => { srv = await serve(); browser = await launch() })
after(async () => { await browser?.close(); srv?.close() })

const rows = (page) => page.evaluate(() => [...document.querySelectorAll('.slide.active .ft-row, .ex-tree .ft-row')].filter((r) => r.offsetParent).map((r) => r.textContent.replace('▾', '').replace('▸', '').trim()))
async function openDeck(page) {
  await page.goto(srv.url + '/' + DECK)
  const n = await page.evaluate(() => [...document.querySelectorAll('.slide')].findIndex((s) => s.querySelector('.livepad')) + 1)
  await page.goto(srv.url + '/' + DECK + '#' + n)
  await page.reload()
  await page.waitForSelector('.slide.active .ft-row')
}

test('every page with an editor loads the file tree', () => {
  const pages = []
  const walk = (d) => { for (const e of readdirSync(d, { withFileTypes: true })) {
    if (['node_modules', '.git', 'tests', 'demo-kit'].includes(e.name)) continue
    const p = path.join(d, e.name)
    if (e.isDirectory()) walk(p)
    else if (e.name.endsWith('.html') && readFileSync(p, 'utf8').includes('livepad.js')) pages.push(p)
  } }
  walk(ROOT)
  assert.ok(pages.length > 2)
  for (const p of pages) {
    const s = readFileSync(p, 'utf8')
    assert.match(s, /filetree\.js/, p)
    assert.match(s, /filetree\.css/, p)
    assert.ok(s.indexOf('filetree.js') < s.indexOf('livepad.js'), p + ': the tree loads before the editor')
  }
})

test('slides: the tree shows the project, opens files, collapses and remembers', async () => {
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } })
  const errs = []
  page.on('pageerror', (e) => errs.push(e.message))
  await openDeck(page)
  const shown = await rows(page)
  assert.equal(shown[0], PROJECT, 'the top row is the project folder')
  const files = await page.evaluate(() => Object.keys(document.querySelector('.slide.active .livepad') && Livepad.pads.find((p) => p.el.closest('.slide.active')).files))
  for (const f of files) assert.ok(shown.includes(f.split('/').pop()), f)
  assert.equal(await page.textContent('.slide.active .ft-file.on'), await page.textContent('.slide.active .lp-tab.on'), 'the open file is marked')

  // Hide with the button, and it stays hidden on the next editor and after a reload
  await page.click('.slide.active .lp-files')
  assert.equal(await page.isVisible('.slide.active .lp-tree'), false)
  await page.keyboard.press('e')
  assert.equal(await page.isVisible('.slide.active .lp-tree'), true, 'E brings it back')
  await page.click('.slide.active .lp-files')
  await page.reload()
  await page.waitForSelector('.slide.active .livepad')
  assert.equal(await page.isVisible('.slide.active .lp-tree'), false, 'remembered after a reload')
  await page.keyboard.press('e')
  assert.equal(await page.evaluate(() => !!document.fullscreenElement), false, 'E is not the fullscreen key')
  assert.deepEqual(errs, [])
  await page.close()
})

test('Code Explorer: the tree opens a file, shows new files, and stays collapsed', async () => {
  const page = await browser.newPage({ viewport: { width: 1300, height: 900 } })
  const errs = []
  page.on('pageerror', (e) => errs.push(e.message))
  await page.goto(srv.url + '/explore.html?lesson=' + LESSON + '&at=f1')
  await page.waitForSelector('.ex-tree .ft-row')
  assert.equal((await rows(page))[0], PROJECT)
  await page.click(`.ex-tree [data-file="${OTHER}"]`)
  assert.equal(await page.textContent('.ex-tab.on'), OTHER, 'clicking a file shows it below')
  assert.equal(await page.textContent('.ex-tree .ft-file.on'), OTHER.split('/').pop())
  await page.click('.ex-tree-box summary')
  assert.equal(await page.isVisible('.ex-tree'), false, 'the panel collapses')
  await page.click('.ex-feature:nth-of-type(2)')
  await page.waitForSelector('.ex-tree-box')
  assert.equal(await page.isVisible('.ex-tree'), false, 'and stays collapsed on the next feature')
  assert.deepEqual(errs, [])
  await page.close()
})

test('slides: folders come first and collapse, a file off the tabs opens, a new file shows green', async () => {
  const page = await browser.newPage({ viewport: { width: 1600, height: 900 } })
  await page.addInitScript(() => localStorage.clear())
  await openDeck(page)
  const shown = await rows(page)
  assert.ok(shown.indexOf('src') < shown.indexOf('package.json'), 'folders before files, like VS Code')
  assert.ok(shown.includes('node_modules'), 'node_modules shows, greyed out')
  assert.equal(await page.locator('.slide.active .ft-off', { hasText: 'node_modules' }).count(), 1)
  assert.ok(shown.includes('main.jsx'))
  await page.click('.slide.active [data-dir="src"]')
  assert.ok(!(await rows(page)).includes('main.jsx'), 'src collapses')
  await page.click('.slide.active [data-dir="src"]')
  await page.click('.slide.active [data-file="src/main.jsx"]')
  assert.equal(await page.textContent('.slide.active .lp-tab.on'), 'src/main.jsx')
  await until(page, () => Livepad.current().editorValue.includes('createRoot'))
  await page.evaluate(() => { const p = Livepad.pads.find((x) => x.el.closest('.slide.active')); p.files['src/New.jsx'] = ''; p.syncTabs() })
  assert.equal(await page.locator('.slide.active .ft-file.new').textContent(), 'New.jsx')
  await page.close()
})

test('Code Explorer: nested folders match the lesson, and files new in a feature are green', async () => {
  const page = await browser.newPage({ viewport: { width: 1300, height: 900 } })
  await page.goto(srv.url + '/explore.html?lesson=components-props&at=f1')
  await page.waitForSelector('.ex-tree .ft-row')
  assert.ok(await page.locator('.ex-tree [data-dir="src/components"]').count())
  assert.ok(await page.locator('.ex-tree .ft-new, .ex-tree .new').count(), 'the feature adds a file')
  assert.ok((await rows(page)).includes('hero.png'), 'images show too')
  await page.close()
})

