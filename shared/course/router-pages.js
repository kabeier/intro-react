// Unit 7 · Lecture 2 · Pages: About, a 404 page, an error page inside the layout, and a NavBar
// that moves between pages without reloading. Each page starts with a failing test.
// Follows phase-II/04-Front-End/7-intro-to-react-router/2-adding-router-pages.md
const ROUTES_HEAD = "import { createBrowserRouter } from 'react-router'\nimport App from './App.jsx'\nimport HomePage from './pages/HomePage.jsx'\n"
Course.register({
  id: 'router-pages',
  label: 'Unit 7 · Lecture 2',
  title: 'Pages, links and errors',
  base: { lesson: 'router-intro', feature: 'f2' },
  files: { ...Course.checkpoint(Course.get('router-intro'), 'f2') },
  features: [
    {
      id: 'f1', title: 'An About page',
      why: 'A new page = a component in src/pages + a route with a path. cy.visit(\'/about\') opens it directly, like typing the address.',
      steps: [
        {
          id: 'f1s1', file: 'cypress/e2e/navigation.cy.js', mode: 'set',
          code: "beforeEach(() => {\n  cy.intercept('GET', '**/api/v2/pokemon/pikachu', { fixture: 'pikachu.json' })\n})\n\nit('/about renders the About page', () => {\n  cy.visit('/about')\n  cy.contains('h2', 'About This App')\n  cy.get('header').should('be.visible')\n})",
          say: 'A new spec for pages. Visit /about: the About heading, and the layout (header) still there. Run it: red.',
          notes: [{ match: "cy.visit('/about')", what: 'Opens the app at /about, like typing the address.', why: 'Every page has its own URL you can share or bookmark.' }],
        },
        {
          id: 'f1s2', file: 'src/pages/AboutPage.jsx', mode: 'set',
          code: "function AboutPage() {\n  return (\n    <section className=\"space-y-3 rounded-xl bg-white p-4 shadow\">\n      <h2 className=\"text-2xl font-bold\">About This App</h2>\n      <p>Search the PokeAPI, collect cards, and make them shiny.</p>\n    </section>\n  )\n}\n\nexport default AboutPage",
          say: 'The page component.',
        },
        {
          id: 'f1s3', file: 'src/router.jsx', mode: 'set',
          code: ROUTES_HEAD + "import AboutPage from './pages/AboutPage.jsx'\n\nconst router = createBrowserRouter([\n  {\n    path: '/',\n    element: <App />,\n    children: [\n      { index: true, element: <HomePage /> },\n      { path: 'about', element: <AboutPage /> },\n    ],\n  },\n])\n\nexport default router",
          say: 'A child route: path \'about\' (no slash) = /about. Run the test: green.',
          notes: [{ match: "{ path: 'about', element: <AboutPage /> }", what: 'At /about, show AboutPage inside App\'s Outlet.', why: 'Child paths are relative to the parent, so no leading /.' }],
        },
      ],
    },
    {
      id: 'f2', title: 'A 404 page',
      why: 'path: \'*\' matches any URL no other route matched. It goes last.',
      steps: [
        {
          id: 'f2s1', file: 'cypress/e2e/navigation.cy.js', mode: 'append',
          code: "it('shows a 404 page for an unknown route', () => {\n  cy.visit('/this-page-does-not-exist')\n  cy.contains('h2', '404 - Page Not Found')\n})",
          say: 'Test first: an address that doesn\'t exist. Red.',
        },
        {
          id: 'f2s2', file: 'src/pages/NotFoundPage.jsx', mode: 'set',
          code: "import { Link } from 'react-router'\n\nfunction NotFoundPage() {\n  return (\n    <section className=\"space-y-3 rounded-xl bg-white p-4 shadow\">\n      <h2 className=\"text-2xl font-bold\">404 - Page Not Found</h2>\n      <Link to=\"/\">Back home</Link>\n    </section>\n  )\n}\n\nexport default NotFoundPage",
          say: 'A page with a way back. Link is the router\'s <a>: no page reload.',
        },
        {
          id: 'f2s3', file: 'src/router.jsx', mode: 'set',
          code: ROUTES_HEAD + "import AboutPage from './pages/AboutPage.jsx'\nimport NotFoundPage from './pages/NotFoundPage.jsx'\n\nconst router = createBrowserRouter([\n  {\n    path: '/',\n    element: <App />,\n    children: [\n      { index: true, element: <HomePage /> },\n      { path: 'about', element: <AboutPage /> },\n      { path: '*', element: <NotFoundPage /> },\n    ],\n  },\n])\n\nexport default router",
          say: 'path \'*\' catches everything else. Green.',
          notes: [{ match: "{ path: '*', element: <NotFoundPage /> }", what: 'The catch-all route.', why: 'Inside App\'s children, so the 404 page keeps the header.' }],
        },
      ],
    },
    {
      id: 'f3', title: 'An error page inside the layout',
      why: 'errorElement shows instead of a page that crashed. On a pathless child route it replaces only the page, so the header and NavBar stay.',
      steps: [
        {
          id: 'f3s1', file: 'cypress/e2e/navigation.cy.js', mode: 'append',
          code: "it('shows the error page inside the layout when a page crashes', () => {\n  cy.visit('/about')\n  cy.contains('button', 'Test errorElement').click()\n  cy.contains('h2', 'Something went wrong')\n  cy.get('header').should('be.visible')\n})",
          say: 'Test first: a page crashes; we want our error page, with the header still there. Red.',
        },
        {
          id: 'f3s2', file: 'src/pages/AboutPage.jsx', mode: 'set',
          code: "import { useState } from 'react'\nimport Button from '../components/Button'\n\nfunction AboutPage() {\n  const [crash, setCrash] = useState(false)\n  if (crash) throw new Error('This page intentionally crashed')\n\n  return (\n    <section className=\"space-y-3 rounded-xl bg-white p-4 shadow\">\n      <h2 className=\"text-2xl font-bold\">About This App</h2>\n      <p>Search the PokeAPI, collect cards, and make them shiny.</p>\n      <Button onClick={() => setCrash(true)}>Test errorElement</Button>\n    </section>\n  )\n}\n\nexport default AboutPage",
          say: 'A button that makes the page throw while rendering, so we can see what happens.',
        },
        {
          id: 'f3s3', file: 'src/pages/ErrorPage.jsx', mode: 'set',
          code: "import { Link, isRouteErrorResponse, useRouteError } from 'react-router'\n\nfunction ErrorPage() {\n  const error = useRouteError()\n  const message = isRouteErrorResponse(error) ? `${error.status} ${error.statusText}` : error.message\n\n  return (\n    <section className=\"space-y-3 rounded-xl bg-white p-4 shadow\">\n      <h2 className=\"text-2xl font-bold\">Something went wrong</h2>\n      <p>{message}</p>\n      <Link to=\"/\">Back home</Link>\n    </section>\n  )\n}\n\nexport default ErrorPage",
          say: 'useRouteError gives the error the router caught.',
          notes: [
            { match: 'const error = useRouteError()', what: 'The error that stopped the page.', why: 'A thrown Error, or a response error (404 from a loader).' },
            { match: 'isRouteErrorResponse(error)', what: 'true for errors with a status (404, 500).', why: 'Those have status and statusText instead of message.' },
          ],
        },
        {
          id: 'f3s4', file: 'src/router.jsx', mode: 'set',
          code: ROUTES_HEAD + "import AboutPage from './pages/AboutPage.jsx'\nimport NotFoundPage from './pages/NotFoundPage.jsx'\nimport ErrorPage from './pages/ErrorPage.jsx'\n\nconst router = createBrowserRouter([\n  {\n    path: '/',\n    element: <App />,\n    children: [\n      {\n        errorElement: <ErrorPage />,\n        children: [\n          { index: true, element: <HomePage /> },\n          { path: 'about', element: <AboutPage /> },\n          { path: '*', element: <NotFoundPage /> },\n        ],\n      },\n    ],\n  },\n])\n\nexport default router",
          say: 'A route with no path, only an errorElement, wrapping the pages. A crash replaces just the page. Green.',
          notes: [{ match: 'errorElement: <ErrorPage />,', what: 'Shown instead of any child that throws.', why: 'On the root route it would replace App too (no header). One level down, App stays.' }],
        },
      ],
    },
    {
      id: 'f4', title: 'A NavBar: <a> versus Link',
      why: 'A plain <a href> asks the server for a new page: everything reloads and state is lost. <Link to> changes the URL and renders the new page without a reload.',
      steps: [
        {
          id: 'f4s1', file: 'cypress/e2e/navigation.cy.js', mode: 'append',
          code: "it('navigates with the navbar without reloading the page', () => {\n  cy.visit('/')\n  cy.window().then((win) => { win.noReload = true })\n  cy.get('nav').contains('a', 'About').click()\n  cy.location('pathname').should('eq', '/about')\n  cy.window().its('noReload').should('eq', true)\n})",
          say: 'Mark the window, click About, check the mark is still there: a reload would wipe it. Red: no nav yet.',
          notes: [
            { match: 'cy.window().then((win) => { win.noReload = true })', what: 'Puts a marker on the page\'s window.', why: 'A full reload makes a new window without it.' },
            { match: "cy.location('pathname').should('eq', '/about')", what: 'Checks the path part of the URL.', why: 'pathname = the URL without the http://localhost:5173 part.' },
          ],
        },
        {
          id: 'f4s2', later: { how: "Plain <a> links reload the whole page, and state is lost.", where: "step 6 on this slide (Link)" }, file: 'src/components/NavBar/NavBar.jsx', mode: 'set',
          code: "function NavBar() {\n  return (\n    <nav className=\"mx-auto flex max-w-5xl gap-4 px-6 pt-4\">\n      <a href=\"/\">Home</a>\n      <a href=\"/about\">About</a>\n    </nav>\n  )\n}\n\nexport default NavBar",
          say: 'First with plain <a> tags.',
        },
        { id: 'f4s3', file: 'src/components/NavBar/index.js', mode: 'set', code: "export { default } from './NavBar'", say: 'Its index.js.' },
        {
          id: 'f4s4', file: 'src/App.jsx', mode: 'replace', find: "import Heading from './components/Heading'",
          code: "import Heading from './components/Heading'\nimport NavBar from './components/NavBar'",
          say: 'App shows it on every page…',
        },
        {
          id: 'f4s5', file: 'src/App.jsx', mode: 'replace',
          find: '    <main className="mx-auto max-w-5xl space-y-6 p-6">\n      <Heading />\n      <Outlet />\n    </main>',
          code: '    <>\n      <NavBar />\n      <main className="mx-auto max-w-5xl space-y-6 p-6">\n        <Heading />\n        <Outlet />\n      </main>\n    </>',
          say: '…above main, outside the header (the header test wants one button there). Run the test: still red. The page reloaded: the marker is gone.',
        },
        {
          id: 'f4s6', fixes: ["f4s2"], file: 'src/components/NavBar/NavBar.jsx', mode: 'set',
          code: "import { Link } from 'react-router'\n\nfunction NavBar() {\n  return (\n    <nav className=\"mx-auto flex max-w-5xl gap-4 px-6 pt-4\">\n      <Link to=\"/\">Home</Link>\n      <Link to=\"/about\">About</Link>\n    </nav>\n  )\n}\n\nexport default NavBar",
          say: 'Link instead of a, to instead of href. Run the test: green, no reload.',
          notes: [{ match: '<Link to="/about">About</Link>', what: 'Renders an <a>, but a click changes the page without a reload.', why: 'State (the cards, the count) survives; nothing is downloaded again.',
            api: { name: '<Link to="/path">', does: 'A link inside the app.', params: [['to', 'the path to go to', "'/about', or `/pokemon/${id}`"]], mistakes: ['<a href> inside the app: a full reload, and all state is lost.', 'Link to an outside site: use a normal <a href="https://…">.'] } }],
        },
      ],
    },
    {
      id: 'f5', title: 'A React Bootstrap Navbar',
      why: 'Navbar and Nav.Link come styled. as={Link} makes them render a router Link, so they keep working without reloads.',
      steps: [
        {
          id: 'f5s1', file: 'cypress/e2e/navigation.cy.js', mode: 'append',
          code: "it('shows the nav links', () => {\n  cy.visit('/')\n  cy.contains('nav a', 'About').should('be.visible')\n})",
          say: 'A guard: the links must be visible (a collapsed menu would hide them). Green now; it must stay green.',
        },
        {
          id: 'f5s2', file: 'src/components/NavBar/NavBar.jsx', mode: 'set',
          code: "import { Link } from 'react-router'\nimport Navbar from 'react-bootstrap/Navbar'\nimport Nav from 'react-bootstrap/Nav'\n\nfunction NavBar() {\n  return (\n    <Navbar bg=\"primary\" data-bs-theme=\"dark\" style={{ paddingInline: '1.5rem' }}>\n      <Navbar.Brand as={Link} to=\"/\">PokeSearch</Navbar.Brand>\n      <Nav>\n        <Nav.Link as={Link} to=\"/\">Home</Nav.Link>\n        <Nav.Link as={Link} to=\"/about\">About</Nav.Link>\n      </Nav>\n    </Navbar>\n  )\n}\n\nexport default NavBar",
          say: 'Bootstrap\'s Navbar. as={Link}: look like a Nav.Link, work like a router Link. Run the tests: 22 green.',
          notes: [
            { match: '<Nav.Link as={Link} to="/about">About</Nav.Link>', what: 'Bootstrap\'s look, the router\'s behaviour.', why: 'Without as={Link}, Nav.Link renders a plain <a href> and every click reloads.' },
            { match: 'data-bs-theme="dark"', what: 'Light text for a dark background.', why: 'Bootstrap 5.3\'s colour modes.' },
          ],
        },
      ],
    },
  ],
})
