// Unit 2 · Lecture 2 · Asynchronous Requests: search the PokeAPI with axios and build
// cards with the DOM. Follows phase-II/04-Front-End/2-react-and-requests/2-async-requests.md
// The ids (header, #pokemon-name, button[type=submit], #poke-container, #<name>-card)
// are the ones the unit 3 Cypress tests use, and React keeps them in unit 4.
Course.register({
  id: 'async-requests',
  label: 'Unit 2 · Lecture 2',
  title: 'Async Requests: Pokemon search',
  base: { lesson: 'react-vite', feature: 'f7' },
  files: { ...Course.checkpoint(Course.get('react-vite'), 'f7') },
  features: [
    // ---------------------------------------------------------------- f1
    {
      id: 'f1', title: 'Install axios',
      why: 'axios is a small library for HTTP requests: it turns JSON into objects for us and treats 404/500 answers as errors.',
      steps: [
        {
          id: 'f1s1', file: 'package.json', mode: 'replace', find: '"react": "^19.3.1",', code: '"axios": "^1.20.0",\n    "react": "^19.3.1",',
          say: 'npm install axios adds this line. In Docker: rebuild the image (or docker exec react-container npm install).',
          notes: [{ match: '"axios"', what: 'axios, added to dependencies by npm install axios.', why: 'The app needs it to run, so it is a dependency (not a devDependency).',
            api: { name: 'npm install axios', does: 'Downloads axios and records it in package.json.', params: [['package', 'the npm package name', 'axios (npm install axios@1.20.0 pins this exact version)']], mistakes: ['Installing on the laptop while the app runs in Docker: the container still lacks it. Rebuild the image.'] } }],
        },
      ],
    },
    // ---------------------------------------------------------------- f2
    {
      id: 'f2', title: 'The search page',
      why: 'A heading, a form and an empty container for the cards. The ids are what our tests (unit 3) will look for.',
      steps: [
        {
          id: 'f2s1', file: 'src/App.jsx', mode: 'replace', find: '  let message = "Hello Pokemon trainers"\n  const sayHello = () => "Hello from a function"\n', code: '',
          say: 'Clear lecture 1\'s demo variables.',
        },
        {
          id: 'f2s2', file: 'src/App.jsx', mode: 'replace', find: '      <h1>Pokemon Project</h1>\n      <p className="myText" style={{ color: "red" }}>{message}</p>\n      <p>{sayHello()}</p>',
          code: '      <header>\n        <h1>Pokemon Project</h1>\n      </header>',
          say: 'The heading lives in a <header> (lecture 1\'s semantic tags).',
          notes: [{ match: '<header>', what: 'The page header with our title.', why: 'Semantic, and a stable target for tests: cy.get("header").' }],
        },
        {
          id: 'f2s3', file: 'src/App.jsx', mode: 'insertAfter', find: '      </header>',
          code: '      <form>\n        <label htmlFor="pokemon-name">Pokemon Name</label>\n        <input id="pokemon-name" type="text" name="name" placeholder="pikachu" />\n        <button type="submit">Search</button>\n      </form>\n      <div id="poke-container"></div>',
          say: 'In JSX, label for is htmlFor, and every tag closes: <input />. The empty div will hold the cards.',
          notes: [
            { match: 'htmlFor=', what: 'The label\'s for attribute, written htmlFor in JSX.', why: 'for is a JavaScript keyword (like class → className).' },
            { match: '<input id="pokemon-name"', what: 'The search box: id for the label and tests, name for FormData.', why: 'name="name" makes the value arrive as data.name.',
              api: { name: '<input /> in JSX', does: 'A text box; must be closed with />.', params: [['id', 'unique name', 'pokemon-name (the label\'s htmlFor)'], ['name', 'the FormData key', '"name"'], ['placeholder', 'grey hint text', 'an example: pikachu']], mistakes: ['<input> without /: JSX error "Expected corresponding JSX closing tag".'] } },
            { match: '<button type="submit">', what: 'Submits the form (and Enter in the box does too).', why: 'We listen to the form\'s submit, not the button\'s click.' },
            { match: 'id="poke-container"', what: 'An empty box for the cards.', why: 'generateCard appends cards here; tests count its children.' },
          ],
        },
        {
          id: 'f2s4', file: 'src/App.css', mode: 'replace', find: '.myText {\n  font-size: 50px;\n}',
          code: '#poke-container {\n  display: flex;\n  flex-wrap: wrap;\n  gap: 12px;\n}',
          say: 'Cards side by side, wrapping onto new rows.',
          notes: [{ match: 'display: flex', what: 'Flexbox: children sit in a row.', why: 'The easy way to line up cards.',
            api: { name: 'display: flex', does: 'Lays the children out in a row (or column).', params: [['flex-wrap: wrap', 'start a new row when full', 'for card grids'], ['gap', 'space between children', '12px']] } }],
        },
        {
          id: 'f2s5', file: 'src/App.css', mode: 'append',
          code: '.card {\n  border: 2px solid #ffcb05;\n  border-radius: 8px;\n  padding: 8px;\n  text-align: center;\n}',
          say: 'One look for every card.',
          notes: [{ match: 'border-radius:', what: 'Rounded corners.', why: 'Makes the box look like a card.' }],
        },
      ],
    },
    // ---------------------------------------------------------------- f3
    {
      id: 'f3', title: 'Read the form',
      why: 'Same as lecture 2 of unit 1: stop the reload, read the fields with FormData. In JSX the listener is the onSubmit prop.',
      steps: [
        {
          id: 'f3s1', later: { how: "Reading the form with FormData is the unit 1 way. React keeps the box's text in state (a controlled input).", where: "Unit 4 \u00b7 Lecture 1" }, file: 'src/App.jsx', mode: 'insertAfter', find: 'function App() {',
          code: '  const handleSubmit = (event) => {\n    event.preventDefault()\n    const data = Object.fromEntries(new FormData(event.target))\n    console.log(data)\n  }\n',
          say: 'preventDefault, then FormData: exactly the DOM lecture. Only the wiring is new.',
          notes: [
            { match: 'const handleSubmit', what: 'Our submit handler.', why: 'Naming: handle + the event. React passes it the event object.' },
            { match: 'event.preventDefault()', what: 'Stops the form\'s page reload.', why: 'Without it the page reloads and our cards vanish.' },
            { match: 'Object.fromEntries(new FormData(event.target))', what: 'Reads every named field into an object.', why: 'Gives { name: "pikachu" }.' },
          ],
        },
        {
          id: 'f3s2', file: 'src/App.jsx', mode: 'replace', find: '      <form>', code: '      <form onSubmit={(event) => handleSubmit(event)}>',
          say: 'onSubmit = addEventListener("submit") in JSX. Type pikachu, press Search, look at the console.',
          notes: [{ match: 'onSubmit={', what: 'React\'s submit listener, written as a prop.', why: 'React adds the listener for us.',
            api: { name: 'onSubmit={handler}', does: 'Runs handler when the form is submitted.', params: [['handler', 'a function (not a call)', '(event) => handleSubmit(event), or just handleSubmit']], mistakes: ['onSubmit={handleSubmit()}: runs during render, not on submit.', 'onsubmit (lowercase): React props are camelCase.'] } }],
        },
        {
          id: 'f3s3', file: 'src/App.jsx', mode: 'replace', find: '    console.log(data)',
          code: '    const name = data.name.trim().toLowerCase()\n    if (!name) return\n    console.log(name)',
          say: 'The API wants lowercase, and an empty search must do nothing (the empty URL returns a list, not a Pokemon).',
          notes: [
            { match: '.toLowerCase()', what: 'Makes the text lowercase.', why: 'PokeAPI names are lowercase: pikachu, not Pikachu.' },
            { match: 'if (!name) return', what: 'A guard: stop if the box was empty.', why: '/api/v2/pokemon/ with no name returns a list, and the card code would crash.' },
          ],
        },
      ],
    },
    // ---------------------------------------------------------------- f4
    {
      id: 'f4', title: 'Request with .then()',
      why: 'axios.get returns a promise right away: the answer comes later. .then runs when it arrives, .catch if it fails, .finally either way.',
      steps: [
        {
          id: 'f4s1', file: 'src/App.jsx', mode: 'replace', find: "import './App.css'", code: "import axios from 'axios'\nimport './App.css'",
          say: 'Import axios from node_modules (no ./ means a package).',
          notes: [{ match: "import axios from 'axios'", what: 'Imports the axios package.', why: 'A name without ./ is looked up in node_modules.' }],
        },
        {
          id: 'f4s2', file: 'src/App.jsx', mode: 'insertAfter', find: 'function App() {',
          code: '  const getPokemonData = (name) => {\n    console.log(axios.get(`https://pokeapi.co/api/v2/pokemon/${name}`))\n  }\n',
          say: 'Log what axios.get returns: Promise { <pending> }. The data is not there yet.',
          notes: [
            { match: 'axios.get(', what: 'Sends a GET request.', why: 'GET = "give me this resource".',
              api: { name: 'axios.get(url)', does: 'Requests a URL.', params: [['url', 'the address, as a string', 'a template string fills in the name: `https://pokeapi.co/api/v2/pokemon/${name}`']], returns: 'a Promise of a response: { status, data, headers }', mistakes: ['Using the promise as if it were the data: you get Promise { <pending> }.'] } },
            { match: 'const getPokemonData', what: 'Fetches one Pokemon by name.', why: 'One job per function: get data here, draw it in generateCard.' },
          ],
        },
        {
          id: 'f4s3', file: 'src/App.jsx', mode: 'replace', find: '    console.log(name)', code: '    getPokemonData(name)\n    event.target.reset()',
          say: 'Search calls it, and clears the box for the next search.',
          notes: [{ match: 'event.target.reset()', what: 'Clears every field of the form.', why: 'Ready for the next name (our tests rely on this).' }],
        },
        {
          id: 'f4s4', file: 'src/App.jsx', mode: 'replace', find: '    console.log(axios.get(`https://pokeapi.co/api/v2/pokemon/${name}`))',
          code: '    axios.get(`https://pokeapi.co/api/v2/pokemon/${name}`)\n      .then((response) => console.log(response.data))\n      .catch((error) => console.error("Request failed:", error.message))\n      .finally(() => console.log("Request completed"))',
          say: '.then when the answer arrives, .catch when it fails (try "pikachoo": 404), .finally always.',
          notes: [
            { match: '.then(', what: 'Runs when the promise succeeds, with the response.', why: 'The data only exists inside .then (or after await).',
              api: { name: 'promise.then(fn)', does: 'Runs fn with the result when it is ready.', params: [['fn', 'a function that receives the result', '(response) => … ; the JSON body is response.data']], returns: 'a new promise (so you can chain)' } },
            { match: '.catch(', what: 'Runs if the request (or any .then before it) fails.', why: 'A 404 for an unknown name lands here.' },
            { match: '.finally(', what: 'Runs at the end either way.', why: 'For clean-up, like hiding a "loading" message.' },
            { match: 'response.data', what: 'The JSON the API sent, already turned into an object.', why: 'axios parses JSON for us.' },
          ],
        },
      ],
    },
    // ---------------------------------------------------------------- f5
    {
      id: 'f5', title: 'Make a card',
      why: 'generateCard builds a card with the DOM methods from unit 1 and puts it in #poke-container. (In unit 4 React will draw cards from state instead.)',
      steps: [
        {
          id: 'f5s1', later: { how: "Building cards with createElement is the unit 1 way. In React the cards become data (a list in state) and React draws them with .map.", where: "Unit 4 \u00b7 Lecture 1" }, file: 'src/App.jsx', mode: 'insertAfter', find: 'function App() {',
          code: '  const generateCard = (data) => {\n    const card = document.createElement("div")\n    card.className = "card"\n    card.id = `${data.name}-card`\n    document.querySelector("#poke-container").appendChild(card)\n  }\n',
          say: 'An empty card div with an id like pikachu-card, added to the container.',
          notes: [
            { match: 'const generateCard', what: 'Builds one card from the API data.', why: 'Keeps drawing apart from fetching.' },
            { match: 'document.createElement("div")', what: 'Makes a new div in memory (unit 1, lecture 2).', why: 'It appears only after appendChild puts it in the container.' },
            { match: 'card.id = `${data.name}-card`', what: 'A unique id per Pokemon: pikachu-card.', why: 'Tests find a card by it, and we use it to stop duplicates.' },
            { match: 'document.querySelector("#poke-container")', what: 'The container from our JSX.', why: 'Unit 1 DOM inside React: React does not know about these cards (unit 4 fixes that).' },
          ],
        },
        {
          id: 'f5s2', file: 'src/App.jsx', mode: 'insertAfter', find: '    card.id = `${data.name}-card`',
          code: '    const img = document.createElement("img")\n    img.src = data.sprites.front_default\n    img.alt = data.name\n    card.appendChild(img)',
          say: 'The picture is at data.sprites.front_default. Always an alt.',
          notes: [{ match: 'data.sprites.front_default', what: 'The URL of the front picture in the PokeAPI data.', why: 'Read the shape of the data in the console (or the PokeAPI docs) to find it.' }],
        },
        {
          id: 'f5s3', file: 'src/App.jsx', mode: 'insertAfter', find: '    card.appendChild(img)',
          code: '    const h3 = document.createElement("h3")\n    h3.textContent = data.name\n    card.appendChild(h3)',
          say: 'The name under the picture.',
          notes: [{ match: 'h3.textContent = data.name', what: 'Sets the card title.', why: 'textContent: plain text, safe.' }],
        },
        {
          id: 'f5s4', file: 'src/App.jsx', mode: 'replace', find: '      .then((response) => console.log(response.data))', code: '      .then((response) => generateCard(response.data))',
          say: 'Instead of logging the data, draw it. Search pikachu, then bulbasaur.',
        },
      ],
    },
    // ---------------------------------------------------------------- f6
    {
      id: 'f6', title: 'async / await',
      why: 'async/await is the same promise, written top to bottom: await pauses this function (not the page) until the answer arrives. try/catch/finally replace .then/.catch/.finally.',
      steps: [
        {
          id: 'f6s1', file: 'src/App.jsx', mode: 'replace', find: 'const getPokemonData = (name) => {', code: 'const getPokemonData = async (name) => {',
          say: 'async in front: this function may await.',
          notes: [{ match: 'async (name)', what: 'Marks the function async.', why: 'Only async functions can use await. They always return a promise.' }],
        },
        {
          id: 'f6s2', file: 'src/App.jsx', mode: 'replace', find: '    axios.get(`https://pokeapi.co/api/v2/pokemon/${name}`)\n      .then((response) => generateCard(response.data))',
          code: '    try {\n      const response = await axios.get(`https://pokeapi.co/api/v2/pokemon/${name}`)\n      generateCard(response.data)',
          say: 'await = wait for the promise, then give me the response. Reads like normal code.',
          notes: [
            { match: 'await axios.get', what: 'Waits for the request and gives back the response.', why: 'The next line only runs when the data is here; the page stays responsive meanwhile.',
              api: { name: 'await promise', does: 'Pauses the async function until the promise settles.', params: [['promise', 'anything that returns a promise', 'axios.get(…)']], returns: 'the result (or throws the error into catch)', mistakes: ['Forgetting await: response is a Promise and response.data is undefined.'] } },
            { match: 'try {', what: 'Run this; if anything throws, jump to catch.', why: 'A failed request throws.' },
          ],
        },
        {
          id: 'f6s3', file: 'src/App.jsx', mode: 'replace', find: '      .catch((error) => console.error("Request failed:", error.message))\n      .finally(() => console.log("Request completed"))',
          code: '    } catch (error) {\n      console.error("Request failed:", error.message)\n    } finally {\n      console.log("Request completed")\n    }',
          say: 'Same three parts as before: try = then, catch = catch, finally = finally.',
          notes: [
            { match: '} catch (error) {', what: 'Runs when anything in try throws, including a failed request.', why: 'error.message says why ("Request failed with status code 404").' },
            { match: '} finally {', what: 'Runs at the end, success or not.', why: 'Clean-up that must always happen.' },
          ],
        },
      ],
    },
    // ---------------------------------------------------------------- f7
    {
      id: 'f7', title: 'Errors and duplicates',
      why: 'Users mistype names and search twice. Tell them when a Pokemon does not exist, and never draw the same card twice.',
      steps: [
        {
          id: 'f7s1', file: 'src/App.jsx', mode: 'insertAfter', find: '      console.error("Request failed:", error.message)',
          code: '      alert("Pokemon Does not Exist")',
          say: 'The console is for us; the alert is for the user. Try pikachoo.',
          notes: [{ match: 'alert(', what: 'A pop-up message for the user.', why: 'Errors must be visible to users, not only in the console. Cypress can check alerts (unit 3).' }],
        },
        {
          id: 'f7s2', later: { how: "This checks the page for a card. React checks the data instead: list.some(\u2026).", where: "Unit 4 \u00b7 Lecture 1" }, file: 'src/App.jsx', mode: 'insertAfter', find: '  const generateCard = (data) => {',
          code: '    if (document.getElementById(`${data.name}-card`)) return',
          say: 'Already a pikachu-card? Stop. Search pikachu twice: one card.',
          notes: [{ match: 'getElementById(`${data.name}-card`)', what: 'Looks for an existing card with this id.', why: 'Ids must be unique; a second card would also break our tests.' }],
        },
      ],
    },
  ],
})
