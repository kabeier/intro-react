# React: the Pokemon Project (Front-End, units 2–9)

Lecture site for Code Platoon Phase II, Front-End units 2–9: one Pokemon app built unit by unit.

| Path | What |
|---|---|
| `index.html` | Landing page |
| `lecture-1-react-vite/`, `lecture-2-async-requests/` | Unit 2 decks |
| `explore.html?lesson=…&at=f3`, `fixit.html?lesson=…` | Code Explorer, Fix It |
| `shared/course.js` | Lesson data model + preview builder (plain pages, and **Vite React projects**: Babel + import map in the browser) |
| `shared/course/manifest.json` | Lesson files in load order (a lesson can build on another) |
| `shared/course/create-vite-react.js` | The exact `npm create vite@latest -- --template react` files (create-vite 9.3.3) |
| `shared/course/<lesson>.js`, `<lesson>-fixit.js` | Lessons and their Fix It problems |
| `tools/gen-notes.mjs` | Presenter-note step tables from the lesson data |
| `tools/verify-project.mjs <lesson…>` | Writes every checkpoint as a real project; `npm run build` + `npm run lint` |
| `tests/` | `node --test tests/*.test.mjs`; Docker check: `RUN_DOCKER=1 node --test tests/docker.test.mjs` |

## Deck keys

→ / Space next · ← back · **N** next step · **Shift+N** reset slide (or the **▶ Next line** / **↺ Reset** buttons on the code bar; the presenter window has **Type next step** and **↺ Reset slide code**) · **A** live app · **↗ Pop out** · P notes · T clock · F fullscreen

## Notes

- The live preview loads React 19.3.1 and axios 1.20.0 from esm.sh and Babel 7.28.4 from jsDelivr (internet needed). Each save reloads the app (state resets).
- Requests in the previews and Fix It checks go to the real PokeAPI.

`shared/vendor/react-bootstrap-2.10.10.mjs`: react-bootstrap 2.10.10 (MIT) bundled with esbuild, React left external, so the slide preview uses one copy of React. Rebuild: `echo "export * from 'react-bootstrap'" > e.mjs && npx esbuild@0.25.11 e.mjs --bundle --format=esm --minify --define:process.env.NODE_ENV='"development"' --external:react --external:react-dom --external:react/jsx-runtime --external:react-dom/client --legal-comments=eof --outfile=shared/vendor/react-bootstrap-2.10.10.mjs` (in a folder with react-bootstrap installed).
