// The GitHub repo with the code of every lecture (built by tools/build-code-repo.mjs).
// Each lecture has a branch holding its finished code; it starts from the branch before it.
Course.codeRepo = {
  url: 'https://github.com/kabeier/intro-react-code',
  page: 'code-repo/',
  // Unit 2 · Lecture 1 + react-vite → unit-2-lecture-1-react-vite
  branch: (lesson) => {
    const m = /Unit (\d+) · Lecture (\d+)/.exec(lesson.label || '')
    return m ? `unit-${m[1]}-lecture-${m[2]}-${lesson.id}` : 'optional-' + lesson.id.replace(/^extra-/, '')
  },
}
