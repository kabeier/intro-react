// Fix it problems for unit 6 · lecture 2 (React Bootstrap). The check is the whole test suite,
// plus computed styles for the problems no test covers.
;(function (root) {
  const CARD = 'src/components/PokeSearch/PokeCard.jsx'
  const N = 17
  const allPass = { name: `all ${N} tests pass`, run: async (doc, win, ctx) => { const t = await ctx.runTests(); return t.length === N && t.every((x) => x.state === 'passed') } }
  const styled = (name, sel, prop, want) => ({ name, run: async (doc, win, ctx) => {
    for (let i = 0; i < 50; i++) { const e = doc.querySelector(sel); if (e && win.getComputedStyle(e)[prop] === want) return true; await ctx.wait(100) }
    return false
  } })
  const problems = [
    {
      id: 'important', title: 'The heading went thin, the buttons square', base: 'f2', tabs: ['src/index.css', 'src/main.jsx', 'cypress/e2e/home.cy.js'],
      symptom: '"keeps the Tailwind look after Bootstrap loads" fails: expected <h1> to have CSS property \'font-weight\' with the value \'700\', but the value was \'500\'.',
      breaks: [{ file: 'src/index.css', mode: 'set', code: '@import "tailwindcss";' }],
      checks: [allPass],
      hint: 'Bootstrap\'s CSS beats Tailwind\'s layered utilities. What made them win again?',
      why: '@import "tailwindcss" important; makes every utility !important, which beats Bootstrap\'s normal rules.',
    },
    {
      id: 'css', testsPass: true, title: 'Cards without borders', base: 'f2', tabs: ['src/main.jsx'],
      symptom: 'The cards have no border or rounding, the badge and buttons are plain. No error, all tests pass.',
      breaks: [{ file: 'src/main.jsx', mode: 'replace', find: "import 'bootstrap/dist/css/bootstrap.min.css'\n", code: '' }],
      checks: [allPass, styled('cards have Bootstrap\'s rounded border', '#pikachu-card', 'borderTopLeftRadius', '6px')],
      hint: 'React Bootstrap gives you components. Where does their CSS come from?',
      why: 'react-bootstrap only adds class names; the styles are in Bootstrap\'s CSS: import \'bootstrap/dist/css/bootstrap.min.css\' in main.jsx.',
    },
    {
      id: 'named', title: 'Blank page: "does not provide an export named \'Card\'"', base: 'f2', tabs: [CARD],
      symptom: 'The page is blank. The console: The requested module \'react-bootstrap/Card\' does not provide an export named \'Card\'.',
      breaks: [{ file: CARD, mode: 'replace', find: "import Card from 'react-bootstrap/Card'", code: "import { Card } from 'react-bootstrap/Card'" }],
      checks: [allPass],
      hint: 'react-bootstrap/Card has one default export. How do you import a default?',
      why: 'From the subpath, import the default: import Card from \'react-bootstrap/Card\'. (Or a named import from the package: import { Card } from \'react-bootstrap\'.)',
    },
    {
      id: 'id', title: 'Most card tests fail after the switch', base: 'f2', tabs: [CARD],
      symptom: 'The Bootstrap cards look right, but the card tests fail: Expected to find element: `#pikachu-card`.',
      breaks: [{ file: CARD, mode: 'replace', find: "<Card id={`${pokemon.name}-card`} style={{ width: '15rem' }}>", code: "<Card style={{ width: '15rem' }}>" }],
      checks: [allPass],
      hint: 'What did the old card div have that the tests use?',
      why: 'Put the id on <Card>: React Bootstrap passes it to the outer div. <Card id={`${pokemon.name}-card`} …>.',
    },
    {
      id: 'alt', title: '"expected <img> to have attribute \'alt\'"', base: 'f2', tabs: [CARD],
      symptom: '"should render a Pokemon card for the user\'s search" fails: expected <img> to have attribute alt.',
      breaks: [{ file: CARD, mode: 'replace', find: ' alt={pokemon.name} />', code: ' />' }],
      checks: [allPass],
      hint: 'Card.Img is still an <img>. What does every image need?',
      why: 'Screen readers read the alt text (and the test checks it): <Card.Img … alt={pokemon.name} />.',
    },
    {
      id: 'remove', title: 'Remove does nothing', base: 'f2', tabs: [CARD],
      symptom: 'Click Remove: the card stays. No error. "can remove a card" fails.',
      breaks: [{ file: CARD, mode: 'replace', find: '<BsButton variant="danger" onClick={() => rmData(pokemon.id)}>', code: '<BsButton variant="danger" onClick={rmData}>' }],
      checks: [allPass],
      hint: 'onClick={rmData} calls rmData with what?',
      why: 'onClick passes the click event, so rmData gets an event, not an id. Wrap it: onClick={() => rmData(pokemon.id)}.',
    },
    {
      id: 'capitalize', testsPass: true, title: 'Bonus: names in lowercase', base: 'f2', tabs: [CARD],
      symptom: 'Card titles read "pikachu". No error, all tests pass.',
      breaks: [{ file: CARD, mode: 'replace', find: '<Card.Title className="text-capitalize">', code: '<Card.Title>' }],
      checks: [allPass, styled('titles are capitalised', '#pikachu-card .card-title', 'textTransform', 'capitalize')],
      hint: 'Bootstrap has a class for this; so does Tailwind. This file uses Bootstrap.',
      why: 'className="text-capitalize" (Bootstrap) shows Pikachu without changing the data.',
    },
    {
      id: 'mixed', testsPass: true, title: 'Bonus: square cards', base: 'f2', tabs: [CARD, 'src/index.css'],
      symptom: 'Someone added a Tailwind class to the Card and its corners went square.',
      breaks: [{ file: CARD, mode: 'replace', find: "<Card id={`${pokemon.name}-card`} style={{ width: '15rem' }}>", code: "<Card id={`${pokemon.name}-card`} className=\"rounded-none\" style={{ width: '15rem' }}>" }],
      checks: [allPass, styled('cards keep Bootstrap\'s rounded border', '#pikachu-card', 'borderTopLeftRadius', '6px')],
      hint: 'With important, which library wins when both style the same element?',
      why: 'important makes every Tailwind class win. Keep one library per component: no Tailwind classes on Bootstrap components.',
    },
    {
      id: 'badge', testsPass: true, title: 'Bonus: the number badge is invisible', base: 'f2', tabs: [CARD],
      symptom: 'The Pokédex number is white on white. No error, all tests pass.',
      breaks: [{ file: CARD, mode: 'replace', find: '<Badge bg="secondary">', code: '<Badge bg="grey">' }],
      checks: [allPass, styled('the badge has a grey background', '#pikachu-card .badge', 'backgroundColor', 'rgb(108, 117, 125)')],
      hint: 'bg takes one of Bootstrap\'s colour names. Is grey one of them?',
      why: 'bg="grey" makes the class bg-grey, which doesn\'t exist. Use a theme colour: primary, secondary, success, danger, warning, info, light, dark.',
    },
    {
      id: 'sprite', title: 'Bonus: every card is shiny', base: 'f2', tabs: [CARD],
      symptom: 'All cards show the shiny picture, and Make Shiny changes nothing. Two shiny tests fail.',
      breaks: [{ file: CARD, mode: 'replace', find: 'src={shiny ? pokemon.sprites.front_shiny : pokemon.sprites.front_default}', code: 'src={pokemon.sprites.front_shiny}' }],
      checks: [allPass],
      hint: 'The picture must depend on the card\'s shiny state.',
      why: 'Pick the sprite from the state: src={shiny ? pokemon.sprites.front_shiny : pokemon.sprites.front_default}.',
    },
  ]
  root.FIXIT = root.FIXIT || {}
  root.FIXIT['utilities-bootstrap'] = problems
})(typeof self !== 'undefined' ? self : globalThis)
