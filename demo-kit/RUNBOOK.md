# Runbook · Unit 2 (React and Requests)

## Before class

**N counts below include the red press:** a step that removes code takes two presses. The first shows the code that goes in red (crossed out); the second deletes it and types the new code. The presenter window says "red shown" between them.

| Do | Why |
|---|---|
| Docker Desktop running; Node 24 on the laptop | students follow along with both |
| Open the site → Open the slides, **Ctrl+Shift+R**, **F**, **P** | deck + notes |
| Open one code slide and wait a few seconds | the preview loads React and Babel from the internet the first time |
| Share the **whole screen** if you use **↗ Pop out** | separate window |

Install steps: **N** types `npm install …` into the slide's terminal (it opens by itself) and npm writes package.json; nobody types dependency lines. Students can type the command into that terminal too. **>_ Terminal** opens and closes it.

Keys: **N** next step · **Shift+N** reset · **A** live app · **↗ Pop out** (real DevTools there).

Buttons do the same by mouse: **▶ Next line** and **↺ Reset** on every code slide's bar (students following along use these; Reset also stops a step halfway through typing). The presenter window shows **Type next step (N)** with "Typed 2 of 6 steps", and **↺ Reset slide code (Shift+N)**.

## Lecture 1 · React + Vite (~40 min)
| # | Min | Do | Say |
|---|---|---|---|
| 1 | 0 | T | React draws the page, Vite runs it |
| 2 | 1 | — | two tools, two jobs |
| 3 | 3 | — | virtual DOM = compare with the previous render |
| 4 | 5 | students run create vite in a terminal | @latest, --template react |
| 5 | 7 | **N ×1** | --host |
| 6 | 9 | **N ×6**, students `bash run_container.sh` | flag table in notes |
| 7 | 14 | — | file tour |
| 8 | 15 | DevTools → Elements on the pop-out | index.html → main.jsx → App |
| 9 | 17 | **N ×10**, A | make the page ours |
| 10 | 20 | — | JSX rules |
| 11–13 | 21–25 | **N** through each | {}, functions, className + import |
| 14 | 27 | — | all CSS is one stylesheet (two .title rules clash); optional page for the curious |
| 15 | 28 | **N** through | style object |
| 16 | 30 | timer | Fix It (JSX) 1–6 |
| 17 | 37 | — | homework |

## Lecture 2 · Async Requests (~40 min)
| # | Min | Do | Say |
|---|---|---|---|
| 1 | 0 | T; raw JSON tab open | ask a server, wait without freezing |
| 2 | 1 | show the JSON | request → 200 + JSON / 404 |
| 3 | 3 | — | sync vs async; promise states |
| 4 | 5 | **N** runs `npm install axios@1.20.0` in the slide's terminal; students type it in theirs | npm writes package.json; rebuild the Docker image after installing |
| 5 | 7 | **N ×8** | the ids are for tests and unit 4 |
| 6 | 11 | **N ×4**, A, search Pikachu | Console shows "pikachu" |
| 7 | 14 | **N ×6**; after N 3 search: pending Promise; try pikachoo | then / catch / finally |
| 8 | 19 | **N ×5** | createElement inside React |
| 9 | 23 | — | catch catches our bugs too |
| 10 | 24 | **N ×5** | await |
| 11 | 27 | — | .then vs await |
| 12 | 28 | **N ×2**; pikachoo, pikachu twice | alert; no duplicates |
| 13 | 31 | timer | Fix It (requests) 1–6 |
| 14 | 37 | — | React doesn't know these cards: unit 4 |
| 15 | 38 | — | homework Part II |

## Things to expect
- **No internet** = no preview (React loads from the internet) and no PokeAPI.
- **Pop-ups**: the alert in lecture 2 is a real browser alert over the deck. Click OK.
- **Each save reloads the app** in the preview: cards disappear. Real Vite keeps state for small edits (Fast Refresh).
- **Docker: "vite: not found"**: the `-v /app/node_modules` line is missing. **Port 5173 doesn't answer**: `--host` missing in package.json.
- **After `npm install axios` on the laptop** the container still lacks it: rebuild the image (or `docker exec react-container npm install`).


# Runbook · Unit 3 (End-to-End Testing)

Before class: the unit 2 app running in Docker; Node 24 on your laptop; `npm install` done there (Cypress downloads its app once). In the slides, **▶ Run tests** runs the specs beside the live app; the results were checked against real Cypress 16.2.0 (tools/real-cypress.mjs).

