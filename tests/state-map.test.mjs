import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { serve, launch, until } from './helpers.mjs'

let srv, browser
before(async () => { srv = await serve(); browser = await launch() })
after(async () => { await browser?.close(); srv?.close() })

// Lecture 14, slide 4: the hand-built "where state lives" diagram.
const DECK = '/lecture-14-outlet-context/slides.html#4'

async function open() {
  const context = await browser.newContext({ viewport: { width: 1600, height: 900 } })
  const page = await context.newPage()
  const errors = []
  page.on('pageerror', (e) => errors.push(e.message))
  await page.goto(srv.url + DECK)
  await until(page, () => document.querySelector('.slide.active .sm .sm-tag'))
  // Pikachu is fetched when PokeSearch mounts
  await until(page, () => document.querySelector('.slide.active .sm-card[data-name="pikachu"]'))
  return { context, page, errors }
}
const S = '.slide.active .sm '
const val = (page, key, where) => page.textContent(`${S}.sm-tag[data-key="${key}"]${where ? `[data-where="${where}"]` : ''} .sm-val`)
async function go(page, to) {
  await page.click(`${S}.sm-nav [data-go="${to}"]`)
  await until(page, (to) => { const r = document.querySelector('.slide.active .sm'); return r.dataset.path === to && !r.dataset.busy }, to)
}
const cards = (page) => page.$$eval(`${S}.sm-card`, (els) => els.map((e) => e.dataset.name))

test('starts as the app is now: state lives in the components, wires drawn', async () => {
  const { context, page, errors } = await open()
  assert.equal((await val(page, 'count', 'Counter')).trim(), '0')
  assert.equal(await page.$(`${S}.sm-tag[data-where="App"]`), null, 'App owns nothing yet')
  assert.match(await page.textContent(`${S}.sm-outlet-label`), /<Outlet \/>/)
  assert.ok((await page.$$(`${S}.sm-wires path`)).length >= 2, 'prop wires are drawn')
  assert.deepEqual(errors, [])
  await context.close()
})

test('leaving Home unmounts it and throws its state away', async () => {
  const { context, page } = await open()
  await page.click(`${S}.sm-count-btn`)
  await page.click(`${S}.sm-count-btn`)
  assert.equal((await val(page, 'count', 'Counter')).trim(), '2')
  await go(page, '/about')
  assert.equal(await page.$(`${S}.sm-outlet [data-comp="Counter"]`), null)
  assert.ok(await page.$(`${S}.sm-outlet [data-comp="AboutPage"]`))
  assert.ok(await page.$(`${S}.sm-shelf [data-page="HomePage"]:not(.in-outlet)`))
  const log = await page.textContent(`${S}.sm-log`)
  assert.match(log, /unmount.*HomePage/)
  assert.match(log, /count.*0/)
  await go(page, '/')
  assert.equal((await val(page, 'count', 'Counter')).trim(), '0')
  await context.close()
})

test('"move up" puts the state in App and passes it through the Outlet context', async () => {
  const { context, page } = await open()
  await page.click(`${S}.sm-tag[data-key="count"] .sm-move`)
  assert.ok(await page.$(`${S}.sm-tag[data-key="count"][data-where="App"]`))
  assert.match(await page.textContent(`${S}.sm-outlet-label`), /context=\{\{ count, setCount \}\}/)
  assert.match(await page.textContent(`${S}.sm-tag[data-key="count"][data-where="Counter"]`), /useOutletContext/)
  await page.click(`${S}.sm-count-btn`)
  await page.click(`${S}.sm-count-btn`)
  await page.click(`${S}.sm-count-btn`)
  await go(page, '/about')
  assert.equal((await val(page, 'count', 'App')).trim(), '3', 'App keeps it while Home is gone')
  await go(page, '/')
  assert.equal((await val(page, 'count', 'Counter')).trim(), '3')
  // and it can move back down
  await page.click(`${S}.sm-tag[data-key="count"][data-where="App"] .sm-move`)
  assert.equal(await page.$(`${S}.sm-tag[data-where="App"]`), null)
  await context.close()
})

test('state left in a page still resets: username on the login page', async () => {
  const { context, page } = await open()
  await page.click(`${S}.sm-tag[data-key="count"] .sm-move`)
  await go(page, '/login')
  await page.fill(`${S}.sm-user-input`, 'ash')
  assert.equal((await val(page, 'username', 'LoginPage')).trim(), '"ash"')
  await go(page, '/')
  await go(page, '/login')
  assert.equal((await val(page, 'username', 'LoginPage')).trim(), '""')
  await context.close()
})

test('the list: search adds a card; local list is lost, moved list survives', async () => {
  const { context, page } = await open()
  await page.fill(`${S}.sm-name-input`, 'bulbasaur')
  assert.equal((await val(page, 'pokemonName', 'PokeSearch')).trim(), '"bulbasaur"')
  await page.click(`${S}.sm-search`)
  await until(page, () => document.querySelector('.slide.active .sm-card[data-name="bulbasaur"]'))
  await go(page, '/about')
  await go(page, '/')
  await until(page, () => document.querySelector('.slide.active .sm-card[data-name="pikachu"]'))
  assert.deepEqual(await cards(page), ['pikachu'], 'local list started over')

  await page.click(`${S}.sm-tag[data-key="pokemonList"] .sm-move`)
  await page.fill(`${S}.sm-name-input`, 'bulbasaur')
  await page.click(`${S}.sm-search`)
  await until(page, () => document.querySelector('.slide.active .sm-card[data-name="bulbasaur"]'))
  // a card's own shiny state is local to the card
  await page.click(`${S}.sm-card[data-name="bulbasaur"] .sm-shiny`)
  assert.ok(await page.$(`${S}.sm-card[data-name="bulbasaur"].shiny`))
  await go(page, '/about')
  await go(page, '/')
  assert.deepEqual(await cards(page), ['pikachu', 'bulbasaur'], 'App kept the list')
  assert.equal(await page.$(`${S}.sm-card.shiny`), null, 'shiny reset with the card')
  await context.close()
})

test('the Pikachu bug shows up once the list lives in App', async () => {
  const { context, page } = await open()
  await page.click(`${S}.sm-tag[data-key="pokemonList"] .sm-move`)
  await page.click(`${S}.sm-card[data-name="pikachu"] .sm-rm`)
  await until(page, () => !document.querySelector('.slide.active .sm-card'))
  await go(page, '/about')
  await go(page, '/')
  await until(page, () => document.querySelector('.slide.active .sm-card[data-name="pikachu"]'))
  assert.match(await page.textContent(`${S}.sm-log`), /fetch.*pikachu/i)
  await context.close()
})

test('changing a value sends a pulse along its wire', async () => {
  const { context, page } = await open()
  await page.click(`${S}.sm-count-btn`)
  await page.click(`${S}.sm-tag[data-key="pokemonList"] .sm-move`)
  await page.fill(`${S}.sm-name-input`, 'eevee')
  await page.click(`${S}.sm-search`)
  await until(page, () => document.querySelector('.slide.active .sm-wires .sm-pulse'))
  await context.close()
})

test('reset puts everything back', async () => {
  const { context, page } = await open()
  await page.click(`${S}.sm-tag[data-key="count"] .sm-move`)
  await page.click(`${S}.sm-count-btn`)
  await go(page, '/about')
  await page.click(`${S}.sm-reset`)
  await until(page, () => document.querySelector('.slide.active .sm-card[data-name="pikachu"]'))
  assert.equal(await page.$(`${S}.sm-tag[data-where="App"]`), null)
  assert.equal((await val(page, 'count', 'Counter')).trim(), '0')
  await context.close()
})
