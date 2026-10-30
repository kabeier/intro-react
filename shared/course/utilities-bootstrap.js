// Unit 6 · Lecture 2 · React Bootstrap: a component library next to Tailwind. Bootstrap's CSS
// overrides Tailwind everywhere they overlap (cascade layers); a test catches it, `important` fixes it.
// Follows phase-II/04-Front-End/6-components-utilities (Bootstrap part).
Course.register({
  id: 'utilities-bootstrap',
  label: 'Unit 6 · Lecture 2',
  title: 'React Bootstrap',
  base: { lesson: 'utilities-tailwind', feature: 'f4' },
  files: { ...Course.checkpoint(Course.get('utilities-tailwind'), 'f4') },
  features: [
    {
      id: 'f1', title: 'Install Bootstrap, and keep the Tailwind look',
      why: 'Bootstrap\'s CSS is not in a cascade layer, and Tailwind\'s is, so Bootstrap wins every clash, whatever the order. `important` makes Tailwind\'s utilities win again.',
      steps: [
        {
          id: 'f1s1', file: 'cypress/e2e/home.cy.js', mode: 'append',
          code: "it('keeps the Tailwind look after Bootstrap loads', () => {\n  cy.get('header h1').should('have.css', 'font-weight', '700')\n  cy.get('button[type=submit]').should('have.css', 'border-radius', '6px')\n})",
          say: 'A guard test before we install anything: the heading is bold, the search button is rounded. Run it: green.',
          notes: [{ match: "should('have.css', 'border-radius', '6px')", what: 'rounded-md = 0.375rem = 6px.', why: 'Checks the result on the page, so it catches any CSS that overrides ours.' }],
        },
        {
          id: 'f1s2', file: 'package.json', mode: 'replace', find: '    "axios": "^1.20.0",',
          code: '    "axios": "^1.20.0",\n    "bootstrap": "^5.3.8",',
          say: 'npm install react-bootstrap bootstrap: Bootstrap\'s CSS…',
        },
        {
          id: 'f1s3', file: 'package.json', mode: 'replace', find: '    "react": "^19.3.1",',
          code: '    "react": "^19.3.1",\n    "react-bootstrap": "^2.10.10",',
          say: '…and its React components.',
        },
        {
          id: 'f1s4', file: 'src/main.jsx', mode: 'replace', find: "import './index.css'",
          code: "import 'bootstrap/dist/css/bootstrap.min.css'\nimport './index.css'",
          say: 'Bootstrap\'s CSS, before ours. Run the tests: the guard test is red. The heading is weight 500, the button square.',
          notes: [{ match: "import 'bootstrap/dist/css/bootstrap.min.css'", what: 'Loads all of Bootstrap\'s CSS, including Reboot (its reset).', why: 'Reboot styles h1 and button directly, and that beats Tailwind\'s classes.' }],
        },
        {
          id: 'f1s5', file: 'src/index.css', mode: 'set', code: '@import "tailwindcss" important;',
          say: 'important: every Tailwind utility becomes !important, so it beats Bootstrap. Run the tests: green.',
          notes: [{ match: '@import "tailwindcss" important;', what: 'Marks every utility !important.', why: 'Tailwind v4 puts its CSS in cascade layers; CSS outside a layer (Bootstrap) wins over any layer. !important inside a layer wins over normal CSS outside it.' }],
        },
      ],
    },
    {
      id: 'f2', title: 'PokeCard as a React Bootstrap Card',
      why: 'A component library gives you finished components (Card, Badge, Button) with props for the variants. You write less CSS and get a consistent look.',
      steps: [
        {
          id: 'f2s1', file: 'src/components/PokeSearch/PokeCard.jsx', mode: 'set',
          code: "import { useState } from 'react'\nimport Card from 'react-bootstrap/Card'\nimport Badge from 'react-bootstrap/Badge'\nimport Stack from 'react-bootstrap/Stack'\nimport BsButton from 'react-bootstrap/Button'\n\nfunction PokeCard({ pokemon, rmData }) {\n  const [shiny, setShiny] = useState(false)\n\n  return (\n    <Card id={`${pokemon.name}-card`} style={{ width: '15rem' }}>\n      <Card.Img variant=\"top\" src={shiny ? pokemon.sprites.front_shiny : pokemon.sprites.front_default} alt={pokemon.name} />\n      <Card.Body>\n        <Badge bg=\"secondary\">Pokédex #{pokemon.id}</Badge>\n        <Card.Title className=\"text-capitalize\">{pokemon.name}</Card.Title>\n        <Stack direction=\"horizontal\" gap={2}>\n          <BsButton variant={shiny ? 'secondary' : 'warning'} onClick={() => setShiny((shiny) => !shiny)}>{shiny ? 'Make Normal' : 'Make Shiny'}</BsButton>\n          <BsButton variant=\"danger\" onClick={() => rmData(pokemon.id)}>Remove</BsButton>\n        </Stack>\n      </Card.Body>\n    </Card>\n  )\n}\n\nexport default PokeCard",
          say: 'The same card from Bootstrap\'s parts. Keep the id on <Card>: the tests find cards by it. Run the tests: all 17 green.',
          notes: [
            { match: "import BsButton from 'react-bootstrap/Button'", what: 'Bootstrap\'s Button, renamed.', why: 'We already have our own Button; two components can\'t share a name in one file.' },
            { match: '<Card id={`${pokemon.name}-card`}', what: 'Props you don\'t know (id, style) go to the outer div.', why: 'So the tests\' #pikachu-card still works.' },
            { match: "variant={shiny ? 'secondary' : 'warning'}", what: 'variant picks Bootstrap\'s colour.', why: 'Props, not classes: the library writes the CSS.' },
          ],
        },
      ],
    },
  ],
})
