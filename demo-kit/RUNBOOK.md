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
