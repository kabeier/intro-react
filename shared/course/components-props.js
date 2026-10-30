// Unit 5 · Lecture 1 · Components and props: App.jsx is split into components, one at a time.
// The behaviour does not change, so the whole test suite stays green after every feature.
// Follows phase-II/04-Front-End/5-react-components/1-components-props.md, with the
// instructor's taught structure (Heading, Counter, Button, PokeSearch, PokeContainer, PokeCard, PokeForm).
Course.register({
  id: 'components-props',
  label: 'Unit 5 · Lecture 1',
  title: 'Components and props',
  base: { lesson: 'hooks-useeffect', feature: 'f4' },
  files: { ...Course.checkpoint(Course.get('hooks-useeffect'), 'f4') },
  features: [
    {
      id: 'f1', title: 'First component: Counter',
      why: 'A component is a function that returns JSX. Moving the counter into its own file keeps App short, and the counter keeps its own state.',
      steps: [
        {
          id: 'f1s1', file: 'src/components/Counter/Counter.jsx', mode: 'set',
          code: "import { useState, useEffect } from 'react'\n\nfunction Counter() {\n  const [count, setCount] = useState(0)\n\n  useEffect(() => {\n    const colors = ['lightblue', 'lightgreen', 'lightpink', 'lightyellow', 'lightsalmon']\n    document.body.style.backgroundColor = colors[count % colors.length]\n  }, [count])\n\n  return (\n    <>\n      <h3>Total Clicks: {count}</h3>\n      <button type=\"button\" onClick={() => setCount((count) => count + 1)}>Click me!</button>\n    </>\n  )\n}\n\nexport default Counter",
          say: 'A new file: the count state, its effect and its JSX move here. The name starts with a capital letter.',
          notes: [
            { match: 'function Counter()', what: 'A component: a function, named in PascalCase, that returns JSX.', why: 'React treats <Counter /> as a component only because of the capital C; <counter /> would be an unknown HTML tag.' },
            { match: 'export default Counter', what: 'Lets other files import this component.', why: 'One component per file, exported as the default.' },
          ],
        },
        {
          id: 'f1s2', file: 'src/App.jsx', mode: 'replace', find: "import './App.css'", code: "import './App.css'\nimport Counter from './components/Counter/Counter'",
          say: 'Import it. A default export is imported without { }.',
          notes: [{ match: "import Counter from './components/Counter/Counter'", what: 'Imports the default export of Counter.jsx.', why: 'Paths start with ./ for our own files; the .jsx ending can be left out.' }],
        },
        { id: 'f1s3', file: 'src/App.jsx', mode: 'replace', find: '  const [count, setCount] = useState(0)\n', code: '', say: 'App no longer needs the count.' },
        {
          id: 'f1s4', file: 'src/App.jsx', mode: 'replace',
          find: "  useEffect(() => {\n    const colors = ['lightblue', 'lightgreen', 'lightpink', 'lightyellow', 'lightsalmon']\n    document.body.style.backgroundColor = colors[count % colors.length]\n  }, [count])\n\n",
          code: '', say: 'The background effect moved with the count.',
        },
        {
          id: 'f1s5', file: 'src/App.jsx', mode: 'replace',
          find: '      <h3>Total Clicks: {count}</h3>\n      <button type="button" onClick={() => setCount((count) => count + 1)}>Click me!</button>',
          code: '      <Counter />',
          say: 'Render it like a tag. Run the tests: all green, nothing changed for the user.',
          notes: [{ match: '<Counter />', what: 'Renders the Counter component here.', why: 'Write it as a tag; never call Counter() yourself.' }],
        },
      ],
    },
    {
      id: 'f2', title: 'Heading, and index.js files',
      why: 'Each component gets a folder. An index.js in the folder re-exports the component, so imports stay short: ./components/Heading.',
      steps: [
        {
          id: 'f2s1', file: 'src/components/Heading/Heading.jsx', mode: 'set',
          code: "import { useState } from 'react'\n\nfunction Heading() {\n  const [heading, setHeading] = useState('Pokemon Project')\n\n  return (\n    <header>\n      <h1>{heading}</h1>\n      <button type=\"button\" onClick={() => setHeading('Pokemon Project: Day 2')}>Change Title</button>\n    </header>\n  )\n}\n\nexport default Heading",
          say: 'The heading state lives with the heading now.',
        },
        {
          id: 'f2s2', file: 'src/components/Heading/index.js', mode: 'set', code: "export { default } from './Heading'",
          say: 'index.js passes the component on. Importing a folder loads its index.js.',
          notes: [{ match: "export { default } from './Heading'", what: 'Re-exports Heading as this folder\'s default.', why: "import Heading from './components/Heading' finds index.js in the folder." }],
        },
        { id: 'f2s3', file: 'src/components/Counter/index.js', mode: 'set', code: "export { default } from './Counter'", say: 'Same for Counter.' },
        {
          id: 'f2s4', file: 'src/App.jsx', mode: 'replace', find: "import Counter from './components/Counter/Counter'",
          code: "import Heading from './components/Heading'\nimport Counter from './components/Counter'",
          say: 'Shorter imports.',
        },
        { id: 'f2s5', file: 'src/App.jsx', mode: 'replace', find: "  const [heading, setHeading] = useState('Pokemon Project')\n", code: '', say: 'App no longer owns the heading.' },
        {
          id: 'f2s6', file: 'src/App.jsx', mode: 'replace',
          find: "      <header>\n        <h1>{heading}</h1>\n        <button type=\"button\" onClick={() => setHeading('Pokemon Project: Day 2')}>Change Title</button>\n      </header>",
          code: '      <Heading />',
          say: 'Run the tests: still green.',
        },
      ],
    },
    {
      id: 'f3', title: 'A reusable Button (children)',
      why: 'Props are the arguments of a component. children is the special prop for whatever you put between the tags: <Button>Click me!</Button>.',
      steps: [
        {
          id: 'f3s1', file: 'src/components/Button/Button.jsx', mode: 'set',
          code: "function Button({ children, ...props }) {\n  return (\n    <button type=\"button\" {...props}>\n      {children}\n    </button>\n  )\n}\n\nexport default Button",
          say: 'children = what is between the tags. ...props passes every other prop (onClick, type) on to the real button.',
          notes: [
            { match: 'function Button({ children, ...props })', what: 'Takes the props object apart: children, and the rest in props.', why: 'Destructuring names the props we use; the rest go straight to <button>.',
              api: { name: 'props', does: 'The object of attributes written on a component: <Button onClick={f}> gives { onClick: f, children: … }.', params: [['children', 'what is between the opening and closing tag', 'text, elements, other components']], mistakes: ['Forgetting {children}: the button renders empty.', 'Changing props inside the component: props are read-only.'] } },
            { match: 'type="button" {...props}', what: 'type="button" by default; a type prop written later wins.', why: 'A button inside a form submits by default. <Button type="submit"> still works.' },
          ],
        },
        { id: 'f3s2', file: 'src/components/Button/index.js', mode: 'set', code: "export { default } from './Button'", say: 'The folder\'s index.js.' },
        {
          id: 'f3s3', file: 'src/components/Counter/Counter.jsx', mode: 'replace', find: "import { useState, useEffect } from 'react'",
          code: "import { useState, useEffect } from 'react'\nimport Button from '../Button'",
          say: '../ goes up one folder: from Counter to components.',
        },
        {
          id: 'f3s4', file: 'src/components/Counter/Counter.jsx', mode: 'replace',
          find: '      <button type="button" onClick={() => setCount((count) => count + 1)}>Click me!</button>',
          code: '      <Button onClick={() => setCount((count) => count + 1)}>Click me!</Button>',
          say: '"Click me!" is the children. Run the tests: "counts clicks" finds the button by that text.',
        },
        {
          id: 'f3s5', file: 'src/components/Heading/Heading.jsx', mode: 'replace', find: "import { useState } from 'react'",
          code: "import { useState } from 'react'\nimport Button from '../Button'",
          say: 'Heading uses it too.',
        },
        {
          id: 'f3s6', file: 'src/components/Heading/Heading.jsx', mode: 'replace',
          find: "      <button type=\"button\" onClick={() => setHeading('Pokemon Project: Day 2')}>Change Title</button>",
          code: "      <Button onClick={() => setHeading('Pokemon Project: Day 2')}>Change Title</Button>",
          say: 'Run the tests: green.',
        },
      ],
    },
    {
      id: 'f4', title: 'The search feature: PokeSearch',
      why: 'Everything about searching (its state, effects and functions) moves into one component. App only lays out the page.',
      steps: [
        {
          id: 'f4s1', file: 'src/components/PokeSearch/PokeSearch.jsx', mode: 'set',
          code: "import { useState, useEffect } from 'react'\nimport axios from 'axios'\n\nfunction PokeSearch() {\n  const [pokemonName, setPokemonName] = useState('')\n  const [pokemonList, setPokemonList] = useState([])\n\n  useEffect(() => {\n    console.log('pokemon list changed', pokemonList)\n  }, [pokemonList])\n\n  useEffect(() => {\n    let ignore = false\n    axios.get('https://pokeapi.co/api/v2/pokemon/pikachu')\n      .then((response) => { if (!ignore) addPokemonData(response.data) })\n    return () => { ignore = true }\n  }, [])\n\n  const addPokemonData = (data) => {\n    setPokemonList((list) => (list.some((pokemon) => pokemon.id === data.id) ? list : [...list, data]))\n  }\n\n  const rmData = (id) => {\n    setPokemonList((list) => list.filter((pokemon) => pokemon.id !== id))\n  }\n\n  const getPokemonData = async (name) => {\n    try {\n      const response = await axios.get(`https://pokeapi.co/api/v2/pokemon/${name}`)\n      addPokemonData(response.data)\n    } catch (error) {\n      console.error(\"Request failed:\", error.message)\n      alert(\"Pokemon Does not Exist\")\n    } finally {\n      console.log(\"Request completed\")\n    }\n  }\n\n  const handleSubmit = (event) => {\n    event.preventDefault()\n    const name = pokemonName.trim().toLowerCase()\n    if (!name) return\n    getPokemonData(name)\n    setPokemonName('')\n  }\n\n  return (\n    <>\n      <form onSubmit={(event) => handleSubmit(event)}>\n        <label htmlFor=\"pokemon-name\">Pokemon Name</label>\n        <input\n          id=\"pokemon-name\" type=\"text\" name=\"name\" placeholder=\"pikachu\"\n          value={pokemonName}\n          onChange={(event) => setPokemonName(event.target.value)}\n        />\n        <button type=\"submit\">Search</button>\n      </form>\n      <div id=\"poke-container\">\n        {pokemonList.map((pokemon) => (\n          <div className=\"card\" id={`${pokemon.name}-card`} key={pokemon.id}>\n            <img src={pokemon.sprites.front_default} alt={pokemon.name} />\n            <h3>{pokemon.name}</h3>\n            <button type=\"button\" onClick={() => rmData(pokemon.id)}>Remove</button>\n          </div>\n        ))}\n      </div>\n    </>\n  )\n}\n\nexport default PokeSearch",
          say: 'Cut and paste: the two states, both effects, the functions, the form and the cards. Nothing new, just a new home.',
          notes: [{ match: 'function PokeSearch()', what: 'A feature component: it owns the search state and the functions that change it.', why: 'State lives in the component that uses it. Nothing else needs the list yet.' }],
        },
        { id: 'f4s2', file: 'src/components/PokeSearch/index.js', mode: 'set', code: "export { default } from './PokeSearch'", say: 'Its index.js.' },
        {
          id: 'f4s3', file: 'src/App.jsx', mode: 'set',
          code: "import { useEffect } from 'react'\nimport './App.css'\nimport Heading from './components/Heading'\nimport Counter from './components/Counter'\nimport PokeSearch from './components/PokeSearch'\n\nfunction App() {\n  useEffect(() => {\n    console.log('page mounted')\n    return () => console.log('page unmounted')\n  }, [])\n\n  return (\n    <>\n      <Heading />\n      <Counter />\n      <PokeSearch />\n    </>\n  )\n}\n\nexport default App",
          say: 'App is now only the page layout. Run the tests: all 12 green.',
          notes: [{ match: '<PokeSearch />', what: 'The whole search feature in one tag.', why: 'Reading App now tells you what is on the page, not how each part works.' }],
        },
      ],
    },
    {
      id: 'f5', title: 'PokeCard, with props',
      why: 'The parent passes data down as props: <PokeCard pokemon={pokemon} rmData={rmData} />. The card gets them as one object.',
      steps: [
        {
          id: 'f5s1', file: 'src/components/PokeSearch/PokeCard.jsx', mode: 'set',
          code: "function PokeCard({ pokemon, rmData }) {\n  return (\n    <div className=\"card\" id={`${pokemon.name}-card`}>\n      <img src={pokemon.sprites.front_default} alt={pokemon.name} />\n      <h3>{pokemon.name}</h3>\n      <button type=\"button\" onClick={() => rmData(pokemon.id)}>Remove</button>\n    </div>\n  )\n}\n\nexport default PokeCard",
          say: 'One card. It gets the Pokemon and the remove function from its parent.',
          notes: [{ match: 'function PokeCard({ pokemon, rmData })', what: 'Destructures the two props the card needs.', why: 'Same as (props) => … props.pokemon, with shorter names.' }],
        },
        {
          id: 'f5s2', file: 'src/components/PokeSearch/PokeSearch.jsx', mode: 'replace', find: "import axios from 'axios'",
          code: "import axios from 'axios'\nimport PokeCard from './PokeCard'",
          say: 'Same folder: ./',
        },
        {
          id: 'f5s3', file: 'src/components/PokeSearch/PokeSearch.jsx', mode: 'replace',
          find: "          <div className=\"card\" id={`${pokemon.name}-card`} key={pokemon.id}>\n            <img src={pokemon.sprites.front_default} alt={pokemon.name} />\n            <h3>{pokemon.name}</h3>\n            <button type=\"button\" onClick={() => rmData(pokemon.id)}>Remove</button>\n          </div>",
          code: '          <PokeCard key={pokemon.id} pokemon={pokemon} rmData={rmData} />',
          say: 'The key stays here, on the element the map returns. Forget rmData and "can remove a card" goes red. Run the tests: green.',
          notes: [
            { match: 'rmData={rmData}', what: 'Passes the parent\'s function down as a prop.', why: 'The list lives in PokeSearch, so only PokeSearch can change it. The card calls the function it was given.' },
            { match: 'key={pokemon.id}', what: 'The key goes on the component in the map.', why: 'key is for React, not a prop: the card never sees it.' },
          ],
        },
      ],
    },
    {
      id: 'f6', title: 'PokeContainer: passing props down',
      why: 'rmData now travels PokeSearch → PokeContainer → PokeCard. Passing props through components that only hand them on is called prop drilling.',
      steps: [
        {
          id: 'f6s1', file: 'src/components/PokeSearch/PokeContainer.jsx', mode: 'set',
          code: "import PokeCard from './PokeCard'\n\nfunction PokeContainer({ pokemonList, rmData }) {\n  return (\n    <div id=\"poke-container\">\n      {pokemonList.map((pokemon) => (\n        <PokeCard key={pokemon.id} pokemon={pokemon} rmData={rmData} />\n      ))}\n    </div>\n  )\n}\n\nexport default PokeContainer",
          say: 'The container gets the list and the remove function. Keep id="poke-container": two tests look for it.',
        },
        {
          id: 'f6s2', file: 'src/components/PokeSearch/PokeSearch.jsx', mode: 'replace', find: "import PokeCard from './PokeCard'",
          code: "import PokeContainer from './PokeContainer'",
          say: 'PokeSearch no longer uses PokeCard directly.',
        },
        {
          id: 'f6s3', file: 'src/components/PokeSearch/PokeSearch.jsx', mode: 'replace',
          find: "      <div id=\"poke-container\">\n        {pokemonList.map((pokemon) => (\n          <PokeCard key={pokemon.id} pokemon={pokemon} rmData={rmData} />\n        ))}\n      </div>",
          code: '      <PokeContainer pokemonList={pokemonList} rmData={rmData} />',
          say: 'Run the tests: green.',
          notes: [{ match: '<PokeContainer pokemonList={pokemonList} rmData={rmData} />', what: 'Passes the list and the function down.', why: 'Data flows down as props; changes flow up by calling functions the parent passed.' }],
        },
      ],
    },
    {
      id: 'f7', title: 'PokeForm',
      why: 'The form only shows the box and reports what happens. The state stays in PokeSearch, which passes the value and the functions down.',
      steps: [
        {
          id: 'f7s1', file: 'src/components/PokeSearch/PokeForm.jsx', mode: 'set',
          code: "function PokeForm({ handleSubmit, pokemonName, setPokemonName }) {\n  return (\n    <form onSubmit={(event) => handleSubmit(event)}>\n      <label htmlFor=\"pokemon-name\">Pokemon Name</label>\n      <input\n        id=\"pokemon-name\" type=\"text\" name=\"name\" placeholder=\"pikachu\"\n        value={pokemonName}\n        onChange={(event) => setPokemonName(event.target.value)}\n      />\n      <button type=\"submit\">Search</button>\n    </form>\n  )\n}\n\nexport default PokeForm",
          say: 'The form gets three props: the value, the setter, and what to do on submit.',
          notes: [{ match: 'function PokeForm({ handleSubmit, pokemonName, setPokemonName })', what: 'A component that only displays and reports.', why: 'The parent owns the state; the form can be reused or tested on its own.' }],
        },
        {
          id: 'f7s2', file: 'src/components/PokeSearch/PokeSearch.jsx', mode: 'replace', find: "import PokeContainer from './PokeContainer'",
          code: "import PokeContainer from './PokeContainer'\nimport PokeForm from './PokeForm'",
          say: 'Import the form.',
        },
        {
          id: 'f7s3', file: 'src/components/PokeSearch/PokeSearch.jsx', mode: 'replace',
          find: "      <form onSubmit={(event) => handleSubmit(event)}>\n        <label htmlFor=\"pokemon-name\">Pokemon Name</label>\n        <input\n          id=\"pokemon-name\" type=\"text\" name=\"name\" placeholder=\"pikachu\"\n          value={pokemonName}\n          onChange={(event) => setPokemonName(event.target.value)}\n        />\n        <button type=\"submit\">Search</button>\n      </form>",
          code: '      <PokeForm handleSubmit={handleSubmit} pokemonName={pokemonName} setPokemonName={setPokemonName} />',
          say: 'Run the tests: all 12 green. Same app, eight small files instead of one big one.',
        },
      ],
    },
  ],
})
