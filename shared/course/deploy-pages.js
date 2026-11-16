// Unit 9 · Lecture 1 · GitHub Pages: build the app, make it work under /<repo>/ (base only in
// production, the hash router only in production), and publish dist/ with a GitHub Actions workflow
// (GitHub's Pages actions; Settings → Pages → Source: GitHub Actions). No gh-pages package or branch.
// Follows phase-II/04-Front-End/9-ci-cd/1-gh-pages.md.
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
          code: "// Runs against the BUILT app (npm run build && npm run preview), not the dev server:\n// npx cypress run --config \"baseUrl=http://localhost:4173/pokemon-app/,specPattern=cypress/e2e-prod/**/*.cy.js\"\nit('opens a page from its address and survives a refresh', () => {\n  cy.visit('/#/about')\n  cy.contains('h2', 'About This App')\n  cy.reload()\n  cy.contains('h2', 'About This App')\n})\n\nit('opens a Pokemon from its address', () => {\n  cy.visit('/#/pokemon/25')\n  cy.contains('h2', 'pikachu')\n})",
          say: 'A small test for the built site: open a page by its address, refresh. It lives outside cypress/e2e, so the normal run skips it.',
        },
      ],
    },
    {
      id: 'f3', title: 'Publish with a workflow',
      why: 'A GitHub Actions workflow builds the app on GitHub and hands dist/ straight to GitHub Pages, on every push to main. Settings → Pages → Source: GitHub Actions.',
      steps: [
        {
          id: 'f3s1', file: '.github/workflows/deploy.yml', mode: 'set',
          code: "name: Deploy to GitHub Pages\n\non:\n  push:\n    branches: [main]\n  workflow_dispatch:\n\npermissions:\n  contents: read\n  pages: write\n  id-token: write\n\nconcurrency:\n  group: pages\n  cancel-in-progress: false\n\njobs:\n  deploy:\n    runs-on: ubuntu-latest\n    environment:\n      name: github-pages\n      url: ${{ steps.deployment.outputs.page_url }}\n    steps:\n      - uses: actions/checkout@v7\n      - uses: actions/setup-node@v7\n        with:\n          node-version: 24\n          cache: npm\n      - run: npm ci\n      - run: npm run build\n      - uses: actions/upload-pages-artifact@v5\n        with:\n          path: dist\n      - id: deployment\n        uses: actions/deploy-pages@v5",
          say: 'On every push to main: get the code, install, build, pack dist/, publish it. Same YAML as fundamentals week.',
          notes: [
            { match: '      - run: npm run build', what: 'Builds dist/ on GitHub, in production mode.', why: 'base and the hash router switch on here; dist/ never goes into git.' },
            { match: '      - uses: actions/upload-pages-artifact@v5', what: 'Packs dist/ as the site for GitHub Pages.', why: 'Pages publishes exactly this folder.' },
            { match: '        uses: actions/deploy-pages@v5', what: 'Publishes the packed site to GitHub Pages.', why: 'No extra branch, no token to copy anywhere.' },
            { match: '  pages: write\n  id-token: write', what: 'May publish to Pages, and prove to Pages which workflow it is.', why: 'Read-only for the code: the workflow cannot push to any branch.' },
            { match: '      name: github-pages', what: 'The environment GitHub makes for Pages.', why: 'The repo page lists each deploy and the live URL under Environments.' },
            { match: '      cancel-in-progress: false', what: 'Two quick pushes deploy one after the other.', why: 'A running deploy is never cut off halfway.' },
          ],
        },
      ],
    },
  ],
})
