import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { serve, launch, until } from './helpers.mjs'

let srv, browser
before(async () => { srv = await serve(); browser = await launch() })
after(async () => { await browser?.close(); srv?.close() })

const base = {
  'index.html': '<!doctype html>\n<html lang="en">\n  <head>\n    <meta charset="UTF-8" />\n    <title>pokemon-app</title>\n  </head>\n  <body>\n    <div id="root"></div>\n    <script type="module" src="/src/main.jsx"></script>\n  </body>\n</html>',
  'src/main.jsx': "import { StrictMode } from 'react'\nimport { createRoot } from 'react-dom/client'\nimport './index.css'\nimport App from './App.jsx'\n\ncreateRoot(document.getElementById('root')).render(\n  <StrictMode>\n    <App />\n  </StrictMode>,\n)",
  'src/index.css': 'body { margin: 0 }',
  'src/App.css': 'h1 { color: rgb(255, 0, 0) }',
  'src/App.jsx': "import { useState } from 'react'\nimport './App.css'\nimport Card from './components/Card.jsx'\n\nfunction App() {\n  const [count, setCount] = useState(0)\n  return (\n    <>\n      <h1>Hi</h1>\n      <button id=\"b\" onClick={() => setCount((c) => c + 1)}>count is {count}</button>\n      <Card name=\"pikachu\" />\n    </>\n  )\n}\n\nexport default App",
  'src/components/Card.jsx': 'export default function Card({ name }) {\n  return <p className="card">{name}</p>\n}',
}

async function mount(files, assets) {
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } })
  await page.goto(srv.url + '/tests/fixtures/mount.html')
  await page.evaluate(([f, a]) => window.mountFiles(f, a), [files, assets || {}])
  return page
}
const frame = (page) => page.frames().find((f) => f !== page.mainFrame() && f.parentFrame() === page.mainFrame() && f.url() === 'about:srcdoc')
const consoleText = (page) => page.evaluate(() => document.querySelector('.lp-console')?.textContent || '')

test('a Vite React app runs in the preview: JSX, StrictMode, state, CSS and component imports', async () => {
  const page = await mount(base)
  await until(page, () => !!document.querySelector('.lp-preview iframe').contentDocument.querySelector('#b'), null, 20000)
  const f = frame(page)
  await f.evaluate(() => { document.querySelector('#b').click() })
  await f.evaluate(() => { document.querySelector('#b').click() })
  await page.waitForTimeout(100)
  assert.equal(await f.textContent('#b'), 'count is 2')
  assert.equal(await f.evaluate(() => getComputedStyle(document.querySelector('h1')).color), 'rgb(255, 0, 0)')
  assert.equal(await f.textContent('.card'), 'pikachu')
  await page.close()
})

test('a JSX syntax error shows in the console panel with the file name', async () => {
  const page = await mount({ ...base, 'src/App.jsx': 'export default function App() {\n  return <h1>oops</h2>\n}' })
  await until(page, () => /src\/App\.jsx/.test(document.querySelector('.lp-console')?.textContent || ''), null, 20000)
  assert.match(await page.evaluate(() => document.querySelector('.lp-console .err').textContent), /App\.jsx/)
  await page.close()
})

test('npm packages from the import map load (axios)', async () => {
  const page = await mount({ ...base, 'src/App.jsx': "import axios from 'axios'\nconsole.log('axios.get is a', typeof axios.get)\nexport default function App() { return <h1>x</h1> }" })
  await until(page, () => /axios\.get is a function/.test(document.querySelector('.lp-console')?.textContent || ''), null, 20000)
  await page.close()
})

test('imported assets work: svg from the files, png from the lesson assets, /public files', async () => {
  const files = { ...base,
    'src/assets/logo.svg': '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"><rect width="10" height="10"/></svg>',
    'public/icons.svg': '<svg xmlns="http://www.w3.org/2000/svg"><symbol id="i"><rect width="5" height="5"/></symbol></svg>',
    'src/App.jsx': "import logo from './assets/logo.svg'\nimport hero from './assets/hero.png'\nexport default function App() {\n  return <><img id=\"a\" src={logo} alt=\"\" /><img id=\"b\" src={hero} alt=\"\" /><img id=\"c\" src=\"/icons.svg\" alt=\"\" /></>\n}" }
  const page = await mount(files, { 'src/assets/hero.png': '/tests/fixtures/hero.png' })
  await until(page, () => { const d = document.querySelector('.lp-preview iframe').contentDocument; return d.querySelector('#a') && d.querySelector('#b') }, null, 20000)
  const f = frame(page)
  await page.waitForTimeout(800)
  const loaded = await f.evaluate(() => ['#a', '#b', '#c'].map((s) => document.querySelector(s).naturalWidth > 0))
  assert.deepEqual(loaded, [true, true, true])
  await page.close()
})
