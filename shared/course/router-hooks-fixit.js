// Fix it problems for unit 8 · lecture 1 (useParams, useNavigate). The check is the whole test suite.
;(function (root) {
  const ROUTER = 'src/router.jsx', DETAILS = 'src/pages/PokemonDetailsPage.jsx', LOGIN = 'src/pages/LoginPage.jsx'
  const BACK = 'src/components/BackButton/BackButton.jsx', CARD = 'src/components/PokeSearch/PokeCard.jsx'
  const SPEC = 'cypress/e2e/details.cy.js'
  const N = 30
  const allPass = { name: `all ${N} tests pass`, run: async (doc, win, ctx) => { const t = await ctx.runTests(); return t.length === N && t.every((x) => x.state === 'passed') } }
  const problems = [
    {
      id: 'param', title: 'The details page says "Pokemon not found" for Pikachu', base: 'f6', tabs: [DETAILS, ROUTER],
      symptom: '/pokemon/25 says "Pokemon not found". The Network tab shows a request to …/pokemon/undefined.',
      breaks: [{ file: DETAILS, mode: 'replace', find: '  const { id } = useParams()', code: '  const { pokemonId: id } = useParams()' }],
      checks: [allPass],
      hint: 'The route says :id. What name does the page read?',
      why: 'useParams uses the names from the route: pokemon/:id gives { id }. Reading pokemonId gives undefined.',
    },
    {
      id: 'colon', title: '/pokemon/25 is a 404', base: 'f6', tabs: [ROUTER],
      symptom: 'Every details link shows "404 - Page Not Found".',
      breaks: [{ file: ROUTER, mode: 'replace', find: "{ path: 'pokemon/:id', element: <PokemonDetailsPage /> }", code: "{ path: 'pokemon/id', element: <PokemonDetailsPage /> }" }],
      checks: [allPass],
      hint: 'What turns part of a path into a parameter?',
      why: 'Without the colon, pokemon/id only matches the literal address /pokemon/id. Write pokemon/:id.',
    },
    {
      id: 'deps', title: 'Details never change from the first Pokemon', base: 'f6', tabs: [DETAILS],
      symptom: 'Open Pikachu\'s details, then change only the id in the URL (/pokemon/1) without a reload: still Pikachu. No link does this, so you won\'t see it by clicking: read the dependency array.',
      breaks: [{ file: DETAILS, mode: 'replace', find: '  }, [id])', code: '  }, [])' }],
      checks: [allPass, { name: 'the page follows the id in the URL', run: async (doc, win, ctx) => {
        await ctx.wait(800)
        const w = ctx.doc().defaultView
        if (!w.__ROUTER) return false
        // Open Pikachu's page first, then change only the id (the page stays mounted).
        w.__ROUTER.navigate('/pokemon/25')
        for (let i = 0; i < 40; i++) { await ctx.wait(100); const h = ctx.doc().querySelector('h2'); if (h && /pikachu/.test(h.textContent)) break }
        w.__ROUTER.navigate('/pokemon/1')
        for (let i = 0; i < 40; i++) { await ctx.wait(100); const h = ctx.doc().querySelector('h2'); if (h && /bulbasaur/.test(h.textContent)) return true }
        return false
      } }],
      testsPass: true,
      hint: 'When does the effect run again?',
      why: 'The page stays mounted when only the id changes. The effect reads id, so it belongs in the array: [id].',
    },
    {
      id: 'loading', title: '"Cannot read properties of null (reading \'sprites\')"', base: 'f6', tabs: [DETAILS],
      symptom: 'Opening a details page shows "Something went wrong: Cannot read properties of null (reading \'sprites\')" inside the layout.',
      breaks: [{ file: DETAILS, mode: 'replace', find: '  if (!pokemon) return <Spinner animation="border" role="status" />\n', code: '' }],
      checks: [allPass],
      hint: 'What is pokemon on the very first render, before the answer arrives?',
      why: 'The first render has pokemon = null. Return a spinner until it arrives: if (!pokemon) return <Spinner … />.',
    },
    {
      id: 'navigate', title: 'Log In with a name does nothing', base: 'f6', tabs: [LOGIN, SPEC],
      symptom: 'Type a name, click Log In: you stay on /login. No error. "logs in and goes home" fails.',
      breaks: [{ file: LOGIN, mode: 'replace', find: "    navigate('/')\n", code: '' }],
      checks: [allPass],
      hint: 'After the check passes, what moves the user?',
      why: 'Call navigate(\'/\') once the name is valid.',
    },
    {
      id: 'details', title: 'Details goes to the wrong Pokemon', base: 'f6', tabs: [CARD],
      symptom: 'Every Details link opens /pokemon/undefined: "Pokemon not found".',
      breaks: [{ file: CARD, mode: 'replace', find: 'to={`/pokemon/${pokemon.id}`}', code: 'to={`/pokemon/${pokemon.ID}`}' }],
      checks: [allPass],
      hint: 'Check the property name against the fixture (or the API).',
      why: 'The API\'s field is id (lowercase): to={`/pokemon/${pokemon.id}`}.',
    },
    {
      id: 'empty', title: 'Bonus: an empty name logs in', base: 'f6', tabs: [LOGIN],
      symptom: 'Log In with an empty box goes home. "stays on the login page with an empty name" fails.',
      breaks: [{ file: LOGIN, mode: 'replace', find: '    if (!username.trim()) return\n', code: '' }],
      checks: [allPass],
      hint: 'What stops an empty name?',
      why: 'Check before navigating: if (!username.trim()) return.',
    },
    {
      id: 'backcall', title: 'Bonus: every link bounces back to Home', base: 'f6', tabs: [BACK],
      symptom: 'Click About (or any link): you bounce straight back to Home. The console: You should call navigate() in a React.useEffect(), not when your component is first rendered. And: Expected `onClick` listener to be a function.',
      breaks: [{ file: BACK, mode: 'replace', find: 'onClick={goBack}', code: 'onClick={goBack()}' }],
      checks: [allPass],
      hint: 'Is goBack called on click, or while the button is drawn?',
      why: 'onClick={goBack()} navigates during render. Pass the function: onClick={goBack}.',
    },
    {
      id: 'reload', title: 'Bonus: Log In reloads the page', base: 'f6', tabs: [LOGIN],
      symptom: 'Click Log In: the whole page reloads and you are still on /login.',
      breaks: [{ file: LOGIN, mode: 'replace', find: '    event.preventDefault()\n', code: '' }],
      checks: [allPass],
      hint: 'What does a form do by default when submitted?',
      why: 'A form submit reloads the page unless the handler calls event.preventDefault() first.',
    },
    {
      id: 'catch', title: 'Bonus: an unknown Pokemon spins forever', base: 'f6', tabs: [DETAILS],
      symptom: '/pokemon/99999 shows a spinner forever. The console: Uncaught (in promise) AxiosError: Request failed with status code 404.',
      breaks: [{ file: DETAILS, mode: 'replace', find: "      .catch(() => { if (!ignore) setError('Pokemon not found') })\n", code: '' }],
      checks: [allPass],
      hint: 'Who handles a failed request?',
      why: 'Add .catch(() => { if (!ignore) setError(\'Pokemon not found\') }) so a 404 shows the message.',
    },
  ]
  root.FIXIT = root.FIXIT || {}
  root.FIXIT['router-hooks'] = problems
})(typeof self !== 'undefined' ? self : globalThis)
