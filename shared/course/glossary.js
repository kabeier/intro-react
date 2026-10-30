// Explanations for lines no step explains itself: boilerplate (templates and config files) and
// common code patterns. The Code Explorer shows these when a line has no note of its own, so a
// curious student can click any line and learn what it does. Rules run in order; the first match wins.
;(function (root) {
  const C = root.Course
  const n = (what, why, extra) => ({ what, why, ...(extra || {}) })
  const q = (s) => String(s).replace(/^['"`]|['"`]$/g, '')
  const isTest = /\.cy\.jsx?$/
  const isJs = /\.(jsx?|mjs)$/
  const CONFIG = /(^|\/)(package\.json|package-lock\.json|vite\.config\.js|cypress\.config\.js|\.oxlintrc\.json|eslint\.config\.js|index\.html|\.gitignore|\.dockerignore|Dockerfile|run_container\.sh|src\/main\.jsx|.*\.svg)$/
  // Boilerplate = setup code from a template or a tool, not something we designed.
  const boiler = (file, own) => CONFIG.test(file) || !own

  // ---------- small dictionaries ----------
  const TAG = {
    html: 'the whole page', head: 'page settings the visitor doesn\'t see (title, styles, scripts)', body: 'everything the visitor sees',
    div: 'a box that groups other elements (no meaning of its own)', section: 'a section of the page (a group of related content)',
    main: 'the main content of the page', header: 'the top part of the page or of a section', nav: 'a group of navigation links', footer: 'the bottom part of the page',
    h1: 'the main heading', h2: 'a second-level heading', h3: 'a third-level heading', p: 'a paragraph of text', span: 'a piece of text inside a line',
    ul: 'a bulleted list', ol: 'a numbered list', li: 'one item of a list', a: 'a link', img: 'an image', button: 'a button',
    form: 'a form (inputs that are submitted together)', label: 'the text label of a form field', input: 'a box the user types into', code: 'code-styled text',
    svg: 'an SVG (vector) drawing', use: 'reuses an SVG icon defined elsewhere (by its #id)', title: 'the text in the browser tab', meta: 'information about the page for the browser',
    link: 'a link to another file the page needs (here an icon or stylesheet)', script: 'loads JavaScript', strong: 'important (bold) text', em: 'emphasised (italic) text',
    table: 'a table', tr: 'a table row', td: 'a table cell', th: 'a table heading cell', article: 'a self-contained piece of content', aside: 'side content',
  }
  const LIB = {
    'Card': ['React Bootstrap', 'a card: a bordered box for one item'], 'Card.Body': ['React Bootstrap', 'the padded inside of a card'], 'Card.Img': ['React Bootstrap', 'the card\'s picture'],
    'Card.Title': ['React Bootstrap', 'the card\'s title'], 'Badge': ['React Bootstrap', 'a small coloured label'], 'Stack': ['React Bootstrap', 'lays its children out in a row or column with a gap'],
    'BsButton': ['React Bootstrap (imported as BsButton)', 'a styled button; variant picks the colour'], 'Spinner': ['React Bootstrap', 'a loading spinner'],
    'Navbar': ['React Bootstrap', 'the navigation bar across the top'], 'Navbar.Brand': ['React Bootstrap', 'the app name on the left of the navbar'], 'Nav': ['React Bootstrap', 'a group of navbar links'],
    'Nav.Link': ['React Bootstrap', 'one navbar link'], 'Form': ['React Bootstrap', 'a styled <form>'], 'Form.Group': ['React Bootstrap', 'one field of the form (label + input)'],
    'Form.Label': ['React Bootstrap', 'the field\'s label'], 'Form.Control': ['React Bootstrap', 'the field\'s input box'],
    'Link': ['React Router', 'a link inside the app: changes the page without a reload'], 'Outlet': ['React Router', 'where the current page is drawn inside the layout'],
    'RouterProvider': ['React Router', 'runs the router and draws the page that matches the URL'], 'StrictMode': ['React', 'extra checks in development (runs effects twice to find bugs)'],
  }
  const ATTR = {
    className: 'sets CSS classes (the HTML class attribute; class is a JavaScript keyword)', id: 'a unique name: CSS (#id) and tests (cy.get(\'#id\')) find the element by it',
    alt: 'text that describes the image (read by screen readers, shown if the image fails)', src: 'where the image comes from', href: 'where the link goes',
    target: '_blank opens the link in a new tab', type: 'the kind of button or input', onClick: 'runs a function when clicked', onChange: 'runs on every change of the input',
    onSubmit: 'runs when the form is submitted', value: 'what the input shows (a controlled input)', placeholder: 'grey hint text shown while the box is empty',
    name: 'the field\'s name (used when a form is submitted)', htmlFor: 'connects the label to the input with that id (the for attribute)', key: 'tells React which list item is which',
    role: 'tells screen readers what the element is', 'aria-hidden': 'hides the element from screen readers (decoration only)', 'aria-label': 'a name for screen readers',
    width: 'the width in pixels', height: 'the height in pixels', style: 'inline CSS, written as a JavaScript object', to: 'the path the router link goes to',
    as: 'renders the library component as another component (here a router Link)', variant: 'the Bootstrap colour/style', bg: 'the Bootstrap background colour', gap: 'the space between items',
    direction: 'row (horizontal) or column', controlId: 'gives the input this id and links the label to it', size: 'the size (sm = small)', context: 'a value passed to the page the Outlet draws',
    router: 'the router to run', 'data-bs-theme': 'Bootstrap colour mode (dark = light text)',
  }
  const CSS = {
    color: 'text colour', background: 'background colour or image', 'background-color': 'background colour', padding: 'space inside the border', margin: 'space outside the border',
    'margin-top': 'space above', 'margin-bottom': 'space below', border: 'the border (width, style, colour)', 'border-radius': 'rounded corners', 'border-top': 'the top border',
    'border-bottom': 'the bottom border', 'border-right': 'the right border', 'border-color': 'border colour', 'border-inline': 'left and right borders', 'border-left-color': 'left border colour',
    'border-right-color': 'right border colour', width: 'the width', height: 'the height', 'max-width': 'the widest it may get', 'min-height': 'the shortest it may get',
    display: 'how the element is laid out (block, flex, grid, none…)', 'flex-direction': 'row or column for flex children', 'flex-wrap': 'whether flex children wrap to a new line',
    flex: 'how a flex child grows and shrinks', 'flex-grow': 'how much a flex child grows', gap: 'space between flex/grid children', 'align-items': 'vertical alignment of flex children',
    'justify-content': 'horizontal spacing of flex children', 'place-items': 'centres grid/flex items (both directions)', 'place-content': 'centres the content block (both directions)',
    'text-align': 'left / centre / right text', 'font-family': 'the font', 'font-size': 'text size', 'font-weight': 'how bold', font: 'several font settings at once',
    'line-height': 'space between lines of text', 'letter-spacing': 'space between letters', 'text-decoration': 'underline (or none)', 'list-style': 'the bullet style of a list',
    position: 'how the element is placed (relative, absolute, fixed…)', top: 'distance from the top (for positioned elements)', left: 'distance from the left', right: 'distance from the right',
    'inset-inline': 'distance from the left and right', 'z-index': 'which element is on top when they overlap', transition: 'animates changes smoothly', transform: 'moves, scales or rotates the element',
    'box-shadow': 'a shadow around the box', opacity: 'transparency', filter: 'visual effects (blur, drop-shadow…)', outline: 'a line outside the border (e.g. keyboard focus)',
    'outline-offset': 'space between the outline and the element', 'box-sizing': 'whether width includes padding and border', content: 'text for ::before/::after (often empty)',
    'color-scheme': 'tells the browser light/dark mode is supported', 'font-synthesis': 'stops the browser faking bold/italic', 'text-rendering': 'how the browser draws text',
    '-webkit-font-smoothing': 'smoother text on Mac (Safari/Chrome)', '-moz-osx-font-smoothing': 'smoother text on Mac (Firefox)', cursor: 'the mouse pointer shape', overflow: 'what happens when content is too big',
  }
  const PKG = {
    react: 'React itself', 'react-dom': 'React for web pages (draws to the DOM)', axios: 'makes HTTP requests (to the PokeAPI)', vite: 'the dev server and build tool',
    '@vitejs/plugin-react': 'lets Vite understand JSX and fast-refresh React', oxlint: 'the linter (finds mistakes in the code)', cypress: 'the end-to-end test runner',
    '@types/react': 'type hints for React (editor autocomplete)', '@types/react-dom': 'type hints for react-dom', tailwindcss: 'Tailwind CSS (utility classes)',
    '@tailwindcss/vite': 'the Vite plugin that builds Tailwind\'s CSS', bootstrap: 'Bootstrap\'s CSS', 'react-bootstrap': 'Bootstrap\'s components for React',
    'react-router': 'React Router (pages and URLs)', 'gh-pages': 'publishes dist/ to the gh-pages branch',
  }
  const SCRIPT = {
    dev: 'starts the Vite dev server (--host makes it reachable from outside Docker)', build: 'builds the production files into dist/', lint: 'runs the linter',
    preview: 'serves the built dist/ folder to check it before deploying', 'cy:open': 'opens Cypress with its window, to watch tests run', 'cy:run': 'runs every Cypress test in the terminal',
    predeploy: 'runs automatically before deploy: builds first', deploy: 'publishes dist/ to GitHub Pages with gh-pages',
  }
  const YAML = {
    name: 'the name shown in the Actions tab', on: 'which events start this workflow', push: 'start on a push', pull_request: 'start when a pull request is opened or updated',
    workflow_dispatch: 'adds a "Run workflow" button to start it by hand', branches: 'only for these branches', permissions: 'what the workflow\'s token may do',
    contents: 'access to the repository\'s files (read or write)', jobs: 'the jobs to run (each on its own machine)', 'runs-on': 'the kind of machine (ubuntu-latest = Linux)',
    steps: 'the steps of the job, in order', with: 'settings for the action above', 'node-version': 'which Node.js version to install', cache: 'reuse downloaded npm packages between runs',
    install: 'whether the Cypress action installs packages (we already ran npm ci)', start: 'the command that starts the server before testing', 'wait-on': 'wait until this address answers',
    config: 'Cypress settings for this run', workflow_run: 'start when another workflow finishes', workflows: 'which workflow to wait for', types: 'which kind of event (completed = finished)',
    concurrency: 'never run two of these at once', group: 'the name of the queue', 'cancel-in-progress': 'false = let a running deploy finish', if: 'only run when this condition is true',
    env: 'environment variables for this step', ref: 'which commit to check out', run: 'shell commands to run',
  }

  // ---------- rules ----------
  // Rules without their own boilerplate setting: config files and template lines are boilerplate.
  const register = (rules) => C.registerGlossary(rules.map((r) => (r.boilerplate === undefined ? { ...r, boilerplate: boiler } : r)))
  register([
    // SVG files and inline SVG data
    { file: /\.svg$/, line: /./, boilerplate: true, note: () => n('SVG drawing data: the shapes and colours of this image, written as XML.', 'Images can be code. The browser draws it at any size without getting blurry. Nobody writes this by hand.') },

    // ----- comments, any language -----
    { file: /\.(jsx?|mjs|css)$/, line: /^\/\/\s?(.*)$|^\/\*(.*?)\*?\/?$/, boilerplate: boiler, note: (m) => n(`A comment: "${(m[1] || m[2] || '').trim()}"`, 'Comments are notes for people. The computer skips them.') },
    { file: /(\.ya?ml|\.gitignore|\.dockerignore|Dockerfile|\.sh)$/, line: /^#\s?(.*)$/, boilerplate: boiler, note: (m) => n(`A comment: "${m[1]}"`, 'Lines starting with # are notes for people; the tool skips them.') },

    // ----- .gitignore / .dockerignore -----
    { file: /\.gitignore$/, line: /^!(.+)$/, boilerplate: true, note: (m) => n(`Do NOT ignore ${m[1]} (the ! makes an exception).`, 'This file is shared on purpose (e.g. recommended editor extensions).') },
    { file: /\.gitignore$/, line: /^(.+)$/, boilerplate: true, note: (m) => n(`Git ignores files and folders matching ${m[1]}.`, /node_modules/.test(m[1]) ? 'node_modules is huge and npm install recreates it: never commit it.' : /dist/.test(m[1]) ? 'dist is built output: npm run build recreates it.' : /log/.test(m[1]) ? 'Log files are noise from running tools.' : /cypress/.test(m[1]) ? 'Cypress writes screenshots and videos here on failures: not code.' : 'Editor and system files that belong to one computer, not to the project.') },
    { file: /\.dockerignore$/, line: /^(.+)$/, boilerplate: true, note: (m) => n(`Docker does not copy ${m[1]} into the image.`, 'The image installs its own packages and builds its own output; copying these would be slow and could clash.') },

    // ----- Dockerfile / shell -----
    { file: /Dockerfile$/, line: /^FROM\s+(\S+)/, boilerplate: true, note: (m) => n(`Start from the ${m[1]} image (Linux with Node.js installed).`, 'Everyone gets the same Node version.') },
    { file: /Dockerfile$/, line: /^WORKDIR\s+(\S+)/, boilerplate: true, note: (m) => n(`Work in the folder ${m[1]} inside the container.`, 'Later commands run there.') },
    { file: /Dockerfile$/, line: /^COPY\s+(.+)/, boilerplate: true, note: (m) => n(`Copy files into the image: ${m[1]}.`, 'The project files must be inside the container to install and run them.') },
    { file: /Dockerfile$/, line: /^RUN\s+(.+)/, boilerplate: true, note: (m) => n(`Run ${m[1]} while building the image.`, 'Installs the packages once, when the image is built.') },
    { file: /Dockerfile$/, line: /^EXPOSE\s+(\d+)/, boilerplate: true, note: (m) => n(`Says the container listens on port ${m[1]}.`, 'Vite\'s dev server uses 5173.') },
    { file: /Dockerfile$/, line: /^CMD\s+(.+)/, boilerplate: true, note: (m) => n(`The command that runs when the container starts: ${m[1]}.`, 'Starts the dev server.') },
    { file: /\.sh$/, line: /^docker build/, boilerplate: true, note: () => n('Builds the Docker image from the Dockerfile and names it.', 'Rebuild after installing new packages.') },
    { file: /\.sh$/, line: /^docker run/, boilerplate: true, note: () => n('Starts a container from the image (the lines below are its options).', 'Runs the app inside Docker.') },
    { file: /\.sh$/, line: /^--rm/, boilerplate: true, note: () => n('Delete the container when it stops.', 'No old containers pile up.') },
    { file: /\.sh$/, line: /^-p\s+(\S+)/, boilerplate: true, note: (m) => n(`Connect port ${m[1]} (laptop:container).`, 'So localhost:5173 on your laptop reaches the app.') },
    { file: /\.sh$/, line: /^-v\s+"?\$\(pwd\)"?:/, boilerplate: true, note: () => n('Share this folder with the container.', 'Edits on your laptop show up in the running app.') },
    { file: /\.sh$/, line: /^-v\s+\/app\/node_modules/, boilerplate: true, note: () => n('Keep the container\'s own node_modules.', 'Your laptop\'s folder must not hide the packages installed in the image.') },
    { file: /\.sh$/, line: /^--name\s+(\S+)/, boilerplate: true, note: (m) => n(`Name the container ${m[1]}.`, 'Easy to find with docker ps or stop by name.') },
    { file: /\.sh$/, line: /^([\w-]+)$/, boilerplate: true, note: (m) => n(`The image to run: ${m[1]}.`, 'The name given by docker build -t.') },

    // ----- index.html -----
    { file: /index\.html$/, line: /^<!doctype html>/i, boilerplate: true, note: () => n('Tells the browser this is a modern HTML page.', 'Without it, browsers use an old "quirks" mode.') },
    { file: /index\.html$/, line: /^<html lang="(\w+)"/, boilerplate: true, note: (m) => n(`The start of the page, in language "${m[1]}".`, 'Screen readers and translators use the language.') },
    { file: /index\.html$/, line: /^<meta charset/, boilerplate: true, note: () => n('The text encoding: UTF-8 (every language and emoji).', 'Characters like é and ✓ show correctly.') },
    { file: /index\.html$/, line: /^<meta name="viewport"/, boilerplate: true, note: () => n('Makes the page fit phone screens.', 'Without it, phones show a tiny zoomed-out desktop page.') },
    { file: /index\.html$/, line: /^<link rel="icon"/, boilerplate: true, note: () => n('The small icon in the browser tab.', 'Comes from public/favicon.svg.') },
    { file: /index\.html$/, line: /^<title>(.*)<\/title>/, boilerplate: true, note: (m) => n(`The text in the browser tab: "${m[1]}".`, 'Also used for bookmarks and search results.') },
    { file: /index\.html$/, line: /^<div id="root"><\/div>/, boilerplate: true, note: () => n('The empty box React draws the whole app into.', 'main.jsx finds it with document.getElementById(\'root\').') },
    { file: /index\.html$/, line: /^<script type="module" src="([^"]+)"/, boilerplate: true, note: (m) => n(`Loads ${m[1]}, the start of the app.`, 'type="module" lets the file use import; Vite serves it.') },

    // ----- package.json -----
    { file: /package\.json$/, line: /^"(name)": "([^"]+)"/, boilerplate: true, note: (m) => n(`The project's name: ${m[2]}.`, 'npm needs a name; it is not published anywhere (private).') },
    { file: /package\.json$/, line: /^"private": true/, boilerplate: true, note: () => n('Marks the project as private.', 'npm refuses to publish it to the npm registry by accident.') },
    { file: /package\.json$/, line: /^"version": "([^"]+)"/, boilerplate: true, note: (m) => n(`The project's version: ${m[1]}.`, 'Only matters for published packages.') },
    { file: /package\.json$/, line: /^"type": "module"/, boilerplate: true, note: () => n('Files use import/export (ES modules).', 'Instead of the older require().') },
    { file: /package\.json$/, line: /^"engines": \{/, boilerplate: true, note: () => n('Which Node.js versions the project needs.', 'npm warns when your Node is too old.') },
    { file: /package\.json$/, line: /^"node": "([^"]+)"/, boilerplate: true, note: (m) => n(`Allowed Node.js versions: ${m[1]}.`, 'Vite 8 needs Node 20.19+ or 22.12+; we use 24.') },
    { file: /package\.json$/, line: /^"scripts": \{/, boilerplate: true, note: () => n('Shortcuts you run with npm run <name>.', 'npm run dev, npm run build…') },
    { file: /package\.json$/, line: /^"dependencies": \{/, boilerplate: true, note: () => n('Packages the app needs to run.', 'npm install puts them in node_modules.') },
    { file: /package\.json$/, line: /^"devDependencies": \{/, boilerplate: true, note: () => n('Packages needed only while developing (build tools, linters, test runners).', 'They are not part of the built site.') },
    { file: /package\.json$/, line: /^"([\w:-]+)": "([^"]+)",?$/, boilerplate: true, note: (m) => SCRIPT[m[1]] ? n(`npm run ${m[1]}: ${m[2]}`, SCRIPT[m[1]]) : null },
    { file: /package\.json$/, line: /^"(@?[\w./-]+)": "(\^?[\d.]+)",?$/, boilerplate: true, note: (m) => n(`The package ${m[1]}, version ${m[2]}${m[2].startsWith('^') ? ' (^ = this version or a newer one with the same first number)' : ''}.`, PKG[m[1]] ? `It is ${PKG[m[1]]}.` : 'Installed by npm install.') },

    // ----- other JSON (fixtures, linter config) -----
    { file: /fixtures\/.*\.json$/, line: /^"(\w+)": (.+?),?$/, note: (m) => n(`In the fake API answer: ${m[1]} = ${m[2]}.`, 'Fixtures copy the shape of the real PokeAPI answer, so the app behaves the same in tests, every time.') },
    { file: /\.oxlintrc\.json$/, line: /^"\$schema"/, boilerplate: true, note: () => n('Points the editor at the list of allowed settings.', 'Your editor can autocomplete and check this file.') },
    { file: /\.oxlintrc\.json$/, line: /^"plugins"/, boilerplate: true, note: () => n('Turns on the linter\'s React and general-JavaScript rule sets.', 'React rules catch hook and component mistakes.') },
    { file: /\.oxlintrc\.json$/, line: /^"rules"/, boilerplate: true, note: () => n('Individual rules and how strict they are.', '"error" fails the lint, "warn" only warns.') },
    { file: /\.oxlintrc\.json$/, line: /^"react\/rules-of-hooks"/, boilerplate: true, note: () => n('Error if a hook is called in the wrong place (inside if, loops, or non-components).', 'Hooks must run in the same order every render.') },
    { file: /\.oxlintrc\.json$/, line: /^"react\/only-export-components"/, boilerplate: true, note: () => n('Warn when a component file exports other things.', 'Fast refresh (instant updates) works best with component-only files.') },
    { file: /\.oxlintrc\.json$/, line: /"files": \["cypress/, boilerplate: true, note: () => n('For test files: allow Cypress\'s globals (cy, Cypress) and test words (it, beforeEach).', 'Otherwise the linter reports them as undefined.') },
    { file: /\.oxlintrc\.json$/, line: /^"(overrides|ignorePatterns|env|globals)"/, boilerplate: true, note: (m) => n(`Linter setting "${m[1]}".`, 'Adjusts which files or names the rules apply to.') },

    // ----- workflow YAML -----
    { file: /\.ya?ml$/, line: /^- uses: ([\w./-]+)@(v\d+)/, boilerplate: true, note: (m) => n(`Use the ready-made action ${m[1]}, version ${m[2]}.`, m[1].includes('checkout') ? 'The machine starts empty: this gets your code.' : m[1].includes('setup-node') ? 'Installs Node.js on the machine.' : m[1].includes('cypress') ? 'Starts the server, waits for it, and runs Cypress.' : 'Someone else wrote this step; we only configure it.') },
    { file: /\.ya?ml$/, line: /^(?:- )?uses: ([\w./-]+)@(v\d+)/, boilerplate: true, note: (m) => n(`Use the ready-made action ${m[1]}, version ${m[2]}.`, 'Someone else wrote this step; with: configures it.') },
    { file: /\.ya?ml$/, line: /^- run: (.+)$/, boilerplate: true, note: (m) => n(`A step that runs the command: ${m[1]}`, m[1].includes('lint') ? 'Fails the run on lint errors.' : m[1].includes('build') ? 'Fails the run if the app does not build.' : 'Same command you run on your laptop.') },
    { file: /\.ya?ml$/, line: /^- name: (.+)$/, boilerplate: true, note: (m) => n(`A step named "${m[1]}".`, 'The name shows in the run\'s log.') },
    { file: /\.ya?ml$/, line: /^([\w-]+):\s*(.*)$/, boilerplate: true, note: (m) => YAML[m[1]] ? n(`${m[1]}${m[2] ? ': ' + m[2] : ''}: ${YAML[m[1]]}.`, 'Workflow files are YAML: keys, values, and indentation for nesting.') : n(`${m[1]}:${m[2] ? ' ' + m[2] : ''}: ${m[2] ? 'a setting' : 'the name of a job (or a group of settings below it)'}.`, 'Workflow files are YAML: keys, values, and indentation for nesting.') },
    { file: /\.ya?ml$/, line: /^git config user\.(name|email)/, boilerplate: true, note: (m) => n(`Sets the git ${m[1]} for the commit gh-pages makes.`, 'A bot identity, so no personal details are used.') },
    { file: /\.ya?ml$/, line: /^npx gh-pages/, boilerplate: true, note: () => n('Publishes dist/ to the gh-pages branch, signing in with the run\'s token.', 'Same as npm run deploy, but from GitHub.') },

    { file: /\.json$/, line: /^[\[\]{}],?$/, boilerplate: (file) => !/fixtures/.test(file), note: (m, t) => n(t.startsWith('{') || t.startsWith('[') ? 'Opens the JSON object (or list) that holds everything below.' : 'Closes the JSON object (or list) opened above.', 'JSON is data written like a JavaScript object: keys in "double quotes".') },
    { file: /index\.html$/, line: /^<\/?(html|head|body)>$/, boilerplate: true, note: (m, t) => n(`${t.startsWith('</') ? 'Ends' : 'Starts'} the <${m[1]}>: ${TAG[m[1]]}.`, 'Every HTML page has html, head and body.') },
    // ----- config JS files -----
    { file: /(vite|cypress)\.config\.js$/, line: /^export default defineConfig/, boilerplate: true, note: () => n('Exports the settings, wrapped in defineConfig.', 'defineConfig gives your editor autocomplete for the settings.') },
    { file: /vite\.config\.js$/, line: /^import (\w+) from '([^']+)'/, boilerplate: true, note: (m) => n(`Imports ${m[1]} from ${m[2]}.`, 'Used in the settings below.') },
    { file: /vite\.config\.js$/, line: /^plugins: \[(.+)\],?$/, boilerplate: true, note: (m) => n(`Vite's plugins: ${m[1]}.`, 'react() lets Vite understand JSX; tailwindcss() builds the Tailwind CSS.') },
    { file: /vite\.config\.js$/, line: /^base: (.+),$/, boilerplate: true, note: (m) => n(`The folder the built app lives in: ${m[1]}.`, 'GitHub Pages serves the app under /<repo>/; the dev server stays at /.') },
    { file: /cypress\.config\.js$/, line: /^(e2e|viewportWidth|viewportHeight):?\s*(.*)$/, boilerplate: true, note: (m) => n(`${m[1]}${m[2] ? ' ' + m[2] : ''}: ${m[1] === 'e2e' ? 'settings for end-to-end tests' : 'the size of the test browser window, in pixels'}.`, 'Cypress reads this file when it starts.') },

    // ----- CSS -----
    { file: /\.css$/, line: /^@import\s+["']?tailwindcss["']?(.*);/, note: (m) => n(`Loads Tailwind CSS${m[1].includes('important') ? ' with every utility marked !important' : ''}.`, 'The Vite plugin turns this line into the CSS for the classes you use.') },
    { file: /\.css$/, line: /^@media \(prefers-color-scheme: dark\)/, boilerplate: boiler, note: () => n('These rules apply only when the computer is in dark mode.', 'The page follows the visitor\'s light/dark setting.') },
    { file: /\.css$/, line: /^@media \((max|min)-width: ([\w.]+)\)/, boilerplate: boiler, note: (m) => n(`These rules apply only when the screen is ${m[1] === 'max' ? 'at most' : 'at least'} ${m[2]} wide.`, 'Responsive design: a different layout for small or large screens.') },
    { file: /\.css$/, line: /^:root \{/, boilerplate: boiler, note: () => n('Rules for the whole page (the <html> element).', 'A good place for CSS variables used everywhere.') },
    { file: /\.css$/, line: /^(--[\w-]+):$/, boilerplate: boiler, note: (m) => n(`A CSS variable ${m[1]}; its value is on the next lines.`, `Other rules use it with var(${m[1]}).`) },
    { file: /\.css$/, line: /^(--[\w-]+):\s*(.+?);?$/, boilerplate: boiler, note: (m) => n(`A CSS variable ${m[1]} = ${m[2]}.`, `Other rules use it with var(${m[1]}), so changing it here changes it everywhere.`) },
    { file: /\.css$/, line: /^&(:hover|:focus-visible|::before|::after|\s*>\s*\w+)/, boilerplate: boiler, note: (m) => n(`Nested rule: the same element ${m[1].includes('hover') ? 'while the mouse is over it' : m[1].includes('focus') ? 'when it has keyboard focus' : m[1].includes('before') ? '(a decoration drawn before its content)' : m[1].includes('after') ? '(a decoration drawn after its content)' : '(its direct children)'}.`, '& means "the element of the rule around this one" (CSS nesting).') },
    { file: /\.css$/, line: /^([-\w]+):\s*(.+?);?$/, boilerplate: boiler, note: (m) => CSS[m[1]] ? n(`${m[1]}: ${m[2]}. Controls ${CSS[m[1]]}.`, 'One CSS property: a name and a value.') : n(`${m[1]}: ${m[2]}. Sets the CSS property ${m[1]}.`, 'One CSS property: a name and a value. MDN explains every property.') },
    { file: /\.css$/, line: /^([^{}]+?),$/, boilerplate: boiler, note: (m) => n(`${m[1]}, and the next selector: the rule below applies to both.`, 'A comma lists several selectors for one rule.') },
    { file: /\.css$/, line: /^([^{}]+?)\s*\{$/, boilerplate: boiler, note: (m) => n(`Starts a CSS rule for ${selector(m[1].trim())}.`, 'The properties inside { } apply to every element the selector matches.') },
    { file: /\.css$/, line: /^\}$/, boilerplate: boiler, note: () => n('Ends the CSS rule.', 'Every { needs its }.') },
    { file: /\.css$/, line: /^[\w(),.\s%-]+;$/, boilerplate: boiler, note: () => n('The rest of the value from the line above (one value written over several lines).', 'Long values are easier to read split up.') },

    // ----- Cypress tests -----
    { file: isTest, line: /^beforeEach\(\(\) => \{/, note: () => n('Code that runs before every test in this file.', 'Each test starts from the same place (a fresh visit, the same stubs).') },
    { file: isTest, line: /^it\((['"`])(.+)\1, \(\) => \{/, note: (m) => n(`Starts the test "${m[2].replace(/\\'/g, "'")}".`, 'The name says what must be true; the lines inside check it.') },
    { file: isTest, line: /^\}\)$/, note: () => n('Ends the test (or the beforeEach) opened above.', 'Closes the function and the it(…) call.') },
    { file: isTest, line: /^const alerts = \[\]$/, note: () => n('An empty list to collect every alert text.', 'Then the test can check the list, which fails if no alert ever came.') },
    { file: isTest, line: /^cy\./, note: (m, t) => cyExplain(t) },

    // ----- JS / JSX -----
    { file: isJs, line: /^\/\/ (.*)$/, note: (m) => n(`A comment: "${m[1]}"`, 'Comments are notes for people. The computer skips them.') },
    { file: isJs, line: /^import ['"](.+\.css)['"]$/, boilerplate: boiler, note: (m) => n(`Loads the stylesheet ${m[1]}.`, 'Vite adds its CSS to the page.') },
    { file: isJs, line: /^import (\w+) from ['"](.+\.(png|svg|jpe?g|gif))['"]$/, boilerplate: boiler, note: (m) => n(`Imports the image ${m[2]}; ${m[1]} becomes its URL.`, `Use it as <img src={${m[1]}} />. Vite handles the file.`) },
    { file: isJs, line: /^import \{ ([^}]+) \} from ['"]([^'"]+)['"]$/, boilerplate: boiler, note: (m) => n(`Imports ${m[1]} from ${m[2].startsWith('.') ? 'the file ' + m[2] : 'the package ' + m[2]}.`, 'Named imports: the names must match what that file exports. Each file imports what it uses.') },
    { file: isJs, line: /^import (\w+) from ['"]([^'"]+)['"]$/, boilerplate: boiler, note: (m) => n(`Imports ${m[1]} (the default export) from ${m[2].startsWith('.') ? 'the file ' + m[2] : 'the package ' + m[2]}.`, m[2].startsWith('.') ? 'Our own file. A folder path loads its index.js.' : (PKG[m[2].split('/')[0]] ? `${PKG[m[2].split('/')[0]]}.` : 'An installed package.')) },
    { file: isJs, line: /^export \{ default \} from ['"](.+)['"]$/, note: (m) => n(`Passes on the default export of ${m[1]}.`, 'Importing the folder loads this index.js, so imports stay short.') },
    { file: isJs, line: /^export default (\w+)$/, boilerplate: boiler, note: (m) => n(`Makes ${m[1]} this file's default export.`, 'Other files import it with import ' + m[1] + ' from \'…\'.') },
    { file: isJs, line: /^function ([A-Z]\w*)\((.*)\) \{$/, boilerplate: boiler, note: (m) => n(`Starts the ${m[1]} component: a function that returns JSX${m[2] ? ' and receives the props ' + m[2] : ''}.`, 'Component names start with a capital letter, so <' + m[1] + ' /> means this component.') },
    { file: isJs, line: /^function (\w+)\((.*)\) \{$/, note: (m) => n(`Starts the function ${m[1]}(${m[2]}).`, 'Code inside runs each time it is called.') },
    { file: isJs, line: /^const \[(\w+), (set\w+)\] = useState\((.*)\)$/, note: (m) => n(`State: ${m[1]} starts as ${m[3] || 'undefined'}; ${m[2]} changes it.`, `Calling ${m[2]} makes React draw the component again with the new ${m[1]}.`) },
    { file: isJs, line: /^const \{ (.+) \} = (use\w+)\(\)$/, note: (m) => n(`Takes ${m[1]} out of ${HOOK[m[2]] || 'what ' + m[2] + '() returns'}.`, 'Destructuring: pick names out of an object.') },
    { file: isJs, line: /^const (\w+) = (use\w+)\((.*)\)$/, note: (m) => n(`${m[1]} = ${HOOK[m[2]] || 'the result of the ' + m[2] + ' hook'} (from ${m[2]}).`, 'Hooks are functions starting with use; call them at the top of a component, never inside if or loops.') },
    { file: isJs, line: /^const (\w+) = (?:async )?\(([^)]*)\) => \{$/, note: (m) => n(`Defines the function ${m[1]}${m[2] ? ' (takes ' + m[2] + ')' : ''}.`, 'An arrow function stored in a const, so the code below can call it.') },
    { file: isJs, line: /^const (\w+) = \[(.+)\]$/, note: (m) => n(`A list called ${m[1]}: ${m[2]}.`, 'Arrays keep values in order; [0] is the first.') },
    { file: isJs, line: /^(?:const|let) (\w+) = (.+)$/, note: (m) => n(`Stores ${m[2]} in ${m[1]}.`, 'A variable: a name for a value used below.') },
    { file: isJs, line: /^useEffect\((async )?\(\) => \{$/, note: () => n('Starts an effect: code that runs after React draws the page.', 'Effects talk to the outside world (requests, logs, the page title).') },
    { file: isJs, line: /^\}, \[\]\)$/, note: () => n('Ends the effect. [] = run it once, after the first render.', 'An empty dependency list never changes, so the effect never runs again.') },
    { file: isJs, line: /^\}, \[(.+)\]\)$/, note: (m) => n(`Ends the effect. It runs again whenever ${m[1]} changes.`, 'List every value the effect reads.') },
    { file: isJs, line: /^return \(\)? => /, note: () => n('The cleanup: React runs it before the effect runs again, and when the component leaves the page.', 'Undo what the effect started.') },
    { file: isJs, line: /^return \($/, note: () => n('Starts the JSX this component returns (what it draws).', 'The ( lets the JSX span many lines.') },
    { file: isJs, line: /^return <(.+)$/, note: () => n('Returns this JSX: what the component draws.', 'A one-line return needs no ( ).') },
    { file: isJs, line: /^return$|^if \((.+)\) return$/, note: (m) => n(m[1] ? `Stops here when ${m[1]} is true${m[1].startsWith('!') ? ' (! means "not": so when ' + m[1].slice(1) + ' is empty or false)' : ''}.` : 'Stops the function here.', 'An early return skips the rest of the function.') },
    { file: isJs, line: /^if \((.+)\) return (<.+)$/, note: (m) => n(`If ${m[1]}, draw ${m[2]} instead and stop.`, 'An early return: the rest of the component is skipped.') },
    { file: isJs, line: /^if \((.+)\) throw (.+)$/, note: (m) => n(`If ${m[1]}, throw ${m[2]}.`, 'A thrown error stops rendering; the router\'s errorElement shows instead.') },
    { file: isJs, line: /^try \{$/, note: () => n('Starts a try block: if any line inside throws an error, jump to catch.', 'Requests can fail; try/catch handles it instead of crashing.') },
    { file: isJs, line: /^\} catch \((\w+)\) \{$/, note: (m) => n(`Runs only if something in try failed. ${m[1]} is the error.`, 'Show a message instead of crashing.') },
    { file: isJs, line: /^\} finally \{$/, note: () => n('Runs at the end, whether try worked or failed.', 'Good for clean-up and "done" logs.') },
    { file: isJs, line: /^console\.(log|error|warn)\((.+)\)$/, note: (m) => n(`Prints ${m[2]} in the browser console${m[1] === 'error' ? ' (in red, as an error)' : ''}.`, 'Only developers see it (DevTools → Console).') },
    { file: isJs, line: /^alert\((.+)\)$/, note: (m) => n(`Shows a pop-up with the text ${m[1]}.`, 'Simple feedback for the user.') },
    { file: isJs, line: /^event\.preventDefault\(\)$/, note: () => n('Stops the browser\'s default action (a form submit would reload the page).', 'React handles the form instead.') },
    { file: isJs, line: /^(set\w+)\((.+)\)$/, note: (m) => n(`Changes state with ${m[1]}: the new value is ${m[2]}.`, 'React draws the component again with it.') },
    { file: isJs, line: /^(\w+)\((.*)\)$/, note: (m) => n(`Calls ${m[1]}(${m[2]}).`, 'Runs that function now.') },
    { file: isJs, line: /^(\w+(?:\.\w+)+) = (.+)$/, note: (m) => n(`Sets ${m[1]} to ${m[2]}.`, 'Changes a property of a DOM element or object directly (vanilla JS).') },
    { file: isJs, line: /^(\w+)\.(\w+)\((.*)\)$/, note: (m) => n(`Calls ${m[2]}(${m[3]}) on ${m[1]}.`, m[2] === 'appendChild' ? 'appendChild puts an element inside another one, at the end.' : 'A method: a function that belongs to that object.') },
    { file: isJs, line: /^\.then\(/, note: () => n('When the request\'s answer arrives, run this function with it.', 'A promise: the answer comes later, so we say what to do when it does.') },
    { file: isJs, line: /^\.catch\(/, note: () => n('If the request fails, run this function instead.', 'Handles errors like a 404.') },
    { file: isJs, line: /^createRoot\(/, boilerplate: true, note: () => n('Finds the #root box in index.html and starts React there…', '…and .render( draws the app into it.') },
    { file: isJs, line: /^([\w-]+)=(.+)$/, note: (m) => attr(m[1], m[2]) },
    { file: isJs, line: /^(\w+)="([^"]*)"(\s+\w+="[^"]*")+$/, note: (m, t) => n(`Attributes of the element above: ${t}.`, [...t.matchAll(/(\w+)="/g)].map((x) => x[1] + ': ' + (ATTR[x[1]] || 'an HTML attribute')).join('; ') + '.') },
    { file: isJs, line: /^\{\.\.\.props\}$/, note: () => n('Passes every other prop (onClick, type…) on to this element.', 'The spread copies them all, so Button works like a normal <button>.') },
    { file: isJs, line: /^\{children\}$/, note: () => n('Shows whatever was written between <Button> and </Button>.', 'children is the special prop for the content between the tags.') },
    { file: isJs, line: /^\{(\w+)\.map\(\((\w+)(?:, \w+)?\) => \($/, note: (m) => n(`For every item in ${m[1]} (called ${m[2]}), return the JSX below.`, '.map turns the list of data into a list of elements.') },
    { file: isJs, line: /^\{(.+)\}$/, note: (m) => n(`Shows the value of ${m[1]} here.`, '{ } puts a JavaScript value into the JSX.') },
    { file: isJs, line: /^<>$/, note: () => n('Opens a fragment: groups elements without adding a box to the page.', 'A component must return one thing; <>…</> wraps several.') },
    { file: isJs, line: /^<\/>$/, note: () => n('Closes the fragment.', 'Matches the <> above.') },
    { file: isJs, line: /^<\/([\w.]+)>,?$/, note: (m) => n(`Closes the <${m[1]}>.`, 'Everything between the opening and closing tag is inside it.') },
    { file: isJs, line: /^<([\w.]+)(\s[^>]*?)?\s*(\/?)>(.*)$/, boilerplate: boiler, note: (m) => element(m[1], m[2] || '', m[3], m[4]) },
    { file: isJs, line: /^<([\w.]+)$/, boilerplate: boiler, note: (m) => element(m[1], '', '', '', true) },
    { file: isJs, line: /^\/>$/, note: () => n('Ends the tag above (self-closing: nothing inside it).', 'In JSX every tag must be closed; /> closes a tag with no content.') },
    { file: isJs, line: /^>$/, note: () => n('Ends the opening tag above; what follows is inside the element.', 'The tag\'s attributes were written over several lines.') },
    { file: isJs, line: /^\)\)\}$/, note: () => n('Closes the .map(…) callback and the { } around it.', 'Matches {list.map((item) => ( above.') },
    { file: isJs, line: /^\}\)$/, note: () => n('Closes the function and the call it was passed to.', 'Matches the ( and { opened above.') },
    { file: isJs, line: /^\}\)+$/, note: () => n('Closes the object and the calls around it.', 'Each ) matches a ( opened above.') },
    { file: isJs, line: /^\)$/, note: () => n('Closes the ( opened above (the JSX returned, or a long call).', 'Every ( needs its ).') },
    { file: isJs, line: /^\}$/, note: () => n('Closes the block opened above (a function, if, or object).', 'Every { needs its }.') },
    { file: isJs, line: /^\]\)?,?$/, note: () => n('Closes the list (array) opened above.', 'Every [ needs its ].') },
    { file: isJs, line: /^\},?$|^\],?$/, note: () => n('Closes the object or list opened above.', 'The comma separates it from the next item.') },
    { file: isJs, line: /^(\w+): (.+?),?$/, note: (m) => n(`${m[1]}: ${m[2]}. A setting in the object above.`, m[1] === 'path' ? 'The URL this route matches.' : m[1] === 'element' ? 'The JSX shown for this route.' : m[1] === 'children' ? 'Routes shown inside this one\'s <Outlet />.' : m[1] === 'errorElement' ? 'Shown when a page inside crashes.' : 'Objects are key: value pairs.') },
    { file: isJs, line: /^\{ (path|index): /, note: (m, t) => n(`A route: ${t.replace(/,$/, '')}.`, 'path = the URL; element = the JSX shown there; index: true = the parent\'s own path.') },
    { file: isJs, line: /^(\w+): \[$|^(\w+): \{$|^\{$/, note: (m) => n(`Starts ${m[1] || m[2] ? (m[1] || m[2]) + ', ' : ''}a list or object.`, 'The items follow, one per line.') },
    { file: isJs, line: /^[^<>{}]*[^\s<>{}][^]*$/, boilerplate: boiler, note: (m, t) => /^[A-Za-z][^=;]*(<\w+>|\{\w+\})/.test(t) ? n(`Text shown on the page, with ${/\{/.test(t) ? 'a value in { }' : 'small tags'} inside: ${t}`, 'Text, tags and { } values can mix inside JSX.') : null },
    // A line of plain text inside JSX (what the page shows).
    { file: isJs, line: /^[^<>{}()=;]+$/, boilerplate: boiler, note: (m, t) => n(`The text "${t}", shown on the page.`, 'Plain text between tags is drawn as-is.') },
  ])

  function selector(sel) {
    if (/^#[\w-]+$/.test(sel)) return `the element with id ${sel.slice(1)} (#${sel.slice(1)})`
    if (/^\.[\w-]+$/.test(sel)) return `elements with the class ${sel.slice(1)}`
    if (/^[a-z][\w]*$/.test(sel)) return `every <${sel}> element`
    if (/^[#.]?[\w-]+ [#.]?[\w-]+$/.test(sel)) { const [a, b] = sel.split(' '); return `${selector(b)}, but only inside ${selector(a)}` }
    return `elements matching ${sel}`
  }
  const HOOK = {
    useState: 'a value React remembers between renders', useEffect: 'code that runs after rendering', useLocation: 'the current URL (path, search, key)',
    useNavigate: 'a function to change the page from code', useParams: 'the :parts of the URL (e.g. { id })', useRouteError: 'the error the router caught',
    useOutletContext: 'the value the layout passed to <Outlet context>', useLoaderData: 'the data the route\'s loader fetched',
  }
  function attr(name, value) {
    const v = value.replace(/^"|"$/g, '')
    if (name === 'className') return n(`className=${value}: CSS classes${/\b(rounded|bg-|px-|flex|text-|p-\d|gap-)/.test(value) ? ' (Tailwind utilities: each class sets one CSS property)' : ''}.`, ATTR.className)
    return n(`${name}=${value}: ${ATTR[name] || 'an attribute of the element above'}.`, 'Attributes written one per line are easier to read.')
  }

  function element(tag, attrs, selfClose, rest, open) {
    const lib = LIB[tag]
    const html = TAG[tag]
    const attrNames = [...attrs.matchAll(/([\w-]+)=/g)].map((x) => x[1])
    const attrText = attrNames.length ? ' Attributes: ' + attrNames.map((a) => `${a} (${ATTR[a] || 'a prop'})`).join('; ') + '.' : ''
    const inner = rest && !/^<\//.test(rest) ? rest.replace(/<\/[\w.]+>$/, '').trim() : ''
    const shows = inner ? ` It shows ${inner.startsWith('{') ? 'the value ' + inner : '"' + inner.replace(/\{([^}]+)\}/g, '<$1>') + '"'}.` : ''
    if (lib) return n(`<${tag}>: ${lib[1]} (from ${lib[0]}).${shows}${attrText}`, 'A ready-made component from a library: it renders HTML and CSS for you.')
    if (html) return n(`<${tag}>: ${html}.${shows}${attrText}${open ? ' Its attributes follow on the next lines.' : ''}`, selfClose ? 'Self-closing (/>): nothing goes inside it.' : 'HTML tags in JSX work like in HTML, with className instead of class.')
    if (/^[A-Z]/.test(tag)) return n(`<${tag} />: draws our ${tag} component here.${attrNames.length ? ' Passes it the props ' + attrNames.join(', ') + '.' : ''}`, 'Props are the component\'s inputs: it receives them as one object.')
    return n(`<${tag}>: an HTML element.${shows}${attrText}`, 'JSX looks like HTML and becomes real elements on the page.')
  }

  // Cypress lines: explain each command in the chain.
  const CY = {
    visit: (a) => `opens the app at ${a || '/'}`, get: (a) => `finds the element(s) matching ${a}`, contains: (a) => `finds the element containing ${a}`,
    click: () => 'clicks it', type: (a) => `types ${a}${/\{enter\}/.test(a) ? ' ({enter} presses Enter)' : ''}`, clear: () => 'empties the box',
    should: (a) => `checks it: ${a}`, and: (a) => `and checks: ${a}`, intercept: (a) => `stubs the request ${a} (a fake, fixed answer)`, as: (a) => `names it ${a} (use it as @${q(a)})`,
    wait: (a) => `waits for the request ${a} to be answered`, location: (a) => `reads the URL's ${a || 'parts'}`, go: (a) => `presses the browser's ${q(a)} button`,
    window: () => 'gets the page\'s window object', its: (a) => `reads its property ${a}`, then: () => 'runs a function with it', reload: () => 'reloads the page (like F5)',
    wrap: (a) => `wraps ${a} so Cypress can check it (and retry)`, on: (a) => `listens for ${a}`, children: () => 'takes its direct children', find: (a) => `finds ${a} inside it`,
  }
  // .should('have.length', 1) and friends, in words.
  const CHAIN = {
    'be.visible': () => 'it is visible', 'exist': () => 'it exists', 'not.exist': () => 'it does not exist', 'eq': (v) => `it equals ${v}`,
    'have.length': (v) => `there are exactly ${v}`, 'have.value': (v) => `the box contains ${v}`, 'have.text': (v) => `its text is exactly ${v}`,
    'have.attr': (a, v) => `it has the attribute ${a}${v ? ' = ' + v : ''}`, 'have.css': (p, v) => `its computed CSS ${p} is ${v}`, 'contain': (v) => `it contains ${v}`,
    'include': (v) => `it includes ${v}`, 'not.include': (v) => `it does not include ${v}`, 'have.class': (v) => `it has the class ${v}`,
  }
  const splitArgs = (a) => [...a.matchAll(/'((?:[^'\\]|\\.)*)'|"([^"]*)"|([^,\s]+)/g)].map((x) => x[1] ?? x[2] ?? x[3])
  function cyStep(name, a) {
    const args = splitArgs(a)
    if (name === 'contains' && args.length === 2) return `contains: finds the <${args[0]}> whose text contains '${args[1]}'`
    if ((name === 'should' || name === 'and') && CHAIN[args[0]]) return `${name}: checks that ${CHAIN[args[0]](...args.slice(1).map((x) => "'" + x + "'"))}`
    return `${name}: ${CY[name](a)}`
  }
  function cyExplain(t) {
    const parts = [...t.matchAll(/\.?(\w+)\(((?:[^()]|\([^()]*\))*)\)/g)].filter((p) => CY[p[1]])
    if (!parts.length) return null
    const steps = parts.map((p) => cyStep(p[1], p[2]))
    return n(`Cypress: ${steps.join(' → ')}.`, 'Each command waits and retries (up to 4 seconds) until it works, so tests don\'t break on slow pages.')
  }
})(typeof self !== 'undefined' ? self : globalThis)
