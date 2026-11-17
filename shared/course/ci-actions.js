// Unit 9 · Lecture 2 · GitHub Actions for CI/CD: lint, build and run Cypress on every push and
// pull request, check the built site too, and deploy only after the tests pass.
// Follows phase-II/04-Front-End/9-ci-cd/2-gh-actions.md (action versions as of November 2026).
// Lecture 1's deploy.yml deploys every push; its deploy moves into ci-cd.yml behind the tests, and deploy.yml goes.
Course.register({
  id: 'ci-actions',
  label: 'Unit 9 · Lecture 2',
  title: 'GitHub Actions for CI/CD',
  base: { lesson: 'deploy-pages', feature: 'f3' },
  files: { ...Course.checkpoint(Course.get('deploy-pages'), 'f3') },
  features: [
    {
      id: 'f1', title: 'Run the tests on every push',
      why: 'CI = a clean computer checks every change: install, lint, build, test. A red check on a pull request means "don\'t merge yet".',
      steps: [
        {
          id: 'f1s1', file: '.github/workflows/ci-cd.yml', mode: 'set',
          code: "name: CI/CD\n\non:\n  push:\n    branches: [main]\n  pull_request:\n    branches: [main]\n  workflow_dispatch:\n\npermissions:\n  contents: read\n\njobs:\n  cypress-run:\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/checkout@v7\n      - uses: actions/setup-node@v7\n        with:\n          node-version: 24\n          cache: npm\n      - run: npm ci\n      - run: npm run lint\n      - run: npm run build\n      - name: Cypress (dev server)\n        uses: cypress-io/github-action@v7\n        with:\n          install: false\n          start: npm run dev\n          wait-on: 'http://localhost:5173/'",
          say: 'One job: get the code, Node 24, install exactly the lockfile (npm ci), lint, build, then Cypress against the dev server.',
          notes: [
            { match: '      - run: npm ci', what: 'Installs exactly what package-lock.json says.', why: 'Same versions every run; fails if the lockfile and package.json disagree.' },
            { match: '          install: false', what: 'Don\'t install again.', why: 'npm ci already ran; without this the Cypress action installs a second time.' },
            { match: "          wait-on: 'http://localhost:5173/'", what: 'Wait until the dev server answers before testing.', why: 'start runs in the background; tests that start too early all fail.' },
            { match: 'permissions:\n  contents: read', what: 'The workflow may only read the repo.', why: 'Give each workflow the least access it needs.' },
          ],
        },
      ],
    },
    {
      id: 'f2', title: 'Also test the built site',
      why: 'The dev server is not what users get. A second Cypress step runs the production smoke test against npm run preview, under /pokesearch/ with the hash router.',
      steps: [
        {
          id: 'f2s1', file: '.github/workflows/ci-cd.yml', mode: 'append',
          code: "      - name: Cypress (built site)\n        uses: cypress-io/github-action@v7\n        with:\n          install: false\n          start: npm run preview\n          wait-on: 'http://localhost:4173/pokesearch/'\n          config: baseUrl=http://localhost:4173/pokesearch/,specPattern=cypress/e2e-prod/**/*.cy.js",
          say: 'Same action, different server: preview serves dist/ on port 4173, at the base path.',
          notes: [{ match: 'config: baseUrl=http://localhost:4173/pokesearch/,specPattern=cypress/e2e-prod/**/*.cy.js', what: 'Points Cypress at the built site and the production specs.', why: 'Catches a wrong base or router before users do.' }],
        },
      ],
    },
    {
      id: 'f3', title: 'Deploy only after green',
      why: 'deploy.yml from lecture 1 deploys every push, even a red one. A deploy job in ci-cd.yml needs cypress-run: it starts only if the tests passed, only for pushes to main, and publishes the exact dist/ the tests checked. Then deploy.yml goes.',
      steps: [
        {
          id: 'f3s1', file: '.github/workflows/ci-cd.yml', mode: 'append',
          code: "      - name: Save dist/ for GitHub Pages\n        if: github.event_name == 'push'\n        uses: actions/upload-pages-artifact@v5\n        with:\n          path: dist\n\n  deploy:\n    needs: cypress-run\n    if: github.event_name == 'push'\n    runs-on: ubuntu-latest\n    permissions:\n      pages: write\n      id-token: write\n    environment:\n      name: github-pages\n      url: ${{ steps.deployment.outputs.page_url }}\n    concurrency:\n      group: pages\n      cancel-in-progress: false\n    steps:\n      - id: deployment\n        uses: actions/deploy-pages@v5",
          say: 'The test job saves the dist/ it just tested; the deploy job waits for it (needs) and hands that dist/ to GitHub Pages.',
          notes: [
            { match: "        if: github.event_name == 'push'", what: 'Save dist/ only for a push to main.', why: 'A pull request is tested but never deployed.' },
            { match: '        uses: actions/upload-pages-artifact@v5', what: 'Packs dist/ as the site for GitHub Pages.', why: 'It deploys the exact build the tests just checked; nothing is built twice.' },
            { match: '    needs: cypress-run', what: 'Wait for the cypress-run job, and only start if it passed.', why: 'Red tests: this job shows as skipped, and the live site stays as it was.' },
            { match: '      pages: write\n      id-token: write', what: 'May publish to Pages, and prove to Pages which workflow it is.', why: 'Only this job gets them; it cannot push code to any branch.' },
            { match: '      name: github-pages', what: 'The environment GitHub made for Pages.', why: 'The repo page shows each deploy and the live URL under Environments.' },
            { match: '      cancel-in-progress: false', what: 'Two quick pushes deploy one after the other.', why: 'A running deploy is never cut off halfway.' },
            { match: '        uses: actions/deploy-pages@v5', what: 'Publishes the saved dist/ to GitHub Pages.', why: 'Same action as deploy.yml; now it waits for the tests.' },
          ],
        },
        {
          id: 'f3s2', file: '.github/workflows/deploy.yml', mode: 'delete', code: '',
          say: 'Delete deploy.yml: it deploys every push, even a red one. ci-cd.yml deploys now, only after green.',
        },
      ],
    },
  ],
})
