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
      id: 'cleanup', title: 'Blank page: "destroy is not a function"', base: 'f4', tabs,
      symptom: 'The page goes blank. The console: useEffect must not return anything besides a function, which is used for clean-up. You returned: true. Then: TypeError: destroy is not a function.',
      breaks: [{ file: APP, mode: 'replace', find: '    return () => { ignore = true }', code: '    return ignore = true' }],
      checks: [allPass, noWarning(/must not return anything besides a function|destroy is not a function/, 'the effect\'s return value')],
      hint: 'What must an effect return: a value, or a function?',
      why: '"return ignore = true" sets ignore at once and returns true. React later calls the return value to clean up, and true is not a function, so the app crashes. Return a function: return () => { ignore = true }.',
    },
    {
      id: 'tracking', testsPass: true, title: '"pokemon list changed" is logged only once', base: 'f4', tabs,
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
      racy: ['should render the Pikachu card on load'],
      checks: [allPass],
      hint: 'StrictMode runs the effect twice in development. What should happen to the answer of the first (cleaned-up) run? And what stops the same Pokemon being added twice?',
      why: 'Two fixes: the cleanup sets ignore = true, so use the answer only if (!ignore); and addPokemonData must skip a Pokemon already in the list (list.some(…) ? list : [...list, data]).',
    },
    {
      id: 'async', title: 'Bonus: blank page after making an effect async', base: 'f4', tabs,
      symptom: 'Someone made the logging effect async. The page goes blank. The console: useEffect must not return anything besides a function… It looks like you wrote useEffect(async () => ...). Then: TypeError: destroy is not a function.',
      breaks: [{ file: APP, mode: 'replace', find: "  useEffect(() => {\n    console.log('page mounted')", code: "  useEffect(async () => {\n    console.log('page mounted')" }],
      checks: [allPass, noWarning(/must not return anything besides a function|destroy is not a function/, 'async effects')],
      hint: 'An async function always returns a promise. What may an effect return?',
      why: 'An async function returns a promise; React tries to call it as the cleanup and crashes. Effects may only return a cleanup function. Don\'t make the effect async; if you need await, put an async function inside and call it.',
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
      id: 'nodeps', testsPass: true, title: 'Bonus: Pikachu keeps coming back', base: 'f4', tabs,
      symptom: 'Click Remove on Pikachu: a moment later Pikachu is back. The Network tab shows a new pikachu request after every click and every key you type.',
      breaks: [{ file: APP, mode: 'replace', find: '    return () => { ignore = true }\n  }, [])', code: '    return () => { ignore = true }\n  })' }],
      checks: [allPass, { name: 'a removed Pikachu stays removed', run: async (doc, win, ctx) => {
        await ctx.wait(1500)
        const btn = ctx.doc().querySelector('#pikachu-card button')
        if (!btn) return false
        btn.click()
        await ctx.wait(1500)
        return !ctx.doc().querySelector('#pikachu-card')
      } }],
      hint: 'With no dependency array, when does an effect run?',
      why: 'No array = after every render. Removing Pikachu renders again, so the effect loads Pikachu again. Start-up work needs []: }, []).',
    },
    {
      id: 'url', title: 'Bonus: "Request failed with status code 404" on load', base: 'f4', tabs,
      symptom: 'No Pikachu. The console: Uncaught (in promise) AxiosError: Request failed with status code 404.',
      breaks: [{ file: APP, mode: 'replace', find: "axios.get('https://pokeapi.co/api/v2/pokemon/pikachu')", code: "axios.get('https://pokeapi.co/api/v2/pokemon/pikachuu')" }],
      checks: [allPass],
      hint: 'Read the URL letter by letter (the Network tab shows it).',
      why: 'The name in the URL must be exact: /pokemon/pikachu.',
    },
  ]
  root.FIXIT = root.FIXIT || {}
  root.FIXIT['hooks-useeffect'] = problems
})(typeof self !== 'undefined' ? self : globalThis)
