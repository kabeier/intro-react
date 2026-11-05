// Unit 7 · Lecture 1 · Intro to React Router: the app gets a router, and App becomes the layout
// every page shares. Nothing changes for the user yet, so the 17 tests stay green.
// Follows phase-II/04-Front-End/7-intro-to-react-router/1-intro-react-router.md, with React Router 8
// (the package is react-router; react-router-dom was merged into it).
Course.register({
  id: 'router-intro',
  label: 'Unit 7 · Lecture 1',
  title: 'Intro to React Router',
  base: { lesson: 'utilities-bootstrap', feature: 'f2' },
  files: { ...Course.checkpoint(Course.get('utilities-bootstrap'), 'f2') },
  features: [
    {
      id: 'f1', title: 'Install the router',
      why: 'A router picks what to render from the URL. createBrowserRouter takes a list of routes; RouterProvider renders the one that matches.',
      steps: [
        {
          id: 'f1s1', run: 'npm install react-router', npm: { added: 3, audited: 262, secs: 1, funding: 67 }, file: 'package.json', mode: 'replace', find: '    "react-dom": "^19.3.1",',
          code: '    "react-dom": "^19.3.1",\n    "react-router": "^8.5.1",',
          say: 'npm install react-router. One package: react-router-dom was merged into it in version 8.',
          notes: [{ match: '"react-router": "^8.5.1"', what: 'React Router 8.', why: 'Different from the curriculum (until merged): it installs react-router-dom, which stopped at version 7.' }],
        },
        {
          id: 'f1s2', file: 'src/router.jsx', mode: 'set',
          code: "import { createBrowserRouter } from 'react-router'\nimport App from './App.jsx'\n\nconst router = createBrowserRouter([\n  { path: '/', element: <App /> },\n])\n\nexport default router",
          say: 'One route for now: the path / shows App.',
          notes: [
            { match: 'createBrowserRouter([', what: 'Makes a router from a list of route objects.', why: 'Browser router = real paths like /about, using the browser\'s history.',
              api: { name: 'createBrowserRouter(routes)', does: 'Creates the router for the whole app.', params: [['routes', 'an array of { path, element, children }', 'one object per page']], returns: 'a router, passed to <RouterProvider router={router} />' } },
            { match: "{ path: '/', element: <App /> }", what: 'When the path is /, render <App />.', why: 'path = the URL; element = the JSX to show.' },
          ],
        },
        {
          id: 'f1s3', file: 'src/main.jsx', mode: 'set',
          code: "import { StrictMode } from 'react'\nimport { createRoot } from 'react-dom/client'\nimport { RouterProvider } from 'react-router/dom'\nimport 'bootstrap/dist/css/bootstrap.min.css'\nimport './index.css'\nimport router from './router.jsx'\n\ncreateRoot(document.getElementById('root')).render(\n  <StrictMode>\n    <RouterProvider router={router} />\n  </StrictMode>,\n)",
          say: 'main renders the router instead of App. Run the tests: 17 green, nothing looks different.',
          notes: [{ match: "import { RouterProvider } from 'react-router/dom'", what: 'The component that renders the matching route.', why: 'It comes from react-router/dom (the browser part of the package).' }],
        },
      ],
    },
    {
      id: 'f2', title: 'App becomes the layout',
      why: 'App keeps what every page shares (the heading). <Outlet /> marks where the current page goes. The home page moves into src/pages.',
      steps: [
        {
          id: 'f2s1', file: 'src/pages/HomePage.jsx', mode: 'set',
          code: "import Counter from '../components/Counter'\nimport PokeSearch from '../components/PokeSearch'\n\nfunction HomePage() {\n  return (\n    <>\n      <Counter />\n      <PokeSearch />\n    </>\n  )\n}\n\nexport default HomePage",
          say: 'A page is a component too. It lives in src/pages.',
        },
        {
          id: 'f2s2', file: 'src/App.jsx', mode: 'replace', find: "import Counter from './components/Counter'\nimport PokeSearch from './components/PokeSearch'",
          code: "import { Outlet } from 'react-router'",
          say: 'App no longer imports the page parts.',
        },
        {
          id: 'f2s3', file: 'src/App.jsx', mode: 'replace', find: '      <Counter />\n      <PokeSearch />',
          code: '      <Outlet />',
          say: 'The Outlet is the hole the current page fills.',
          notes: [{ match: '<Outlet />', what: 'Renders the child route that matches the URL.', why: 'Layout around it (the heading) stays; the page inside changes.' }],
        },
        {
          id: 'f2s4', file: 'src/router.jsx', mode: 'set',
          code: "import { createBrowserRouter } from 'react-router'\nimport App from './App.jsx'\nimport HomePage from './pages/HomePage.jsx'\n\nconst router = createBrowserRouter([\n  {\n    path: '/',\n    element: <App />,\n    children: [\n      { index: true, element: <HomePage /> },\n    ],\n  },\n])\n\nexport default router",
          say: 'HomePage is a child of App: index: true means "at / exactly". Forget the Outlet and 15 tests go red. Run the tests: 17 green.',
          notes: [{ match: '{ index: true, element: <HomePage /> }', what: 'The index route: the page for the parent\'s own path (/).', why: 'Children render inside the parent\'s <Outlet />.' }],
        },
      ],
    },
  ],
})
