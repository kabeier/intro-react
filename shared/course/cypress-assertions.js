// Unit 3 · Lecture 2 · Cypress Assertions: test every feature of the search app, against the live PokeAPI.
// Follows phase-II/04-Front-End/3-e2e-testing/2-cypress-assertions.md
Course.register({
  id: 'cypress-assertions',
  label: 'Unit 3 · Lecture 2',
  title: 'Cypress: testing the search',
  base: { lesson: 'cypress-react', feature: 'f3' },
  files: { ...Course.checkpoint(Course.get('cypress-react'), 'f3') },
  features: [
    {
      id: 'f1', title: 'A search shows a card',
      why: 'Test what the user does and sees: type a name, press Search, a card for that Pokemon appears with a picture.',
      steps: [
        { id: 'f1s1', file: 'cypress/e2e/pokemon.cy.js', mode: 'append', code: "beforeEach(() => {\n  cy.visit('/')\n})", say: 'A second spec file, one per feature area. Fresh page before every test.' },
        {
          id: 'f1s2', file: 'cypress/e2e/pokemon.cy.js', mode: 'append',
          code: "it('should render a Pokemon card for the user\\'s search', () => {\n  cy.get('input[id=pokemon-name]').type('Bulbasaur')\n  cy.get('button[type=submit]').click()\n  cy.get('#bulbasaur-card').should('be.visible')\n})",
          say: 'Type, click, check. The card id comes from generateCard: name + "-card".',
          notes: [
            { match: ".type('Bulbasaur')", what: 'Types into the input, key by key.', why: 'Like a user. {enter} at the end would press Enter.',
              api: { name: '.type(text)', does: 'Types into the element.', params: [['text', 'the keys to type', "'Bulbasaur'; special keys in braces: '{enter}'"]], mistakes: ['Calling it on something that is not an input.'] } },
            { match: '.click()', what: 'Clicks the element.', why: 'Submits the form here.' },
            { match: "cy.get('#bulbasaur-card')", what: 'The card for bulbasaur, by its id.', why: 'Ids we planned for tests: they survive the React rewrite in unit 4.' },
          ],
        },
        {
          id: 'f1s3', file: 'cypress/e2e/pokemon.cy.js', mode: 'insertAfter', find: "  cy.get('#bulbasaur-card').should('be.visible')",
          code: "  cy.get('#bulbasaur-card img').should('have.attr', 'alt', 'bulbasaur')\n  cy.get('#bulbasaur-card img').should('have.attr', 'src').and('not.include', 'shiny')",
          say: 'The picture has an alt, and it is the normal picture (we add the shiny one in a future lecture).',
          notes: [{ match: ".should('have.attr', 'src')", what: 'Checks an attribute; with no value it moves on to the attribute\'s value.', why: '.and(\'not.include\', \'shiny\') then checks the URL text.' }],
        },
      ],
    },
    {
      id: 'f2', title: 'More searches',
      why: 'Several cards can be on the page, and the box clears after each search (our tests type without clearing).',
      steps: [
        {
          id: 'f2s1', file: 'cypress/e2e/pokemon.cy.js', mode: 'append',
          code: "it('should render MULTIPLE Pokemon cards', () => {\n  cy.get('input[id=pokemon-name]').type('Bulbasaur{enter}')\n  cy.get('input[id=pokemon-name]').type('Charizard{enter}')\n  cy.get('#bulbasaur-card').should('be.visible')\n  cy.get('#charizard-card').should('be.visible')\n})",
          say: '{enter} submits the form, like pressing Enter.',
          notes: [{ match: '{enter}', what: 'Presses Enter while typing.', why: 'Users submit forms with Enter too.' }],
        },
        {
          id: 'f2s2', file: 'cypress/e2e/pokemon.cy.js', mode: 'append',
          code: "it('clears the input after a search', () => {\n  cy.get('input[id=pokemon-name]').type('Bulbasaur{enter}')\n  cy.get('input[id=pokemon-name]').should('have.value', '')\n})",
          say: 'have.value checks what is in a box.',
        },
      ],
    },
    {
      id: 'f3', title: 'Edge cases',
      why: 'Good tests also check what must NOT happen: empty searches, duplicates, and names that do not exist.',
      steps: [
        {
          id: 'f3s1', file: 'cypress/e2e/pokemon.cy.js', mode: 'append',
          code: "it('does nothing on an empty search', () => {\n  const alerts = []\n  cy.on('window:alert', (text) => alerts.push(text))\n  cy.get('button[type=submit]').click()\n  cy.wait(1000)\n  cy.wrap(alerts).should('have.length', 0)\n})",
          say: 'Empty box, Search: nothing may happen. Without the empty check the app asks the API for /pokemon/ and shows an alert. Give that wrong answer one second to come back, then check: no alerts.',
          notes: [
            { match: "cy.on('window:alert'", what: 'Listens for alert() in the page.', why: 'Cypress clicks OK automatically; this lets us read the message.' },
            { match: 'cy.wait(1000)', what: 'Waits one second, on purpose.', why: 'To check that something did NOT happen, give it time to happen first. Checking right after the click passes before any answer could arrive: a test that can\'t fail.',
              api: { name: 'cy.wait(ms)', does: 'Pauses the test for that many milliseconds.', params: [['ms', 'how long', '1000 = one second']], mistakes: ['Using it to wait for something to appear: should() already retries for that.'] } },
            { match: 'cy.wrap(alerts)', what: 'Turns a normal value into something Cypress can assert on.', why: 'have.length 0: no alert happened.' },
          ],
        },
        {
          id: 'f3s2', file: 'cypress/e2e/pokemon.cy.js', mode: 'append',
          code: "it('does not add the same Pokemon twice', () => {\n  cy.get('input[id=pokemon-name]').type('Bulbasaur{enter}')\n  cy.get('#bulbasaur-card').should('be.visible')\n  cy.get('input[id=pokemon-name]').type('Bulbasaur{enter}')\n  cy.get('input[id=pokemon-name]').type('Charizard{enter}')\n  cy.get('#charizard-card').should('be.visible')\n  cy.get('[id=\"bulbasaur-card\"]').should('have.length', 1)\n})",
          say: 'Bulbasaur twice, then Charizard. Once Charizard shows, the second Bulbasaur answer is back too: now count. [id="…"] finds every element with that id (#id stops at the first).',
          notes: [
            { match: "type('Charizard{enter}')", what: 'A last search, only so we know when to count.', why: 'Counting right after the second Bulbasaur would pass before its answer arrives: a test that can\'t fail.' },
            { match: '[id="bulbasaur-card"]', what: 'An attribute selector: every element whose id is bulbasaur-card.', why: '#bulbasaur-card only ever finds the first one, so it cannot count duplicates.' },
          ],
        },
        {
          id: 'f3s3', file: 'cypress/e2e/pokemon.cy.js', mode: 'append',
          code: "it('alerts when a Pokemon does not exist', () => {\n  const alerts = []\n  cy.on('window:alert', (text) => alerts.push(text))\n  cy.get('input[id=pokemon-name]').type('pikachoo{enter}')\n  cy.wrap(alerts).should('include', 'Pokemon Does not Exist')\n})",
          say: 'The same alert list as the empty search. pikachoo is not a Pokemon, so the real PokeAPI answers 404. If no alert ever comes, the test fails.',
          notes: [
            { match: 'cy.wrap(alerts)', what: 'Turns a normal value into something Cypress can assert on, retrying.', why: 'should(\'include\') re-checks until the alert arrives (up to 4 s).' },
          ],
        },
      ],
    },
  ],
})
