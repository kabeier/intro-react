// Unit 4 · Lecture 2 · useEffect: run code after React draws (logging, a side effect on the
// page, loading Pikachu on start). Tests first; the two "starts empty" tests are rewritten.
// Follows phase-II/04-Front-End/4-react-hooks/2-useEffect-hook.md
Course.register({
  id: 'hooks-useeffect',
  label: 'Unit 4 · Lecture 2',
  title: 'useEffect: after the render',
  base: { lesson: 'hooks-usestate', feature: 'f5' },
  files: { ...Course.checkpoint(Course.get('hooks-usestate'), 'f5') },
  features: [
    {
      id: 'f1', title: 'Run code after render',
      why: 'useEffect runs a function after React has put the component on the page. The array says when to run it again; [] = only after the first render. The function it returns is the cleanup.',
      steps: [
        {
          id: 'f1s1', file: 'src/App.jsx', mode: 'replace', find: "import { useState } from 'react'", code: "import { useState, useEffect } from 'react'",
          say: 'Import useEffect next to useState.',
        },
        {
          id: 'f1s2', file: 'src/App.jsx', mode: 'insertAfter', find: '  const [pokemonList, setPokemonList] = useState([])',
          code: "\n  useEffect(() => {\n    console.log('page mounted')\n    return () => console.log('page unmounted')\n  }, [])",
          say: 'Watch the Console: mounted, unmounted, mounted. That is StrictMode in development: React mounts twice to check the cleanup works. In production it runs once.',
          notes: [
            { match: 'useEffect(() => {', what: 'Runs the function after the render is on the page.', why: 'For work that is not drawing: logging, timers, requests, changing things outside React.',
              api: { name: 'useEffect(effect, dependencies)', does: 'Runs effect after render; again when a dependency changes.', params: [['effect', 'a function; may return a cleanup function', 'keep each effect to one job'], ['dependencies', 'the values the effect reads', '[] = after the first render only; [count] = also when count changes; leave it out = after every render (rarely wanted)']], returns: 'nothing', mistakes: ['Setting state that is in the dependency list, inside the effect: an endless loop.', 'Expecting it to run once in development: StrictMode runs effects twice to test the cleanup.'] } },
            { match: "return () => console.log('page unmounted')", what: 'The cleanup: React runs it before the effect runs again, and when the component leaves the page.', why: 'Undo what the effect started: stop timers, ignore late answers.' },
          ],
        },
      ],
    },
    {
      id: 'f2', title: 'Track a value',
      why: 'With a value in the dependency array, the effect runs again every time that value changes.',
      steps: [
        {
          id: 'f2s1', file: 'src/App.jsx', mode: 'insertAfter', find: '  }, [])',
          code: "\n  useEffect(() => {\n    console.log('pokemon list changed', pokemonList)\n  }, [pokemonList])",
          say: 'Search a Pokemon: the Console logs the new list. Remove one: it logs again.',
          notes: [{ match: '[pokemonList])', what: 'Run again whenever pokemonList changes.', why: 'React compares each dependency with the last render; a new array = changed.' }],
        },
      ],
    },
    {
      id: 'f3', title: 'A visible side effect',
      why: 'The page background is outside React\'s box (document.body), so changing it is a side effect: it belongs in useEffect.',
      steps: [
        {
          id: 'f3s1', file: 'cypress/e2e/home.cy.js', mode: 'append',
          code: "it('changes the background when you click', () => {\n  cy.contains('button', 'Click me!').click()\n  cy.get('body').should('have.css', 'background-color', 'rgb(144, 238, 144)')\n})",
          say: 'Test first: one click → light green. Red for now.',
          notes: [{ match: "should('have.css'", what: 'Checks a computed CSS value.', why: 'Colours come back as rgb(): lightgreen is rgb(144, 238, 144).' }],
        },
        {
          id: 'f3s2', file: 'src/App.jsx', mode: 'insertAfter', find: '  }, [pokemonList])',
          code: "\n  useEffect(() => {\n    const colors = ['lightblue', 'lightgreen', 'lightpink', 'lightyellow', 'lightsalmon']\n    document.body.style.backgroundColor = colors[count % colors.length]\n  }, [count])",
          say: 'Every click changes count; the effect picks the next colour. % wraps around after the last colour.',
          notes: [
            { match: 'document.body.style.backgroundColor', what: 'Changes the page outside our component.', why: 'React does not draw <body>, so we change it ourselves, after render.' },
            { match: 'count % colors.length', what: 'The remainder: 0, 1, 2, 3, 4, 0, 1…', why: 'Cycles through the colours forever.' },
          ],
        },
      ],
    },
    {
      id: 'f4', title: 'Pikachu on load',
      why: 'Loading data when the page opens is the classic effect. The tests that said "starts empty" change first: we decide the new behaviour, then build it.',
      steps: [
        { id: 'f4s1', file: 'cypress/fixtures/pikachu.json', mode: 'append', code: '{\n  "id": 25,\n  "name": "pikachu",\n  "sprites": { "front_default": "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/25.png", "front_shiny": "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/25.png" }\n}', say: 'A fixture for Pikachu: the page will ask for it on every visit.' },
        {
          id: 'f4s2', file: 'cypress/e2e/home.cy.js', mode: 'replace', find: "beforeEach(() => {\n  cy.visit('/')\n})",
          code: "beforeEach(() => {\n  cy.intercept('GET', '**/api/v2/pokemon/pikachu', { fixture: 'pikachu.json' })\n  cy.visit('/')\n})",
          say: 'Stub the start-up request in this spec too.',
        },
        {
          id: 'f4s3', file: 'cypress/e2e/home.cy.js', mode: 'replace', find: "it('starts with an empty poke container', () => {\n  cy.get('#poke-container').children().should('have.length', 0)\n})",
          code: "it('should render the Pikachu card on load', () => {\n  cy.get('#pikachu-card').should('be.visible')\n  cy.get('#poke-container').children().should('have.length', 1)\n})",
          say: 'The planned rewrite from unit 3: the page now starts with Pikachu. Red until we build it.',
        },
        {
          id: 'f4s4', file: 'cypress/e2e/pokemon.cy.js', mode: 'insertAfter', find: "  cy.intercept('GET', '**/api/v2/pokemon/charizard', { fixture: 'charizard.json' }).as('charizard')",
          code: "  cy.intercept('GET', '**/api/v2/pokemon/pikachu', { fixture: 'pikachu.json' })",
          say: 'And here.',
        },
        {
          id: 'f4s6', later: { how: "No cleanup yet: in development StrictMode runs this twice, and a late answer could still change state.", where: "the next step (the ignore flag)" }, file: 'src/App.jsx', mode: 'replace', find: '  const rmData = (id) => {',
          code: "  useEffect(() => {\n    axios.get('https://pokeapi.co/api/v2/pokemon/pikachu')\n      .then((response) => addPokemonData(response.data))\n  }, [])\n\n  const rmData = (id) => {",
          say: 'Fetch Pikachu after the first render. Watch the Network tab: two requests in development (StrictMode). addPokemonData skips the duplicate, but there is a better way.',
          notes: [
            { match: "axios.get('https://pokeapi.co/api/v2/pokemon/pikachu')", what: 'The start-up request.', why: 'An effect with [] runs once after the first render: the right place to load start-up data.' },
            { match: '.then((response) => addPokemonData(response.data))', what: 'Uses addPokemonData, so the effect goes below it.', why: 'A const can\'t be used before its line (the linter says so). [] is still right: addPokemonData only calls the setter with a function, which never needs a newer copy.' },
          ],
        },
        {
          id: 'f4s7', fixes: ["f4s6"], file: 'src/App.jsx', mode: 'replace', find: "    axios.get('https://pokeapi.co/api/v2/pokemon/pikachu')\n      .then((response) => addPokemonData(response.data))\n  }, [])",
          code: "    let ignore = false\n    axios.get('https://pokeapi.co/api/v2/pokemon/pikachu')\n      .then((response) => { if (!ignore) addPokemonData(response.data) })\n    return () => { ignore = true }\n  }, [])",
          say: 'The cleanup sets ignore: an answer that arrives after the cleanup is thrown away. This is the pattern from react.dev for requests in effects. Run every test: green.',
          notes: [{ match: 'let ignore = false', what: 'A flag the cleanup can flip.', why: 'If the effect is cleaned up (StrictMode, or the component leaves) before the answer arrives, we ignore that answer.',
            api: { name: 'the ignore flag', does: 'Drops answers from effects that were already cleaned up.', params: [['ignore', 'false while this effect is current', 'set true in the cleanup; check it before setting state']], mistakes: ['No cleanup: a slow first answer can overwrite newer data (a race).'] } }],
        },
      ],
    },
  ],
})
