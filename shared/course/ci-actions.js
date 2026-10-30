// Unit 9 · Lecture 2 · GitHub Actions for CI/CD: lint, build and run Cypress on every push and
// pull request, check the built site too, and deploy only after the tests pass.
// Follows phase-II/04-Front-End/9-ci-cd/2-gh-actions.md (action versions as of October 2026).
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
          id: 'f1s1', file: '.github/workflows/e2e-tests.yml', mode: 'set',
          code: "name: E2E Tests\n\non:\n  push:\n    branches: [main]\n  pull_request:\n    branches: [main]\n  workflow_dispatch:\n\npermissions:\n  contents: read\n\njobs:\n  cypress-run:\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/checkout@v7\n      - uses: actions/setup-node@v7\n        with:\n          node-version: 24\n          cache: npm\n      - run: npm ci\n      - run: npm run lint\n      - run: npm run build\n      - name: Cypress (dev server)\n        uses: cypress-io/github-action@v7\n        with:\n          install: false\n          start: npm run dev\n          wait-on: 'http://localhost:5173/'",
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
      why: 'The dev server is not what users get. A second Cypress step runs the production smoke test against npm run preview, under /pokemon-app/ with the hash router.',
      steps: [
        {
          id: 'f2s1', file: '.github/workflows/e2e-tests.yml', mode: 'append',
          code: "      - name: Cypress (built site)\n        uses: cypress-io/github-action@v7\n        with:\n          install: false\n          start: npm run preview\n          wait-on: 'http://localhost:4173/pokemon-app/'\n          config: baseUrl=http://localhost:4173/pokemon-app/,specPattern=cypress/e2e-prod/**/*.cy.js",
          say: 'Same action, different server: preview serves dist/ on port 4173, at the base path.',
          notes: [{ match: 'config: baseUrl=http://localhost:4173/pokemon-app/,specPattern=cypress/e2e-prod/**/*.cy.js', what: 'Points Cypress at the built site and the production specs.', why: 'Catches a wrong base or router before users do.' }],
        },
      ],
    },
    {
      id: 'f3', title: 'Deploy only after green',
      why: 'workflow_run starts this workflow when E2E Tests finishes. The if: deploys only when it passed, and only for pushes to main (not pull requests).',
      steps: [
        {
          id: 'f3s1', file: '.github/workflows/deploy.yml', mode: 'set',
          code: "name: Deploy\n\non:\n  workflow_run:\n    workflows: [E2E Tests]\n    branches: [main]\n    types: [completed]\n\nconcurrency:\n  group: pages\n  cancel-in-progress: false\n\njobs:\n  deploy:\n    if: github.event.workflow_run.conclusion == 'success' && github.event.workflow_run.event == 'push'\n    runs-on: ubuntu-latest\n    permissions:\n      contents: write\n    steps:\n      - uses: actions/checkout@v7\n        with:\n          ref: ${{ github.event.workflow_run.head_sha }}\n      - uses: actions/setup-node@v7\n        with:\n          node-version: 24\n          cache: npm\n      - run: npm ci\n      - run: npm run build\n      - name: Publish dist/ to the gh-pages branch\n        env:\n          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}\n        run: |\n          git config user.name 'github-actions[bot]'\n          git config user.email 'github-actions[bot]@users.noreply.github.com'\n          npx gh-pages -d dist -r \"https://x-access-token:${GITHUB_TOKEN}@github.com/${{ github.repository }}.git\"",
          say: 'Waits for E2E Tests; deploys the exact commit that was tested, with the same gh-pages command as npm run deploy.',
          notes: [
            { match: "    if: github.event.workflow_run.conclusion == 'success' && github.event.workflow_run.event == 'push'", what: 'Only after a green run, and only for a push.', why: 'A red run shows this job as skipped; a pull request never deploys.' },
            { match: '          ref: ${{ github.event.workflow_run.head_sha }}', what: 'Check out the commit the tests ran on.', why: 'Not whatever is newest on main by now.' },
            { match: '      contents: write', what: 'This job may push (the gh-pages branch).', why: 'The test workflow only reads; only the deploy writes.' },
            { match: '${{ secrets.GITHUB_TOKEN }}', what: 'A token GitHub creates for each run.', why: 'No password or personal token in the repo, ever.' },
          ],
        },
      ],
    },
  ],
})
