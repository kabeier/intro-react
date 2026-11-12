// Unit 6 · Lecture 1 · Tailwind CSS: utility classes inside the Pokemon app. Styling is not
// tested by class names; the tests that matter here check what the page computes (layout).
// Follows phase-II/04-Front-End/6-components-utilities (Tailwind part), Tailwind v4 with @tailwindcss/vite.
Course.register({
  id: 'utilities-tailwind',
  label: 'Unit 6 · Lecture 1',
  title: 'Tailwind CSS',
  base: { lesson: 'component-state', feature: 'f4' },
  files: { ...Course.checkpoint(Course.get('component-state'), 'f4') },
  features: [
    {
      id: 'f1', title: 'Install Tailwind',
      why: 'Tailwind v4 is a Vite plugin plus one CSS line. It scans your files for class names and writes only the CSS you use.',
      steps: [
        {
          id: 'f1s1', run: 'npm install tailwindcss @tailwindcss/vite', npm: { added: 15, audited: 222, secs: 5, funding: 65 }, file: 'package.json', mode: 'replace', find: '    "axios": "^1.20.0",',
          code: '    "@tailwindcss/vite": "^4.3.3",\n    "axios": "^1.20.0",',
          say: 'npm install tailwindcss @tailwindcss/vite: two packages land in dependencies.',
        },
        { id: 'f1s2', run: 'npm install tailwindcss @tailwindcss/vite', file: 'package.json', mode: 'replace', find: '    "react-dom": "^19.3.1"\n', code: '    "react-dom": "^19.3.1",\n    "tailwindcss": "^4.3.3"\n', say: 'The second one.' },
        {
          id: 'f1s3', file: 'vite.config.js', mode: 'set',
          code: "import react from '@vitejs/plugin-react'\nimport tailwindcss from '@tailwindcss/vite'\nimport { defineConfig } from 'vite'\n\n// https://vite.dev/config/\nexport default defineConfig({\n  plugins: [react(), tailwindcss()],\n})",
          say: 'Add the plugin next to react(). Keep react(): without it JSX stops working.',
          notes: [{ match: 'plugins: [react(), tailwindcss()]', what: 'Vite runs both plugins: React (JSX, fast refresh) and Tailwind (writes the CSS).', why: 'Different from the curriculum (until merged): its config lost react().' }],
        },
        {
          id: 'f1s4', file: 'src/index.css', mode: 'set', code: '@import "tailwindcss";',
          say: 'One line. It also adds Preflight, a reset: headings lose their size, lists their bullets. Rebuild the Docker image so the new packages are inside it.',
          notes: [{ match: '@import "tailwindcss";', what: 'Pulls in Tailwind: Preflight (a reset), the theme, and the utilities you use.', why: 'v4 has no tailwind.config.js and no @tailwind directives; this line replaces them.' }],
        },
      ],
    },
    {
      id: 'f2', title: 'Layout with utilities',
      why: 'Utility classes are tiny, single-purpose classes: flex, flex-wrap, gap-5. You style in the JSX instead of a separate CSS file.',
      steps: [
        {
          id: 'f2s1', file: 'cypress/e2e/pokemon.cy.js', mode: 'append',
          code: "it('lays the cards out in a wrapping row', () => {\n  cy.get('#poke-container').should('have.css', 'display', 'flex')\n  cy.get('#poke-container').should('have.css', 'flex-wrap', 'wrap')\n})",
          say: 'A test for the layout we have now (App.css). Run it: green. It checks what the page computes, not class names.',
          notes: [{ match: "should('have.css', 'display', 'flex')", what: 'Checks the computed style.', why: 'It passes whether the style comes from App.css or from Tailwind classes, so it survives the switch.' }],
        },
        { id: 'f2s2', file: 'src/App.jsx', mode: 'replace', find: "import './App.css'\n", code: '', say: 'Stop importing App.css. Run the test: red, the cards no longer wrap.' },
        { id: 'f2s3', file: 'src/App.css', mode: 'delete', say: 'And delete the file.' },
        {
          id: 'f2s4', file: 'src/components/PokeSearch/PokeContainer.jsx', mode: 'replace', find: '<div id="poke-container">',
          code: '<div id="poke-container" className="flex flex-wrap gap-5">',
          say: 'Three utilities. Run the test: green again. Keep the id: the tests use it.',
          notes: [{ match: 'className="flex flex-wrap gap-5"', what: 'display: flex; flex-wrap: wrap; gap: 1.25rem.', why: 'Each class does one thing; the name says what.' }],
        },
      ],
    },
    {
      id: 'f3', title: 'A Tailwind card, with the Pokedex number',
      why: 'A design is many small utilities: size, border, rounding, shadow, spacing. A new feature (the number) gets a test first.',
      steps: [
        {
          id: 'f3s1', file: 'cypress/e2e/home.cy.js', mode: 'append',
          code: "it('shows the Pokedex number on each card', () => {\n  cy.get('#pikachu-card').should('contain', '#25')\n})",
          say: 'New feature, test first: Pikachu is number 25. Run it: red.',
        },
        {
          id: 'f3s2', file: 'src/components/PokeSearch/PokeCard.jsx', mode: 'replace',
          find: '    <div className="card" id={`${pokemon.name}-card`}>\n      <img src={shiny ? pokemon.sprites.front_shiny : pokemon.sprites.front_default} alt={pokemon.name} />\n      <h3>{pokemon.name}</h3>\n      <Button onClick={() => setShiny((shiny) => !shiny)}>{shiny ? \'Make Normal\' : \'Make Shiny\'}</Button>\n      <Button onClick={() => rmData(pokemon.id)}>Remove</Button>\n    </div>',
          code: '    <div id={`${pokemon.name}-card`} className="w-60 rounded-xl border border-slate-200 bg-white p-4 text-center shadow-md">\n      <img className="mx-auto h-32" src={shiny ? pokemon.sprites.front_shiny : pokemon.sprites.front_default} alt={pokemon.name} />\n      <p className="text-sm text-slate-500">Pokédex #{pokemon.id}</p>\n      <h3 className="text-xl font-bold capitalize">{pokemon.name}</h3>\n      <div className="mt-3 flex justify-center gap-2">\n        <Button onClick={() => setShiny((shiny) => !shiny)}>{shiny ? \'Make Normal\' : \'Make Shiny\'}</Button>\n        <Button onClick={() => rmData(pokemon.id)}>Remove</Button>\n      </div>\n    </div>',
          say: 'The same card, styled with utilities, and the number. Run the tests: green.',
          notes: [
            { match: 'className="w-60 rounded-xl border border-slate-200 bg-white p-4 text-center shadow-md"', what: 'Width, rounded corners, a light border, white background, padding, centred text, a shadow.', why: 'Read them left to right: each is one CSS property.' },
            { match: 'capitalize', what: 'text-transform: capitalize: pikachu shows as Pikachu.', why: 'The data stays lowercase (the ids and tests rely on it); only the display changes.' },
          ],
        },
      ],
    },
    {
      id: 'f4', title: 'Style the rest',
      why: 'Heading, Counter, Button and the form get utilities too. The CSS Module goes: one way of styling per app is easier to read.',
      steps: [
        {
          id: 'f4s1', file: 'src/components/Button/Button.jsx', mode: 'set',
          code: "function Button({ children, className = '', ...props }) {\n  return (\n    <button\n      type=\"button\"\n      className={`rounded-md bg-blue-600 px-3 py-1.5 font-semibold text-white hover:bg-blue-700 ${className}`}\n      {...props}\n    >\n      {children}\n    </button>\n  )\n}\n\nexport default Button",
          say: 'Every Button gets the same look. hover: is a state variant: it applies only while the mouse is over it.',
          notes: [{ match: "className = ''", what: 'Lets a parent add its own classes.', why: 'The extra classes are added after ours.' }],
        },
        {
          id: 'f4s2', file: 'src/components/Heading/Heading.jsx', mode: 'set',
          code: "import { useState } from 'react'\nimport Button from '../Button'\n\nfunction Heading() {\n  const [heading, setHeading] = useState('Pokemon Project')\n\n  return (\n    <header className=\"flex items-center justify-between rounded-xl bg-slate-800 p-4 text-white\">\n      <h1 className=\"text-3xl font-bold\">{heading}</h1>\n      <Button onClick={() => setHeading('Pokemon Project: Day 2')}>Change Title</Button>\n    </header>\n  )\n}\n\nexport default Heading",
          say: 'A dark header bar. The CSS Module import goes.',
        },
        { id: 'f4s3', file: 'src/components/Heading/heading.module.css', mode: 'delete', say: 'Delete the module file.' },
        {
          id: 'f4s4', file: 'src/components/Counter/Counter.jsx', mode: 'replace',
          find: '    <>\n      <h3>Total Clicks: {count}</h3>\n      <Button onClick={() => setCount((count) => count + 1)}>Click me!</Button>\n    </>',
          code: '    <section className="flex items-center gap-4 rounded-xl bg-white p-4 shadow">\n      <h3 className="text-lg font-semibold">Total Clicks: {count}</h3>\n      <Button onClick={() => setCount((count) => count + 1)}>Click me!</Button>\n    </section>',
          say: 'A white box. The page behind it still changes color.',
        },
        {
          id: 'f4s5', file: 'src/components/PokeSearch/PokeForm.jsx', mode: 'set',
          code: "function PokeForm({ handleSubmit, pokemonName, setPokemonName }) {\n  return (\n    <form className=\"flex items-end gap-3 rounded-xl bg-white p-4 shadow\" onSubmit={(event) => handleSubmit(event)}>\n      <div>\n        <label className=\"block text-sm font-semibold\" htmlFor=\"pokemon-name\">Pokemon Name</label>\n        <input\n          className=\"rounded-md border border-slate-300 px-3 py-1.5 focus:outline-2 focus:outline-blue-600\"\n          id=\"pokemon-name\" type=\"text\" name=\"name\" placeholder=\"pikachu\"\n          value={pokemonName}\n          onChange={(event) => setPokemonName(event.target.value)}\n        />\n      </div>\n      <button className=\"rounded-md bg-emerald-600 px-3 py-1.5 font-semibold text-white hover:bg-emerald-700\" type=\"submit\">Search</button>\n    </form>\n  )\n}\n\nexport default PokeForm",
          say: 'focus: is another state variant: the outline shows while you type.',
        },
        {
          id: 'f4s6', file: 'src/App.jsx', mode: 'replace', find: '    <>\n      <Heading />\n      <Counter />\n      <PokeSearch />\n    </>',
          code: '    <main className="mx-auto max-w-5xl space-y-6 p-6">\n      <Heading />\n      <Counter />\n      <PokeSearch />\n    </main>',
          say: 'A centred column with space between the parts. No background on main, so the counter\'s color still shows. Run the tests: all green.',
          notes: [{ match: 'mx-auto max-w-5xl space-y-6 p-6', what: 'Centre a column up to 64rem wide, with 1.5rem between the children and padding around.', why: 'Layout for the whole page in one line.' }],
        },
        {
          id: 'f4s7', file: 'src/components/PokeSearch/PokeSearch.jsx', mode: 'replace', find: '    <>\n      <PokeForm', code: '    <div className="space-y-6">\n      <PokeForm',
          say: 'PokeSearch keeps its two parts apart too…',
        },
        {
          id: 'f4s8', file: 'src/components/PokeSearch/PokeSearch.jsx', mode: 'replace', find: '      <PokeContainer pokemonList={pokemonList} rmData={rmData} />\n    </>',
          code: '      <PokeContainer pokemonList={pokemonList} rmData={rmData} />\n    </div>',
          say: '…closing the div. Run the tests: 16 green.',
        },
      ],
    },
  ],
})
