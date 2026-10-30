// Fix it problems for unit 5 · lecture 1 (components and props). The check is the whole
// test suite (the refactor must not change behaviour), plus the console for React warnings.
;(function (root) {
  const APP = 'src/App.jsx'
  const DIR = 'src/components/'
  const SEARCH = DIR + 'PokeSearch/PokeSearch.jsx', CONTAINER = DIR + 'PokeSearch/PokeContainer.jsx', CARD = DIR + 'PokeSearch/PokeCard.jsx'
  const N = 12
  const allPass = { name: `all ${N} tests pass`, run: async (doc, win, ctx) => { const t = await ctx.runTests(); return t.length === N && t.every((x) => x.state === 'passed') } }
  const noWarning = (re, label) => ({ name: `no React warning about ${label}`, run: (doc, win, ctx) => !ctx.console().some((l) => re.test(l)) })
  const problems = [
    {
      id: 'lowercase', title: 'The counter is gone', base: 'f7', tabs: [APP, DIR + 'Counter/Counter.jsx'],
      symptom: 'No "Total Clicks" and no "Click me!" button. The console warns: The tag <counter> is unrecognized in this browser. If you meant to render a React component, start its name with an uppercase letter.',
      breaks: [{ file: APP, mode: 'replace', find: '      <Counter />', code: '      <counter />' }],
      checks: [allPass, noWarning(/is unrecognized in this browser/, 'casing')],
      hint: 'How does React tell a component from an HTML tag?',
      why: 'A lowercase tag is HTML (an unknown <counter> element). Components start with a capital letter: <Counter />.',
    },
    {
      id: 'export', title: 'Blank page: "does not provide an export named \'default\'"', base: 'f7', tabs: [DIR + 'Counter/Counter.jsx', DIR + 'Counter/index.js', APP],
      symptom: 'The page is blank. The console: The requested module \'/src/components/Counter/Counter.jsx\' does not provide an export named \'default\'.',
      breaks: [{ file: DIR + 'Counter/Counter.jsx', mode: 'replace', find: '\n\nexport default Counter', code: '' }],
      checks: [allPass],
      hint: 'index.js passes on the default export of Counter.jsx. Does Counter.jsx have one?',
      why: 'A component file must export the component: export default Counter. Without it, nothing can import it.',
    },
    {
      id: 'children', title: 'The buttons are empty', base: 'f7', tabs: [DIR + 'Button/Button.jsx', DIR + 'Counter/Counter.jsx'],
      symptom: 'The Change Title and Click me! buttons show no text. They still work if you find them.',
      breaks: [{ file: DIR + 'Button/Button.jsx', mode: 'replace', find: '      {children}\n', code: '' }],
      checks: [allPass],
      hint: 'Where does the text between <Button> and </Button> go?',
      why: 'The text between the tags arrives as the children prop. Button must render it: {children}.',
    },
    {
      id: 'propname', title: 'Blank page: "Cannot read properties of undefined (reading \'map\')"', base: 'f7', tabs: [CONTAINER, SEARCH],
      symptom: 'The page goes blank. The console: TypeError: Cannot read properties of undefined (reading \'map\').',
      breaks: [
        { file: CONTAINER, mode: 'replace', find: 'function PokeContainer({ pokemonList, rmData })', code: 'function PokeContainer({ pokemons, rmData })' },
        { file: CONTAINER, mode: 'replace', find: '{pokemonList.map(', code: '{pokemons.map(' },
      ],
      checks: [allPass],
      hint: 'Compare the prop name PokeSearch sends with the name PokeContainer reads.',
      why: 'Props arrive under the name the parent wrote: pokemonList={…}. Reading pokemons gives undefined. Use the same name on both sides.',
    },
    {
      id: 'rmdata', title: 'Remove: "rmData is not a function"', base: 'f7', tabs: [CONTAINER, CARD, SEARCH],
      symptom: 'Click Remove: nothing happens, and the console says TypeError: rmData is not a function.',
      breaks: [{ file: CONTAINER, mode: 'replace', find: '<PokeCard key={pokemon.id} pokemon={pokemon} rmData={rmData} />', code: '<PokeCard key={pokemon.id} pokemon={pokemon} />' }],
      checks: [allPass],
      hint: 'PokeCard calls rmData. Who gives it to PokeCard?',
      why: 'Each component in the chain must pass the prop on: PokeContainer → <PokeCard … rmData={rmData} />.',
    },
    {
      id: 'id', title: 'The page looks right, a test fails', base: 'f7', tabs: [CONTAINER, 'cypress/e2e/home.cy.js', 'cypress/e2e/pokemon.cy.js'],
      symptom: 'Everything works in the browser, but "should render the Pikachu card on load" fails: Expected to find element: `#poke-container`.',
      breaks: [{ file: CONTAINER, mode: 'replace', find: '<div id="poke-container">', code: '<div>' }],
      checks: [allPass],
      hint: 'What does that test look for? Is it still on the page after the move?',
      why: 'The tests find the cards through #poke-container. A refactor must keep what the tests (and users) rely on: <div id="poke-container">.',
    },
    {
      id: 'path', title: 'Bonus: "Failed to resolve import"', base: 'f7', tabs: [APP],
      symptom: 'Blank page. The console: [plugin:vite:import-analysis] Failed to resolve import "./components/heading" from "src/App.jsx". Does the file exist?',
      breaks: [{ file: APP, mode: 'replace', find: "import Heading from './components/Heading'", code: "import Heading from './components/heading'" }],
      checks: [allPass],
      hint: 'Compare the path with the folder name, letter by letter.',
      why: 'Paths are case-sensitive (on Linux, in Docker, and on GitHub Pages): ./components/Heading.',
    },
    {
      id: 'braces', title: 'Bonus: "Cannot read properties of undefined (reading \'front_default\')"', base: 'f7', tabs: [CARD],
      symptom: 'The page goes blank as soon as Pikachu loads. The console: TypeError: Cannot read properties of undefined (reading \'front_default\').',
      breaks: [{ file: CARD, mode: 'replace', find: 'function PokeCard({ pokemon, rmData })', code: 'function PokeCard(pokemon, rmData)' }],
      checks: [allPass],
      hint: 'A component gets ONE argument. What is it?',
      why: 'A component receives one props object. Take it apart with braces: function PokeCard({ pokemon, rmData }).',
    },
    {
      id: 'key', testsPass: true, title: 'Bonus: "Each child in a list should have a unique key"', base: 'f7', tabs: [CONTAINER, CARD],
      symptom: 'Everything works, but the console warns: Each child in a list should have a unique "key" prop. Check the render method of `PokeContainer`.',
      breaks: [
        { file: CONTAINER, mode: 'replace', find: '<PokeCard key={pokemon.id} pokemon={pokemon} rmData={rmData} />', code: '<PokeCard pokemon={pokemon} rmData={rmData} />' },
        { file: CARD, mode: 'replace', find: '<div className="card" id={`${pokemon.name}-card`}>', code: '<div className="card" id={`${pokemon.name}-card`} key={pokemon.id}>' },
      ],
      checks: [allPass, noWarning(/unique "key" prop/, 'keys')],
      hint: 'The key belongs on the element the .map returns. Which element is that?',
      why: 'The map returns <PokeCard … />, so the key goes there: <PokeCard key={pokemon.id} … />. A key inside the card does nothing.',
    },
    {
      id: 'value', title: 'Bonus: the box keeps the old name', base: 'f7', tabs: [SEARCH, DIR + 'PokeSearch/PokeForm.jsx'],
      symptom: 'Searches work, but the name stays in the box afterwards.',
      breaks: [{ file: SEARCH, mode: 'replace', find: '<PokeForm handleSubmit={handleSubmit} pokemonName={pokemonName} setPokemonName={setPokemonName} />', code: '<PokeForm handleSubmit={handleSubmit} setPokemonName={setPokemonName} />' }],
      checks: [allPass],
      hint: 'PokeForm shows value={pokemonName}. Where does that value come from?',
      why: 'Without the pokemonName prop, value is undefined and the box is uncontrolled, so setPokemonName(\'\') cannot clear it. Pass it: pokemonName={pokemonName}.',
    },
  ]
  root.FIXIT = root.FIXIT || {}
  root.FIXIT['components-props'] = problems
})(typeof self !== 'undefined' ? self : globalThis)
