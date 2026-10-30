// Unit 3 · Lecture 2 · Cypress Assertions: test every feature of the search app, first
// against the live PokeAPI, then with cy.intercept and fixtures (fast and reliable).
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
          code: "it('does nothing on an empty search', () => {\n  cy.get('button[type=submit]').click()\n  cy.get('#poke-container').children().should('have.length', 0)\n})",
          say: 'Empty box, Search: still no cards.',
        },
        {
          id: 'f3s2', file: 'cypress/e2e/pokemon.cy.js', mode: 'append',
          code: "it('does not add the same Pokemon twice', () => {\n  cy.get('input[id=pokemon-name]').type('Bulbasaur{enter}')\n  cy.get('#bulbasaur-card').should('be.visible')\n  cy.get('input[id=pokemon-name]').type('Bulbasaur{enter}')\n  cy.get('[id=\"bulbasaur-card\"]').should('have.length', 1)\n})",
          say: '[id="…"] finds every element with that id (#id stops at the first). Careful: this can pass before the second answer arrives. Feature 4 fixes that.',
          notes: [{ match: '[id="bulbasaur-card"]', what: 'An attribute selector: every element whose id is bulbasaur-card.', why: '#bulbasaur-card only ever finds the first one, so it cannot count duplicates.' }],
        },
        {
          id: 'f3s3', file: 'cypress/e2e/pokemon.cy.js', mode: 'append',
          code: "it('alerts when a Pokemon does not exist', () => {\n  const alerts = []\n  cy.on('window:alert', (text) => alerts.push(text))\n  cy.get('input[id=pokemon-name]').type('pikachoo{enter}')\n  cy.wrap(alerts).should('include', 'Pokemon Does not Exist')\n})",
          say: 'Cypress closes alerts for us; we collect their text and check it. If no alert ever comes, the test fails.',
          notes: [
            { match: "cy.on('window:alert'", what: 'Listens for alert() in the page.', why: 'Cypress clicks OK automatically; this lets us read the message.' },
            { match: 'cy.wrap(alerts)', what: 'Turns a normal value into something Cypress can assert on, retrying.', why: 'should(\'include\') re-checks until the alert arrives (up to 4 s).' },
          ],
        },
      ],
    },
    {
      id: 'f4', title: 'Stub the API',
      why: 'The real PokeAPI is slow sometimes and can be down. cy.intercept answers the request with a fixture (saved JSON): tests get fast and always give the same result.',
      steps: [
        { id: 'f4s1', file: 'cypress/fixtures/bulbasaur.json', mode: 'append', code: '{\n  "id": 1,\n  "name": "bulbasaur",\n  "sprites": { "front_default": "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/1.png", "front_shiny": "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/1.png" }\n}', say: 'A fixture: the parts of the real answer our app reads.',
          notes: [{ match: '"sprites"', what: 'Only the fields the app uses.', why: 'Copy them from the real response (the raw JSON tab), so the stub looks real.' }] },
        { id: 'f4s2', file: 'cypress/fixtures/charizard.json', mode: 'append', code: '{\n  "id": 6,\n  "name": "charizard",\n  "sprites": { "front_default": "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/6.png", "front_shiny": "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/6.png" }\n}', say: 'One fixture per Pokemon we search for.' },
        {
          id: 'f4s3', file: 'cypress/e2e/pokemon.cy.js', mode: 'replace', find: "beforeEach(() => {\n  cy.visit('/')\n})",
          code: "beforeEach(() => {\n  cy.intercept('GET', '**/api/v2/pokemon/bulbasaur', { fixture: 'bulbasaur.json' }).as('bulbasaur')\n  cy.intercept('GET', '**/api/v2/pokemon/charizard', { fixture: 'charizard.json' }).as('charizard')\n  cy.intercept('GET', '**/api/v2/pokemon/pikachoo', { statusCode: 404, body: {} })\n  cy.visit('/')\n})",
          say: 'Set up the stubs before visiting. ** matches any start of the URL. The 404 stub makes "does not exist" happen for sure.',
          notes: [{ match: 'cy.intercept(', what: 'Catches matching requests and answers them with a fixture (or a status).', why: 'No network: fast, and the same answer every run.',
            api: { name: 'cy.intercept(method, url, response)', does: 'Stubs a request.', params: [["method", 'the HTTP method', "'GET'"], ['url', 'a URL or glob', "'**/api/v2/pokemon/bulbasaur' (** = anything before)"], ['response', 'what to answer', "{ fixture: 'bulbasaur.json' } or { statusCode: 404, body: {} }"]], returns: 'a route; .as(\'name\') names it for cy.wait(\'@name\')', mistakes: ['Calling it after cy.visit: requests made during the visit are not caught.'] } }],
        },
        {
          id: 'f4s4', file: 'cypress/e2e/pokemon.cy.js', mode: 'replace', find: "  cy.get('[id=\"bulbasaur-card\"]').should('have.length', 1)",
          code: "  cy.get('@bulbasaur.all').should('have.length', 2)\n  cy.get('[id=\"bulbasaur-card\"]').should('have.length', 1)",
          say: 'Wait until both requests happened, then count. Now the duplicate test cannot pass too early.',
          notes: [{ match: "cy.get('@bulbasaur.all')", what: 'Every request the bulbasaur stub caught so far.', why: 'Lets the test wait for the second search to really finish.' }],
        },
      ],
    },
  ],
})
