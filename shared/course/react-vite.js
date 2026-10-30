// Unit 2 · Lecture 1 · Intro to React + Vite: the Pokemon app starts as the create-vite
// template, gets Docker, then the JSX basics. Follows the curriculum page
// phase-II/04-Front-End/2-react-and-requests/1-react-and-vite.md
// Needs create-vite-react.js loaded first.
Course.register({
  id: 'react-vite',
  label: 'Unit 2 · Lecture 1',
  title: 'React + Vite: Pokemon Project',
  files: { ...CREATE_VITE_REACT },
  assets: { 'src/assets/hero.png': 'shared/course/assets/react-vite/hero.png' },
  features: [
    // ---------------------------------------------------------------- f1
    {
      id: 'f1', title: 'Ready for Docker',
      why: 'Inside a container the dev server must listen on every network interface (--host), or the port we publish can\'t reach it. engines says which Node versions the project needs.',
      steps: [
        {
          id: 'f1s1', file: 'package.json', mode: 'replace', find: '"dev": "vite",', code: '"dev": "vite --host",',
          say: 'npm run dev starts Vite. --host: listen on all interfaces, so Docker\'s published port can reach it.',
          notes: [
            { match: '"dev": "vite --host"', what: 'The dev script: npm run dev runs vite --host.', why: 'By default Vite only listens on localhost inside the container. --host makes it listen on all interfaces, so -p 5173:5173 can reach it.',
              api: { name: 'vite (dev server)', does: 'Serves the app with hot reload while you code.', params: [['--host', 'listen on all network interfaces', 'needed in Docker; not needed when you run Vite directly on your laptop'], ['--port', 'which port (default 5173)', 'leave it at 5173 unless something else uses it']], mistakes: ['Forgetting --host in Docker: the container runs, but http://localhost:5173 says "connection reset".'] } },
          ],
        },
        {
          id: 'f1s2', file: 'package.json', mode: 'insertAfter', find: '"type": "module",',
          code: '  "engines": {\n    "node": "^22.12.0 || ^24.0.0 || >=26.0.0"\n  },',
          say: 'engines documents which Node versions work: Vite 8 and (later) Cypress 16 both need one of these.',
          notes: [
            { match: '"engines"', what: 'The Node versions this project works with.', why: 'Vite 8 needs Node 20.19+ or 22.12+; Cypress 16 (unit 3) needs 22, 24 or 26+. npm warns when your Node does not fit.' },
          ],
        },
      ],
    },
    // ---------------------------------------------------------------- f2
    {
      id: 'f2', title: 'Run it in Docker',
      why: 'The Dockerfile is the recipe for an image with Node and our packages; run_container.sh starts it with our folder mounted, so edits on the laptop show up in the container and the page hot-reloads.',
      steps: [
        {
          id: 'f2s1', file: 'Dockerfile', mode: 'append', code: 'FROM node:24\n\nWORKDIR /app',
          say: 'Start from the official Node 24 image. WORKDIR = the folder inside the container where everything happens.',
          notes: [
            { match: 'FROM node:24', what: 'The base image: Linux with Node 24 and npm installed.', why: 'Node 24 is a long-term-support version that Vite 8 and Cypress 16 both accept.',
              api: { name: 'FROM image:tag', does: 'Picks the image to build on.', params: [['image:tag', 'which image and version', 'node:24 (pin the major version; "latest" changes under you)']], mistakes: ['node:18: Vite 8 refuses to start ("requires Node.js version 20.19+").'] } },
            { match: 'WORKDIR /app', what: 'The working folder inside the image.', why: 'Every later command (COPY, RUN, CMD) runs in /app.' },
          ],
        },
        {
          id: 'f2s2', file: 'Dockerfile', mode: 'append', code: 'COPY . .\n\nRUN npm install',
          say: 'Copy the project in, then install the packages inside the image.',
          notes: [
            { match: 'COPY . .', what: 'Copies the project folder (.) into the working folder (.) of the image.', why: 'npm install needs package.json inside the image. .dockerignore keeps node_modules out.' },
            { match: 'RUN npm install', what: 'Runs while the image is built.', why: 'Installs the Linux versions of the packages inside the image.',
              api: { name: 'RUN command', does: 'Runs a command at build time and saves the result in the image.', params: [['command', 'a shell command', 'install steps: npm install']], mistakes: ['Using RUN to start the server: RUN finishes during the build. Starting is CMD.'] } },
          ],
        },
        {
          id: 'f2s3', file: 'Dockerfile', mode: 'append', code: 'EXPOSE 5173\n\nCMD ["npm", "run", "dev"]',
          say: 'EXPOSE documents the port. CMD = what runs when the container starts: our dev script.',
          notes: [
            { match: 'EXPOSE 5173', what: 'Says the app listens on port 5173.', why: 'Documentation for people and tools; the real connection is -p in docker run.' },
            { match: 'CMD ["npm", "run", "dev"]', what: 'The command the container runs when it starts.', why: 'Starts Vite (with --host from package.json).',
              api: { name: 'CMD ["program", "arg", …]', does: 'The default command when a container starts.', params: [['list of strings', 'the program and its arguments, one per string', '["npm", "run", "dev"]']] } },
          ],
        },
        {
          id: 'f2s4', file: '.dockerignore', mode: 'append', code: 'node_modules\ndist',
          say: 'Keep node_modules out of the image: the image installs its own Linux versions.',
          notes: [{ match: 'node_modules', what: 'Files COPY must skip.', why: 'Your laptop\'s node_modules may hold Mac or Windows binaries that crash in Linux; the image runs npm install itself.' }],
        },
        {
          id: 'f2s5', file: 'run_container.sh', mode: 'append', code: 'docker build -t react-img .',
          say: 'Build the image from the Dockerfile in this folder (the dot) and name it react-img.',
          notes: [{ match: 'docker build -t react-img .', what: 'Builds an image from the Dockerfile in this folder.', why: '-t names it, so docker run can find it.',
            api: { name: 'docker build -t name folder', does: 'Builds an image.', params: [['-t name', 'the image name', 'short and lowercase: react-img'], ['folder', 'where the Dockerfile is', '. = this folder']] } }],
        },
        {
          id: 'f2s6', file: 'run_container.sh', mode: 'append',
          code: 'docker run --rm \\\n  -p 5173:5173 \\\n  -v "$(pwd)":/app \\\n  -v /app/node_modules \\\n  --name react-container \\\n  react-img',
          say: 'One flag per line. Read the table in the notes out loud: each flag has one job.',
          notes: [
            { match: 'docker run --rm', what: 'Starts a container; --rm deletes it when it stops.', why: 'No pile of stopped containers.' },
            { match: '-p 5173:5173', what: 'Connects port 5173 on your laptop to 5173 in the container.', why: 'So http://localhost:5173 reaches Vite.' },
            { match: '-v "$(pwd)":/app', what: 'Mounts this folder into /app in the container.', why: 'Edits on your laptop appear in the container at once: Vite hot-reloads. The quotes keep paths with spaces working.' },
            { match: '-v /app/node_modules', what: 'Keeps the container\'s own node_modules (a separate volume).', why: 'Without it, the mount above would hide the image\'s node_modules with your laptop\'s folder: "vite: not found" or crashes from Mac/Windows binaries.' },
            { match: '--name react-container', what: 'Names the container.', why: 'So you can stop it with docker stop react-container.' },
          ],
        },
      ],
    },
    // ---------------------------------------------------------------- f3
    {
      id: 'f3', title: 'Clean the template',
      why: 'The template is a demo page. We keep the wiring (index.html, main.jsx) and clear the demo, so the page is ours.',
      steps: [
        { id: 'f3s1', file: 'src/index.css', mode: 'set', code: '', say: 'Empty index.css: its styles centre everything and add dark mode we don\'t want.' },
        { id: 'f3s2', file: 'src/App.css', mode: 'set', code: '', say: 'Empty App.css too. We write our own styles.' },
        {
          id: 'f3s3', file: 'src/App.jsx', mode: 'set',
          code: 'function App() {\n  return <h1>Pokemon Project</h1>\n}\n\nexport default App',
          say: 'A component is a function that returns what to show. Watch the page: just our heading.',
          notes: [
            { match: 'function App()', what: 'A React component: a function whose name starts with a capital letter.', why: 'React calls it and draws what it returns. Capital letter = component; lowercase = HTML tag.' },
            { match: 'return <h1>', what: 'JSX: HTML-like syntax inside JavaScript.', why: 'Vite turns it into JavaScript calls that build the page.',
              api: { name: 'JSX', does: 'Describes the page inside JavaScript.', params: [['one root', 'return exactly one element (or a fragment <>…</>)', 'wrap siblings in <>…</>'], ['closed tags', 'every tag closes, even <img />', 'void elements get a slash in JSX']], mistakes: ['Two elements side by side in return without a wrapper: "Adjacent JSX elements must be wrapped".'] } },
            { match: 'export default App', what: 'Makes App the file\'s main export.', why: 'main.jsx imports it: import App from \'./App.jsx\'.' },
          ],
        },
        { id: 'f3s4', file: 'src/assets/react.svg', mode: 'delete', code: '', say: 'Delete the demo logos (and hero.png on your laptop).' },
        { id: 'f3s5', file: 'src/assets/vite.svg', mode: 'delete', code: '', say: 'Nothing imports them any more.' },
        {
          id: 'f3s6', file: 'index.html', mode: 'replace', find: '<title>pokemon-app</title>', code: '<title>Pokemon Project</title>',
          say: 'index.html is the one real HTML page. React draws into its <div id="root">.',
          notes: [{ match: '<title>Pokemon Project</title>', what: 'The browser tab title.', why: 'index.html is the page Vite serves; React fills its #root div.' }],
        },
      ],
    },
    // ---------------------------------------------------------------- f4
    {
      id: 'f4', title: 'Variables in JSX',
      why: 'Curly braces {} put any JavaScript value into the page.',
      steps: [
        {
          id: 'f4s1', file: 'src/App.jsx', mode: 'insertAfter', find: 'function App() {',
          code: '  let message = "Hello Pokemon trainers"',
          say: 'A normal JavaScript variable inside the component.',
          notes: [{ match: 'let message', what: 'A variable inside the component.', why: 'Everything above return is plain JavaScript.' }],
        },
        {
          id: 'f4s2', file: 'src/App.jsx', mode: 'replace', find: '  return <h1>Pokemon Project</h1>',
          code: '  return (\n    <>\n      <h1>Pokemon Project</h1>\n      <p>{message}</p>\n    </>\n  )',
          say: 'Two elements now, so wrap them in a fragment <>. {message} = put the value here.',
          notes: [
            { match: '<>', what: 'A fragment: a wrapper that adds no element to the page.', why: 'JSX must return one root; <> lets two siblings share it without an extra div.' },
            { match: '{message}', what: 'Curly braces: run this JavaScript and show the result.', why: 'How data gets into the page.',
              api: { name: '{ expression }', does: 'Inserts the value of a JavaScript expression.', params: [['expression', 'a value: variable, math, function call, ternary', 'not a statement: no if / for inside {} (use ? : or .map)']], mistakes: ['Writing "message" without braces: the word message appears, not its value.'] } },
            { match: 'return (', what: 'Parentheses around multi-line JSX.', why: 'Without them, a line break after return returns nothing.' },
          ],
        },
      ],
    },
    // ---------------------------------------------------------------- f5
    {
      id: 'f5', title: 'Functions in JSX',
      why: 'Inside {} you can call a function; its return value is shown.',
      steps: [
        {
          id: 'f5s1', file: 'src/App.jsx', mode: 'insertAfter', find: '  let message = "Hello Pokemon trainers"',
          code: '  const sayHello = () => "Hello from a function"',
          say: 'An arrow function that returns a string.',
          notes: [{ match: 'const sayHello', what: 'A function inside the component.', why: 'Components can hold helper functions; later, event handlers live here too.' }],
        },
        {
          id: 'f5s2', file: 'src/App.jsx', mode: 'insertAfter', find: '      <p>{message}</p>',
          code: '      <p>{sayHello()}</p>',
          say: 'Call it inside {}: the brackets () run it and its result is shown.',
          notes: [{ match: '{sayHello()}', what: 'Calls the function and shows what it returns.', why: 'With () it runs now. Without () you hand over the function (that is what onClick wants later).' }],
        },
      ],
    },
    // ---------------------------------------------------------------- f6
    {
      id: 'f6', title: 'className',
      why: 'class is a reserved word in JavaScript, so JSX uses className. Importing the CSS file applies it.',
      steps: [
        {
          id: 'f6s1', file: 'src/App.css', mode: 'append', code: '.myText {\n  font-size: 50px;\n}',
          say: 'A class rule in App.css. Nothing changes yet: App.jsx does not use it, and does not import the file.',
          notes: [{ match: '.myText {', what: 'A class selector, like in lecture 1.', why: 'Any element with className="myText" gets it.' }],
        },
        {
          id: 'f6s2', file: 'src/App.jsx', mode: 'replace', find: 'function App() {', code: "import './App.css'\n\nfunction App() {",
          say: 'Import the CSS file. Vite adds its styles to the page.',
          notes: [{ match: "import './App.css'", what: 'Imports a CSS file into the component file.', why: 'Vite puts the CSS on the page. Without this line the rules in App.css do nothing.',
            api: { name: "import './file.css'", does: 'Loads a stylesheet (Vite feature).', params: [['path', 'relative to this file', "'./App.css' = next to App.jsx"]], mistakes: ['Leaving the import out: className is right but nothing changes.'] } }],
        },
        {
          id: 'f6s3', file: 'src/App.jsx', mode: 'replace', find: '<p>{message}</p>', code: '<p className="myText">{message}</p>',
          say: 'className, not class. Now the message is big.',
          notes: [{ match: 'className="myText"', what: 'The CSS class of an element, written className in JSX.', why: 'class is a JavaScript keyword, so React uses the DOM property name className.',
            api: { name: 'className', does: 'Sets the element\'s class attribute.', params: [['"names"', 'one or more class names, space-separated', 'the same names as your CSS selectors, without the dot']], mistakes: ['class="…": React warns "Invalid DOM property `class`. Did you mean `className`?"; use className.'] } }],
        },
      ],
    },
    // ---------------------------------------------------------------- f7
    {
      id: 'f7', title: 'Inline styles',
      why: 'In JSX, style takes a JavaScript object: outer {} = "JavaScript here", inner {} = the object.',
      steps: [
        {
          id: 'f7s1', file: 'src/App.jsx', mode: 'replace', find: '<p className="myText">{message}</p>',
          code: '<p className="myText" style={{ color: "red" }}>{message}</p>',
          say: 'Double braces: JavaScript, then an object. Property names are camelCase, values are strings.',
          notes: [{ match: 'style={{', what: 'An inline style written as a JavaScript object.', why: 'Quick one-off styles; most styling stays in CSS files.',
            api: { name: 'style={{ property: "value" }}', does: 'Sets inline CSS.', params: [['property', 'camelCase CSS name', 'backgroundColor, fontSize (not background-color)'], ['value', 'a string (or a number for px)', '"red", "2rem", 16']], mistakes: ['style="color: red": JSX needs an object, React throws an error.'] } }],
        },
      ],
    },
  ],
})
