// Fix it problems for unit 4 · lecture 2 (useEffect). The check is the whole test suite,
// plus the console for React warnings and effect logs.
;(function (root) {
  const APP = 'src/App.jsx'
  const tabs = [APP, 'cypress/e2e/home.cy.js', 'cypress/e2e/pokemon.cy.js']
  const N = 12
  const allPass = { name: `all ${N} tests pass`, run: async (doc, win, ctx) => { const t = await ctx.runTests(); return t.length === N && t.every((x) => x.state === 'passed') } }
  const noWarning = (re, label) => ({ name: `no React warning about ${label}`, run: (doc, win, ctx) => !ctx.console().some((l) => re.test(l)) })
  const problems = [
    {
      id: 'deps', title: 'The background never changes', base: 'f4', tabs,
      symptom: 'Click "Click me!": the count goes up, the background stays light blue.',
      breaks: [{ file: APP, mode: 'replace', find: '  }, [count])', code: '  }, [])' }],
      checks: [allPass],
      hint: 'When does an effect with [] run again?',
      why: '[] = only after the first render. The effect reads count, so count belongs in the array: [count].',
    },
    {
      id: 'import', title: 'Blank page: "useEffect is not defined"', base: 'f4', tabs,
      symptom: 'Nothing renders; the console says ReferenceError: useEffect is not defined.',
      breaks: [{ file: APP, mode: 'replace', find: "import { useState, useEffect } from 'react'", code: "import { useState } from 'react'" }],
      checks: [allPass],
      hint: 'Where do hooks come from?',
      why: 'Hooks are imported from react: import { useState, useEffect } from \'react\'.',
    },
    {
      id: 'nofetch', title: 'No Pikachu on load', base: 'f4', tabs,
      symptom: 'The page opens with no cards. The effect is there, but nothing is requested.',
      breaks: [{ file: APP, mode: 'replace', find: "    axios.get('https://pokeapi.co/api/v2/pokemon/pikachu')\n      .then((response) => { if (!ignore) addPokemonData(response.data) })\n", code: '' }],
      checks: [allPass],
      hint: 'What should the start-up effect actually do?',
      why: 'The effect must request Pikachu and add it: axios.get(…pikachu).then((response) => { if (!ignore) addPokemonData(response.data) }).',
    },
    {
      id: 'cleanup', title: 'No Pikachu, and a warning about the return value', base: 'f4', tabs,
      symptom: 'No Pikachu on load. The console: An effect function must not return anything besides a function, which is used for clean-up.',
      breaks: [{ file: APP, mode: 'replace', find: '    return () => { ignore = true }', code: '    return ignore = true' }],
      checks: [allPass, noWarning(/must not return anything besides a function/, 'the effect\'s return value')],
      hint: 'What must an effect return: a value, or a function?',
      why: '"return ignore = true" sets ignore right away (so the answer is ignored) and returns true. Return a function: return () => { ignore = true }.',
    },
    {
      id: 'tracking', title: '"pokemon list changed" is logged only once', base: 'f4', tabs,
      symptom: 'The tracking effect should log every time the list changes, but it logs once and never again.',
      breaks: [{ file: APP, mode: 'replace', find: '  }, [pokemonList])', code: '  }, [])' }],
      checks: [allPass, { name: 'the tracking effect logs again after a change', run: async (doc, win, ctx) => {
        await ctx.wait(1500)
        const before = ctx.console().filter((l) => l.startsWith('pokemon list changed')).length
        const btn = [...ctx.doc().querySelectorAll('#poke-container button')].find((b) => b.textContent === 'Remove')
        if (!btn) return false
        btn.click()
        await ctx.wait(300)
        return ctx.console().filter((l) => l.startsWith('pokemon list changed')).length > before
      } }],
      hint: 'The effect reads pokemonList. What must the dependency array say?',
      why: 'Put every value the effect reads in its array: [pokemonList]. Then it runs again on every change.',
    },
    {
      id: 'double', title: 'Two Pikachu cards on load', base: 'f4', tabs,
      symptom: 'In development the page opens with two Pikachu cards (and a duplicate key warning).',
      breaks: [
        { file: APP, mode: 'replace', find: 'setPokemonList((list) => (list.some((pokemon) => pokemon.id === data.id) ? list : [...list, data]))', code: 'setPokemonList((list) => [...list, data])' },
        { file: APP, mode: 'replace', find: '{ if (!ignore) addPokemonData(response.data) }', code: '{ addPokemonData(response.data) }' },
      ],
      solve: [{ file: APP, mode: 'replace', find: 'setPokemonList((list) => (list.some((pokemon) => pokemon.id === data.id) ? list : [...list, data]))', code: 'setPokemonList((list) => [...list, data])' }],
      checks: [allPass],
      hint: 'StrictMode runs the effect twice in development. What should happen to the answer of the first (cleaned-up) run?',
      why: 'The cleanup sets ignore = true; the first run\'s answer must be ignored: if (!ignore) addPokemonData(…). That fixes it even without the duplicate guard.',
    },
    {
      id: 'async', title: 'Bonus: "useEffect must not return anything besides a function"', base: 'f4', tabs,
      symptom: 'Someone made the logging effect async. The console warns: It looks like you wrote useEffect(async () => ...).',
      breaks: [{ file: APP, mode: 'replace', find: "  useEffect(() => {\n    console.log('page mounted')", code: "  useEffect(async () => {\n    console.log('page mounted')" }],
      checks: [allPass, noWarning(/useEffect must not return anything besides a function/, 'async effects')],
      hint: 'An async function always returns a promise. What may an effect return?',
      why: 'Effects may only return a cleanup function. Don\'t make the effect async; if you need await, put an async function inside and call it.',
    },
    {
      id: 'stringdeps', title: 'Bonus: the background changes once, then never', base: 'f4', tabs,
      symptom: 'The background is light blue and never follows the clicks.',
      breaks: [{ file: APP, mode: 'replace', find: '  }, [count])', code: "  }, ['count'])" }],
      checks: [allPass],
      hint: 'Is the dependency the variable count, or the word "count"?',
      why: "'count' is a string that never changes, so the effect never runs again. Use the variable: [count].",
    },
    {
      id: 'ignore', title: 'Bonus: Pikachu never shows', base: 'f4', tabs,
      symptom: 'The Pikachu request succeeds (200), but no card appears and there is no error.',
      breaks: [{ file: APP, mode: 'replace', find: '{ if (!ignore) addPokemonData(response.data) }', code: '{ if (ignore) addPokemonData(response.data) }' }],
      checks: [allPass],
      hint: 'When should the answer be used: when ignore is true, or false?',
      why: 'Use the answer only if this effect was not cleaned up: if (!ignore).',
    },
    {
      id: 'url', title: 'Bonus: "Request failed with status code 404" on load', base: 'f4', tabs,
      symptom: 'No Pikachu, and the start-up request answers 404.',
      breaks: [{ file: APP, mode: 'replace', find: "axios.get('https://pokeapi.co/api/v2/pokemon/pikachu')", code: "axios.get('https://pokeapi.co/api/v2/pokemon/pikachuu')" }],
      checks: [allPass],
      hint: 'Read the URL letter by letter (the Network tab shows it).',
      why: 'The name in the URL must be exact: /pokemon/pikachu.',
    },
  ]
  root.FIXIT = root.FIXIT || {}
  root.FIXIT['hooks-useeffect'] = problems
})(typeof self !== 'undefined' ? self : globalThis)
