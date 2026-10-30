// Fix it problems for unit 4 · lecture 1 (useState). The check is the whole test suite
// (every feature has tests), plus the console for React warnings.
;(function (root) {
  const APP = 'src/App.jsx'
  const tabs = [APP, 'cypress/e2e/pokemon.cy.js', 'cypress/e2e/home.cy.js']
  const N = 11
  const allPass = { name: `all ${N} tests pass`, run: async (doc, win, ctx) => { const t = await ctx.runTests(); return t.length === N && t.every((x) => x.state === 'passed') } }
  const noWarning = (re, label) => ({ name: `no React warning about ${label}`, run: (doc, win, ctx) => !ctx.console().some((l) => re.test(l)) })
  const problems = [
    {
      id: 'assign', title: '"Assignment to constant variable"', base: 'f5', tabs,
      symptom: 'Click Change Title: nothing changes, and the console says TypeError: Assignment to constant variable.',
      breaks: [{ file: APP, mode: 'replace', find: "onClick={() => setHeading('Pokemon Project: Day 2')}", code: "onClick={() => { heading = 'Pokemon Project: Day 2' }}" }],
      checks: [allPass],
      hint: 'How do you change state in React?',
      why: 'State only changes through its setter: setHeading(…). Assigning to the variable would not re-render anyway.',
    },
    {
      id: 'rerenders', title: 'Blank page: "Too many re-renders"', base: 'f5', tabs,
      symptom: 'The page is empty. The console: Too many re-renders. React limits the number of renders to prevent an infinite loop.',
      breaks: [{ file: APP, mode: 'replace', find: "onClick={() => setHeading('Pokemon Project: Day 2')}", code: "onClick={setHeading('Pokemon Project: Day 2')}" }],
      checks: [allPass],
      hint: 'Is setHeading called when the button is clicked, or while the page is drawn?',
      why: 'onClick={setHeading(…)} calls it during render; the new state renders again, which calls it again… Pass a function: onClick={() => setHeading(…)}.',
    },
    {
      id: 'push', title: 'Search works, no card appears', base: 'f5', tabs,
      symptom: 'The request succeeds (200, no error) but no card is drawn.',
      breaks: [{ file: APP, mode: 'replace', find: 'setPokemonList((list) => (list.some((pokemon) => pokemon.id === data.id) ? list : [...list, data]))', code: 'setPokemonList((list) => { list.push(data); return list })' }],
      checks: [allPass],
      hint: 'Does the setter get a NEW array, or the same one changed?',
      why: 'React compares the old and new state; the same array (even with a new item pushed in) looks unchanged, so nothing re-renders. Return a new array: [...list, data].',
    },
    {
      id: 'onchange', title: 'You cannot type in the box', base: 'f5', tabs,
      symptom: 'Typing does nothing. The console warns: You provided a `value` prop to a form field without an `onChange` handler.',
      breaks: [{ file: APP, mode: 'replace', find: '          onChange={(event) => setPokemonName(event.target.value)}\n', code: '' }],
      checks: [allPass],
      hint: 'value shows the state. What updates the state when you type?',
      why: 'A controlled input needs both: value={pokemonName} and onChange={(event) => setPokemonName(event.target.value)}.',
    },
    {
      id: 'key', testsPass: true, title: '"Each child in a list should have a unique key"', base: 'f5', tabs,
      symptom: 'Everything works, but the console warns about a missing key prop as soon as a card shows.',
      breaks: [{ file: APP, mode: 'replace', find: ' key={pokemon.id}>', code: '>' }],
      checks: [allPass, noWarning(/unique "key" prop/, 'keys')],
      hint: 'Which prop tells React which card is which?',
      why: 'Items in a .map need a unique, stable key: key={pokemon.id}.',
    },
    {
      id: 'filter', title: 'Remove keeps only the card you removed', base: 'f5', tabs,
      symptom: 'Click Remove on Bulbasaur: every other card disappears, Bulbasaur stays.',
      breaks: [{ file: APP, mode: 'replace', find: 'list.filter((pokemon) => pokemon.id !== id)', code: 'list.filter((pokemon) => pokemon.id === id)' }],
      checks: [allPass],
      hint: 'filter KEEPS the items where the test is true. Which ones do you want to keep?',
      why: 'Keep every Pokemon whose id is NOT the removed one: pokemon.id !== id.',
    },
    {
      id: 'mapbraces', title: 'Bonus: no cards, no error', base: 'f5', tabs,
      symptom: 'Searches work (the list grows in the console) but no card is drawn and there is no error.',
      breaks: [
        { file: APP, mode: 'replace', find: '        {pokemonList.map((pokemon) => (\n', code: '        {pokemonList.map((pokemon) => {\n' },
        { file: APP, mode: 'replace', find: '        ))}\n', code: '        })}\n' },
      ],
      checks: [allPass],
      hint: 'Compare (pokemon) => ( … ) with (pokemon) => { … }. What does each return?',
      why: 'With braces the arrow function needs return; without it it returns undefined, so nothing is drawn. Use ( … ) to return the JSX.',
    },
    {
      id: 'clear', title: 'Bonus: the box keeps the old name', base: 'f5', tabs,
      symptom: 'After a search the name stays in the box.',
      breaks: [{ file: APP, mode: 'replace', find: "    setPokemonName('')\n", code: '' }],
      checks: [allPass],
      hint: 'With a controlled input, how do you empty the box?',
      why: 'The box shows the state; set the state to \'\' after the search: setPokemonName(\'\').',
    },
    {
      id: 'dup', title: 'Bonus: two Bulbasaur cards (and a key warning)', base: 'f5', tabs,
      symptom: 'Search Bulbasaur twice: two cards, and the console warns: Encountered two children with the same key.',
      breaks: [{ file: APP, mode: 'replace', find: 'setPokemonList((list) => (list.some((pokemon) => pokemon.id === data.id) ? list : [...list, data]))', code: 'setPokemonList((list) => [...list, data])' }],
      checks: [allPass],
      hint: 'Before adding, check whether the list already has this Pokemon.',
      why: 'Return the same list when the id is already there: list.some((pokemon) => pokemon.id === data.id) ? list : [...list, data].',
    },
    {
      id: 'value', title: 'Bonus: the box never clears', base: 'f5', tabs,
      symptom: 'setPokemonName(\'\') runs after a search, but the box still shows the old name.',
      breaks: [{ file: APP, mode: 'replace', find: '          value={pokemonName}\n', code: '' }],
      checks: [allPass],
      hint: 'Clearing the state only clears the box if the box shows the state.',
      why: 'Without value={pokemonName} the input is uncontrolled: the browser keeps its own text, and state changes do not reach it.',
    },
  ]
  root.FIXIT = root.FIXIT || {}
  root.FIXIT['hooks-usestate'] = problems
})(typeof self !== 'undefined' ? self : globalThis)
