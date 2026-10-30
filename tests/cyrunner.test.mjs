import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { serve, launch } from './helpers.mjs'

let srv, browser, page
before(async () => {
  srv = await serve(); browser = await launch()
  page = await browser.newPage({ viewport: { width: 1400, height: 900 } })
  page.on('dialog', (d) => d.dismiss())
  await page.goto(srv.url + '/tests/fixtures/cy.html')
  await page.waitForFunction(() => window.CyRunner)
})
after(async () => { await browser?.close(); srv?.close() })
const run = (spec, opts) => page.evaluate(([s, o]) => window.runSpec(s, o), [spec, opts || {}])

test('a passing test, with beforeEach visit', async () => {
  const r = await run("beforeEach(() => { cy.visit('/') })\nit('should have a heading', () => {\n  cy.get('header').should('be.visible')\n})")
  assert.deepEqual(r.tests.map((t) => [t.title, t.state]), [['should have a heading', 'passed']])
  assert.equal(r.passed, 1)
})

test('a failing length assertion reads like Cypress', async () => {
  const r = await run("it('starts with one card', () => {\n  cy.visit('/')\n  cy.get('#poke-container').children().should('have.length', 1)\n})")
  assert.equal(r.tests[0].state, 'failed')
  assert.match(r.tests[0].error, /Timed out retrying after 4000ms: Not enough elements found\. Found '0', expected '1'\./)
})

test('a missing element reads like Cypress', async () => {
  const r = await run("it('finds the list', () => {\n  cy.visit('/')\n  cy.get('#nope')\n})")
  assert.match(r.tests[0].error, /Timed out retrying after 4000ms: Expected to find element: `#nope`, but never found it\./)
})

test('type with {enter}, click, contains, ids, have.value', async () => {
  const r = await run(`describe('search', () => {
  beforeEach(() => { cy.visit('/') })
  it('adds a card with the button', () => {
    cy.get('input[id=pokemon-name]').type('bulbasaur')
    cy.get('button[type=submit]').click()
    cy.get('#bulbasaur-card').should('be.visible')
    cy.get('#pokemon-name').should('have.value', '')
  })
  it('adds a card with Enter, and each test starts fresh', () => {
    cy.get('#poke-container').children().should('have.length', 0)
    cy.get('#pokemon-name').type('charizard{enter}')
    cy.get('#poke-container').contains('charizard')
    cy.contains('#poke-container div', 'charizard').should('exist')
  })
})`)
  assert.deepEqual(r.tests.map((t) => t.state), ['passed', 'passed'], JSON.stringify(r.tests))
  assert.deepEqual(r.tests.map((t) => t.title), ['search adds a card with the button', 'search adds a card with Enter, and each test starts fresh'])
})

test('have.attr with and(include / not.include)', async () => {
  const r = await run("it('pic', () => {\n  cy.visit('/')\n  cy.get('#pic').should('have.attr', 'src').and('include', 'front_default').and('not.include', 'shiny')\n  cy.get('#pic').should('have.attr', 'alt', 'x')\n})")
  assert.equal(r.tests[0].state, 'passed', r.tests[0].error)
})

test('window:alert is caught and checked with expect', async () => {
  const pass = await run("it('alerts', () => {\n  cy.visit('/')\n  cy.on('window:alert', (text) => { expect(text).to.equal('Pokemon Does not Exist') })\n  cy.get('#warn').click()\n})")
  assert.equal(pass.tests[0].state, 'passed', pass.tests[0].error)
  const fail = await run("it('alerts', () => {\n  cy.visit('/')\n  cy.on('window:alert', (text) => { expect(text).to.equal('nope') })\n  cy.get('#warn').click()\n})")
  assert.equal(fail.tests[0].state, 'failed')
  assert.match(fail.tests[0].error, /expected 'Pokemon Does not Exist' to equal 'nope'/)
})

test('.contain is not a command: a clear TypeError, like Cypress', async () => {
  const r = await run("it('bad', () => {\n  cy.visit('/')\n  cy.get('header').contain('x')\n})")
  assert.equal(r.tests[0].state, 'failed')
  assert.match(r.tests[0].error, /cy\.get\(\.\.\.\)\.contain is not a function/)
})

test('the results panel shows ✓ and ✗ lines and a summary', async () => {
  await run("it('ok', () => { cy.visit('/'); cy.get('header') })\nit('bad', () => { cy.visit('/'); cy.get('#nope') })")
  const t = await page.textContent('.lp-tests')
  assert.match(t, /✓ ok/)
  assert.match(t, /✗ bad/)
  assert.match(t, /Passing: 1/)
  assert.match(t, /Failing: 1/)
})
