// Unit 6 · Lecture 2 · React Bootstrap: the components become React Bootstrap, Tailwind keeps the layout.
// Bootstrap's same-named classes override Tailwind's (cascade layers); a test catches it, `important` fixes it.
// Follows phase-II/04-Front-End/6-components-utilities (Bootstrap part).
Course.register({
  id: 'utilities-bootstrap',
  label: 'Unit 6 · Lecture 2',
  title: 'React Bootstrap',
  base: { lesson: 'utilities-tailwind', feature: 'f4' },
  files: { ...Course.checkpoint(Course.get('utilities-tailwind'), 'f4') },
  features: [
    {
      id: 'f1', title: 'Install Bootstrap, and keep the Tailwind layout',
      why: 'Both libraries have a class called gap-5, with different values. Bootstrap\'s is !important and not in a cascade layer, so it wins, whatever the order. `important` makes Tailwind\'s utilities win again.',
      steps: [
        {
          id: 'f1s1', file: 'cypress/e2e/home.cy.js', mode: 'append',
          code: "it('keeps the Tailwind layout after Bootstrap loads', () => {\n  cy.get('#poke-container').should('have.css', 'column-gap', '20px')\n})",
          say: 'A guard test before we install anything: the cards sit 20px apart (gap-5). Run it: green.',
          notes: [{ match: "should('have.css', 'column-gap', '20px')", what: 'gap-5 = 1.25rem = 20px between the cards.', why: 'Checks the result on the page, so it catches any CSS that overrides ours.' }],
        },
        {
          id: 'f1s2', run: 'npm install react-bootstrap@2 bootstrap@5', npm: { added: 37, audited: 259, secs: 5, funding: 67 }, file: 'package.json', mode: 'replace', find: '    "axios": "^1.20.0",',
          code: '    "axios": "^1.20.0",\n    "bootstrap": "^5.3.8",',
          say: 'npm install react-bootstrap bootstrap: Bootstrap\'s CSS…',
        },
        {
          id: 'f1s3', run: 'npm install react-bootstrap@2 bootstrap@5', file: 'package.json', mode: 'replace', find: '    "react": "^19.3.1",',
          code: '    "react": "^19.3.1",\n    "react-bootstrap": "^2.10.10",',
          say: '…and its React components.',
        },
        {
          id: 'f1s4', file: 'src/main.jsx', mode: 'replace', find: "import './index.css'",
          code: "import 'bootstrap/dist/css/bootstrap.min.css'\nimport './index.css'",
          say: 'Bootstrap\'s CSS, before ours. Run the tests: the guard test is red. The gap is 48px: Bootstrap\'s gap-5.',
          notes: [{ match: "import 'bootstrap/dist/css/bootstrap.min.css'", what: 'Loads all of Bootstrap\'s CSS, including Reboot (its reset).', why: 'Bootstrap has utility classes too, some with the same names as Tailwind\'s (gap-5, mt-4, border…).' }],
        },
        {
          id: 'f1s5', file: 'src/index.css', mode: 'set', code: '@import "tailwindcss" important;',
          say: 'important: every Tailwind utility becomes !important, so it beats Bootstrap. Run the tests: green.',
          notes: [{ match: '@import "tailwindcss" important;', what: 'Marks every utility !important.', why: 'Tailwind v4 puts its CSS in cascade layers; CSS outside a layer (Bootstrap) wins over any layer. For !important it turns around: !important inside a layer beats !important outside it.' }],
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
    {
      id: 'f3', title: 'The rest of the page in React Bootstrap',
      why: 'One library per component: the button, heading, counter and form become React Bootstrap too. Tailwind keeps the layout (App, PokeSearch, PokeContainer). Only the looks change, so the 17 tests must stay green.',
      steps: [
        {
          id: 'f3s1', file: 'src/components/Button/Button.jsx', mode: 'set',
          code: "import BsButton from 'react-bootstrap/Button'\n\nfunction Button({ children, ...props }) {\n  return (\n    <BsButton variant=\"primary\" {...props}>\n      {children}\n    </BsButton>\n  )\n}\n\nexport default Button",
          say: 'Our Button wraps Bootstrap\'s. Change Title, Click me! and every later Button get the Bootstrap look from here.',
          notes: [{ match: '<BsButton variant="primary" {...props}>', what: 'Bootstrap\'s button, blue, with every prop the parent passes (onClick, className…).', why: 'It is already type="button" unless you say otherwise.' }],
        },
        {
          id: 'f3s2', file: 'src/components/Heading/Heading.jsx', mode: 'set',
          code: "import { useState } from 'react'\nimport Card from 'react-bootstrap/Card'\nimport Stack from 'react-bootstrap/Stack'\nimport Button from '../Button'\n\nfunction Heading() {\n  const [heading, setHeading] = useState('Pokemon Project')\n\n  return (\n    <Card as=\"header\" bg=\"dark\" text=\"white\" body>\n      <Stack direction=\"horizontal\" className=\"justify-content-between\">\n        <h1 className=\"mb-0\">{heading}</h1>\n        <Button onClick={() => setHeading('Pokemon Project: Day 2')}>Change Title</Button>\n      </Stack>\n    </Card>\n  )\n}\n\nexport default Heading",
          say: 'A dark Card. as="header" keeps the <header> tag: the tests find header h1 and header button.',
          notes: [
            { match: '<Card as="header" bg="dark" text="white" body>', what: 'as picks the tag; bg and text pick the colours; body wraps the content in Card.Body.', why: 'Props, not classes.' },
            { match: 'className="justify-content-between"', what: 'Bootstrap\'s class: the title left, the button right.', why: 'Inside a Bootstrap component we use Bootstrap\'s names (Tailwind\'s is justify-between).' },
          ],
        },
        {
          id: 'f3s3', file: 'src/components/Counter/Counter.jsx', mode: 'replace', find: "import Button from '../Button'\n",
          code: "import Button from '../Button'\nimport Card from 'react-bootstrap/Card'\nimport Stack from 'react-bootstrap/Stack'\n",
          say: 'The Counter becomes a Card…',
        },
        {
          id: 'f3s4', file: 'src/components/Counter/Counter.jsx', mode: 'replace', find: "    <section className=\"flex items-center gap-4 rounded-xl bg-white p-4 shadow\">\n      <h3 className=\"text-lg font-semibold\">Total Clicks: {count}</h3>\n      <Button onClick={() => setCount((count) => count + 1)}>Click me!</Button>\n    </section>",
          code: "    <Card body>\n      <Stack direction=\"horizontal\" gap={3}>\n        <h3 className=\"mb-0\">Total Clicks: {count}</h3>\n        <Button onClick={() => setCount((count) => count + 1)}>Click me!</Button>\n      </Stack>\n    </Card>",
          say: '…a white card. The page behind it still changes colour.',
        },
        {
          id: 'f3s5', file: 'src/components/PokeSearch/PokeForm.jsx', mode: 'set',
          code: "import Card from 'react-bootstrap/Card'\nimport Form from 'react-bootstrap/Form'\nimport Stack from 'react-bootstrap/Stack'\nimport BsButton from 'react-bootstrap/Button'\n\nfunction PokeForm({ handleSubmit, pokemonName, setPokemonName }) {\n  return (\n    <Card body>\n      <Form onSubmit={(event) => handleSubmit(event)}>\n        <Stack direction=\"horizontal\" gap={3} className=\"align-items-end\">\n          <Form.Group controlId=\"pokemon-name\">\n            <Form.Label>Pokemon Name</Form.Label>\n            <Form.Control\n              type=\"text\" name=\"name\" placeholder=\"pikachu\"\n              value={pokemonName}\n              onChange={(event) => setPokemonName(event.target.value)}\n            />\n          </Form.Group>\n          <BsButton variant=\"success\" type=\"submit\">Search</BsButton>\n        </Stack>\n      </Form>\n    </Card>\n  )\n}\n\nexport default PokeForm",
          say: 'The form from Bootstrap\'s parts. controlId gives the input its id, so input[id=pokemon-name] still finds it. Run the tests: 17 green.',
          notes: [
            { match: '<Form.Group controlId="pokemon-name">', what: 'Sets the input\'s id and links the label to it.', why: 'The tests find the input by that id.' },
            { match: '<BsButton variant="success" type="submit">Search</BsButton>', what: 'Bootstrap\'s button, green, that submits the form.', why: 'Our Button is for buttons that do not submit.' },
          ],
        },
      ],
    },
  ],
})
