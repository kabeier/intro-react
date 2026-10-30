// Fix it problems for unit 2 · lecture 2 (requests). Checks drive the real app
// (live PokeAPI) and read ctx.alerts instead of showing pop-ups.
;(function (root) {
  const search = async (doc, ctx, name) => {
    const box = doc.querySelector('#pokemon-name'), form = doc.querySelector('form')
    if (!box || !form) return false
    box.value = name
    form.requestSubmit()
    await ctx.wait(150)
    await ctx.settled()
    return true
  }
  const waitFor = async (ctx, sel, ms = 8000) => {
    for (let t = 0; t < ms; t += 200) { if (ctx.doc().querySelector(sel)) return true; await ctx.wait(200) }
    return false
  }
  const cardFor = async (doc, ctx, name) => (await search(doc, ctx, name)) && waitFor(ctx, `#${name}-card img`)
  const problems = [
    {
      id: 'prevent', title: 'Search reloads the page', base: 'f7',
      symptom: 'Press Search: the page flashes and no card appears.',
      breaks: [{ file: 'src/App.jsx', mode: 'replace', find: '    event.preventDefault()\n', code: '' }],
      checks: [{ name: 'searching pikachu shows its card', run: (doc, win, ctx) => cardFor(doc, ctx, 'pikachu') }],
      hint: 'A form submit has a default action. Which line stops it?',
      why: 'Without event.preventDefault() the browser reloads the page on submit, and the request never finishes.',
    },
    {
      id: 'await', title: '"Pokemon Does not Exist" for pikachu', base: 'f7',
      symptom: 'Every search, even pikachu, says Pokemon Does not Exist. The console: Request failed: Cannot read properties of undefined (reading \'name\').',
      breaks: [{ file: 'src/App.jsx', mode: 'replace', find: 'const response = await axios.get', code: 'const response = axios.get' }],
      checks: [{ name: 'searching pikachu shows its card', run: (doc, win, ctx) => cardFor(doc, ctx, 'pikachu') }],
      hint: 'axios.get gives back a promise. What turns a promise into the response?',
      why: 'Without await, response is a Promise, so response.data is undefined. await waits for the real response.',
    },
    {
      id: 'path', title: 'Every search fails', base: 'f7',
      symptom: 'The request works (status 200 in the Network tab), but no card and the alert says Pokemon Does not Exist.',
      breaks: [{ file: 'src/App.jsx', mode: 'replace', find: 'data.sprites.front_default', code: 'data.sprite.front_default' }],
      checks: [{ name: 'searching pikachu shows its card', run: (doc, win, ctx) => cardFor(doc, ctx, 'pikachu') }],
      hint: 'console.log(response.data) and look at the exact key that holds the pictures.',
      why: 'The key is sprites (plural). Any error inside try, not only a failed request, lands in catch.',
    },
    {
      id: 'dup', title: 'Two Pikachu cards', base: 'f7',
      symptom: 'Search pikachu twice: two identical cards.',
      breaks: [{ file: 'src/App.jsx', mode: 'replace', find: '    if (document.getElementById(`${data.name}-card`)) return\n', code: '' }],
      checks: [{ name: 'a second search adds no second card', run: async (doc, win, ctx) => {
        if (!(await cardFor(doc, ctx, 'pikachu'))) return false
        await search(ctx.doc(), ctx, 'pikachu')
        for (let t = 0; t < 6000; t += 250) {
          if (ctx.doc().querySelectorAll('[id="pikachu-card"]').length > 1) return false
          await ctx.wait(250)
        }
        return true
      } }],
      hint: 'Before building a card, check whether one with this id already exists.',
      why: 'if (document.getElementById(`${data.name}-card`)) return stops a second card (and keeps ids unique).',
    },
    {
      id: 'reset', title: 'The old name stays in the box', base: 'f7',
      symptom: 'After a search the box still says pikachu.',
      breaks: [{ file: 'src/App.jsx', mode: 'replace', find: '    event.target.reset()\n', code: '' }],
      checks: [{ name: 'the box is empty after a search', run: async (doc, win, ctx) => (await search(doc, ctx, 'pikachu')) && ctx.doc().querySelector('#pokemon-name').value === '' }],
      hint: 'A form element has a method that clears all its fields.',
      why: 'event.target is the form; event.target.reset() clears it, ready for the next name.',
    },
    {
      id: 'alert', title: 'A wrong name does nothing', base: 'f7',
      symptom: 'Search pikachoo: no card and no message. Only the console shows the 404.',
      breaks: [{ file: 'src/App.jsx', mode: 'replace', find: '      alert("Pokemon Does not Exist")\n', code: '' }],
      checks: [{ name: 'the user is told the Pokemon does not exist', run: async (doc, win, ctx) => {
        await search(doc, ctx, 'pikachoo')
        for (let t = 0; t < 8000 && !ctx.alerts.length; t += 200) await ctx.wait(200)
        return ctx.alerts.some((a) => a.trim().length > 0)
      } }],
      hint: 'The console is for developers. What does the user see when a request fails?',
      why: 'Errors must be visible to the user: alert("Pokemon Does not Exist") in catch.',
    },
    {
      id: 'empty', title: 'Bonus: an empty search shows an error', base: 'f7',
      symptom: 'Press Search with an empty box: "Pokemon Does not Exist".',
      breaks: [{ file: 'src/App.jsx', mode: 'replace', find: '    if (!name) return\n', code: '' }],
      checks: [{ name: 'an empty search does nothing', run: async (doc, win, ctx) => {
        await search(doc, ctx, '')
        await ctx.wait(6000)
        return ctx.alerts.length === 0 && ctx.doc().querySelectorAll('#poke-container > *').length === 0
      } }],
      hint: 'What does the URL look like with no name? What should happen instead?',
      why: '/api/v2/pokemon/ with no name returns a list, not a Pokemon, so the card code fails. Stop early: if (!name) return.',
    },
    {
      id: 'called', title: 'Bonus: "Cannot read properties of undefined (reading \'preventDefault\')"', base: 'f7',
      symptom: 'The page breaks as soon as it loads; the console says: Cannot read properties of undefined (reading \'preventDefault\').',
      breaks: [{ file: 'src/App.jsx', mode: 'replace', find: 'onSubmit={(event) => handleSubmit(event)}', code: 'onSubmit={handleSubmit(event)}' }],
      checks: [{ name: 'searching pikachu shows its card', run: (doc, win, ctx) => cardFor(doc, ctx, 'pikachu') }],
      hint: 'onSubmit wants a function for later. What does handleSubmit(event) do right now?',
      why: 'handleSubmit(event) runs during render, before any submit, so there is no submit event yet. Pass a function: onSubmit={(event) => handleSubmit(event)} or onSubmit={handleSubmit}.',
    },
    {
      id: 'append', title: 'Bonus: the request works, no card appears', base: 'f7',
      symptom: 'Search pikachu: status 200, no error, no card.',
      breaks: [{ file: 'src/App.jsx', mode: 'replace', find: '    document.querySelector("#poke-container").appendChild(card)\n', code: '' }],
      checks: [{ name: 'searching pikachu shows its card', run: (doc, win, ctx) => cardFor(doc, ctx, 'pikachu') }],
      hint: 'The card is built. Is it ever put on the page?',
      why: 'createElement makes the card in memory; appendChild puts it in #poke-container.',
    },
    {
      id: 'selector', title: 'Bonus: "Cannot read properties of null (reading \'appendChild\')"', base: 'f7',
      symptom: 'Every search ends in Pokemon Does not Exist; the console says Cannot read properties of null (reading \'appendChild\').',
      breaks: [{ file: 'src/App.jsx', mode: 'replace', find: 'document.querySelector("#poke-container")', code: 'document.querySelector("#pokemon-container")' }],
      checks: [{ name: 'searching pikachu shows its card', run: (doc, win, ctx) => cardFor(doc, ctx, 'pikachu') }],
      hint: 'Compare the id in querySelector with the id on the div in the JSX.',
      why: 'querySelector returns null when nothing matches; the next call on null crashes. The div is #poke-container.',
    },
  ]
  root.FIXIT = root.FIXIT || {}
  root.FIXIT['async-requests'] = problems
})(typeof self !== 'undefined' ? self : globalThis)
