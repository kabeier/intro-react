// Fix it problems for unit 2 · lecture 1 (JSX basics). Checks read the rendered page.
;(function (root) {
  const style = (win, el) => win.getComputedStyle(el)
  const ps = (doc) => [...doc.querySelectorAll('#root p')]
  const firstP = (doc) => ps(doc)[0]
  const problems = [
    {
      id: 'cssimport', title: 'The message is not big', base: 'f7',
      symptom: 'className="myText" is there and App.css has .myText { font-size: 50px }, but the text is normal size.',
      breaks: [{ file: 'src/App.jsx', mode: 'replace', find: "import './App.css'\n\n", code: '' }],
      checks: [{ name: 'the message is 50px', run: (doc, win) => !!firstP(doc) && style(win, firstP(doc)).fontSize === '50px' }],
      hint: 'How does App.jsx get the rules from App.css?',
      why: "With Vite, a component file imports its CSS: import './App.css'. Without the import the rules never reach the page.",
    },
    {
      id: 'tworoots', title: 'Blank page: "Adjacent JSX elements"', base: 'f7',
      symptom: 'Nothing shows. The console says: Adjacent JSX elements must be wrapped in an enclosing tag.',
      breaks: [
        { file: 'src/App.jsx', mode: 'replace', find: '    <>\n', code: '' },
        { file: 'src/App.jsx', mode: 'replace', find: '    </>\n', code: '' },
      ],
      checks: [{ name: 'the heading and both paragraphs show', run: (doc) => !!doc.querySelector('#root h1') && ps(doc).length === 2 }],
      hint: 'return gives back one thing. How do you wrap three elements without adding a div?',
      why: 'JSX must return one root. A fragment <>…</> wraps siblings without adding an element.',
    },
    {
      id: 'stylestring', title: 'Blank page: "style prop expects a mapping"', base: 'f7',
      symptom: 'The page is empty; the console mentions the style prop.',
      breaks: [{ file: 'src/App.jsx', mode: 'replace', find: 'style={{ color: "red" }}', code: 'style="color: red"' }],
      checks: [{ name: 'the message is red', run: (doc, win) => !!firstP(doc) && style(win, firstP(doc)).color === 'rgb(255, 0, 0)' }],
      hint: 'In JSX, style is not a string. What kind of value is it?',
      why: 'style takes a JavaScript object: style={{ color: "red" }} (outer braces = JavaScript, inner = the object).',
    },
    {
      id: 'braces', title: 'The page says "message"', base: 'f7',
      symptom: 'Instead of "Hello Pokemon trainers", the page shows the word message.',
      breaks: [{ file: 'src/App.jsx', mode: 'replace', find: '>{message}</p>', code: '>message</p>' }],
      checks: [{ name: 'the message text shows', run: (doc) => !!firstP(doc) && firstP(doc).textContent === 'Hello Pokemon trainers' }],
      hint: 'How does JSX know you mean the variable, not the word?',
      why: 'Text in JSX is shown as written. Curly braces {message} mean "the value of this JavaScript".',
    },
    {
      id: 'call', title: 'The second line is empty', base: 'f7',
      symptom: 'No "Hello from a function". The console warns: Functions are not valid as a React child.',
      breaks: [{ file: 'src/App.jsx', mode: 'replace', find: '{sayHello()}', code: '{sayHello}' }],
      checks: [{ name: 'the function\'s text shows', run: (doc) => ps(doc).some((p) => p.textContent === 'Hello from a function') }],
      hint: 'Do you want the function, or what it returns?',
      why: 'sayHello is the function itself; sayHello() runs it and gives back the string to show.',
    },
    {
      id: 'export', title: 'Blank page: "does not provide an export named default"', base: 'f7',
      symptom: 'Nothing renders; the console says App.jsx does not provide an export named \'default\'.',
      breaks: [{ file: 'src/App.jsx', mode: 'replace', find: '\n\nexport default App', code: '' }],
      checks: [{ name: 'the app renders', run: (doc) => !!doc.querySelector('#root h1') }],
      hint: 'main.jsx says import App from \'./App.jsx\'. What must App.jsx do so that works?',
      why: 'import App from \'./App.jsx\' takes the file\'s default export. Add export default App.',
    },
    {
      id: 'lowercase', title: 'Bonus: an empty <app> tag', base: 'f7',
      symptom: 'Blank page, no error. DevTools shows <app></app> inside #root.',
      breaks: [{ file: 'src/main.jsx', mode: 'replace', find: '<App />', code: '<app />' }],
      checks: [{ name: 'the App component renders', run: (doc) => !!doc.querySelector('#root h1') }],
      hint: 'How does JSX tell a component from an HTML tag?',
      why: 'Lowercase names are HTML tags; components start with a capital letter: <App />.',
    },
    {
      id: 'unclosed', title: 'Bonus: "Expected corresponding JSX closing tag"', base: 'f7',
      symptom: 'Blank page; the console points at the second <p>.',
      breaks: [{ file: 'src/App.jsx', mode: 'replace', find: '<p>{sayHello()}</p>', code: '<p>{sayHello()}' }],
      checks: [{ name: 'the function\'s text shows', run: (doc) => ps(doc).some((p) => p.textContent === 'Hello from a function') }],
      hint: 'In JSX every tag must be closed.',
      why: 'HTML forgives a missing </p>; JSX does not. Every element closes: <p>…</p> or <img />.',
    },
    {
      id: 'quotes', title: 'Bonus: "red is not defined"', base: 'f7',
      symptom: 'Blank page; the console says ReferenceError: red is not defined.',
      breaks: [{ file: 'src/App.jsx', mode: 'replace', find: 'style={{ color: "red" }}', code: 'style={{ color: red }}' }],
      checks: [{ name: 'the message is red', run: (doc, win) => !!firstP(doc) && style(win, firstP(doc)).color === 'rgb(255, 0, 0)' }],
      hint: 'Inside the style object, is red a variable or a string?',
      why: 'CSS values in a style object are strings: color: "red". Without quotes JavaScript looks for a variable named red.',
    },
    {
      id: 'comment', title: 'Bonus: an HTML comment breaks the page', base: 'f7',
      symptom: 'We added <!-- the title --> above the h1. Now the page is blank.',
      breaks: [{ file: 'src/App.jsx', mode: 'replace', find: '      <h1>Pokemon Project</h1>', code: '      <!-- the title -->\n      <h1>Pokemon Project</h1>' }],
      checks: [{ name: 'the app renders', run: (doc) => !!doc.querySelector('#root h1') }],
      hint: 'JSX is JavaScript. How do you write a comment inside {}?',
      why: 'JSX has no HTML comments. Use {/* the title */} (or delete it).',
    },
  ]
  root.FIXIT = root.FIXIT || {}
  root.FIXIT['react-vite'] = problems
})(typeof self !== 'undefined' ? self : globalThis)
