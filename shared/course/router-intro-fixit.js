// Fix it problems for unit 7 · lecture 1 (router setup). The check is the whole test suite.
;(function (root) {
  const MAIN = 'src/main.jsx', ROUTER = 'src/router.jsx', APP = 'src/App.jsx', HOME = 'src/pages/HomePage.jsx'
  const N = 17
  const allPass = { name: `all ${N} tests pass`, run: async (doc, win, ctx) => { const t = await ctx.runTests(); return t.length === N && t.every((x) => x.state === 'passed') } }
  const problems = [
    {
      id: 'provider', title: 'Only the heading shows', base: 'f2', tabs: [MAIN, ROUTER, APP],
      symptom: 'The page shows the heading and nothing else: no counter, no search. No error.',
      breaks: [
        { file: MAIN, mode: 'replace', find: "import router from './router.jsx'", code: "import App from './App.jsx'" },
        { file: MAIN, mode: 'replace', find: '<RouterProvider router={router} />', code: '<App />' },
      ],
      checks: [allPass],
      hint: 'Who decides which page goes into the Outlet? Is it running?',
      why: 'main.jsx must render the router: <RouterProvider router={router} />. Rendering App directly leaves its Outlet empty.',
    },
    {
      id: 'outlet', title: 'The home page is missing', base: 'f2', tabs: [APP, ROUTER],
      symptom: 'Heading only. The router is set up, HomePage exists, and there is no error.',
      breaks: [{ file: APP, mode: 'replace', find: '      <Outlet />\n', code: '' }],
      checks: [allPass],
      hint: 'Where in App does a child route\'s page appear?',
      why: 'App must say where pages go: <Outlet />.',
    },
    {
      id: 'index', title: 'Home is empty, /home works', base: 'f2', tabs: [ROUTER],
      symptom: 'At / only the heading shows. Typing /home in the address shows the counter and search.',
      breaks: [{ file: ROUTER, mode: 'replace', find: '{ index: true, element: <HomePage /> }', code: "{ path: 'home', element: <HomePage /> }" }],
      checks: [allPass],
      hint: 'Which route matches the parent\'s own path, /?',
      why: 'The page for / is the index route: { index: true, element: <HomePage /> }.',
    },
    {
      id: 'element', title: '"Functions are not valid as a React child"', base: 'f2', tabs: [ROUTER],
      symptom: 'A blank page. The console: Functions are not valid as a React child.',
      breaks: [{ file: ROUTER, mode: 'replace', find: "  {\n    path: '/',\n    element: <App />,", code: "  {\n    path: '/',\n    element: App," }],
      checks: [allPass],
      hint: 'element wants something to render. Is App rendered here, or just named?',
      why: 'element takes JSX: element: <App />. App alone is the function itself.',
    },
    {
      id: 'dom', title: 'Blank page: Failed to resolve import "react-router-dom"', base: 'f2', tabs: [MAIN, 'package.json'],
      symptom: 'Blank page. The console: [plugin:vite:import-analysis] Failed to resolve import "react-router-dom" from "src/main.jsx". Does the file exist?',
      breaks: [{ file: MAIN, mode: 'replace', find: "import { RouterProvider } from 'react-router/dom'", code: "import { RouterProvider } from 'react-router-dom'" }],
      checks: [allPass],
      hint: 'Which package did we install? (Older tutorials use a different one.)',
      why: 'In React Router 8 there is one package, react-router. RouterProvider comes from \'react-router/dom\'.',
    },
    {
      id: 'children', title: 'Only the heading, and a typo hunt', base: 'f2', tabs: [ROUTER],
      symptom: 'Heading only, no error. App and HomePage look right.',
      breaks: [{ file: ROUTER, mode: 'replace', find: '    children: [', code: '    chidren: [' }],
      checks: [allPass],
      hint: 'The router ignores keys it doesn\'t know. Spell each one.',
      why: 'The child routes must be under children (with the r). An unknown key is silently ignored.',
    },
    {
      id: 'export', title: 'Bonus: "does not provide an export named \'default\'"', base: 'f2', tabs: [ROUTER, MAIN],
      symptom: 'Blank page. The console: The requested module \'/src/router.jsx\' does not provide an export named \'default\'.',
      breaks: [{ file: ROUTER, mode: 'replace', find: '\n\nexport default router', code: '' }],
      checks: [allPass],
      hint: 'main.jsx imports router. Does router.jsx give it away?',
      why: 'router.jsx must end with export default router.',
    },
    {
      id: 'outletimport', title: 'Bonus: "does not provide an export named \'Outlet\'"', base: 'f2', tabs: [APP],
      symptom: 'Blank page. The console: The requested module \'react-router/dom\' does not provide an export named \'Outlet\'.',
      breaks: [{ file: APP, mode: 'replace', find: "import { Outlet } from 'react-router'", code: "import { Outlet } from 'react-router/dom'" }],
      checks: [allPass],
      hint: 'react-router/dom only has the browser parts (RouterProvider). Where does everything else come from?',
      why: 'Outlet, Link, useParams… come from \'react-router\'. Only RouterProvider comes from \'react-router/dom\'.',
    },
    {
      id: 'path', title: 'Bonus: "Failed to resolve import" in HomePage', base: 'f2', tabs: [HOME],
      symptom: 'Blank page. The console: [plugin:vite:import-analysis] Failed to resolve import "../components/counter" from "src/pages/HomePage.jsx".',
      breaks: [{ file: HOME, mode: 'replace', find: "import Counter from '../components/Counter'", code: "import Counter from '../components/counter'" }],
      checks: [allPass],
      hint: 'Paths are case-sensitive.',
      why: 'The folder is Counter: \'../components/Counter\'.',
    },
    {
      id: 'routerprop', title: 'Bonus: blank page from RouterProvider', base: 'f2', tabs: [MAIN],
      symptom: 'Blank page. The console: Uncaught TypeError: Cannot read properties of undefined (reading \'state\').',
      breaks: [{ file: MAIN, mode: 'replace', find: '<RouterProvider router={router} />', code: '<RouterProvider />' }],
      checks: [allPass],
      hint: 'Which router should RouterProvider run?',
      why: 'RouterProvider needs the router you made: <RouterProvider router={router} />.',
    },
  ]
  root.FIXIT = root.FIXIT || {}
  root.FIXIT['router-intro'] = problems
})(typeof self !== 'undefined' ? self : globalThis)
