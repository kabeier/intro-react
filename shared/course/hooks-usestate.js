// Unit 4 · Lecture 1 · useState: the page moves from DOM code to React state. Every new
// behaviour starts with a failing Cypress test; the big rewrite keeps every test green.
// Follows phase-II/04-Front-End/4-react-hooks/1-useState-hook.md
Course.register({
  id: 'hooks-usestate',
  label: 'Unit 4 · Lecture 1',
  title: 'useState: state drives the page',
  base: { lesson: 'cypress-assertions', feature: 'f4' },
  files: { ...Course.checkpoint(Course.get('cypress-assertions'), 'f4') },
  features: [
    {
      id: 'f1', title: 'Change the title (state)',
      why: 'State is a value React remembers between renders. Changing it with its setter makes React draw the component again with the new value.',
      steps: [
        {
          id: 'f1s1', file: 'cypress/e2e/home.cy.js', mode: 'append',
          code: "it('changes the title when you click Change Title', () => {\n  cy.get('header button').click()\n  cy.get('header h1').should('have.text', 'Pokemon Project: Day 2')\n})",
          say: 'Test first: describe the feature, run it, watch it fail (there is no button yet).',
          notes: [{ match: "should('have.text'", what: 'Checks the exact text of the element.', why: 'The title must change to exactly this.' }],
        },
        {
          id: 'f1s2', file: 'src/App.jsx', mode: 'replace', find: "import axios from 'axios'\nimport './App.css'", code: "import { useState } from 'react'\nimport axios from 'axios'\nimport './App.css'",
          say: 'useState comes from React: a named import, in { }.',
          notes: [{ match: "import { useState } from 'react'", what: 'Imports the useState hook.', why: 'Hooks are functions from React that start with use.' }],
        },
        {
          id: 'f1s3', file: 'src/App.jsx', mode: 'insertAfter', find: 'function App() {',
          code: "  const [heading, setHeading] = useState('Pokemon Project')\n",
          say: 'useState gives back two things: the value now, and a function to change it.',
          notes: [{ match: 'const [heading, setHeading] = useState(', what: 'A piece of state: the current value and its setter.', why: 'When setHeading runs, React renders App again with the new heading.',
            api: { name: 'useState(initialValue)', does: 'Creates a value React remembers between renders.', params: [['initialValue', 'the value on the first render', "what the page should show first: '' for a text box, 0 for a counter, [] for a list"]], returns: '[value, setValue]: unpack it with [ , ] and name them thing / setThing', mistakes: ['Calling hooks inside if, loops or other functions: only at the top level of the component.', 'Changing the variable directly (heading = "x"): React does not notice. Always call the setter.'] } }],
        },
        {
          id: 'f1s4', file: 'src/App.jsx', mode: 'replace', find: '        <h1>Pokemon Project</h1>',
          code: "        <h1>{heading}</h1>\n        <button type=\"button\" onClick={() => setHeading('Pokemon Project: Day 2')}>Change Title</button>",
          say: 'Show the state with {}, change it with the setter on click. Run the tests: green.',
          notes: [{ match: 'onClick={() => setHeading(', what: 'On click, call the setter with the new value.', why: 'The arrow function waits for the click; setHeading(…) without it would run during render.',
            api: { name: 'onClick={handler}', does: 'Runs handler when the element is clicked.', params: [['handler', 'a function (not a call)', '() => setHeading(\'…\') when you need arguments']], mistakes: ['onClick={setHeading(\'x\')}: runs while rendering, and loops ("Too many re-renders").'] } }],
        },
      ],
    },
    {
      id: 'f2', title: 'A click counter',
      why: 'When the new value depends on the old one, pass the setter a function: React gives it the latest value.',
      steps: [
        {
          id: 'f2s1', file: 'cypress/e2e/home.cy.js', mode: 'append',
          code: "it('counts clicks', () => {\n  cy.contains('button', 'Click me!').click().click()\n  cy.contains('Total Clicks: 2')\n})",
          say: 'Failing test first: two clicks → "Total Clicks: 2".',
          notes: [{ match: "cy.contains('button', 'Click me!')", what: 'Finds a button by its text.', why: 'Users find buttons by what they say.' }],
        },
        {
          id: 'f2s2', file: 'src/App.jsx', mode: 'insertAfter', find: "  const [heading, setHeading] = useState('Pokemon Project')",
          code: '  const [count, setCount] = useState(0)',
          say: 'A number state, starting at 0.',
        },
        {
          id: 'f2s3', file: 'src/App.jsx', mode: 'insertAfter', find: '      </header>',
          code: '      <h3>Total Clicks: {count}</h3>\n      <button type="button" onClick={() => setCount((count) => count + 1)}>Click me!</button>',
          say: 'setCount((count) => count + 1): "take the latest count, add one". Safe even when clicks come fast.',
          notes: [{ match: 'setCount((count) => count + 1)', what: 'A functional update: the setter gets a function of the old value.', why: 'Always correct when the new value depends on the old, even if several updates happen before a render.',
            api: { name: 'setThing((old) => new)', does: 'Computes the next state from the latest state.', params: [['(old) => new', 'a function that gets the latest value', 'use it whenever the new value is based on the old: counts, adding to a list']], mistakes: ['setCount(count + 1) twice in a row adds 1, not 2: both read the same old count.'] } }],
        },
      ],
    },
    {
      id: 'f3', title: 'A controlled input',
      why: 'The box\'s text lives in state (value + onChange). React is the single source of truth: no FormData, and clearing is setPokemonName(\'\').',
      steps: [
        {
          id: 'f3s1', file: 'src/App.jsx', mode: 'insertAfter', find: '  const [count, setCount] = useState(0)',
          code: "  const [pokemonName, setPokemonName] = useState('')",
          say: 'State for the text box, starting empty. The tests are green before and after this change: run them.',
        },
        {
          id: 'f3s2', file: 'src/App.jsx', mode: 'replace', find: '<input id="pokemon-name" type="text" name="name" placeholder="pikachu" />',
          code: '<input\n          id="pokemon-name" type="text" name="name" placeholder="pikachu"\n          value={pokemonName}\n          onChange={(event) => setPokemonName(event.target.value)}\n        />',
          say: 'value shows the state; onChange updates it on every key.',
          notes: [
            { match: 'value={pokemonName}', what: 'The box always shows the state.', why: 'A "controlled" input: React decides what is in it.' },
            { match: 'onChange={(event) => setPokemonName(event.target.value)}', what: 'Every key press updates the state.', why: 'Without it the box would never change (React keeps it equal to the state).',
              api: { name: 'onChange={handler}', does: 'Runs on every change of the input.', params: [['event.target.value', 'the text in the box now', 'pass it to the setter']], mistakes: ['value without onChange: the box is stuck (React warns: "You provided a value prop without an onChange handler").'] } },
          ],
        },
        {
          id: 'f3s3', file: 'src/App.jsx', mode: 'replace', find: '    const data = Object.fromEntries(new FormData(event.target))\n    const name = data.name.trim().toLowerCase()',
          code: '    const name = pokemonName.trim().toLowerCase()',
          say: 'Read the name from state instead of FormData.',
        },
        {
          id: 'f3s4', file: 'src/App.jsx', mode: 'replace', find: '    event.target.reset()', code: "    setPokemonName('')",
          say: 'Clear the box by clearing the state. Run the tests: still green.',
        },
      ],
    },
    {
      id: 'f4', title: 'The list in state',
      why: 'The cards become data: a list in state, drawn with .map. React draws, updates and removes the cards itself; generateCard (unit 2) goes away.',
      steps: [
        {
          id: 'f4s1', file: 'src/App.jsx', mode: 'insertAfter', find: "  const [pokemonName, setPokemonName] = useState('')",
          code: '  const [pokemonList, setPokemonList] = useState([])',
          say: 'An array state: every Pokemon we found.',
        },
        {
          id: 'f4s2', file: 'src/App.jsx', mode: 'replace',
          find: '  const generateCard = (data) => {\n    if (document.getElementById(`${data.name}-card`)) return\n    const card = document.createElement("div")\n    card.className = "card"\n    card.id = `${data.name}-card`\n    const img = document.createElement("img")\n    img.src = data.sprites.front_default\n    img.alt = data.name\n    card.appendChild(img)\n    const h3 = document.createElement("h3")\n    h3.textContent = data.name\n    card.appendChild(h3)\n    document.querySelector("#poke-container").appendChild(card)\n  }',
          code: '  const addPokemonData = (data) => {\n    setPokemonList((list) => (list.some((pokemon) => pokemon.id === data.id) ? list : [...list, data]))\n  }',
          say: 'generateCard is gone. Adding = a new array with the old items plus the new one (never push into state). Already there? Keep the list as it is.',
          notes: [
            { match: '[...list, data]', what: 'A new array: every old item, then the new one.', why: 'React compares the old and new array; changing the same array (push) is not noticed.' },
            { match: 'list.some((pokemon) => pokemon.id === data.id)', what: 'Is this Pokemon already in the list?', why: 'The duplicate guard, now in the data instead of the DOM.',
              api: { name: 'array.some(test)', does: 'true if at least one item passes the test.', params: [['test', 'a function item => true/false', 'compare a unique field: the id']], returns: 'true or false' } },
          ],
        },
        {
          id: 'f4s3', file: 'src/App.jsx', mode: 'replace', find: '      generateCard(response.data)', code: '      addPokemonData(response.data)',
          say: 'The request now adds data to state instead of building DOM.',
        },
        {
          id: 'f4s4', file: 'src/App.jsx', mode: 'replace', find: '      <div id="poke-container"></div>',
          code: '      <div id="poke-container">\n        {pokemonList.map((pokemon) => (\n          <div className="card" id={`${pokemon.name}-card`} key={pokemon.id}>\n          </div>\n        ))}\n      </div>',
          say: '.map turns every Pokemon into a card. key tells React which card is which.',
          notes: [
            { match: 'pokemonList.map(', what: 'Turns each item of the list into JSX.', why: 'One card per Pokemon; when the list changes, the cards change.',
              api: { name: 'array.map((item) => <jsx/>)', does: 'Returns a new array: one element per item.', params: [['(item) => …', 'what to draw for one item', 'use ( ) after => to return JSX directly']], returns: 'an array of elements React can draw' } },
            { match: 'key={pokemon.id}', what: 'A unique, stable name for each item in a list.', why: 'React uses keys to know which card was added, moved or removed.',
              api: { name: 'key', does: 'Identifies a list item between renders.', params: [['value', 'unique among its siblings and stable', 'an id from the data (pokemon.id); not the array index when items can be removed']], mistakes: ['No key: React warns "Each child in a list should have a unique key prop".'] } },
            { match: 'id={`${pokemon.name}-card`}', what: 'The same id generateCard used.', why: 'Our tests find cards by it, so they keep passing.' },
          ],
        },
        {
          id: 'f4s5', file: 'src/App.jsx', mode: 'insertAfter', find: '          <div className="card" id={`${pokemon.name}-card`} key={pokemon.id}>',
          code: '            <img src={pokemon.sprites.front_default} alt={pokemon.name} />\n            <h3>{pokemon.name}</h3>',
          say: 'Same card as before, now JSX. Run every test: all green. We rewrote the page and the tests prove nothing broke.',
        },
      ],
    },
    {
      id: 'f5', title: 'Remove a card',
      why: 'Removing = a new list without that item (filter). React removes the card from the page.',
      steps: [
        {
          id: 'f5s1', file: 'cypress/e2e/pokemon.cy.js', mode: 'append',
          code: "it('can remove a card', () => {\n  cy.get('input[id=pokemon-name]').type('Bulbasaur{enter}')\n  cy.get('#bulbasaur-card button').contains('Remove').click()\n  cy.get('#bulbasaur-card').should('not.exist')\n})",
          say: 'Failing test first: there is no Remove button yet.',
          notes: [{ match: "should('not.exist')", what: 'Passes when the element is gone.', why: 'Cypress retries until it disappears (up to 4 s).' }],
        },
        {
          id: 'f5s2', file: 'src/App.jsx', mode: 'insertAfter', find: '    setPokemonList((list) => (list.some((pokemon) => pokemon.id === data.id) ? list : [...list, data]))',
          code: '  }\n\n  const rmData = (id) => {\n    setPokemonList((list) => list.filter((pokemon) => pokemon.id !== id))',
          say: 'filter keeps every Pokemon except this one. A new array again.',
          notes: [{ match: 'list.filter(', what: 'A new array with only the items that pass the test.', why: 'Remove = keep everything whose id is not this id.',
            api: { name: 'array.filter(test)', does: 'Returns a new array of the items where test is true.', params: [['test', 'item => true to keep', 'pokemon => pokemon.id !== id']], returns: 'a new array (the old one is unchanged)' } }],
        },
        {
          id: 'f5s3', file: 'src/App.jsx', mode: 'insertAfter', find: '            <h3>{pokemon.name}</h3>',
          code: '            <button type="button" onClick={() => rmData(pokemon.id)}>Remove</button>',
          say: 'Each card gets its own button with its own id. Run the tests: green.',
        },
      ],
    },
  ],
})
