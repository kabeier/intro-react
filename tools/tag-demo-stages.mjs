#!/usr/bin/env node
// Tag every stage of the unit 9 live demo in the code repo, so the instructor can jump the demo
// folder (intro-gh-pages-deploy) to a stage with one command: git reset --hard demo-l15-2-base
//   node tools/tag-demo-stages.mjs [repo folder]        (default ../intro-react-code)
// Run it after every rebuild of the code repo, then: git push --force code 'refs/tags/demo-*'
// (from the code repo: git push --force origin 'refs/tags/demo-*').
import { execFileSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const REPO = path.resolve(process.argv[2] || path.join(ROOT, '..', 'intro-react-code'))
const git = (...a) => execFileSync('git', a, { cwd: REPO, encoding: 'utf8' }).trim()

// [tag prefix, the lecture's branch, the branch it starts from, a short name per feature]
const LECTURES = [
  ['demo-l15', 'unit-9-lecture-1-deploy-pages', 'unit-8-lecture-2-outlet-context', ['workflow', 'base', 'hash']],
  ['demo-l16', 'unit-9-lecture-2-ci-actions', 'unit-9-lecture-1-deploy-pages', ['ci', 'built-site', 'deploy-job']],
]

for (const [prefix, branch, start, names] of LECTURES) {
  const tags = [[`${prefix}-0-start`, git('rev-parse', start)]]
  // one commit per feature, oldest first, named "Unit 9 Lecture N, feature K: …"
  const commits = git('log', '--reverse', '--format=%H %s', `${start}..${branch}`).split('\n')
  if (commits.length !== names.length) throw new Error(`${branch}: ${commits.length} commits, expected ${names.length}`)
  commits.forEach((line, i) => {
    const [sha, ...subject] = line.split(' ')
    if (!subject.join(' ').includes(`feature ${i + 1}:`)) throw new Error(`${branch}: commit ${i + 1} is "${subject.join(' ')}"`)
    tags.push([`${prefix}-${i + 1}-${names[i]}`, sha])
  })
  for (const [tag, sha] of tags) {
    git('tag', '-f', tag, sha)
    console.log(`${tag.padEnd(24)} ${sha.slice(0, 7)} ${git('log', '-1', '--format=%s', sha)}`)
  }
}
