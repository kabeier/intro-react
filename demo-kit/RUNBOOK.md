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
