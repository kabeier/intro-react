// Fix it problems for unit 7 · lecture 2 (pages, links, errors). The check is the whole test suite.
;(function (root) {
  const ROUTER = 'src/router.jsx', APP = 'src/App.jsx', NAV = 'src/components/NavBar/NavBar.jsx'
  const ABOUT = 'src/pages/AboutPage.jsx', NOTFOUND = 'src/pages/NotFoundPage.jsx', ERR = 'src/pages/ErrorPage.jsx'
  const SPEC = 'cypress/e2e/navigation.cy.js'
  const N = 22
  const allPass = { name: `all ${N} tests pass`, run: async (doc, win, ctx) => { const t = await ctx.runTests(); return t.length === N && t.every((x) => x.state === 'passed') } }
  const problems = [
    {
      id: 'slash', title: 'About shows the 404 page', base: 'f5', tabs: [ROUTER, SPEC],
      symptom: 'Click About: "404 - Page Not Found". "/about renders the About page" fails.',
      breaks: [{ file: ROUTER, mode: 'replace', find: "{ path: 'about', element: <AboutPage /> }", code: "{ path: 'abuot', element: <AboutPage /> }" }],
      checks: [allPass],
      hint: 'Compare the route\'s path with the address, letter by letter.',
      why: 'The path must match the URL: path: \'about\'. Anything else falls through to *.',
    },
    {
      id: 'aboutfile', title: 'Blank page: Failed to resolve import "./pages/About.jsx"', base: 'f5', tabs: [ROUTER],
      symptom: 'Blank page. The console: [plugin:vite:import-analysis] Failed to resolve import "./pages/About.jsx" from "src/router.jsx". Does the file exist?',
      breaks: [{ file: ROUTER, mode: 'replace', find: "import AboutPage from './pages/AboutPage.jsx'", code: "import AboutPage from './pages/About.jsx'" }],
      checks: [allPass],
      hint: 'Open src/pages: what is the file called?',
      why: 'The import path must name the real file: \'./pages/AboutPage.jsx\'. The name after import (AboutPage) can be anything; the path cannot.',
    },
    {
      id: 'a', title: 'The navbar reloads the page', base: 'f5', tabs: [NAV, SPEC],
      symptom: 'Clicking About reloads everything (the cards reset). "navigates with the navbar without reloading the page" fails: noReload does not exist.',
      breaks: [{ file: NAV, mode: 'replace', find: '<Nav.Link as={Link} to="/about">About</Nav.Link>', code: '<Nav.Link href="/about">About</Nav.Link>' }],
      checks: [allPass],
      hint: 'What does Nav.Link render by itself? What makes it a router link?',
      why: 'Without as={Link}, Nav.Link is a plain <a href>: a full page load. Use <Nav.Link as={Link} to="/about">.',
    },
    {
      id: 'errorroot', title: 'A crash hides the header', base: 'f5', tabs: [ROUTER, SPEC],
      symptom: 'Test errorElement shows the error page, but the header and navbar disappear. The error test fails on header.',
      breaks: [
        { file: ROUTER, mode: 'replace', find: "    element: <App />,\n    children: [\n      {\n        errorElement: <ErrorPage />,\n        children: [", code: "    element: <App />,\n    errorElement: <ErrorPage />,\n    children: [\n      {\n        children: [" },
      ],
      checks: [allPass],
      hint: 'Which route\'s element does the error page replace?',
      why: 'An errorElement replaces its own route\'s element. On the root it replaces App (and the header). Put it on the pathless child route that wraps the pages.',
    },
    {
      id: 'nonav', title: 'The navbar is gone', base: 'f5', tabs: [APP, NAV, SPEC],
      symptom: 'No navbar on any page. "navigates with the navbar…" fails: Expected to find element: `nav`. "shows the nav links" fails: Expected to find content: \'About\' within the selector: \'nav a\'.',
      breaks: [{ file: APP, mode: 'replace', find: '      <NavBar />\n', code: '' }],
      checks: [allPass],
      hint: 'NavBar.jsx exists and is imported. Is it rendered anywhere?',
      why: 'A component shows only where it is rendered: <NavBar /> in App, above <main>, so every page has it.',
    },
    {
      id: 'linkimport', title: '"Link is not defined" on the 404 page', base: 'f5', tabs: [NOTFOUND],
      symptom: 'An unknown address shows "Something went wrong: Link is not defined" (inside the layout) instead of the 404 page.',
      breaks: [{ file: NOTFOUND, mode: 'replace', find: "import { Link } from 'react-router'\n\n", code: '' }],
      checks: [allPass],
      hint: 'Each file imports what it uses.',
      why: 'NotFoundPage uses Link, so it needs import { Link } from \'react-router\'.',
    },
    {
      id: 'message', title: 'Bonus: the error page crashes too', base: 'f5', tabs: [ERR],
      symptom: 'Click Test errorElement: React Router\'s plain default error screen appears instead of ours.',
      breaks: [{ file: ERR, mode: 'replace', find: '  const error = useRouteError()', code: '  const error = useRouteError()\n  error.details.trim()' }],
      checks: [allPass],
      hint: 'An error page must not throw. What is error.details?',
      why: 'The error page itself crashed (error.details is undefined), so the router fell back to its default screen. Read only what exists: message, or status for responses.',
    },
    {
      id: 'brand', title: 'Bonus: the brand reloads the page', base: 'f5', tabs: [NAV],
      symptom: 'Clicking the PokeSearch brand reloads the whole app.',
      breaks: [{ file: NAV, mode: 'replace', find: '<Navbar.Brand as={Link} to="/">', code: '<Navbar.Brand href="/">' }],
      checks: [allPass, { name: 'the brand is a router link', run: async (doc, win, ctx) => {
        await ctx.wait(500)
        win.__brandMark = true
        const a = doc.querySelector('.navbar-brand')
        if (!a) return false
        a.click()
        await ctx.wait(600)
        await ctx.settled()
        return ctx.doc().defaultView.__brandMark === true
      } }],
      testsPass: true,
      hint: 'Same as Nav.Link: what turns it into a router link?',
      why: 'Navbar.Brand renders a plain <a> unless you give it as={Link} to="/".',
    },
    {
      id: 'aboutcrash', title: 'Bonus: About crashes on its own', base: 'f5', tabs: [ABOUT],
      symptom: 'Opening About shows "Something went wrong" right away, without clicking anything.',
      breaks: [{ file: ABOUT, mode: 'replace', find: 'const [crash, setCrash] = useState(false)', code: 'const [crash, setCrash] = useState(true)' }],
      checks: [allPass],
      hint: 'When does the page throw?',
      why: 'The page throws while crash is true; it must start false: useState(false).',
    },
    {
      id: 'navlink', title: 'Bonus: About link goes nowhere', base: 'f5', tabs: [NAV],
      symptom: 'Clicking About keeps you on the home page. No error.',
      breaks: [{ file: NAV, mode: 'replace', find: '<Nav.Link as={Link} to="/about">About</Nav.Link>', code: '<Nav.Link as={Link} href="/about">About</Nav.Link>' }],
      checks: [allPass],
      hint: 'A router Link uses a different prop than an <a>.',
      why: 'Link takes to, not href: <Nav.Link as={Link} to="/about">.',
    },
  ]
  root.FIXIT = root.FIXIT || {}
  root.FIXIT['router-pages'] = problems
})(typeof self !== 'undefined' ? self : globalThis)
