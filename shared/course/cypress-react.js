// Unit 3 · Lecture 1 · Cypress and React: install and configure Cypress, write the first
// tests for the unit 2 app (tested from the outside, like a user).
// Follows phase-II/04-Front-End/3-e2e-testing/1-cypress-react.md
Course.register({
  id: 'cypress-react',
  label: 'Unit 3 · Lecture 1',
  title: 'Cypress: first tests',
  base: { lesson: 'async-requests', feature: 'f7' },
  files: { ...Course.checkpoint(Course.get('async-requests'), 'f7') },
  features: [
    {
      id: 'f1', title: 'Install Cypress',
      why: 'Cypress is a dev dependency (only developers need it), plus two scripts: one opens the Cypress app, one runs every test in the terminal.',
      steps: [
        {
          id: 'f1s1', file: 'package.json', mode: 'insertAfter', find: '"@vitejs/plugin-react": "^6.1.2",', code: '    "cypress": "^16.2.0",',
          say: 'npm install cypress --save-dev adds this line under devDependencies. It downloads the Cypress app too (a few hundred MB, once).',
          notes: [{ match: '"cypress"', what: 'Cypress, as a dev dependency.', why: 'Needed to develop and test, not to run the app, so --save-dev.',
            api: { name: 'npm install cypress --save-dev', does: 'Installs Cypress and records it in devDependencies.', params: [['--save-dev', 'only for development', 'tools: test runners, linters, build tools']], mistakes: ['Running it inside Docker: Cypress runs on your laptop (it opens a browser); the app runs in Docker. Your laptop needs Node 22, 24 or 26.'] } }],
        },
        {
          id: 'f1s2', file: 'package.json', mode: 'replace', find: '"preview": "vite preview"',
          code: '"preview": "vite preview",\n    "cy:open": "cypress open --e2e",\n    "cy:run": "cypress run"',
          say: 'cy:open opens the Cypress app (watch tests run). cy:run runs them all in the terminal, headless.',
          notes: [
            { match: '"cy:open"', what: 'npm run cy:open: the Cypress app, end-to-end tests.', why: 'You see the browser while the test clicks and types.' },
            { match: '"cy:run"', what: 'npm run cy:run: every test, headless, results in the terminal.', why: 'What CI runs (unit 9). One file: npm run cy:run -- --spec cypress/e2e/home.cy.js.' },
          ],
        },
      ],
    },
    {
      id: 'f2', title: 'Configure Cypress',
      why: 'cypress.config.js says where the app runs (baseUrl), so tests can write cy.visit("/"). Lint must know Cypress\'s globals, and git must skip test videos.',
      steps: [
        {
          id: 'f2s1', file: 'cypress.config.js', mode: 'append',
          code: "import { defineConfig } from 'cypress'\n\nexport default defineConfig({\n  e2e: {\n    baseUrl: 'http://localhost:5173/',\n    supportFile: false,",
          say: 'e2e = settings for end-to-end tests. baseUrl = where our dev server is. supportFile: false = we have no shared helpers yet.',
          notes: [
            { match: 'defineConfig', what: 'Cypress\'s config helper.', why: 'Gives editor hints for the options.' },
            { match: 'e2e: {', what: 'Settings for end-to-end tests.', why: 'Cypress has two testing types: e2e (whole app in a browser) and component.' },
            { match: "baseUrl: 'http://localhost:5173/'", what: 'The address of the running app.', why: 'cy.visit("/") means baseUrl + "/". The dev server (Docker) must be running first.',
              api: { name: 'baseUrl', does: 'The prefix for cy.visit and cy.request.', params: [['URL', 'where the app runs', 'the Vite dev server: http://localhost:5173/']], mistakes: ['The app is not running: "cy.visit() failed trying to load http://localhost:5173/".'] } },
            { match: 'supportFile: false', what: 'No support file.', why: 'We have no custom commands; otherwise Cypress expects cypress/support/e2e.js.' },
          ],
        },
        {
          id: 'f2s2', file: 'cypress.config.js', mode: 'insertAfter', find: '    supportFile: false,',
          code: '  },\n  viewportWidth: 1024,\n  viewportHeight: 768,\n})',
          say: 'The browser size for every test.',
          notes: [{ match: 'viewportWidth', what: 'The test browser\'s width and height.', why: 'Same size every run, so layout is the same.' }],
        },
        {
          id: 'f2s3', file: '.gitignore', mode: 'append', code: '# Cypress\ncypress/videos\ncypress/screenshots',
          say: 'Videos and screenshots are made on every run: don\'t commit them.',
          notes: [{ match: 'cypress/videos', what: 'Recordings Cypress makes of runs.', why: 'Big, and re-made every run.' }],
        },
        {
          id: 'f2s4', file: '.oxlintrc.json', mode: 'replace', find: '  "rules": {',
          code: '  "overrides": [\n    { "files": ["cypress/**/*.js"], "env": { "mocha": true }, "globals": { "cy": "readonly", "Cypress": "readonly" } }\n  ],\n  "rules": {',
          say: 'Tell the linter that test files use describe, it, cy and Cypress without importing them.',
          notes: [{ match: '"overrides"', what: 'Extra lint settings for some files only.', why: 'In cypress/ files, cy, Cypress, it and beforeEach are globals that Cypress provides.' }],
        },
      ],
    },
    {
      id: 'f3', title: 'The first tests',
      why: 'An end-to-end test does what a user does (visit, look, type, click) and checks what the page shows. It does not care how the code is written inside.',
      steps: [
        {
          id: 'f3s1', file: 'cypress/e2e/home.cy.js', mode: 'append', code: "beforeEach(() => {\n  cy.visit('/')\n})",
          say: 'Before every test: open the home page. Each test starts fresh.',
          notes: [
            { match: 'beforeEach(', what: 'Runs before every test in the file.', why: 'Each test gets a fresh page: tests never depend on each other.' },
            { match: "cy.visit('/')", what: 'Opens the app at baseUrl + "/".', why: 'Every test starts from the page a user would open.',
              api: { name: 'cy.visit(path)', does: 'Loads a page in the test browser.', params: [['path', 'a path after baseUrl', "'/' for home (later: '/about')"]], mistakes: ['The dev server is not running.'] } },
          ],
        },
        {
          id: 'f3s2', file: 'cypress/e2e/home.cy.js', mode: 'append', code: "it('should have a heading', () => {\n  cy.get('header').should('be.visible')\n})",
          say: 'One test: there is a visible header. Press Run tests.',
          notes: [
            { match: 'it(', what: 'One test: a name and what to do.', why: 'Name it like a sentence about the app: "should have a heading".' },
            { match: "cy.get('header')", what: 'Finds elements with a CSS selector (like querySelectorAll).', why: 'Cypress waits up to 4 seconds for it to appear.',
              api: { name: 'cy.get(selector)', does: 'Finds elements, retrying until found (4 s).', params: [['selector', 'any CSS selector', "'header', '#poke-container', 'button[type=submit]': prefer ids we added for tests"]], returns: 'the elements, for the next command', mistakes: ['A selector that changes with styling (a Tailwind class): tests break when the design changes.'] } },
            { match: ".should('be.visible')", what: 'An assertion: what must be true.', why: 'Cypress retries until it is true or 4 seconds pass.',
              api: { name: ".should(chainer, value?)", does: 'Asserts, retrying until it passes.', params: [["'be.visible'", 'on screen', 'for things users must see'], ["'have.length', n", 'how many elements', 'counts'], ["'have.value', v", "an input's value", "'' = empty"]] } },
          ],
        },
        {
          id: 'f3s3', file: 'cypress/e2e/home.cy.js', mode: 'append', code: "it('starts with an empty poke container', () => {\n  cy.get('#poke-container').children().should('have.length', 0)\n})",
          say: 'No cards before any search. (In unit 4 Pikachu loads on start, and this test changes.)',
          notes: [{ match: '.children()', what: 'The direct children of the found element.', why: 'The cards are children of #poke-container.' }],
        },
      ],
    },
  ],
})
