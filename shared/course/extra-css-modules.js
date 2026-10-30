// Optional page (not a lecture): why plain CSS in React is global, components in folders with an
// index.js, and CSS Modules that scope a component's classes. A small app with two components
// (Card and Banner) that both use the class name "title", so the clash is easy to see.
const CARD_JSX = (imp, box, title) => `${imp}\n\nfunction Card() {\n  return (\n    <div className=${box}>\n      <h2 className=${title}>Card title</h2>\n      <p>The card wants a red title.</p>\n    </div>\n  )\n}\n\nexport default Card`
const BANNER_JSX = (imp, title) => `${imp}\n\nfunction Banner() {\n  return <h2 className=${title}>Banner title</h2>\n}\n\nexport default Banner`
const CARD_CSS = '.box {\n  border: 2px solid crimson;\n  padding: 12px;\n  margin-bottom: 12px;\n}\n\n.title {\n  color: crimson;\n}'
const BANNER_CSS = '.title {\n  color: royalblue;\n  font-size: 40px;\n}'
Course.register({
  id: 'extra-css-modules',
  label: 'Optional',
  title: 'Components in folders, and CSS Modules',
  base: { lesson: 'react-vite', feature: 'f3' },
  files: { ...Course.checkpoint(Course.get('react-vite'), 'f3') },
  features: [
    {
      id: 'f1', title: 'Two components, one stylesheet',
      why: 'Card.css and Banner.css both style .title. Vite puts every imported CSS file into one stylesheet for the whole page, so the rule loaded last wins, everywhere: the card\'s title turns blue and big.',
      steps: [
        { id: 'f1s1', file: 'src/index.css', mode: 'set', code: 'body {\n  font-family: system-ui, sans-serif;\n  margin: 24px;\n}', say: 'Global page styles: these SHOULD reach every component.' },
        {
          id: 'f1s2', file: 'src/Card.css', mode: 'set', code: CARD_CSS,
          later: { how: 'A plain CSS file: its .title rule reaches the whole page, not only Card.', where: 'Feature 3 (a CSS Module)' },
          say: 'Card\'s styles: a red border and a red title.',
          notes: [{ match: '.title {', what: 'A rule for every element with class="title".', why: 'In a plain CSS file, "every" means the whole page, whichever component it is in.' }],
        },
        { id: 'f1s3', file: 'src/Card.jsx', mode: 'set', code: CARD_JSX("import './Card.css'", '"box"', '"title"'), say: 'Card imports its CSS file, the usual way.' },
        {
          id: 'f1s4', file: 'src/Banner.css', mode: 'set', code: BANNER_CSS,
          later: { how: 'A second .title rule, also for the whole page.', where: 'Feature 4' },
          say: 'Banner wants a big blue title, also called .title.',
        },
        { id: 'f1s5', file: 'src/Banner.jsx', mode: 'set', code: BANNER_JSX("import './Banner.css'", '"title"'), say: 'Banner imports its own CSS file.' },
        {
          id: 'f1s6', file: 'src/App.jsx', mode: 'set',
          code: "import Card from './Card'\nimport Banner from './Banner'\n\nfunction App() {\n  return (\n    <>\n      <Card />\n      <Banner />\n    </>\n  )\n}\n\nexport default App",
          say: 'Show both. Look at the card: its title is blue and 40px, not red. Banner.css loaded last and its .title won.',
          notes: [{ match: "import Banner from './Banner'", what: 'Imports Banner, which imports Banner.css.', why: 'Banner.css loads after Card.css, so its .title rule wins for both titles.' }],
        },
      ],
    },
    {
      id: 'f2', title: 'One folder per component',
      why: 'Each component gets a folder with its .jsx, its CSS and an index.js. The index.js re-exports the component, so imports stay short: ./components/Card. Folders keep files together, but they do NOT scope CSS: the titles still clash.',
      steps: [
        { id: 'f2s1', file: 'src/components/Card/Card.jsx', mode: 'set', code: CARD_JSX("import './Card.css'", '"box"', '"title"'), say: 'Move Card into src/components/Card/.' },
        { id: 'f2s2', file: 'src/components/Card/Card.css', mode: 'set', code: CARD_CSS, say: 'Its CSS moves with it.' },
        {
          id: 'f2s3', file: 'src/components/Card/index.js', mode: 'set', code: "export { default } from './Card'",
          say: 'index.js: the folder\'s front door.',
          notes: [{ match: "export { default } from './Card'", what: 'Re-exports Card as this folder\'s default export.', why: "import Card from './components/Card' finds this file, so the import doesn't repeat Card/Card." }],
        },
        { id: 'f2s4', file: 'src/Card.jsx', mode: 'delete', say: 'Remove the old files.' },
        { id: 'f2s5', file: 'src/Card.css', mode: 'delete', say: '…' },
        { id: 'f2s6', file: 'src/components/Banner/Banner.jsx', mode: 'set', code: BANNER_JSX("import './Banner.css'", '"title"'), say: 'Same for Banner.' },
        { id: 'f2s7', file: 'src/components/Banner/Banner.css', mode: 'set', code: BANNER_CSS, say: '…its CSS…' },
        { id: 'f2s8', file: 'src/components/Banner/index.js', mode: 'set', code: "export { default } from './Banner'", say: '…and its index.js.' },
        { id: 'f2s9', file: 'src/Banner.jsx', mode: 'delete', say: 'Remove the old files.' },
        { id: 'f2s10', file: 'src/Banner.css', mode: 'delete', say: '…' },
        {
          id: 'f2s11', file: 'src/App.jsx', mode: 'replace', find: "import Card from './Card'\nimport Banner from './Banner'",
          code: "import Card from './components/Card'\nimport Banner from './components/Banner'",
          say: 'Import the folders. The page looks the same: the card title is still blue. Folders organise files; they don\'t make CSS private.',
          notes: [{ match: "import Card from './components/Card'", what: 'Imports from the folder; JavaScript loads its index.js.', why: 'Short imports, and the folder can hold more files (CSS, tests, small helpers) without changing them.' }],
        },
      ],
    },
    {
      id: 'f3', title: "Card's CSS as a CSS Module",
      why: 'A file named *.module.css is a CSS Module. Vite renames each class to something unique (like _title_1x2y3) and gives you an object of the new names. Only elements that use styles.title get the rule, so Card\'s title is finally red.',
      steps: [
        { id: 'f3s1', file: 'src/components/Card/Card.css', mode: 'delete', say: 'Rename Card.css…' },
        {
          id: 'f3s2', file: 'src/components/Card/Card.module.css', mode: 'set', code: CARD_CSS, fixes: ['f1s2'],
          say: '…to Card.module.css. Same rules: the name is what makes it a module.',
          notes: [{ match: '.title {', what: 'In a CSS Module, .title only matches elements that use styles.title.', why: 'Vite gives the class a unique name, so no other .title rule can collide with it.' }],
        },
        {
          id: 'f3s3', file: 'src/components/Card/Card.jsx', mode: 'replace', find: "import './Card.css'",
          code: "import styles from './Card.module.css'",
          say: 'Import it with a name: styles is an object of class names.',
          notes: [{ match: "import styles from './Card.module.css'", what: 'styles = { box: \'_box_x1\', title: \'_title_y2\' } (Vite makes the names).', why: 'You never type the unique names: you use styles.box and styles.title.',
            api: { name: "import styles from './X.module.css'", does: 'Loads a CSS Module and gives an object of its class names.', params: [['styles', 'any name you like', 'styles is the usual choice']], returns: 'an object: one key per class in the file', mistakes: ["import './Card.module.css' without a name: the rules load, but you have no names to use.", 'styles.Title instead of styles.title: undefined, so no class is set (no error).'] } }],
        },
        {
          id: 'f3s4', file: 'src/components/Card/Card.jsx', mode: 'replace', find: '<div className="box">', code: '<div className={styles.box}>',
          say: 'Use the names from the object…',
          notes: [{ match: '<div className={styles.box}>', what: 'The class name Vite generated for .box.', why: 'Inspect it in DevTools: something like _box_1x2y3.' }],
        },
        {
          id: 'f3s5', file: 'src/components/Card/Card.jsx', mode: 'replace', find: '<h2 className="title">', code: '<h2 className={styles.title}>',
          say: '…for the title too. The card\'s title is red now; the banner is still blue and big.',
          notes: [{ match: '<h2 className={styles.title}>', what: 'Card\'s own title class.', why: 'Banner.css\'s global .title can\'t reach it any more: the class name is different.' }],
        },
      ],
    },
    {
      id: 'f4', title: 'Banner too, and two classes at once',
      why: 'Banner gets its own module. To use two module classes on one element, join them in a template string. index.css stays global on purpose: page-wide styles (fonts, margins) belong there.',
      steps: [
        { id: 'f4s1', file: 'src/components/Banner/Banner.css', mode: 'delete', say: 'Banner.css goes…' },
        {
          id: 'f4s2', file: 'src/components/Banner/Banner.module.css', mode: 'set', code: '.title {\n  color: royalblue;\n}\n\n.big {\n  font-size: 40px;\n}', fixes: ['f1s4'],
          say: '…Banner.module.css comes, with the size as its own class.',
        },
        { id: 'f4s3', file: 'src/components/Banner/Banner.jsx', mode: 'replace', find: "import './Banner.css'", code: "import styles from './Banner.module.css'", say: 'Import the module.' },
        {
          id: 'f4s4', file: 'src/components/Banner/Banner.jsx', mode: 'replace', find: '<h2 className="title">', code: '<h2 className={`${styles.title} ${styles.big}`}>',
          say: 'Two classes: a template string with a space between them. Each component now has its own title style; neither leaks.',
          notes: [{ match: '${styles.title} ${styles.big}', what: 'Joins two generated class names with a space.', why: 'className is one string of class names, as in HTML: "a b".' }],
        },
      ],
    },
  ],
})
