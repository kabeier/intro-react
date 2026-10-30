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

const app = (body) => ({ ...base, 'src/App.jsx': body })
const waitConsole = (page, re) => until(page, (s) => new RegExp(s).test(document.querySelector('.lp-console')?.textContent || ''), re.source, 20000)

test('React development build: helpful warnings show (style string, functions as children)', async () => {
  const page = await mount(app('export default function App() {\n  const f = () => 1\n  return <><p style="color: red">x</p></>\n}'))
  await waitConsole(page, /prop expects a mapping/)
  await page.close()
})

test('re-exports, export *, and dynamic import() of local files work', async () => {
  const page = await mount({ ...base,
    'src/components/Inner.jsx': 'export default function Inner() { return <p id="inner">inner</p> }\nexport const N = 7',
    'src/components/index.js': "export { default as Inner } from './Inner.jsx'\nexport * from './Inner.jsx'",
    'src/App.jsx': "import { Inner, N } from './components'\nexport default function App() {\n  import('./components/Inner.jsx').then((m) => console.log('dynamic', m.N))\n  return <><Inner /><p id=\"n\">{N}</p></>\n}" })
  await waitConsole(page, /dynamic 7/)
  await page.close()
})

test('an import cycle gives a clear message', async () => {
  const page = await mount({ ...base,
    'src/A.jsx': "import B from './B.jsx'\nexport default function A() { return <B /> }",
    'src/B.jsx': "import A from './A.jsx'\nexport default function B() { return <p>b</p> }",
    'src/App.jsx': "import A from './A.jsx'\nexport default function App() { return <A /> }" })
  await waitConsole(page, /import each other/)
  await page.close()
})

test('commented-out imports are ignored; import.meta.env works; CSS @import and url() resolve', async () => {
  const page = await mount({ ...base,
    'src/extra.css': 'h1 { letter-spacing: 3px }',
    'src/App.css': "@import './extra.css';\nh1 { color: rgb(255, 0, 0); background: url(./assets/logo.svg) }",
    'src/assets/logo.svg': '<svg xmlns="http://www.w3.org/2000/svg" width="4" height="4"/>',
    'src/App.jsx': "/* import Old from './Old.jsx' */\nimport './App.css'\nexport default function App() {\n  console.log('mode', import.meta.env.MODE)\n  return <h1>Hi</h1>\n}" })
  await waitConsole(page, /mode development/)
  const f = frame(page)
  const st = await f.evaluate(() => { const c = getComputedStyle(document.querySelector('h1')); return [c.letterSpacing, c.backgroundImage.startsWith('url("blob:') || c.backgroundImage.startsWith('url("data:')] })
  assert.deepEqual(st, ['3px', true])
  await page.close()
})

test('an asset import mixed with named imports keeps the default binding', async () => {
  const page = await mount({ ...base,
    'src/assets/logo.svg': '<svg xmlns="http://www.w3.org/2000/svg" width="4" height="4"/>',
    'src/App.jsx': "import logo from './assets/logo.svg'\nimport { useState } from 'react'\nexport default function App() {\n  const [x] = useState(1)\n  console.log('logo is', typeof logo, x)\n  return <img src={logo} alt=\"\" />\n}" })
  await waitConsole(page, /logo is string 1/)
  await page.close()
})

test('offline (no Babel from the CDN) says so plainly', async () => {
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } })
  await page.route('**/@babel/standalone@*/**', (r) => r.abort())
  await page.goto(srv.url + '/tests/fixtures/mount.html')
  await page.evaluate(([f]) => window.mountFiles(f, {}), [base])
  await waitConsole(page, /Can't load React tools from the internet/)
  await page.close()
})

test('console formats %s placeholders like DevTools (React warnings read cleanly)', async () => {
  const page = await mount(app('export default function App() {\n  const f = () => 1\n  console.log("a %s b %d", "X", 5)\n  return <p>{f}</p>\n}'))
  await waitConsole(page, /a X b 5/)
  await waitConsole(page, /Functions are not valid as a React child/)
  const t = await page.evaluate(() => document.querySelector('.lp-console').textContent)
  assert.doesNotMatch(t, /%s/)
  await page.close()
})

test('an uncaught promise rejection shows in the console like DevTools', async () => {
  const page = await mount(app("export default function App() {\n  Promise.reject(Object.assign(new Error('Request failed with status code 404'), { name: 'AxiosError' }))\n  return <p>hi</p>\n}"))
  await waitConsole(page, /Uncaught \(in promise\) AxiosError: Request failed with status code 404/)
  await page.close()
})
