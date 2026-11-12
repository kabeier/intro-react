// Fix it problems for unit 6 · lecture 1 (Tailwind). The check is the whole test suite, plus
// computed styles for the problems no test covers (styling is not tested by class names).
;(function (root) {
  const DIR = 'src/components/'
  const CARD = DIR + 'PokeSearch/PokeCard.jsx', CONTAINER = DIR + 'PokeSearch/PokeContainer.jsx', SEARCH = DIR + 'PokeSearch/PokeSearch.jsx'
  const BUTTON = DIR + 'Button/Button.jsx'
  const N = 16
  const allPass = { name: `all ${N} tests pass`, run: async (doc, win, ctx) => { const t = await ctx.runTests(); return t.length === N && t.every((x) => x.state === 'passed') } }
  const noWarning = (re, label) => ({ name: `no React warning about ${label}`, run: (doc, win, ctx) => !ctx.console().some((l) => re.test(l)) })
  // Tailwind compiles in the page after it loads: wait for the style to arrive before judging.
  const styled = (name, sel, prop, want) => ({ name, run: async (doc, win, ctx) => {
    for (let i = 0; i < 40; i++) { const e = doc.querySelector(sel); if (e && win.getComputedStyle(e)[prop] === want) return true; await ctx.wait(100) }
    return false
  } })
  const problems = [
    {
      id: 'plugin', title: 'No styles at all', base: 'f4', tabs: ['vite.config.js', 'src/index.css'],
      symptom: 'The page looks like plain HTML: no colors, no rounded corners, the cards in one column. "lays the cards out in a wrapping row" fails. No error.',
      breaks: [
        { file: 'vite.config.js', mode: 'replace', find: "import tailwindcss from '@tailwindcss/vite'\n", code: '' },
        { file: 'vite.config.js', mode: 'replace', find: 'plugins: [react(), tailwindcss()]', code: 'plugins: [react()]' },
      ],
      checks: [allPass],
      hint: 'Who turns @import "tailwindcss" into real CSS?',
      why: 'The Vite plugin writes the CSS: import tailwindcss from \'@tailwindcss/vite\' and plugins: [react(), tailwindcss()].',
    },
    {
      id: 'import', title: 'Classes everywhere, no styles', base: 'f4', tabs: ['src/index.css', 'src/main.jsx'],
      symptom: 'The JSX is full of Tailwind classes, but nothing is styled. The layout test fails.',
      breaks: [{ file: 'src/index.css', mode: 'set', code: '' }],
      checks: [allPass],
      hint: 'Which CSS file pulls Tailwind in?',
      why: 'src/index.css needs @import "tailwindcss"; and main.jsx imports index.css.',
    },
    {
      id: 'typo', title: 'The cards stop wrapping', base: 'f4', tabs: [CONTAINER],
      symptom: 'All cards squeeze into one row. "lays the cards out in a wrapping row" fails: expected flex-wrap \'wrap\', but the value was \'nowrap\'.',
      breaks: [{ file: CONTAINER, mode: 'replace', find: 'flex flex-wrap gap-5', code: 'flex flex-warp gap-5' }],
      checks: [allPass],
      hint: 'Tailwind ignores class names it doesn\'t know. Spell each class.',
      why: 'flex-warp is not a class, so nothing happens and there is no error. It is flex-wrap.',
    },
    {
      id: 'class', testsPass: true, title: '"Invalid DOM property `class`"', base: 'f4', tabs: [CONTAINER],
      symptom: 'Everything looks right, but the console warns: Invalid DOM property `class`. Did you mean `className`?',
      breaks: [{ file: CONTAINER, mode: 'replace', find: 'className="flex flex-wrap gap-5"', code: 'class="flex flex-wrap gap-5"' }],
      checks: [allPass, noWarning(/Invalid DOM property `class`/, 'class')],
      hint: 'In JSX, which word sets an element\'s classes?',
      why: 'JSX uses className (class is a JavaScript keyword). The examples on tailwindcss.com are HTML: change class to className when you copy them.',
    },
    {
      id: 'id', title: 'Most card tests fail after the restyle', base: 'f4', tabs: [CARD],
      symptom: 'The cards look great, but most card tests fail: Expected to find element: `#pikachu-card`, but never found it.',
      breaks: [{ file: CARD, mode: 'replace', find: '<div id={`${pokemon.name}-card`} className=', code: '<div className=' }],
      checks: [allPass],
      hint: 'Restyling replaced the whole div. What did the old one have that the tests need?',
      why: 'Classes are for looks; the id is how users\' tests find a card. Keep id={`${pokemon.name}-card`} on the card.',
    },
    {
      id: 'number', title: '"expected … to contain \'#25\'"', base: 'f4', tabs: [CARD, 'cypress/e2e/home.cy.js'],
      symptom: 'The card says "Pokédex 25". "shows the Pokedex number on each card" fails.',
      breaks: [{ file: CARD, mode: 'replace', find: 'Pokédex #{pokemon.id}', code: 'Pokédex {pokemon.id}' }],
      checks: [allPass],
      hint: 'Read the test, then the card, character by character.',
      why: 'The feature (and its test) is "#25": Pokédex #{pokemon.id}.',
    },
    {
      id: 'shell', testsPass: true, title: 'Bonus: the counter no longer changes the page color', base: 'f4', tabs: ['src/App.jsx', DIR + 'Counter/Counter.jsx'],
      symptom: 'Click "Click me!": the count goes up, the page stays grey. The tests still pass (they check body, not what you see).',
      breaks: [{ file: 'src/App.jsx', mode: 'replace', find: '<main className="mx-auto max-w-5xl space-y-6 p-6">', code: '<main className="mx-auto min-h-screen max-w-5xl space-y-6 bg-slate-100 p-6">' }],
      checks: [allPass, styled('main has no background of its own', 'main', 'backgroundColor', 'rgba(0, 0, 0, 0)')],
      hint: 'The counter colors body. What is painted on top of body?',
      why: 'A background on main covers body\'s color. Remove bg-slate-100 (and min-h-screen) from main.',
    },
    {
      id: 'gap', testsPass: true, title: 'Bonus: the cards touch each other', base: 'f4', tabs: [CONTAINER],
      symptom: 'No space between the cards. No error, all tests pass.',
      breaks: [{ file: CONTAINER, mode: 'replace', find: 'flex flex-wrap gap-5', code: 'flex flex-wrap gap5' }],
      checks: [allPass, styled('the cards have a 20px gap', '#poke-container', 'columnGap', '20px')],
      hint: 'Utilities with a value have a dash between the name and the value.',
      why: 'gap-5 (1.25rem = 20px). gap5 is not a class.',
    },
    {
      id: 'merge', testsPass: true, title: 'Bonus: every Button lost its style', base: 'f4', tabs: [BUTTON],
      symptom: 'Change Title, Click me!, Make Shiny and Remove look like plain text: no background, no border.',
      breaks: [{ file: BUTTON, mode: 'replace', find: 'className={`rounded-md bg-blue-600 px-3 py-1.5 font-semibold text-white hover:bg-blue-700 ${className}`}', code: 'className={className}' }],
      checks: [allPass, styled('a Button is rounded', 'header button', 'borderRadius', '6px')],
      hint: 'Where did Button\'s own classes go?',
      why: 'The parent\'s className is added to Button\'s own classes, not instead of them: className={`rounded-md … ${className}`}.',
    },
    {
      id: 'data', title: 'Bonus: names look right, cards can\'t be found', base: 'f4', tabs: [SEARCH],
      symptom: 'Names show as "Pikachu", but the card tests fail: Expected to find element: `#pikachu-card`.',
      breaks: [{ file: SEARCH, mode: 'replace', find: '  const addPokemonData = (data) => {\n', code: '  const addPokemonData = (raw) => {\n    const data = { ...raw, name: raw.name[0].toUpperCase() + raw.name.slice(1) }\n' }],
      checks: [allPass],
      hint: 'Is the capital letter in the data, or only on the screen?',
      why: 'Changing the data changed the ids (#Pikachu-card). Change only the display: the h3 already has capitalize.',
    },
  ]
  root.FIXIT = root.FIXIT || {}
  root.FIXIT['utilities-tailwind'] = problems
})(typeof self !== 'undefined' ? self : globalThis)
