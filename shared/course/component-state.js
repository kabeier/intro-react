// Unit 5 · Lecture 2 · Component-level state: where should state live? Shiny for all cards
// (state in the parent), then shiny per card (state in each card), keys, and a CSS Module.
// Follows phase-II/04-Front-End/5-react-components/2-component-lvl-state.md
Course.register({
  id: 'component-state',
  label: 'Unit 5 · Lecture 2',
  title: 'Component-level state',
  base: { lesson: 'components-props', feature: 'f7' },
  files: { ...Course.checkpoint(Course.get('components-props'), 'f7') },
  features: [
    {
      id: 'f1', title: 'Shiny for every card (state in the parent)',
      why: 'One button changes every card, so the state lives in the parent (PokeSearch) and goes down to each card as a prop.',
      steps: [
        {
          id: 'f1s1', file: 'cypress/e2e/pokemon.cy.js', mode: 'append',
          code: "it('makes every card shiny with one click', () => {\n  cy.get('input[id=pokemon-name]').type('Bulbasaur{enter}')\n  cy.get('#bulbasaur-card').should('be.visible')\n  cy.contains('button', 'All Shiny').click()\n  cy.get('#pikachu-card img').should('have.attr', 'src').and('include', 'shiny')\n  cy.get('#bulbasaur-card img').should('have.attr', 'src').and('include', 'shiny')\n})",
          say: 'Test first: one click, every card shiny. Run it: red, there is no button.',
          notes: [{ match: ".and('include', 'shiny')", what: 'The image address must contain "shiny".', why: 'The PokeAPI keeps shiny sprites in a /shiny/ folder.' }],
        },
        {
          id: 'f1s2', file: 'src/components/PokeSearch/PokeSearch.jsx', mode: 'replace', find: "import axios from 'axios'",
          code: "import axios from 'axios'\nimport Button from '../Button'",
          say: 'Our Button from lecture 1.',
        },
        {
          id: 'f1s3', file: 'src/components/PokeSearch/PokeSearch.jsx', mode: 'insertAfter', find: '  const [pokemonList, setPokemonList] = useState([])',
          code: '  const [shiny, setShiny] = useState(false)',
          say: 'One shiny value for the whole list.',
        },
        {
          id: 'f1s4', later: { how: "One shiny value for every card. The next feature gives each card its own.", where: "Feature 2, next" }, file: 'src/components/PokeSearch/PokeSearch.jsx', mode: 'replace',
          find: '      <PokeContainer pokemonList={pokemonList} rmData={rmData} />',
          code: "      <Button onClick={() => setShiny((shiny) => !shiny)}>{shiny ? 'All Normal' : 'All Shiny'}</Button>\n      <PokeContainer pokemonList={pokemonList} rmData={rmData} shiny={shiny} />",
          say: 'The button flips it; the container gets it as a prop.',
          notes: [{ match: 'setShiny((shiny) => !shiny)', what: 'Flips true ↔ false.', why: 'A functional update: the new value depends on the old one.' }],
        },
        {
          id: 'f1s5', file: 'src/components/PokeSearch/PokeContainer.jsx', mode: 'replace', find: 'function PokeContainer({ pokemonList, rmData })',
          code: 'function PokeContainer({ pokemonList, rmData, shiny })',
          say: 'The container passes it on…',
        },
        {
          id: 'f1s6', file: 'src/components/PokeSearch/PokeContainer.jsx', mode: 'replace', find: '<PokeCard key={pokemon.id} pokemon={pokemon} rmData={rmData} />',
          code: '<PokeCard key={pokemon.id} pokemon={pokemon} rmData={rmData} shiny={shiny} />',
          say: '…to every card.',
        },
        {
          id: 'f1s7', file: 'src/components/PokeSearch/PokeCard.jsx', mode: 'replace', find: 'function PokeCard({ pokemon, rmData })',
          code: 'function PokeCard({ pokemon, rmData, shiny })',
          say: 'The card receives it.',
        },
        {
          id: 'f1s8', file: 'src/components/PokeSearch/PokeCard.jsx', mode: 'replace', find: '<img src={pokemon.sprites.front_default} alt={pokemon.name} />',
          code: '<img src={shiny ? pokemon.sprites.front_shiny : pokemon.sprites.front_default} alt={pokemon.name} />',
          say: 'Pick the picture from the prop. Run the tests: green.',
          notes: [{ match: 'shiny ? pokemon.sprites.front_shiny : pokemon.sprites.front_default', what: 'A ternary: if shiny, the shiny sprite, else the normal one.', why: 'JSX needs an expression, so if/else becomes condition ? a : b.' }],
        },
      ],
    },
    {
      id: 'f2', title: 'Each card toggles itself (state moves down)',
      why: 'New requirement: every card has its own button. Each card needs its own shiny value, so the state moves into PokeCard. React keeps a separate copy of state for every card.',
      steps: [
        {
          id: 'f2s1', file: 'cypress/e2e/pokemon.cy.js', mode: 'replace',
          find: "it('makes every card shiny with one click', () => {\n  cy.get('input[id=pokemon-name]').type('Bulbasaur{enter}')\n  cy.get('#bulbasaur-card').should('be.visible')\n  cy.contains('button', 'All Shiny').click()\n  cy.get('#pikachu-card img').should('have.attr', 'src').and('include', 'shiny')\n  cy.get('#bulbasaur-card img').should('have.attr', 'src').and('include', 'shiny')\n})",
          code: "it('makes only one card shiny', () => {\n  cy.get('#pikachu-card').should('be.visible')\n  cy.get('input[id=pokemon-name]').type('Bulbasaur{enter}')\n  cy.get('#bulbasaur-card button').contains('Make Shiny').click()\n  cy.get('#bulbasaur-card img').should('have.attr', 'src').and('include', 'shiny')\n  cy.get('#pikachu-card img').should('have.attr', 'src').and('not.include', 'shiny')\n  cy.get('#bulbasaur-card button').contains('Make Normal').click()\n  cy.get('#bulbasaur-card img').should('have.attr', 'src').and('not.include', 'shiny')\n})",
          say: 'The requirement changed, so the test changes first. Bulbasaur shiny, Pikachu NOT. Run it: red.',
          notes: [{ match: "cy.get('#pikachu-card img').should('have.attr', 'src').and('not.include', 'shiny')", what: 'The other card must stay normal.', why: 'This line is what proves each card has its own state.' }],
        },
        {
          id: 'f2s2', fixes: ["f1s4"], file: 'src/components/PokeSearch/PokeSearch.jsx', mode: 'replace',
          find: "      <Button onClick={() => setShiny((shiny) => !shiny)}>{shiny ? 'All Normal' : 'All Shiny'}</Button>\n      <PokeContainer pokemonList={pokemonList} rmData={rmData} shiny={shiny} />",
          code: '      <PokeContainer pokemonList={pokemonList} rmData={rmData} />',
          say: 'Remove the parent button and the prop…',
        },
        { id: 'f2s3', file: 'src/components/PokeSearch/PokeSearch.jsx', mode: 'replace', find: '  const [shiny, setShiny] = useState(false)\n', code: '', say: '…and the parent state.' },
        { id: 'f2s4', file: 'src/components/PokeSearch/PokeSearch.jsx', mode: 'replace', find: "import Button from '../Button'\n", code: '', say: 'PokeSearch no longer uses Button.' },
        {
          id: 'f2s5', file: 'src/components/PokeSearch/PokeContainer.jsx', mode: 'replace', find: 'function PokeContainer({ pokemonList, rmData, shiny })',
          code: 'function PokeContainer({ pokemonList, rmData })', say: 'The container is back to two props.',
        },
        {
          id: 'f2s6', file: 'src/components/PokeSearch/PokeContainer.jsx', mode: 'replace', find: '<PokeCard key={pokemon.id} pokemon={pokemon} rmData={rmData} shiny={shiny} />',
          code: '<PokeCard key={pokemon.id} pokemon={pokemon} rmData={rmData} />', say: 'No shiny prop.',
        },
        {
          id: 'f2s7', file: 'src/components/PokeSearch/PokeCard.jsx', mode: 'set',
          code: "import { useState } from 'react'\nimport Button from '../Button'\n\nfunction PokeCard({ pokemon, rmData }) {\n  const [shiny, setShiny] = useState(false)\n\n  return (\n    <div className=\"card\" id={`${pokemon.name}-card`}>\n      <img src={shiny ? pokemon.sprites.front_shiny : pokemon.sprites.front_default} alt={pokemon.name} />\n      <h3>{pokemon.name}</h3>\n      <Button onClick={() => setShiny((shiny) => !shiny)}>{shiny ? 'Make Normal' : 'Make Shiny'}</Button>\n      <Button onClick={() => rmData(pokemon.id)}>Remove</Button>\n    </div>\n  )\n}\n\nexport default PokeCard",
          say: 'The card owns its shiny state now. Every card on the page gets its own. Run the tests: green.',
          notes: [{ match: '  const [shiny, setShiny] = useState(false)', what: 'State inside the card: one copy per card on the page.', why: 'Only this card needs it, so it lives here (react.dev: keep state as low as you can, lift it only when it must be shared).' }],
        },
      ],
    },
    {
      id: 'f3', title: 'Keys keep state with the right card',
      why: 'React matches each card\'s state to its key. With the Pokemon id as key, state follows the Pokemon. With the array index, state stays at a position and jumps to the wrong card when the list changes.',
      steps: [
        {
          id: 'f3s1', file: 'cypress/e2e/pokemon.cy.js', mode: 'append',
          code: "it('keeps a card shiny when another card is removed', () => {\n  cy.get('#pikachu-card').should('be.visible')\n  cy.get('input[id=pokemon-name]').type('Bulbasaur{enter}')\n  cy.get('#bulbasaur-card button').contains('Make Shiny').click()\n  cy.get('#pikachu-card button').contains('Remove').click()\n  cy.get('#pikachu-card').should('not.exist')\n  cy.get('#bulbasaur-card img').should('have.attr', 'src').and('include', 'shiny')\n})",
          say: 'A test for something that already works. Run it: green.',
        },
        {
          id: 'f3s2', later: { how: "key={index} on purpose, to watch it break.", where: "the next step" }, file: 'src/components/PokeSearch/PokeContainer.jsx', mode: 'replace',
          find: "      {pokemonList.map((pokemon) => (\n        <PokeCard key={pokemon.id} pokemon={pokemon} rmData={rmData} />",
          code: "      {pokemonList.map((pokemon, index) => (\n        <PokeCard key={index} pokemon={pokemon} rmData={rmData} />",
          say: 'Break it on purpose: key = index. Run the test: red. Bulbasaur moved to position 0 and got Pikachu\'s state.',
          notes: [{ match: 'key={index}', what: 'The position in the array as key.', why: 'Wrong when items can be removed or reordered: the state stays at the position, not with the item.' }],
        },
        {
          id: 'f3s3', fixes: ["f3s2"], file: 'src/components/PokeSearch/PokeContainer.jsx', mode: 'replace',
          find: "      {pokemonList.map((pokemon, index) => (\n        <PokeCard key={index} pokemon={pokemon} rmData={rmData} />",
          code: "      {pokemonList.map((pokemon) => (\n        <PokeCard key={pokemon.id} pokemon={pokemon} rmData={rmData} />",
          say: 'Back to the id. Run the tests: green. A test now guards the key.',
        },
      ],
    },
    {
      id: 'f4', title: 'Scoped styles: a CSS Module',
      why: 'A file named *.module.css gives every class a unique name, so its styles only reach the component that imports it.',
      steps: [
        { id: 'f4s1', file: 'src/components/Heading/heading.module.css', mode: 'set', code: '.heading {\n  color: crimson;\n}', say: 'A CSS Module: the name must end in .module.css.' },
        {
          id: 'f4s2', file: 'src/components/Heading/Heading.jsx', mode: 'replace', find: "import Button from '../Button'",
          code: "import Button from '../Button'\nimport styles from './heading.module.css'",
          say: 'Importing it gives an object: class name → unique name.',
          notes: [{ match: "import styles from './heading.module.css'", what: 'styles.heading is the generated, unique class name.', why: 'Two components can both have a .heading class without clashing.' }],
        },
        {
          id: 'f4s3', file: 'src/components/Heading/Heading.jsx', mode: 'replace', find: '      <h1>{heading}</h1>',
          code: '      <h1 className={styles.heading}>{heading}</h1>',
          say: 'Use it with className={styles.heading}. Inspect the h1: the class looks like _heading_x1y2.',
        },
      ],
    },
  ],
})
