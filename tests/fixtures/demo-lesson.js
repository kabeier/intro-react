// A tiny lesson used only by the browser tests.
Course.register({
  id: 'demo',
  title: 'Demo',
  files: {
    'index.html': '<!DOCTYPE html>\n<html>\n<head>\n  <title>Demo page</title>\n  <link rel="stylesheet" href="styles.css">\n</head>\n<body>\n  <h1>Hello</h1>\n</body>\n</html>',
    'styles.css': '',
  },
  features: [
    { id: 'f1', title: 'Blue heading', why: 'start', steps: [
      { id: 'f1s1', file: 'styles.css', mode: 'append', code: 'h1 {\n  color: rgb(0, 0, 255);\n}' },
    ] },
    { id: 'f2', title: 'Intro', why: 'more', steps: [
      { id: 'f2s1', file: 'index.html', mode: 'insertAfter', find: '<h1>Hello</h1>', code: '  <p class="intro">Hi</p>' },
      { id: 'f2s2', file: 'styles.css', mode: 'replace', find: 'rgb(0, 0, 255)', code: 'rgb(255, 0, 0)' },
      { id: 'f2s3', file: 'styles.css', mode: 'append', code: '.intro {\n  margin: 0;\n}' },
    ] },
  ],
})
