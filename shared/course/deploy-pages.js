// Unit 9 · Lecture 1 · GitHub Pages: build the app, make it work under /<repo>/ (base only in
// production, the hash router only in production), and publish dist/ with the gh-pages package.
// Follows phase-II/04-Front-End/9-ci-cd/1-gh-pages.md (the gh-pages flow, as the curriculum does it).
Course.register({
  id: 'deploy-pages',
  label: 'Unit 9 · Lecture 1',
  title: 'GitHub Pages',
  base: { lesson: 'outlet-context', feature: 'f3' },
  files: { ...Course.checkpoint(Course.get('outlet-context'), 'f3') },
  features: [
    {
      id: 'f1', title: 'base, only in production',
      why: 'GitHub Pages serves the app at https://<you>.github.io/<repo>/, so the built files must ask for /<repo>/assets/…. In development the app stays at /, or the dev server (and every test) breaks.',
      steps: [
        {
          id: 'f1s1', file: 'vite.config.js', mode: 'set',
          code: "import react from '@vitejs/plugin-react'\nimport tailwindcss from '@tailwindcss/vite'\nimport { defineConfig } from 'vite'\n\n// https://vite.dev/config/\nexport default defineConfig(({ mode }) => ({\n  // GitHub Pages serves the app under /<repo name>/; use your repository's name.\n  base: mode === 'production' ? '/pokemon-app/' : '/',\n  plugins: [react(), tailwindcss()],\n}))",
          say: 'defineConfig can take a function: Vite tells it the mode. Build = production. Use your own repo name between the slashes.',
          notes: [
            { match: "base: mode === 'production' ? '/pokemon-app/' : '/'", what: 'The folder the app lives in: /pokemon-app/ on GitHub Pages, / on your laptop.', why: 'An unconditional base moves the dev server to /pokemon-app/ too, so cy.visit(\'/\') and every test fail (the instructor\'s demo repo has 8 red runs from exactly this).' },
            { match: 'defineConfig(({ mode }) => ({', what: 'A function that gets { mode, command }.', why: 'Mind the braces: (mode) => … gives you the whole object, and mode === \'production\' is never true.' },
          ],
        },
      ],
    },
    {
      id: 'f2', title: 'The hash router in production',
      why: 'GitHub Pages only has real files. Refreshing /pokemon-app/about asks for a file that doesn\'t exist: 404. With the hash router the address is /pokemon-app/#/about, and the server only ever sees /pokemon-app/.',
      steps: [
        {
          id: 'f2s1', file: 'src/router.jsx', mode: 'replace', find: "import { createBrowserRouter } from 'react-router'",
          code: "import { createBrowserRouter, createHashRouter } from 'react-router'",
          say: 'Both router makers…',
        },
        {
          id: 'f2s2', file: 'src/router.jsx', mode: 'replace', find: 'const router = createBrowserRouter([',
          code: '// GitHub Pages has no server to send every path to index.html, so the built app uses #/about.\nconst createRouter = import.meta.env.PROD ? createHashRouter : createBrowserRouter\n\nconst router = createRouter([',
          say: '…and pick one: hash in the build, normal paths while developing. Run the tests: 33 green (they run in development).',
          notes: [{ match: 'const createRouter = import.meta.env.PROD ? createHashRouter : createBrowserRouter', what: 'import.meta.env.PROD is true only in npm run build.', why: 'Development keeps clean URLs and the tests; the deployed site survives a refresh.' }],
        },
        {
          id: 'f2s3', file: 'cypress/e2e-prod/smoke.cy.js', mode: 'set',
          code: "// Runs against the BUILT app (npm run build && npm run preview), not the dev server:\n// npx cypress run --config \"baseUrl=http://localhost:4173/pokemon-app/,specPattern=cypress/e2e-prod/**/*.cy.js\"\nbeforeEach(() => {\n  cy.intercept('GET', '**/api/v2/pokemon/pikachu', { fixture: 'pikachu.json' })\n  cy.intercept('GET', '**/api/v2/pokemon/25', { fixture: 'pikachu.json' })\n})\n\nit('opens a page from its address and survives a refresh', () => {\n  cy.visit('/#/about')\n  cy.contains('h2', 'About This App')\n  cy.reload()\n  cy.contains('h2', 'About This App')\n})\n\nit('opens a Pokemon from its address', () => {\n  cy.visit('/#/pokemon/25')\n  cy.contains('h2', 'pikachu')\n})",
          say: 'A small test for the built site: open a page by its address, refresh. It lives outside cypress/e2e, so the normal run skips it.',
        },
      ],
    },
    {
      id: 'f3', title: 'Publish with gh-pages',
      why: 'The gh-pages package copies dist/ to a branch called gh-pages; GitHub Pages serves that branch.',
      steps: [
        {
          id: 'f3s1', file: 'package.json', mode: 'replace', find: '    "cy:run": "cypress run"',
          code: '    "cy:run": "cypress run",\n    "predeploy": "npm run build",\n    "deploy": "gh-pages -d dist"',
          say: 'npm run deploy: predeploy builds first (npm runs pre<name> before <name>), then gh-pages pushes dist/.',
          notes: [{ match: '"deploy": "gh-pages -d dist"', what: 'Push the dist folder to the gh-pages branch.', why: 'Vite builds into dist (not build, as in create-react-app).' }],
        },
        {
          id: 'f3s2', run: 'npm install gh-pages --save-dev', npm: { added: 45, audited: 307, secs: 3, funding: 75 }, file: 'package.json', mode: 'replace', find: '    "cypress": "^16.2.0",',
          code: '    "cypress": "^16.2.0",\n    "gh-pages": "^6.3.0",',
          say: 'npm install --save-dev gh-pages. Then: npm run deploy, and in Settings → Pages pick the gh-pages branch.',
        },
      ],
    },
  ],
})
