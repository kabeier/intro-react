// Unit 8 · Lecture 2 · useOutletContext: a page's state is lost when you leave the page, because
// the page unmounts. State that must survive moves up into App (the layout never unmounts) and
// reaches the pages through <Outlet context={…} />.
// Follows phase-II/04-Front-End/8-react-router-hooks/2-useOutletContext.md
Course.register({
  id: 'outlet-context',
  label: 'Unit 8 · Lecture 2',
  title: 'useOutletContext',
  base: { lesson: 'router-hooks', feature: 'f6' },
  files: { ...Course.checkpoint(Course.get('router-hooks'), 'f6') },
  features: [
    {
      id: 'f1', title: 'The cards survive a trip to another page',
      why: 'HomePage unmounts when you go to /about, and its state goes with it. App stays mounted, so the list moves up to App and comes back down through the Outlet.',
      steps: [
        {
          id: 'f1s1', file: 'cypress/e2e/navigation.cy.js', mode: 'append',
          code: "\nit('keeps searched cards after visiting another page', () => {\n  cy.intercept('GET', '**/api/v2/pokemon/bulbasaur', { fixture: 'bulbasaur.json' })\n  cy.visit('/')\n  cy.get('input[id=pokemon-name]').type('Bulbasaur{enter}')\n  cy.get('#bulbasaur-card').should('be.visible')\n  cy.get('nav').contains('a', 'About').click()\n  cy.get('nav').contains('a', 'Home').click()\n  cy.get('#bulbasaur-card').should('be.visible')\n})",
          say: 'Test first: search, leave, come back. Red: Bulbasaur is gone, the page started over.',
        },
        {
          id: 'f1s2', file: 'src/App.jsx', mode: 'set',
          code: "import { useEffect, useState } from 'react'\nimport Heading from './components/Heading'\nimport NavBar from './components/NavBar'\nimport { Outlet } from 'react-router'\n\nfunction App() {\n  const [pokemonList, setPokemonList] = useState([])\n\n  useEffect(() => {\n    console.log('page mounted')\n    return () => console.log('page unmounted')\n  }, [])\n\n  return (\n    <>\n      <NavBar />\n      <main className=\"mx-auto max-w-5xl space-y-6 p-6\">\n        <Heading />\n        <Outlet context={{ pokemonList, setPokemonList }} />\n      </main>\n    </>\n  )\n}\n\nexport default App",
          say: 'The list lives in App now, and the Outlet hands it to whatever page is showing.',
          notes: [{ match: '<Outlet context={{ pokemonList, setPokemonList }} />', what: 'Passes a value to the page the Outlet renders.', why: 'Pages are not written as tags in App (the router renders them), so normal props can\'t reach them.' }],
        },
        {
          id: 'f1s3', file: 'src/components/PokeSearch/PokeSearch.jsx', mode: 'replace', find: '  const [pokemonList, setPokemonList] = useState([])',
          code: '  const { pokemonList, setPokemonList } = useOutletContext()',
          say: 'PokeSearch reads it instead of owning it…',
          notes: [{ match: 'useOutletContext()', what: 'Reads the context of the nearest Outlet above.', why: 'Any component inside the page can use it.',
            api: { name: 'useOutletContext()', does: 'Returns the context={…} value of the Outlet that rendered this page.', returns: 'whatever App passed: here { pokemonList, setPokemonList }', mistakes: ['Using it in App itself (above the Outlet): undefined.'] } }],
        },
        {
          id: 'f1s4', file: 'src/components/PokeSearch/PokeSearch.jsx', mode: 'replace', find: "import axios from 'axios'",
          code: "import axios from 'axios'\nimport { useOutletContext } from 'react-router'",
          say: '…imported from the router. Run the test: green.',
        },
      ],
    },
    {
      id: 'f2', title: 'Pikachu loads once',
      why: 'The start-up request is still in PokeSearch, so it runs every time Home mounts: remove Pikachu, come back, and it returns. Start-up work for the whole app belongs in App.',
      steps: [
        {
          id: 'f2s1', file: 'cypress/e2e/navigation.cy.js', mode: 'append',
          code: "\nit('does not bring Pikachu back after it was removed', () => {\n  cy.intercept('GET', '**/api/v2/pokemon/charizard', { fixture: 'charizard.json' })\n  cy.visit('/')\n  cy.get('#pikachu-card button').contains('Remove').click()\n  cy.get('nav').contains('a', 'About').click()\n  cy.get('nav').contains('a', 'Home').click()\n  cy.get('input[id=pokemon-name]').type('Charizard{enter}')\n  cy.get('#charizard-card').should('be.visible')\n  cy.get('#poke-container').children().should('have.length', 1)\n})",
          say: 'Test first. Searching Charizard gives the old request time to arrive, so the count is honest. Red: two cards.',
        },
        {
          id: 'f2s2', file: 'src/components/PokeSearch/PokeSearch.jsx', mode: 'replace',
          find: "  useEffect(() => {\n    let ignore = false\n    axios.get('https://pokeapi.co/api/v2/pokemon/pikachu')\n      .then((response) => { if (!ignore) addPokemonData(response.data) })\n    return () => { ignore = true }\n  }, [])\n\n",
          code: '',
          say: 'Cut the Pikachu effect from PokeSearch…',
        },
        {
          id: 'f2s3', fixes: ["components-props:f4s1"], file: 'src/App.jsx', mode: 'replace', find: "    return () => console.log('page unmounted')\n  }, [])\n",
          code: "    return () => console.log('page unmounted')\n  }, [])\n\n  useEffect(() => {\n    let ignore = false\n    axios.get('https://pokeapi.co/api/v2/pokemon/pikachu')\n      .then((response) => {\n        if (ignore) return\n        setPokemonList((list) => (list.some((pokemon) => pokemon.id === response.data.id) ? list : [...list, response.data]))\n      })\n    return () => { ignore = true }\n  }, [])\n",
          say: '…and paste it into App. App never unmounts, so it runs once per visit.',
        },
        {
          id: 'f2s4', file: 'src/App.jsx', mode: 'replace', find: "import { useEffect, useState } from 'react'",
          code: "import { useEffect, useState } from 'react'\nimport axios from 'axios'",
          say: 'App needs axios now. Run the tests: green.',
        },
      ],
    },
    {
      id: 'f3', title: 'The click count survives too',
      why: 'Same problem, same fix: count moves to App and travels in the same context object.',
      steps: [
        {
          id: 'f3s1', file: 'cypress/e2e/navigation.cy.js', mode: 'append',
          code: "\nit('keeps the click count across pages', () => {\n  cy.visit('/')\n  cy.contains('button', 'Click me!').click().click()\n  cy.get('nav').contains('a', 'About').click()\n  cy.get('nav').contains('a', 'Home').click()\n  cy.contains('Total Clicks: 2')\n})",
          say: 'Test first. Red: back to 0.',
        },
        {
          id: 'f3s2', file: 'src/App.jsx', mode: 'replace', find: '  const [pokemonList, setPokemonList] = useState([])',
          code: '  const [pokemonList, setPokemonList] = useState([])\n  const [count, setCount] = useState(0)',
          say: 'count in App…',
        },
        {
          id: 'f3s3', file: 'src/App.jsx', mode: 'replace', find: '<Outlet context={{ pokemonList, setPokemonList }} />',
          code: '<Outlet context={{ pokemonList, setPokemonList, count, setCount }} />',
          say: '…added to the context…',
        },
        {
          id: 'f3s4', file: 'src/components/Counter/Counter.jsx', mode: 'replace', find: "import { useState, useEffect } from 'react'",
          code: "import { useEffect } from 'react'\nimport { useOutletContext } from 'react-router'",
          say: '…and Counter reads it.',
        },
        {
          id: 'f3s5', file: 'src/components/Counter/Counter.jsx', mode: 'replace', find: '  const [count, setCount] = useState(0)',
          code: '  const { count, setCount } = useOutletContext()',
          say: 'Same names, so nothing else in Counter changes. Run the tests: 33 green.',
        },
      ],
    },
  ],
})
