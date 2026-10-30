// Fix it problems for unit 5 · lecture 2 (component-level state). The check is the whole
// test suite (14 tests), plus the page itself for the styling problem.
;(function (root) {
  const DIR = 'src/components/'
  const CARD = DIR + 'PokeSearch/PokeCard.jsx', CONTAINER = DIR + 'PokeSearch/PokeContainer.jsx', HEADING = DIR + 'Heading/Heading.jsx'
  const SPEC = 'cypress/e2e/pokemon.cy.js'
  const N = 14
  const allPass = { name: `all ${N} tests pass`, run: async (doc, win, ctx) => { const t = await ctx.runTests(); return t.length === N && t.every((x) => x.state === 'passed') } }
  const problems = [
    {
      id: 'toggle', title: 'Make Shiny works once, never back', base: 'f4', tabs: [CARD, SPEC],
      symptom: 'Make Shiny turns the card shiny and the button says Make Normal, but Make Normal does nothing.',
      breaks: [{ file: CARD, mode: 'replace', find: 'setShiny((shiny) => !shiny)', code: 'setShiny(true)' }],
      checks: [allPass],
      hint: 'What value does the button set the state to, every time?',
      why: 'setShiny(true) always sets true. Flip it from the old value: setShiny((shiny) => !shiny).',
    },
    {
      id: 'label', title: '"Expected to find content: \'Make Shiny\'"', base: 'f4', tabs: [CARD, SPEC],
      symptom: 'The card button says Make Normal while the card is normal. "makes only one card shiny" fails: Expected to find content: \'Make Shiny\'.',
      breaks: [{ file: CARD, mode: 'replace', find: "{shiny ? 'Make Normal' : 'Make Shiny'}", code: "{shiny ? 'Make Shiny' : 'Make Normal'}" }],
      checks: [allPass],
      hint: 'condition ? whenTrue : whenFalse. Which label belongs to which side?',
      why: 'When shiny is true the button offers to go back: shiny ? \'Make Normal\' : \'Make Shiny\'.',
    },
    {
      id: 'sprite', title: 'Every card starts shiny', base: 'f4', tabs: [CARD, SPEC],
      symptom: 'New cards show the shiny picture, and Make Shiny turns them normal.',
      breaks: [{ file: CARD, mode: 'replace', find: 'shiny ? pokemon.sprites.front_shiny : pokemon.sprites.front_default', code: 'shiny ? pokemon.sprites.front_default : pokemon.sprites.front_shiny' }],
      checks: [allPass],
      hint: 'Read the ternary for the picture out loud.',
      why: 'If shiny, the shiny sprite; otherwise the normal one: shiny ? front_shiny : front_default.',
    },
    {
      id: 'index', title: 'Removing a card un-shines another', base: 'f4', tabs: [CONTAINER, SPEC],
      symptom: 'Make Bulbasaur shiny, remove Pikachu: Bulbasaur turns normal. "keeps a card shiny when another card is removed" fails.',
      breaks: [
        { file: CONTAINER, mode: 'replace', find: '{pokemonList.map((pokemon) => (', code: '{pokemonList.map((pokemon, index) => (' },
        { file: CONTAINER, mode: 'replace', find: '<PokeCard key={pokemon.id}', code: '<PokeCard key={index}' },
      ],
      checks: [allPass],
      hint: 'React matches each card\'s state by its key. What is the key after Pikachu (position 0) is removed?',
      why: 'With key={index}, Bulbasaur moves to position 0 and gets the state that was Pikachu\'s. Use a key that belongs to the Pokemon: key={pokemon.id}.',
    },
    {
      id: 'variable', title: 'Make Shiny does nothing, no error', base: 'f4', tabs: [CARD],
      symptom: 'Click Make Shiny: nothing changes. No error in the console.',
      breaks: [
        { file: CARD, mode: 'replace', find: '  const [shiny, setShiny] = useState(false)', code: '  let shiny = false' },
        { file: CARD, mode: 'replace', find: 'onClick={() => setShiny((shiny) => !shiny)}', code: 'onClick={() => { shiny = !shiny }}' },
      ],
      checks: [allPass],
      hint: 'Changing a normal variable does not make React draw again. What does?',
      why: 'Only a state setter re-renders the component, and only state survives a render: const [shiny, setShiny] = useState(false), then setShiny((shiny) => !shiny).',
    },
    {
      id: 'import', title: 'Blank page: "useState is not defined"', base: 'f4', tabs: [CARD],
      symptom: 'The page goes blank as soon as Pikachu loads. The console: ReferenceError: useState is not defined.',
      breaks: [{ file: CARD, mode: 'replace', find: "import { useState } from 'react'\n", code: '' }],
      checks: [allPass],
      hint: 'Every file that uses a hook must import it.',
      why: 'Imports are per file: PokeCard.jsx needs its own import { useState } from \'react\'.',
    },
    {
      id: 'initial', title: 'Bonus: cards start shiny', base: 'f4', tabs: [CARD],
      symptom: 'Every new card is shiny and its button says Make Normal.',
      breaks: [{ file: CARD, mode: 'replace', find: 'useState(false)', code: 'useState(true)' }],
      checks: [allPass],
      hint: 'What does useState(…) start with?',
      why: 'The first value is the argument: useState(false) for a normal card.',
    },
    {
      id: 'module', title: 'Bonus: "styles is not defined"', base: 'f4', tabs: [HEADING, DIR + 'Heading/heading.module.css'],
      symptom: 'Blank page. The console: ReferenceError: styles is not defined.',
      breaks: [{ file: HEADING, mode: 'replace', find: "import styles from './heading.module.css'", code: "import './heading.module.css'" }],
      checks: [allPass],
      hint: 'Where does the name styles come from?',
      why: 'A CSS Module gives back an object of class names; you have to name it: import styles from \'./heading.module.css\'.',
    },
    {
      id: 'classname', testsPass: true, title: 'Bonus: the heading is not red any more', base: 'f4', tabs: [HEADING, DIR + 'Heading/heading.module.css'],
      symptom: 'No error, all tests pass, but the heading is black instead of crimson.',
      breaks: [{ file: HEADING, mode: 'replace', find: 'className={styles.heading}', code: 'className={styles.Heading}' }],
      checks: [allPass, { name: 'the heading is crimson', run: (doc, win) => { const h = doc.querySelector('header h1'); return !!h && win.getComputedStyle(h).color === 'rgb(220, 20, 60)' } }],
      hint: 'Compare the name after styles. with the class in the .css file.',
      why: 'styles has one key per class in the file: .heading → styles.heading. styles.Heading is undefined, so no class is set.',
    },
    {
      id: 'remove', title: 'Bonus: cards vanish as soon as they appear', base: 'f4', tabs: [CARD],
      symptom: 'Pikachu flashes and disappears; searched cards disappear too. The console: Cannot update a component (`PokeSearch`) while rendering a different component (`PokeCard`).',
      breaks: [{ file: CARD, mode: 'replace', find: 'onClick={() => rmData(pokemon.id)}', code: 'onClick={rmData(pokemon.id)}' }],
      checks: [allPass],
      hint: 'Is rmData called on click, or while the card is drawn?',
      why: 'onClick={rmData(…)} runs during render and removes the card at once. Pass a function: onClick={() => rmData(pokemon.id)}.',
    },
  ]
  root.FIXIT = root.FIXIT || {}
  root.FIXIT['component-state'] = problems
})(typeof self !== 'undefined' ? self : globalThis)
