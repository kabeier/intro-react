// Fix it problems for unit 8 · lecture 2 (useOutletContext). The check is the whole test suite.
;(function (root) {
  const APP = 'src/App.jsx', SEARCH = 'src/components/PokeSearch/PokeSearch.jsx', COUNTER = 'src/components/Counter/Counter.jsx'
  const SPEC = 'cypress/e2e/navigation.cy.js'
  const N = 33
  const allPass = { name: `all ${N} tests pass`, run: async (doc, win, ctx) => { const t = await ctx.runTests(); return t.length === N && t.every((x) => x.state === 'passed') } }
  const problems = [
    {
      id: 'nocontext', title: '"Cannot destructure property \'count\' of useOutletContext()"', base: 'f3', tabs: [APP, SEARCH, COUNTER],
      symptom: 'Home shows "Something went wrong": Cannot destructure property \'count\' of \'useOutletContext(...)\' as it is undefined.',
      breaks: [{ file: APP, mode: 'replace', find: '<Outlet context={{ pokemonList, setPokemonList, count, setCount }} />', code: '<Outlet />' }],
      checks: [allPass],
      hint: 'useOutletContext reads what the Outlet was given. What was it given?',
      why: 'The Outlet passes the shared state: <Outlet context={{ pokemonList, setPokemonList, count, setCount }} />.',
    },
    {
      id: 'local', title: 'Cards vanish after visiting About', base: 'f3', tabs: [SEARCH, SPEC],
      symptom: 'Search Bulbasaur, go to About and back: Bulbasaur is gone. "keeps searched cards after visiting another page" fails.',
      breaks: [
        { file: SEARCH, mode: 'replace', find: '  const { pokemonList, setPokemonList } = useOutletContext()', code: '  const [pokemonList, setPokemonList] = useState([])' },
        { file: SEARCH, mode: 'replace', find: "import { useOutletContext } from 'react-router'\n", code: '' },
      ],
      checks: [allPass],
      hint: 'Where does PokeSearch\'s list come from? What happens to it when Home unmounts?',
      why: 'Local state dies with the page. Read the list App owns: const { pokemonList, setPokemonList } = useOutletContext().',
    },
    {
      id: 'pikachu', title: 'Pikachu comes back after being removed', base: 'f3', tabs: [SEARCH, APP],
      symptom: 'Remove Pikachu, visit About, come back: Pikachu is there again. "does not bring Pikachu back…" fails.',
      breaks: [{ file: SEARCH, mode: 'replace', find: '  const addPokemonData = (data) => {', code: "  useEffect(() => {\n    let ignore = false\n    axios.get('https://pokeapi.co/api/v2/pokemon/pikachu')\n      .then((response) => { if (!ignore) addPokemonData(response.data) })\n    return () => { ignore = true }\n  }, [])\n\n  const addPokemonData = (data) => {" }],
      checks: [allPass],
      hint: 'Which component mounts again every time you come back to Home?',
      why: 'An effect in PokeSearch runs on every visit to Home. Start-up work for the app runs once, in App (which never unmounts). Remove it from PokeSearch.',
    },
    {
      id: 'count', title: 'The count resets after visiting About', base: 'f3', tabs: [COUNTER, APP],
      symptom: 'Click twice, visit About, come back: Total Clicks: 0. "keeps the click count across pages" fails.',
      breaks: [
        { file: COUNTER, mode: 'replace', find: '  const { count, setCount } = useOutletContext()', code: '  const [count, setCount] = useState(0)' },
        { file: COUNTER, mode: 'replace', find: "import { useEffect } from 'react'\nimport { useOutletContext } from 'react-router'", code: "import { useState, useEffect } from 'react'" },
      ],
      checks: [allPass],
      hint: 'Is this the count App owns, or a new one?',
      why: 'Read the shared count: const { count, setCount } = useOutletContext().',
    },
    {
      id: 'names', title: '"setPokemonList is not a function"', base: 'f3', tabs: [APP, SEARCH],
      symptom: 'Search works until the answer arrives; then the console: TypeError: setPokemonList is not a function.',
      breaks: [{ file: APP, mode: 'replace', find: '<Outlet context={{ pokemonList, setPokemonList, count, setCount }} />', code: '<Outlet context={{ pokemonList, setList: setPokemonList, count, setCount }} />' }],
      checks: [allPass],
      hint: 'The context is an object. Do the key names match what PokeSearch takes out?',
      why: 'PokeSearch destructures setPokemonList, so the context needs that exact key.',
    },
    {
      id: 'appcontext', title: 'Blank page: useOutletContext in App', base: 'f3', tabs: [APP],
      symptom: 'Blank page. The console: TypeError: Cannot destructure property \'pokemonList\' of \'useOutletContext(...)\' as it is null. The above error occurred in the <App> component.',
      breaks: [
        { file: APP, mode: 'replace', find: '  const [pokemonList, setPokemonList] = useState([])', code: '  const { pokemonList, setPokemonList } = useOutletContext()' },
        { file: APP, mode: 'replace', find: "import { Outlet } from 'react-router'", code: "import { Outlet, useOutletContext } from 'react-router'" },
      ],
      checks: [allPass],
      hint: 'Who provides the context? Can the provider read its own context?',
      why: 'App gives the context to the Outlet below it; App itself owns the state with useState([]). useOutletContext only works in pages under the Outlet.',
    },
    {
      id: 'array', title: 'Bonus: the context is an array', base: 'f3', tabs: [APP, SEARCH],
      symptom: 'Home shows "Something went wrong": Cannot read properties of undefined (reading \'map\').',
      breaks: [{ file: APP, mode: 'replace', find: '<Outlet context={{ pokemonList, setPokemonList, count, setCount }} />', code: '<Outlet context={[pokemonList, setPokemonList, count, setCount]} />' }],
      checks: [allPass],
      hint: 'PokeSearch takes the context apart with { }. What shape must it be?',
      why: 'An array has no pokemonList key. Pass an object: context={{ pokemonList, setPokemonList, count, setCount }}.',
    },
    {
      id: 'dedupe', title: 'Bonus: two Pikachus on load', base: 'f3', tabs: [APP],
      symptom: 'In development the page opens with two Pikachu cards and a duplicate key warning.',
      breaks: [
        { file: APP, mode: 'replace', find: "        if (ignore) return\n", code: '' },
        { file: APP, mode: 'replace', find: 'setPokemonList((list) => (list.some((pokemon) => pokemon.id === response.data.id) ? list : [...list, response.data]))', code: 'setPokemonList((list) => [...list, response.data])' },
      ],
      checks: [allPass],
      racy: ['should render the Pikachu card on load'],
      hint: 'StrictMode runs App\'s effect twice in development. What should happen to the first answer?',
      why: 'Two fixes: skip the answer of a cleaned-up effect (if (ignore) return), and skip a Pokemon already in the list.',
    },
    {
      id: 'mount', title: 'Bonus: Pikachu never loads', base: 'f3', tabs: [APP],
      symptom: 'The page opens with no cards at all. No error.',
      breaks: [{ file: APP, mode: 'replace', find: "\n  useEffect(() => {\n    let ignore = false\n    axios.get('https://pokeapi.co/api/v2/pokemon/pikachu')\n      .then((response) => {\n        if (ignore) return\n        setPokemonList((list) => (list.some((pokemon) => pokemon.id === response.data.id) ? list : [...list, response.data]))\n      })\n    return () => { ignore = true }\n  }, [])\n", code: '' }],
      checks: [allPass],
      hint: 'It moved out of PokeSearch. Did it arrive in App?',
      why: 'The start-up request belongs in App now: a useEffect with [] that loads Pikachu (with the ignore flag and the duplicate check).',
    },
    {
      id: 'countname', title: 'Bonus: "setCount is not a function"', base: 'f3', tabs: [APP, COUNTER],
      symptom: 'Click "Click me!": the console says TypeError: setCount is not a function.',
      breaks: [{ file: APP, mode: 'replace', find: '<Outlet context={{ pokemonList, setPokemonList, count, setCount }} />', code: '<Outlet context={{ pokemonList, setPokemonList, count }} />' }],
      checks: [allPass],
      hint: 'Counter takes two things out of the context. Are both in it?',
      why: 'Pass the setter too: context={{ …, count, setCount }}.',
    },
  ]
  root.FIXIT = root.FIXIT || {}
  root.FIXIT['outlet-context'] = problems
})(typeof self !== 'undefined' ? self : globalThis)
