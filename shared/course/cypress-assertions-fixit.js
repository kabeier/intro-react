// Fix it problems for unit 3 · lecture 2 (assertions). Broken tests, and three
// tests that pass even when the app is broken (their checks also run them on a broken app).
;(function (root) {
  const SPEC = 'cypress/e2e/pokemon.cy.js'
  const tabs = [SPEC]
  const allPass = (n) => ({ name: `all ${n} tests run and pass`, run: async (doc, win, ctx) => { const t = await ctx.runTests(); return t.length === n && t.every((x) => x.state === 'passed') } })
  // Run the student's tests against an app with one bug: the named test must now fail.
  const catches = (testTitle, find, label) => ({
    bug: { test: testTitle, find, label },
    name: `the test fails when the app has the bug (${label})`,
    run: async (doc, win, ctx) => {
      const files = ctx.files()
      if (!files['src/App.jsx'].includes(find)) return false
      const t = await ctx.runTests({ ...files, 'src/App.jsx': files['src/App.jsx'].replace(find, '') })
      const it = t.find((x) => x.title === testTitle)
      return !!it && it.state === 'failed'
    },
  })
  const problems = [
    {
      id: 'contain', title: '"contain is not a function"', base: 'f3', tabs,
      symptom: 'The first test fails at once: cy.get(...).contain is not a function.',
      breaks: [{ file: SPEC, mode: 'replace', find: "  cy.get('#bulbasaur-card').should('be.visible')\n  cy.get('#bulbasaur-card img').should('have.attr', 'alt'", code: "  cy.get('#poke-container').contain('bulbasaur')\n  cy.get('#bulbasaur-card img').should('have.attr', 'alt'" }],
      checks: [allPass(8)],
      hint: 'The Cypress command that finds text is spelled differently. Or check the card by its id.',
      why: '.contains(\'bulbasaur\') is the command (with an s). Even better, check the card by its id: cy.get(\'#bulbasaur-card\').should(\'be.visible\').',
    },
    {
      id: 'order', title: 'Bulbasaur is "never found" in the MULTIPLE test', base: 'f3', tabs,
      symptom: 'should render MULTIPLE Pokemon cards waits 4 seconds and fails: Expected to find element: `#bulbasaur-card`, but never found it. The same test types Bulbasaur.',
      breaks: [{ file: SPEC, mode: 'replace', find: "  cy.get('input[id=pokemon-name]').type('Bulbasaur{enter}')\n  cy.get('input[id=pokemon-name]').type('Charizard{enter}')\n  cy.get('#bulbasaur-card').should('be.visible')\n", code: "  cy.get('#bulbasaur-card').should('be.visible')\n  cy.get('input[id=pokemon-name]').type('Bulbasaur{enter}')\n  cy.get('input[id=pokemon-name]').type('Charizard{enter}')\n" }],
      checks: [allPass(8)],
      hint: 'A test runs top to bottom. When the first line runs, has anything been searched yet?',
      why: 'Cypress runs the commands in order. Search first (type … {enter}), then check for the card.',
    },
    {
      id: 'enter', title: 'Charizard never appears', base: 'f3', tabs,
      symptom: 'should render MULTIPLE Pokemon cards waits 4 seconds for #charizard-card and fails. Bulbasaur works.',
      breaks: [{ file: SPEC, mode: 'replace', find: "type('Charizard{enter}')\n  cy.get('#bulbasaur-card').should('be.visible')", code: "type('Charizard')\n  cy.get('#bulbasaur-card').should('be.visible')" }],
      checks: [allPass(8)],
      hint: 'The name is typed. Is the form ever submitted?',
      why: 'Typing does not submit. {enter} presses Enter (or click the Search button).',
    },
    {
      id: 'value', title: '"expected … to have value \'Bulbasaur\'"', base: 'f3', tabs,
      symptom: 'clears the input after a search fails: expected <input#pokemon-name> to have value \'Bulbasaur\', but the value was \'\'.',
      breaks: [{ file: SPEC, mode: 'replace', find: "should('have.value', '')", code: "should('have.value', 'Bulbasaur')" }],
      checks: [allPass(8)],
      hint: 'The test name says what should happen. What should the box hold after a search?',
      why: 'The app clears the box (event.target.reset()), so the value must be the empty string.',
    },
    {
      id: 'case', title: 'Bulbasaur is "never found"', base: 'f3', tabs, see: [['src/App.jsx', 'toLowerCase']],
      symptom: 'The first test waits 4 seconds and fails: Expected to find element: `#Bulbasaur-card`, but never found it. The card is on the screen.',
      breaks: [{ file: SPEC, mode: 'replace', find: "  cy.get('#bulbasaur-card').should('be.visible')\n  cy.get('#bulbasaur-card img').should('have.attr', 'alt'", code: "  cy.get('#Bulbasaur-card').should('be.visible')\n  cy.get('#bulbasaur-card img').should('have.attr', 'alt'" }],
      checks: [allPass(8)],
      hint: 'We typed Bulbasaur. What does handleSubmit do to the name before it becomes the card id?',
      why: 'handleSubmit lowercases the name, so the id is bulbasaur-card. Ids are case-sensitive: #Bulbasaur-card finds nothing.',
    },
    {
      id: 'attr', title: '"expected … to include \'shiny\'"', base: 'f3', tabs,
      symptom: 'The first test fails on the img src: expected \'…/pokemon/1.png\' to include \'shiny\'.',
      breaks: [{ file: SPEC, mode: 'replace', find: ".and('not.include', 'shiny')", code: ".and('include', 'shiny')" }],
      checks: [allPass(8)],
      hint: 'Which picture does generateCard use: front_default or front_shiny?',
      why: 'The card shows front_default, so the src must NOT include shiny (the shiny button comes in a future lecture).',
    },
    {
      id: 'dupweak', title: 'Bonus: a test that can never fail', base: 'f3', tabs,
      symptom: 'does not add the same Pokemon twice passes, but it also passes when App.jsx adds Bulbasaur twice. A test that cannot fail tests nothing.',
      breaks: [{ file: SPEC, mode: 'replace', find: "  cy.get('[id=\"bulbasaur-card\"]').should('have.length', 1)", code: "  cy.get('[id=\"bulbasaur-card\"]').should('exist')" }],
      checks: [allPass(8), catches('does not add the same Pokemon twice', '    if (document.getElementById(`${data.name}-card`)) return\n', 'no duplicate guard')],
      hint: 'The test is about "not twice". Does should(\'exist\') care if there are 1 or 2 cards?',
      why: 'should(\'exist\') passes for 1 card or 2. Count them instead: should(\'have.length\', 1).',
    },
    {
      id: 'alertweak', title: 'Bonus: an alert test that passes with no alert', base: 'f3', tabs,
      symptom: 'alerts when a Pokemon does not exist passes, but it also passes if App.jsx never calls alert().',
      breaks: [{ file: SPEC, mode: 'replace', find: "  const alerts = []\n  cy.on('window:alert', (text) => alerts.push(text))\n  cy.get('input[id=pokemon-name]').type('pikachoo{enter}')\n  cy.wrap(alerts).should('include', 'Pokemon Does not Exist')", code: "  cy.on('window:alert', (text) => {\n    expect(text).to.equal('Pokemon Does not Exist')\n  })\n  cy.get('input[id=pokemon-name]').type('pikachoo{enter}')" }],
      checks: [allPass(8), catches('alerts when a Pokemon does not exist', '      alert("Pokemon Does not Exist")\n', 'no alert')],
      hint: 'If no alert ever comes, does the expect inside cy.on ever run?',
      why: 'The expect only runs if an alert happens. Collect the alerts and assert on the list: cy.wrap(alerts).should(\'include\', …) fails when nothing arrives.',
    },
    {
      id: 'emptyweak', title: 'Bonus: an empty-search test that can never fail', base: 'f3', tabs,
      symptom: 'does nothing on an empty search passes, but it also passes if you delete the empty check (if (!name) return) from App.jsx.',
      breaks: [{ file: SPEC, mode: 'replace', find: "  cy.get('button[type=submit]').click()\n  cy.wait(1000)\n", code: "  cy.get('button[type=submit]').click()\n" }],
      checks: [allPass(8), catches('does nothing on an empty search', '    if (!name) return\n', 'no empty check')],
      hint: 'When does the check run: before or after an answer from the API could arrive?',
      why: 'The check runs right after the click, before any answer is back, so it always sees 0 alerts. Give the wrong answer time to arrive first: cy.wait(1000), then count the alerts.',
    },
    {
      id: 'alerttext', title: 'Bonus: the alert test fails, but the alert shows', base: 'f3', tabs,
      symptom: 'alerts when a Pokemon does not exist waits 4 seconds and fails: expected [ \'Pokemon Does not Exist\' ] to include \'Pokemon does not exist\'.',
      breaks: [{ file: SPEC, mode: 'replace', find: "cy.wrap(alerts).should('include', 'Pokemon Does not Exist')", code: "cy.wrap(alerts).should('include', 'Pokemon does not exist')" }],
      checks: [allPass(8)],
      hint: 'The error shows both texts. Compare them letter by letter.',
      why: 'include matches the exact text, capitals too. The app says \'Pokemon Does not Exist\'.',
    },
  ]
  root.FIXIT = root.FIXIT || {}
  root.FIXIT['cypress-assertions'] = problems
})(typeof self !== 'undefined' ? self : globalThis)
