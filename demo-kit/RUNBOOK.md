# Runbook · Unit 2 (React and Requests)

## Before class
| Do | Why |
|---|---|
| Docker Desktop running; Node 24 on the laptop | students follow along with both |
| Open the site → Open the slides, **Ctrl+Shift+R**, **F**, **P** | deck + notes |
| Open one code slide and wait a few seconds | the preview loads React and Babel from the internet the first time |
| Share the **whole screen** if you use **↗ Pop out** | separate window |

Keys: **N** next step · **Shift+N** reset · **A** live app · **↗ Pop out** (real DevTools there).

## Lecture 1 · React + Vite (~40 min)
| # | Min | Do | Say |
|---|---|---|---|
| 1 | 0 | T | React draws the page, Vite runs it |
| 2 | 1 | — | two tools, two jobs |
| 3 | 3 | — | virtual DOM = compare with the previous render |
| 4 | 5 | students run create vite in a terminal | @latest, --template react |
| 5 | 7 | **N ×2** | --host, engines |
| 6 | 9 | **N ×6**, students `bash run_container.sh` | flag table in notes |
| 7 | 14 | — | file tour |
| 8 | 15 | DevTools → Elements on the pop-out | index.html → main.jsx → App |
| 9 | 17 | **N ×6**, A | make the page ours |
| 10 | 20 | — | JSX rules |
| 11–14 | 21–28 | **N** through each | {}, functions, className + import, style object |
| 15 | 30 | timer | Fix It (JSX) 1–6 |
| 16 | 37 | — | homework |

## Lecture 2 · Async Requests (~40 min)
| # | Min | Do | Say |
|---|---|---|---|
| 1 | 0 | T; raw JSON tab open | ask a server, wait without freezing |
| 2 | 1 | show the JSON | request → 200 + JSON / 404 |
| 3 | 3 | — | sync vs async; promise states |
| 4 | 5 | **N**; students `npm install axios` | rebuild the Docker image after installing |
| 5 | 7 | **N ×5** | the ids are for tests and unit 4 |
| 6 | 11 | **N ×3**, A, search Pikachu | Console shows "pikachu" |
| 7 | 14 | **N ×4**; after N 3 search: pending Promise; try pikachoo | then / catch / finally |
| 8 | 19 | **N ×4** | createElement inside React |
| 9 | 23 | — | catch catches our bugs too |
| 10 | 24 | **N ×3** | await |
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
| 5 | 6 | **N ×2**; students `npm install cypress --save-dev` on the laptop | dev dependency; two scripts |
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
| 6–7 | 11–14 | **N** through, ▶ Run tests | {enter}, have.value, edge cases |
| 8 | 18 | break a test on purpose | reading a red test |
| 9–10 | 19–21 | **N ×4**, ▶ Run tests | stubs: fast, same every run |
| 11 | 25 | — | a test that can't fail tests nothing |
| 12 | 28 | timer | Fix It (assertions) 1–6 |
| 13–14 | 35–37 | — | unit 4 preview; homework II |

Things to expect: students running Cypress inside Docker (it must run on the laptop); Node 25 on the laptop (Cypress 16 refuses it: use 24); `cy:run` without the app running ("cy.visit() failed trying to load").

# Runbook · Unit 4 (React Hooks)

Before class: as unit 3. From now on every feature starts with a failing test: press **▶ Run tests** after the test step (red) and after the code (green).

## Lecture 1 · useState
| # | Min | Do | Say |
|---|---|---|---|
| 1–4 | 0–4 | — | by hand vs state; event → setter → render; red, green, tidy |
| 5 | 5 | **N** 1, ▶ (red); **N** 2–4, ▶ (green) | first state: the title |
| 6 | 9 | — | [value, setter]; rules of hooks |
| 7–8 | 10–13 | **N ×3**, ▶ red then green | functional update |
| 9 | 14 | ▶, **N ×4**, ▶ (green both times) | a refactor keeps behaviour |
| 10 | 18 | **N ×5**, ▶ all green | generateCard is gone; tests say users can't tell |
| 11 | 24 | — | new arrays; spread (not "deconstruction") |
| 12 | 25 | **N ×3**, ▶ red then green | Remove with filter |
| 13–14 | 28–29 | timer | Fix It (useState) 1–6 |
| 15 | 37 | — | homework I |

## Lecture 2 · useEffect
| # | Min | Do | Say |
|---|---|---|---|
| 1–2 | 0–1 | — | rendering is pure; effects run after |
| 3 | 3 | **N ×2**, **A**; read the Console | mounted, unmounted, mounted = StrictMode |
| 4–5 | 7–9 | **N** | dependency array; track pokemonList |
| 6 | 11 | — | mount, update, unmount |
| 7 | 13 | **N** 1, ▶ (red); **N** 2, ▶ (green); click "Click me!" | a visible side effect |
| 8–9 | 17–18 | **N** 1–5, ▶ (red); **N** 6–7, ▶ (green) | planned change: tests first |
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
| 4 | 5 | **N ×5**, ▶ green; type `<counter />` → ▶ red → fix | first component |
| 5 | 10 | — | a refactor: green before and after |
| 6 | 11 | **N ×6**, ▶ | one folder per component, index.js |
| 7 | 14 | — | props: one object; children; read-only; destructuring |
| 8 | 16 | **N ×6**, ▶ | Button with children |
| 9 | 20 | **N ×3**, ▶ | PokeSearch owns the search |
| 10 | 24 | **N ×3**, ▶; drop rmData → red → back | PokeCard with props |
| 11 | 27 | — | data down, functions up; prop drilling |
| 12–13 | 28–30 | **N ×3** each, ▶ all 12 green | PokeContainer, PokeForm |
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
| 4 | 5 | **N ×4**; **A** | install: plugin + one CSS line; keep react() |
| 5 | 9 | — | Preflight reset |
| 6 | 10 | **N** 1 ▶ green; **N** 2–3 ▶ red; **N** 4 ▶ green | layout test by computed style |
| 7 | 14 | — | test results, not class names |
| 8 | 16 | **N** 1 ▶ red; **N** 2 ▶ green | Tailwind card + Pokedex number |
| 9 | 20 | — | variants: hover, focus, md, dark (`@custom-variant` note) |
| 10 | 22 | **N ×8**, ▶ 16 green; click "Click me!" | the rest; no background on main |
| 11 | 28 | — | components are the reuse; whole class names |
| 12 | 30 | timer | Fix It (Tailwind) 1–6 |
| 13–14 | 37–38 | — | mental model; homework I |

## Lecture 2 · React Bootstrap
| # | Min | Do | Say |
|---|---|---|---|
| 1–3 | 0–3 | — | component vs utility libraries; two packages |
| 4 | 5 | **N** 1 ▶ green; **N** 2–4 ▶ red, **A**; **N** 5 ▶ green | the clash and `important` |
| 5–6 | 11–13 | — | cascade layers; the two-library rules |
| 7 | 15 | **N**, ▶ 17 green | PokeCard as a Bootstrap Card |
| 8–10 | 21–25 | — | props not classes; BsButton; when to use which |
| 11 | 27 | — | the 17 tests |
| 12 | 29 | timer | Fix It (React Bootstrap) 1–6 |
| 13–14 | 36–37 | — | mental model; homework II |

Things to expect: no styles after `npm install` (Docker image not rebuilt); `class=` copied from tailwindcss.com; `import { Card } from 'react-bootstrap/Card'` (it's a default export); Bootstrap making h1 thin and buttons square.
