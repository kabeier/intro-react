import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { serve, launch, until } from './helpers.mjs'

let srv, browser
before(async () => { srv = await serve(); browser = await launch() })
after(async () => { await browser?.close(); srv?.close() })

test('optional CSS Modules page: the clash, the fix, and the exercise check', async () => {
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } })
  const errs = []
  page.on('pageerror', (e) => errs.push(e.message))
  await page.goto(srv.url + '/optional-css-modules/index.html')
  await until(page, () => [...document.querySelectorAll('.op-pad iframe')].filter((f) => f.contentDocument && f.contentDocument.querySelectorAll('h2').length === 2).length === 4, null, 40000)
  const colours = await page.evaluate(() => [...document.querySelectorAll('.op-pad iframe')].map((f) => [...f.contentDocument.querySelectorAll('h2')].map((h) => getComputedStyle(h).color)))
  const blue = 'rgb(65, 105, 225)', red = 'rgb(220, 20, 60)'
  assert.deepEqual(colours, [[blue, blue], [blue, blue], [red, blue], [red, blue]], 'plain CSS clashes (1, 2); the module fixes Card (3, exercise start)')
  await page.click('#check')
  assert.match(await page.textContent('#result'), /✗ Banner still uses a plain class name/)
  await page.evaluate(() => {
    const p = pads['try-pad']
    const f = p.getFiles()
    f['src/components/Banner/Banner.module.css'] = '.title {\n  color: royalblue;\n}\n\n.big {\n  font-size: 40px;\n}'
    f['src/components/Banner/Banner.jsx'] = "import styles from './Banner.module.css'\n\nfunction Banner() {\n  return <h2 className={`${styles.title} ${styles.big}`}>Banner title</h2>\n}\n\nexport default Banner"
    p.setFiles(f)
  })
  await until(page, () => { const d = document.getElementById('try-pad').querySelector('iframe').contentDocument; const h = d && [...d.querySelectorAll('h2')].find((x) => /Banner/.test(x.textContent)); return h && /_title/.test(h.className) }, null, 20000)
  await page.click('#check')
  assert.match(await page.textContent('#result'), /✓ Banner uses its own module classes/)
  assert.deepEqual(errs, [])
  await page.close()
})
