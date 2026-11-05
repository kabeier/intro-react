// Unit 8 · Lecture 1 · useParams and useNavigate: a details page for each Pokemon (the id comes
// from the URL), a Back button, and a login form that moves to another page after submitting.
// Follows phase-II/04-Front-End/8-react-router-hooks/1-useParams-useNav.md
const ROUTER_8 = (extraImports, extraRoutes) => "import { createBrowserRouter } from 'react-router'\nimport App from './App.jsx'\nimport HomePage from './pages/HomePage.jsx'\nimport AboutPage from './pages/AboutPage.jsx'\nimport NotFoundPage from './pages/NotFoundPage.jsx'\nimport ErrorPage from './pages/ErrorPage.jsx'\n" + extraImports +
  "\nconst router = createBrowserRouter([\n  {\n    path: '/',\n    element: <App />,\n    children: [\n      {\n        errorElement: <ErrorPage />,\n        children: [\n          { index: true, element: <HomePage /> },\n          { path: 'about', element: <AboutPage /> },\n" + extraRoutes + "          { path: '*', element: <NotFoundPage /> },\n        ],\n      },\n    ],\n  },\n])\n\nexport default router"
Course.register({
  id: 'router-hooks',
  label: 'Unit 8 · Lecture 1',
  title: 'useParams and useNavigate',
  base: { lesson: 'router-pages', feature: 'f5' },
  files: { ...Course.checkpoint(Course.get('router-pages'), 'f5') },
  features: [
    {
      id: 'f1', title: 'A route with a parameter',
      why: 'pokemon/:id matches /pokemon/25, /pokemon/1… useParams() gives the page the part after the colon: { id: \'25\' }.',
      steps: [
        {
          id: 'f1s1', file: 'cypress/e2e/details.cy.js', mode: 'set',
          code: "it('reads the id from the URL', () => {\n  cy.visit('/pokemon/25')\n  cy.contains('h2', '#25')\n})",
          say: 'A spec for the details page. Visit /pokemon/25: the page must know it is #25. Red.',
        },
        {
          id: 'f1s2', later: { how: "A placeholder page that only shows the id from the URL.", where: "Feature 2, next (the real Pokemon)" }, file: 'src/pages/PokemonDetailsPage.jsx', mode: 'set',
          code: "import { useParams } from 'react-router'\n\nfunction PokemonDetailsPage() {\n  const { id } = useParams()\n\n  return <h2>Pokemon #{id}</h2>\n}\n\nexport default PokemonDetailsPage",
          say: 'useParams reads the URL. The id is always a string.',
          notes: [{ match: 'const { id } = useParams()', what: 'The URL parameters, by name.', why: 'The route says :id, so the object has an id.',
            api: { name: 'useParams()', does: 'Returns the dynamic parts of the current URL.', returns: "{ id: '25' } for the route pokemon/:id at /pokemon/25 (strings)", mistakes: ['A different name than the route (:pokemonId vs id): undefined.'] } }],
        },
        {
          id: 'f1s3', file: 'src/router.jsx', mode: 'set',
          code: ROUTER_8("import PokemonDetailsPage from './pages/PokemonDetailsPage.jsx'\n", "          { path: 'pokemon/:id', element: <PokemonDetailsPage /> },\n"),
          say: 'The colon makes :id a parameter. Green.',
          notes: [{ match: "{ path: 'pokemon/:id', element: <PokemonDetailsPage /> }", what: 'One route for every Pokemon.', why: ':id matches any value in that place.' }],
        },
      ],
    },
    {
      id: 'f2', title: 'Fetch the Pokemon for that id',
      why: 'The page loads its own data from the id, so /pokemon/25 works even when you open it directly or share it.',
      steps: [
        {
          id: 'f2s2', file: 'cypress/e2e/details.cy.js', mode: 'append',
          code: "\nit('shows the Pokemon from the API', () => {\n  cy.visit('/pokemon/25')\n  cy.contains('h2', 'pikachu')\n  cy.get('img[alt=pikachu]').should('be.visible')\n  cy.contains('Type: electric')\n})",
          say: 'Test first: name, picture, type. Red.',
        },
        {
          id: 'f2s3', fixes: ["f1s2"], file: 'src/pages/PokemonDetailsPage.jsx', mode: 'set',
          code: "import { useEffect, useState } from 'react'\nimport { useParams } from 'react-router'\nimport axios from 'axios'\nimport Card from 'react-bootstrap/Card'\nimport Spinner from 'react-bootstrap/Spinner'\n\nfunction PokemonDetailsPage() {\n  const { id } = useParams()\n  const [pokemon, setPokemon] = useState(null)\n\n  useEffect(() => {\n    let ignore = false\n    axios.get(`https://pokeapi.co/api/v2/pokemon/${id}`)\n      .then((response) => { if (!ignore) setPokemon(response.data) })\n    return () => { ignore = true }\n  }, [id])\n\n  if (!pokemon) return <Spinner animation=\"border\" role=\"status\" />\n\n  return (\n    <Card style={{ width: '20rem' }}>\n      <Card.Img variant=\"top\" src={pokemon.sprites.front_default} alt={pokemon.name} />\n      <Card.Body>\n        <h2 className=\"text-capitalize\">{pokemon.name} #{pokemon.id}</h2>\n        <ul>\n          <li>Height: {pokemon.height}</li>\n          <li>Weight: {pokemon.weight}</li>\n          {pokemon.types.map((t) => <li key={t.type.name}>Type: {t.type.name}</li>)}\n        </ul>\n      </Card.Body>\n    </Card>\n  )\n}\n\nexport default PokemonDetailsPage",
          say: 'An effect on [id]: load when the page opens, and again if the id changes. A spinner until the answer arrives. Green, both tests.',
          notes: [
            { match: '}, [id])', what: 'Run again whenever the id in the URL changes.', why: 'Going from /pokemon/25 to /pokemon/1 keeps the same page component; only id changes.' },
            { match: 'if (!pokemon) return <Spinner animation="border" role="status" />', what: 'Something to show while loading.', why: 'The first render has no data yet; pokemon.name would crash.' },
          ],
        },
      ],
    },
    {
      id: 'f3', title: 'A Pokemon that does not exist',
      why: 'Anyone can type /pokemon/99999. A failed request must show a message, not spin forever.',
      steps: [
        {
          id: 'f3s1', file: 'cypress/e2e/details.cy.js', mode: 'append',
          code: "\nit('shows a message for an unknown Pokemon', () => {\n  cy.visit('/pokemon/99999')\n  cy.contains('Pokemon not found')\n})",
          say: 'Test first: the API answers 404. Red: the spinner never stops.',
        },
        {
          id: 'f3s2', file: 'src/pages/PokemonDetailsPage.jsx', mode: 'replace', find: '  const [pokemon, setPokemon] = useState(null)\n',
          code: '  const [pokemon, setPokemon] = useState(null)\n  const [error, setError] = useState(null)\n',
          say: 'A second state for the error.',
        },
        {
          id: 'f3s3', file: 'src/pages/PokemonDetailsPage.jsx', mode: 'replace', find: "      .then((response) => { if (!ignore) setPokemon(response.data) })\n",
          code: "      .then((response) => { if (!ignore) setPokemon(response.data) })\n      .catch(() => { if (!ignore) setError('Pokemon not found') })\n",
          say: 'catch: the request failed.',
        },
        {
          id: 'f3s4', file: 'src/pages/PokemonDetailsPage.jsx', mode: 'replace', find: '  if (!pokemon) return <Spinner',
          code: '  if (error) return <p>{error}. <Link to="/">Back home</Link></p>\n  if (!pokemon) return <Spinner',
          say: 'Show the message first, the spinner only while still waiting…',
        },
        {
          id: 'f3s5', file: 'src/pages/PokemonDetailsPage.jsx', mode: 'replace', find: "import { useParams } from 'react-router'",
          code: "import { Link, useParams } from 'react-router'",
          say: '…and import Link. Green.',
        },
      ],
    },
    {
      id: 'f4', title: 'A Details link on every card',
      why: 'Going to another page when the user clicks = a Link. The URL is built from the card\'s id.',
      steps: [
        {
          id: 'f4s1', file: 'cypress/e2e/details.cy.js', mode: 'append',
          code: "\nit('opens the details page from a card', () => {\n  cy.visit('/')\n  cy.get('#pikachu-card a').contains('Details').click()\n  cy.location('pathname').should('eq', '/pokemon/25')\n  cy.contains('h2', 'pikachu')\n})",
          say: 'Test first: Details on Pikachu\'s card goes to /pokemon/25. Red.',
        },
        {
          id: 'f4s2', file: 'src/components/PokeSearch/PokeCard.jsx', mode: 'replace', find: "import BsButton from 'react-bootstrap/Button'",
          code: "import BsButton from 'react-bootstrap/Button'\nimport { Link } from 'react-router'",
          say: 'Link from the router.',
        },
        {
          id: 'f4s3', file: 'src/components/PokeSearch/PokeCard.jsx', mode: 'replace', find: '          <BsButton variant="danger" onClick={() => rmData(pokemon.id)}>Remove</BsButton>',
          code: '          <BsButton variant="danger" onClick={() => rmData(pokemon.id)}>Remove</BsButton>\n          <BsButton as={Link} to={`/pokemon/${pokemon.id}`} variant="outline-primary">Details</BsButton>',
          say: 'A button that is really a Link: Bootstrap\'s look, the router\'s behaviour. Green.',
          notes: [{ match: 'to={`/pokemon/${pokemon.id}`}', what: 'Builds /pokemon/25 from the card\'s id.', why: 'A template string puts the value in the path.' }],
        },
      ],
    },
    {
      id: 'f5', title: 'A Back button (useNavigate)',
      why: 'useNavigate moves from code: navigate(\'/\') or navigate(-1) (one step back in history). Use it when something other than a link click decides where to go.',
      steps: [
        {
          id: 'f5s1', file: 'cypress/e2e/details.cy.js', mode: 'append',
          code: "\nit('goes back with the Back button', () => {\n  cy.visit('/')\n  cy.get('#pikachu-card a').contains('Details').click()\n  cy.location('pathname').should('eq', '/pokemon/25')\n  cy.get('button[aria-label=\"Go back\"]').click()\n  cy.location('pathname').should('eq', '/')\n})\n\nit('the browser Back button works too', () => {\n  cy.visit('/')\n  cy.get('#pikachu-card a').contains('Details').click()\n  cy.location('pathname').should('eq', '/pokemon/25')\n  cy.go('back')\n  cy.location('pathname').should('eq', '/')\n})",
          say: 'Two tests: our Back button, and the browser\'s (cy.go(\'back\')). The second already passes: Links add to the history.',
        },
        {
          id: 'f5s2', file: 'src/components/BackButton/BackButton.jsx', mode: 'set',
          code: "import { useLocation, useNavigate } from 'react-router'\nimport BsButton from 'react-bootstrap/Button'\n\nfunction BackButton() {\n  const navigate = useNavigate()\n  const location = useLocation()\n  // Opened directly (nothing to go back to): go home instead of leaving the app.\n  const goBack = () => (location.key === 'default' ? navigate('/') : navigate(-1))\n\n  return <BsButton variant=\"light\" size=\"sm\" aria-label=\"Go back\" onClick={goBack}>← Back</BsButton>\n}\n\nexport default BackButton",
          say: 'navigate(-1) = the browser\'s Back. If the page was opened directly there is no "back" inside the app, so go home.',
          notes: [
            { match: 'const navigate = useNavigate()', what: 'A function that changes the page from code.', why: 'For after a submit, after a timer, or for Back.',
              api: { name: 'useNavigate()', does: 'Returns navigate(to).', params: [['to', "a path ('/') or a number (-1 = back, 1 = forward)", 'a Link is better when the user just clicks to go somewhere']], mistakes: ['Calling navigate while rendering: only in handlers or effects.'] } },
            { match: "location.key === 'default'", what: 'The first page of this visit.', why: 'navigate(-1) there would leave the app.' },
          ],
        },
        { id: 'f5s3', file: 'src/components/BackButton/index.js', mode: 'set', code: "export { default } from './BackButton'", say: 'Its index.js.' },
        {
          id: 'f5s4', file: 'src/components/NavBar/NavBar.jsx', mode: 'replace', find: "import Nav from 'react-bootstrap/Nav'",
          code: "import Nav from 'react-bootstrap/Nav'\nimport BackButton from '../BackButton'",
          say: 'It goes in the NavBar…',
        },
        {
          id: 'f5s5', file: 'src/components/NavBar/NavBar.jsx', mode: 'replace', find: '        <Nav.Link as={Link} to="/about">About</Nav.Link>\n      </Nav>',
          code: '        <Nav.Link as={Link} to="/about">About</Nav.Link>\n      </Nav>\n      <BackButton />',
          say: '…outside the header. Green.',
        },
      ],
    },
    {
      id: 'f6', title: 'A login form that moves on (useNavigate)',
      why: 'After the form\'s logic runs (here: check the name), the code decides where to go. That is a job for navigate, not a Link.',
      steps: [
        {
          id: 'f6s1', file: 'cypress/e2e/details.cy.js', mode: 'append',
          code: "\nit('logs in and goes home', () => {\n  cy.visit('/login')\n  cy.get('#username').type('ash')\n  cy.contains('button', 'Log In').click()\n  cy.location('pathname').should('eq', '/')\n})\n\nit('stays on the login page with an empty name', () => {\n  cy.visit('/login')\n  cy.contains('button', 'Log In').click()\n  cy.location('pathname').should('eq', '/login')\n})",
          say: 'Two tests first: a name goes home, an empty name stays. Red.',
        },
        {
          id: 'f6s2', file: 'src/pages/LoginPage.jsx', mode: 'set',
          code: "import { useState } from 'react'\nimport { useNavigate } from 'react-router'\nimport Form from 'react-bootstrap/Form'\nimport BsButton from 'react-bootstrap/Button'\n\nfunction LoginPage() {\n  const [username, setUsername] = useState('')\n  const navigate = useNavigate()\n\n  const handleSubmit = (event) => {\n    event.preventDefault()\n    if (!username.trim()) return\n    navigate('/')\n  }\n\n  return (\n    <Form onSubmit={handleSubmit} style={{ maxWidth: '20rem' }}>\n      <h2>Log In</h2>\n      <Form.Group controlId=\"username\">\n        <Form.Label>Username</Form.Label>\n        <Form.Control value={username} onChange={(event) => setUsername(event.target.value)} />\n      </Form.Group>\n      <BsButton type=\"submit\">Log In</BsButton>\n    </Form>\n  )\n}\n\nexport default LoginPage",
          say: 'Check, then navigate. controlId gives the input its id and links the label.',
          notes: [{ match: "    navigate('/')", what: 'Go home, from code.', why: 'Only after the check passed; a Link would go even with an empty name.' }],
        },
        {
          id: 'f6s3', file: 'src/router.jsx', mode: 'set',
          code: ROUTER_8("import PokemonDetailsPage from './pages/PokemonDetailsPage.jsx'\nimport LoginPage from './pages/LoginPage.jsx'\n", "          { path: 'pokemon/:id', element: <PokemonDetailsPage /> },\n          { path: 'login', element: <LoginPage /> },\n"),
          say: 'The route…',
        },
        {
          id: 'f6s4', file: 'src/components/NavBar/NavBar.jsx', mode: 'replace', find: '        <Nav.Link as={Link} to="/about">About</Nav.Link>\n',
          code: '        <Nav.Link as={Link} to="/about">About</Nav.Link>\n        <Nav.Link as={Link} to="/login">Log In</Nav.Link>\n',
          say: '…and a link to it. Run the tests: 30 green.',
        },
      ],
    },
  ],
})