## Lecture 1 · Cypress and React
| # | Min | Do | Say |
|---|---|---|---|
| 1–4 | 0–5 | — | why test; unit / integration / e2e; why Cypress |
| 5 | 6 | **N ×2** (N 1 runs `npm install cypress --save-dev` in the slide's terminal; students type it on the laptop) | dev dependency; two scripts |
| 6 | 9 | — | app in Docker, Cypress on the laptop |
| 7 | 11 | **N ×4** | config, gitignore, lint globals |
| 8–9 | 15–17 | — | folders; anatomy of a test |
| 10 | 19 | **N ×3**, ▶ Run tests; break one, run again | visit, find, check |
| 11 | 24 | `npm run cy:open` live | cy:open vs cy:run |
| 12 | 26 | — | reading a red test |
| 13 | 28 | timer | Fix It (setup) 1–6 |
| 14–15 | 35–37 | — | tests change in unit 4; homework I |

## Lecture 2 · Cypress Assertions
| # | Min | Do | Say |
|---|---|---|---|
| 1–3 | 0–3 | — | test what users see; features → tests |
| 4 | 5 | **N ×3**, ▶ Run tests | type, click, ids |
| 5 | 9 | — | commands and assertions |
| 6–7 | 11–14 | **N** through, ▶ Run tests (8 green); delete the duplicate guard, ▶ (red), put it back | {enter}, have.value, edge cases; Charizard tells the test when to count |
| 8 | 18 | break a test on purpose | reading a red test |
| 9 | 19 | open pokeapi.co/api/v2/pokemon/pikachoo | the real PokeAPI's answers |
| 10 | 21 | **E**, delete `if (!name) return`, ▶ (red), put it back, ▶ | break it on purpose |
| 11 | 23 | — | a test that can't fail tests nothing |
| 12 | 25 | timer (8 min) | Fix It (assertions) 1–6 |
| 13–14 | 33–36 | — | unit 4 preview; homework II |

Every test calls the live PokeAPI: no stubs. The laptop (and the Fix It checks) need internet.

Things to expect: students running Cypress inside Docker (it must run on the laptop); Node 25 on the laptop (Cypress 16 refuses it: use 24); `cy:run` without the app running ("cy.visit() failed trying to load").

# Runbook · Unit 4 (React Hooks)

Before class: as unit 3. From now on every feature starts with a failing test: press **▶ Run tests** after the test step (red) and after the code (green).

## Lecture 1 · useState
| # | Min | Do | Say |
|---|---|---|---|
| 1–3 | 0–3 | — | by hand vs state; event → setter → render |
| 4 | 4 | timer; open **state-hunt**; go round the room, type the box #, press **Answer** after each student | State Hunt: what does each box remember? (about 15 s a student) |
| 5 | 12 | — | red, green, tidy |
| 6 | 13 | **N** 1, ▶ (red); **N** 2–4, ▶ (green) | first state: the title |
| 7 | 17 | — | [value, setter]; rules of hooks |
| 8–9 | 18–21 | **N ×3**, ▶ red then green | functional update |
| 10 | 22 | ▶, **N ×7**, ▶ (green both times) | a refactor keeps behaviour |
| 11 | 26 | **N ×7**, ▶ all green | generateCard is gone; tests say users can't tell |
| 12 | 32 | — | new arrays; spread (not "deconstruction") |
| 13 | 33 | **N ×3**, ▶ red then green | Remove with filter |
| 14 | 36 | — | mental model |
| 15 | 37 | — | homework I; Fix It (useState) 1–6 is practice after class |

State Hunt: the harder boxes (something changes but is not state) are 4, 8, 12, 13, 19, 20, 26, 27, 30. Fewer students than boxes: go round twice or press **Random box**.

## Lecture 2 · useEffect
| # | Min | Do | Say |
|---|---|---|---|
| 1–2 | 0–1 | — | rendering is pure; effects run after |
| 3 | 3 | **N ×2**, **A**; read the Console | mounted, unmounted, mounted = StrictMode |
| 4–5 | 7–9 | **N** | dependency array; track pokemonList |
| 6 | 11 | — | mount, update, unmount |
| 7 | 13 | **N** 1, ▶ (red); **N** 2, ▶ (green); click "Click me!" | a visible side effect |
| 8–9 | 17–18 | **N** 1, ▶ (red); **N** 2–3, ▶ (green) | planned change: tests first |
| 10–11 | 24–26 | — | the ignore flag; when not to use an effect |
| 12 | 28 | timer | Fix It (useEffect) 1–6 |
| 13–14 | 35–37 | — | mental model; homework II |

Things to expect: "my effect runs twice" (StrictMode, development only: write the cleanup, keep StrictMode); `onClick={setX(…)}` (Too many re-renders); `list.push` then set (no re-render); an async effect function (blank page: destroy is not a function).

# Runbook · Unit 5 (React Components)

Before class: as unit 4. Lecture 1 is a refactor: the 12 tests are green before and after every feature. Lecture 2 is red, green again.

## Lecture 1 · Components and props
| # | Min | Do | Say |
|---|---|---|---|
| 1–3 | 0–3 | — | why components; function, PascalCase, import/export, used as a tag |
| 4 | 5 | **N ×8**, ▶ green; type `<counter />` → ▶ red → fix | first component |
| 5 | 10 | — | a refactor: green before and after |
| 6 | 11 | **N ×9**, ▶ | one folder per component, index.js |
| 7 | 14 | — | props: one object; children; read-only; destructuring |
| 8 | 16 | **N ×8**, ▶ | Button with children |
| 9 | 20 | **N ×4**, ▶ | PokeSearch owns the search |
| 10 | 24 | **N ×4**, ▶; drop rmData → red → back | PokeCard with props |
| 11 | 27 | — | data down, functions up; prop drilling |
| 12–13 | 28–30 | **N ×5** (slide 12), **N ×4** (slide 13), ▶ all 12 green | PokeContainer, PokeForm |
| 14 | 32 | timer | Fix It (components) 1–6 |
| 15–16 | 38–39 | — | mental model; homework I |

## Lecture 2 · Component-level state
| # | Min | Do | Say |
|---|---|---|---|
| 1–3 | 0–3 | — | parent → child; state as low as possible, lifted when shared |
| 4 | 5 | **N** 1, ▶ red; **N** 2–8, ▶ green | All Shiny: state in the parent |
| 5 | 11 | **N** 1, ▶ red; **N** 2–7, ▶ green | requirement changed: state moves into the card |
| 6 | 17 | — | one state per card, found by key |
| 7 | 18 | **N** 1 ▶ green; **N** 2 ▶ red; **N** 3 ▶ green | key={index} breaks it |
| 8–9 | 22–24 | — | who owns the form text; common mistakes |
| 10 | 25 | **N ×3**; inspect the h1 | CSS Module |
| 11 | 28 | — | 14 tests, what each proves |
| 12 | 30 | timer | Fix It (component state) 1–6 |
| 13–14 | 37–38 | — | mental model; homework II |

Things to expect: `<counter />` in lowercase (React: "The tag <counter> is unrecognized"); a prop renamed on one side only (undefined); `onClick={rmData(id)}` (cards vanish); a path in the wrong case works on a Mac but fails in Docker and on Linux.

# Runbook · Unit 6 (Utility vs Component Libraries)

Before class: as unit 5. The live preview compiles Tailwind and loads Bootstrap from the internet. Students rebuild their Docker image after each `npm install`.

## Lecture 1 · Tailwind CSS
| # | Min | Do | Say |
|---|---|---|---|
| 1–3 | 0–3 | — | why utilities; reading classes (number × 0.25rem) |
| 4 | 5 | **N ×4** (N 1 runs `npm install tailwindcss @tailwindcss/vite` in the slide's terminal); **A** | install: plugin + one CSS line; keep react() |
| 5 | 9 | — | Preflight reset |
| 6 | 10 | **N** 1 ▶ green; **N** 2–3 ▶ red; **N** 4 ▶ green | layout test by computed style |
| 7 | 14 | — | test results, not class names |
| 8 | 16 | **N** 1 ▶ red; **N** 2 ▶ green | Tailwind card + Pokedex number |
| 9 | 20 | — | variants: hover, focus, md, dark (`@custom-variant` note) |
| 10 | 22 | **N ×13**, ▶ 16 green; click "Click me!" | the rest; no background on main |
| 11 | 28 | — | components are the reuse; whole class names |
| 12 | 30 | timer | Fix It (Tailwind) 1–6 |
| 13 | 37 | — | mental model |
| 14 | 38 | click the 3 docs tabs; Ctrl K in the docs | the table: class left, CSS right; v4 badge; Docs guide on the class site |
| 15 | 39 | — | homework I |

## Lecture 2 · React Bootstrap
| # | Min | Do | Say |
|---|---|---|---|
| 1–2 | 0–1 | — | component vs utility libraries |
| 3 | 2 | point at each row | in a real project pick one; we mix only to compare |
| 4 | 3 | — | two packages: components + CSS |
| 5 | 5 | **N** 1 ▶ green; **N** 2 runs `npm install react-bootstrap@2 bootstrap@5` in the slide's terminal; **N** 3 ▶ red (cards 48px apart), **A**; **N** 4 ▶ green | the clash (`gap-5` in both libraries) and `important` |
| 6–7 | 11–13 | — | cascade layers; Bootstrap for components, Tailwind for layout |
| 8 | 14 | **N**, ▶ 17 green | PokeCard as a Bootstrap Card |
| 9 | 19 | — | props not classes |
| 10 | 20 | **N ×9**, **A** after each, ▶ 17 green | Button wraps BsButton; Heading, Counter, PokeForm (controlId) |
| 11–12 | 26–27 | — | BsButton; when to use which |
| 13 | 28 | — | the 17 tests |
| 14 | 29 | timer | Fix It (React Bootstrap) 1–6 |
| 15 | 36 | — | mental model |
| 16 | 37 | click the 3 docs tabs; edit the Live Editor; on Badges: End, scroll up a little to API | Examples on top, API props table at the bottom; classes on getbootstrap.com |
| 17 | 38 | — | homework II |

Things to expect: no styles after `npm install` (Docker image not rebuilt); `class=` copied from tailwindcss.com; `import { Card } from 'react-bootstrap/Card'` (it's a default export); the cards drifting apart after Bootstrap loads (forgot `important`); search tests failing because `controlId` is missing.

# Runbook · Unit 7 (React Router)

Before class: as unit 6. Students `npm install react-router`, then rebuild the image. The live app gets an address bar once the router is in (the preview runs the router in memory; the code on the slide is the real createBrowserRouter).

## Lecture 1 · Intro to React Router
| # | Min | Do | Say |
|---|---|---|---|
| 1–4 | 0–5 | — | SPA with pages; the URL plan; react-router 8 (not react-router-dom) |
| 5 | 7 | **N ×4**, ▶ 17 green | install, router.jsx, RouterProvider |
| 6–7 | 13–15 | — | reading a route; layout + Outlet |
| 8 | 17 | **N ×5**; delete Outlet ▶ red; back; **N ×2**, ▶ green | App becomes the layout |
| 9–10 | 23–25 | — | pages unmount; visit / location / go |
| 11 | 27 | — | "heading only" checklist |
| 12 | 28 | timer | Fix It (router setup) 1–6 |
| 13–14 | 35–37 | — | mental model; homework I |

## Lecture 2 · Pages, links and errors
| # | Min | Do | Say |
|---|---|---|---|
| 2 | 1 | **N** 1 ▶ red; **N** 2–3 ▶ green | About page |
| 3 | 5 | same | 404 page (`*`) |
| 4 | 8 | — | 404 vs error page |
| 5 | 10 | **N ×6**; show errorElement on the root first (header gone) | error page inside the layout |
| 6 | 15 | — | reading the error page: useRouteError, isRouteErrorResponse |
| 7–8 | 16 | — | route tree; a vs Link |
| 9 | 17 | **N** 1–5 ▶ red (reload); **N** 6 ▶ green | NavBar: a, then Link |
| 10 | 23 | **N ×3**, ▶ 22 green | React Bootstrap Navbar (as={Link}) |
| 11–12 | 27–28 | — | as=; the 22 tests |
| 13 | 29 | timer | Fix It (pages and links) 1–6 |
| 14–15 | 36–38 | — | mental model (show the list reset); homework II |

# Runbook · Unit 8 (React Router Hooks)

## Lecture 1 · useParams and useNavigate
| # | Min | Do | Say |
|---|---|---|---|
| 2 | 1 | — | :id and useParams (strings) |
| 3 | 3 | **N ×4**, red → green | route with a parameter |
| 4 | 6 | **N ×3**, red → green | fetch by id (effect on [id], ignore flag) |
| 5 | 10 | **N ×5**, red → green | unknown Pokemon: catch + message |
| 6 | 13 | **N ×3**, red → green | Details link (BsButton as={Link}) |
| 7 | 15 | — | Link or navigate |
| 8 | 16 | **N ×5**, red → green | Back button: navigate(-1), home if opened directly |
| 9 | 20 | **N ×5**, ▶ 30 green (short on time: copy from the Explorer) | Login: navigate after the check |
| 10–11 | 24–26 | — | the real API answers (25 = Pikachu, 99999 = 404); loaders preview (later, with protected routes) |
| 12 | 28 | timer | Fix It (router hooks) 1–6 |
| 13–14 | 35–37 | — | mental model; homework I |

## Lecture 2 · useOutletContext
| # | Min | Do | Say |
|---|---|---|---|
| 1–3 | 0–3 | show the bug (search, About, Home) | pages unmount; lift to App |
| 4 | 5 | **N ×6**, red → green | the list in App, Outlet context |
| 5–6 | 11–13 | — | reading the hook; Pikachu comes back |
| 7 | 15 | **N ×5**, red → green | Pikachu loads once (in App) |
| 8 | 21 | **N ×7**, ▶ 33 green | the count too |
| 9–11 | 25–28 | — | shiny (optional lift); where state lives; 33 tests |
| 12 | 29 | timer | Fix It (outlet context) 1–6 |
| 13–14 | 36–38 | — | mental model; homework II |

# Runbook · Unit 9 (CI/CD)

The build, the deploy and GitHub Actions run on laptops and on GitHub; the slides show the files (the preview still runs the dev app). Checked: the build uses /pokemon-app/; the production smoke test passes in real Cypress against `npm run preview` (and fails with the browser router); both workflows pass actionlint. The red/green runs on the slides are real runs in kabeier/demo-test and kabeier/demo_test2.

## Lecture 1 · GitHub Pages
| # | Min | Do | Say |
|---|---|---|---|
| 2–4 | 1–4 | `npm run build`, `npm run preview` live | dev vs build; the folder problem |
| 5 | 6 | **N** | base only in production (own repo name) |
| 6 | 9 | open the run links | 8 red runs from an always-on base |
| 7–8 | 11–13 | **N ×4** | refresh problem; hash router in the build; smoke test |
| 9–10 | 18–21 | **N ×2**; `npm run deploy` live; Settings → Pages | gh-pages |
| 11 | 25 | — | blank page checklist |
| 12 | 28 | timer (8 min) | students deploy their own copy |
| 13 | 37 | — | mental model |
| 14 | 38 | click the 3 docs tabs; Ctrl K in the docs | the table: class left, CSS right; v4 badge; Docs guide on the class site |
| 15 | 39 | — | homework I |

## Lecture 2 · GitHub Actions
| # | Min | Do | Say |
|---|---|---|---|
| 2 | 1 | — | CI and CD |
| 3–4 | 3–9 | **N**; walk the file | e2e-tests.yml, each step |
| 5 | 11 | **N** | also test the built site |
| 6 | 14 | show Settings → Rules | block the merge |
| 7 | 16 | **N** | deploy.yml: workflow_run, if:, head_sha |
| 8–10 | 22–25 | click the runs (summaries; logs expired) | the real chain; secrets; reading a failed run |
| 11 | 26 | timer (7 min); have a red PR of your own ready | students make and read their own red ✗ (old demo logs have expired) |
| 12–14 | 34–38 | — | pipeline; mental model; homework II |

Things to expect: `react-router-dom` from old tutorials; Nav.Link without as={Link} (reloads); `(mode) =>` instead of `({ mode }) =>`; repo name with _ vs -; GitHub Pages branch not selected.

## Code repo for students

- **Repo:** https://github.com/kabeier/intro-react-code. One branch per lecture, each holding the **finished** code. Start of a lecture = the branch of the lecture before it.
- **Student page:** `code-repo/`, linked from the Code Explorer and the landing page.
- **After changing a lesson:** run `node tools/build-code-repo.mjs`, then `node tools/verify-code-repo.mjs`. The build remakes the branches, so push them with `git push --force --all origin` from `../intro-react-code`.

## File tree and Fix It

- **File tree:** every editor in the slides and the Code Explorer shows the project's folders and files. Click a file to open it, click a folder to fold it.
- **Slides:** press **E** or the **Files** button to hide or show it (**F** is still fullscreen). It stays that way on every slide. New files show green.
- **Fix It:** shows only the lines around the bug, with the live app beside it, all on one screen. **Show all the code** brings back the whole project if a student asks.
