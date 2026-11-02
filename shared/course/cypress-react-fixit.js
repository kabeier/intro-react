// Fix it problems for unit 3 · lecture 1 (Cypress setup and first tests).
// The app is fine; the tests or the config are broken. Checks run the specs (CyRunner).
;(function (root) {
  const allPass = (n) => ({ name: `all ${n} tests run and pass`, run: async (doc, win, ctx) => { const t = await ctx.runTests(); return t.length === n && t.every((x) => x.state === 'passed') } })
  const HOME = 'cypress/e2e/home.cy.js', CONFIG = 'cypress.config.js'
  const tabs = [HOME, CONFIG]
  const problems = [
    {
      id: 'visit', title: 'Every test: "never found it"', base: 'f3', tabs,
      symptom: 'Both tests fail: Expected to find element: `header`, but never found it (and `#poke-container` in the second). The app works fine in the browser.',
      breaks: [{ file: HOME, mode: 'replace', find: "  cy.visit('/')\n", code: '' }],
      checks: [allPass(2)],
      hint: 'Every Cypress test starts on a blank page. What opens the app?',
      why: 'Cypress starts each test on an empty page. cy.visit(\'/\') in beforeEach opens the app before every test.',
    },
    {
      id: 'selector', title: 'The empty-container test cannot find the container', base: 'f3', tabs, see: [['src/App.jsx', 'poke-container']],
      symptom: 'starts with an empty poke container fails: Expected to find element: `#pokemon-container`, but never found it.',
      breaks: [{ file: HOME, mode: 'replace', find: "cy.get('#poke-container')", code: "cy.get('#pokemon-container')" }],
      checks: [allPass(2)],
      hint: 'Open src/App.jsx: what is the id of the div that holds the cards?',
      why: 'The test must use the id the app really has: #poke-container.',
    },
    {
      id: 'chainer', title: '"The chainer `visable` was not found"', base: 'f3', tabs,
      symptom: 'should have a heading fails at once: The chainer `visable` was not found. Could not build assertion.',
      breaks: [{ file: HOME, mode: 'replace', find: "should('be.visible')", code: "should('be.visable')" }],
      checks: [allPass(2)],
      hint: 'Read the assertion name letter by letter.',
      why: 'Assertion names are fixed strings: \'be.visible\'. A typo is not a failing check; Cypress cannot even build the assertion.',
    },
    {
      id: 'length', title: '"Not enough elements found"', base: 'f3', tabs,
      symptom: 'starts with an empty poke container fails: Not enough elements found. Found \'0\', expected \'1\'.',
      breaks: [{ file: HOME, mode: 'replace', find: "should('have.length', 0)", code: "should('have.length', 1)" }],
      checks: [allPass(2)],
      hint: 'Before any search, how many cards are on the page?',
      why: 'The app starts with no cards, so the container has 0 children. The test must say what the app really does.',
    },
    {
      id: 'baseurl', title: '"cy.visit() failed trying to load"', base: 'f3', tabs: [CONFIG, HOME],
      symptom: 'Every test fails: cy.visit() failed trying to load: http://localhost:3000/. The app is running.',
      breaks: [{ file: CONFIG, mode: 'replace', find: "baseUrl: 'http://localhost:5173/'", code: "baseUrl: 'http://localhost:3000/'" }],
      checks: [allPass(2)],
      hint: 'Where does the Vite dev server run? Check the port in the browser\'s address bar.',
      why: 'baseUrl must be the address of the running dev server: http://localhost:5173/. cy.visit(\'/\') adds the path to it.',
    },
    {
      id: 'outside', title: '"Cannot call cy.get() outside a running test"', base: 'f3', tabs,
      symptom: 'The whole file fails to run: Cannot call `cy.get()` outside a running test.',
      breaks: [{ file: HOME, mode: 'replace', find: "it('should have a heading', () => {\n  cy.get('header').should('be.visible')\n})", code: "cy.get('header').should('be.visible')" }],
      checks: [allPass(2)],
      hint: 'Every cy command must be inside an it(…) (or a hook like beforeEach).',
      why: 'Cypress reads the file first, then runs the tests. Commands at the top level run while reading, when no test (and no page) exists.',
    },
    {
      id: 'support', title: 'Bonus: "Your supportFile is missing or invalid"', base: 'f3', tabs: [CONFIG, HOME],
      symptom: 'Cypress will not start: Your `supportFile` is missing or invalid: `cypress/support/e2e.{js,jsx,ts,tsx}`.',
      breaks: [{ file: CONFIG, mode: 'replace', find: '    supportFile: false,\n', code: '' }],
      checks: [allPass(2)],
      hint: 'We have no support file. How do you tell Cypress that?',
      why: 'Without supportFile: false, Cypress expects cypress/support/e2e.js. Either create one or set supportFile: false.',
    },
    {
      id: 'only', title: 'Bonus: only one test runs', base: 'f3', tabs,
      symptom: 'The run says 1 passing. There are two tests in the file.',
      breaks: [{ file: HOME, mode: 'replace', find: "it('should have a heading'", code: "it.only('should have a heading'" }],
      checks: [allPass(2)],
      hint: 'Look for a word after it that tells Cypress to run just one test.',
      why: 'it.only runs only that test (handy while debugging). Remove .only before you commit.',
    },
    {
      id: 'syntax', title: 'Bonus: the spec file will not even load', base: 'f3', tabs,
      symptom: 'Error in the spec file: Unexpected end of input.',
      breaks: [{ file: HOME, mode: 'replace', find: "should('have.length', 0)\n})", code: "should('have.length', 0)\n}" }],
      checks: [allPass(2)],
      hint: 'Count the brackets of the last it(…).',
      why: 'it(\'…\', () => { … }) closes with }). A missing ) is a syntax error, so no test can run.',
    },
    {
      id: 'case', title: 'Bonus: "Expected to find content: \'pokemon project\'"', base: 'f3', tabs,
      symptom: 'should have a heading fails: Expected to find content: \'pokemon project\' but never did. The heading is right there.',
      breaks: [{ file: HOME, mode: 'replace', find: "cy.get('header').should('be.visible')", code: "cy.contains('pokemon project')" }],
      checks: [allPass(2)],
      hint: 'Compare the text in the test with the heading, letter by letter. Does case matter?',
      why: 'cy.contains is case-sensitive: \'Pokemon Project\'. (Or keep the original check: cy.get(\'header\').should(\'be.visible\').)',
    },
  ]
  root.FIXIT = root.FIXIT || {}
  root.FIXIT['cypress-react'] = problems
})(typeof self !== 'undefined' ? self : globalThis)
