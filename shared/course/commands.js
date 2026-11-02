// Every terminal command of the React section, in the order the course uses them.
// Shown by the Code Explorer (explore.html?view=commands).
//   track: 'both' (same with or without Docker), 'docker' (only with Docker), 'laptop' (only without Docker)
//   flows: a flow or a { track, text } step with a track only shows on that tab
//   parts: [text, what it means, can you change it (and what happens)]
// The Docker facts were checked with real runs (Docker 29, node:24): Ctrl+C without -it leaves the
// container running; docker exec npm install works; with Cypress in package.json the image is ~2.4 GB.
Course.commands = {
  flows: [
    {
      title: 'A normal day, with Docker', track: 'docker',
      steps: ['cd pokemon-app', 'bash run_container.sh', 'Open http://localhost:5173', 'Second terminal: npm run cy:open (from unit 3)', 'Code; the page reloads by itself', 'Done: docker stop react-container'],
    },
    {
      title: 'A normal day, without Docker', track: 'laptop',
      steps: ['cd pokemon-app', 'npm run dev', 'Open http://localhost:5173', 'Second terminal: npm run cy:open (from unit 3)', 'Code; the page reloads by itself', 'Done: Ctrl+C in the npm run dev terminal'],
    },
    {
      title: 'After you install a package',
      steps: ['npm install <package> (on your laptop, in the project folder)', { track: 'docker', text: 'With Docker: docker stop react-container, then bash run_container.sh (the build installs it in the image)' }, { track: 'docker', text: 'Or, without restarting: docker exec react-container npm install' }, { track: 'laptop', text: 'Without Docker: nothing else; if the import still fails, stop npm run dev and start it again' }],
    },
  ],
  groups: [
    {
      title: 'Before you start (once per laptop)',
      when: 'Unit 2 · Lecture 1',
      commands: [
        {
          cmd: 'node -v', track: 'both',
          does: 'Prints the version of Node on your laptop.',
          why: 'Vite and Cypress check it. Use Node 24. Even with Docker you need it: Cypress (unit 3) runs on your laptop.',
          parts: [
            ['node', 'The Node.js program.', 'No.'],
            ['-v', 'Short for --version: print the version and stop.', 'Yes: --version does the same.'],
          ],
          expect: 'v24.x.x. Cypress 16 needs Node 22, 24 or 26; Vite needs 20.19 or newer.',
        },
      ],
    },
    {
      title: 'Create the project',
      when: 'Unit 2 · Lecture 1',
      commands: [
        {
          cmd: 'npm create vite@latest pokemon-app -- --template react', track: 'both',
          does: 'Makes a new folder with a ready-to-run React project (the Vite template).',
          why: 'Run it once, in the folder where you keep your projects (not inside another project).',
          parts: [
            ['npm create', 'Runs a "create-" starter package: here create-vite.', 'No.'],
            ['vite@latest', 'Which starter (create-vite), newest version (9.3 when this was written).', 'Keep @latest for class. A number instead of latest pins an older starter.'],
            ['pokemon-app', 'The name of the new folder and of the project.', 'Yes: any lowercase name without spaces. Then cd into that name instead.'],
            ['--', 'Everything after it goes to create-vite, not to npm.', 'Keep it. Without it npm keeps --template for itself and create-vite asks you questions instead.'],
            ['--template react', 'Which template: React with JavaScript.', 'react-ts gives TypeScript (not this course). Leave it out and it asks you to pick.'],
          ],
          expect: 'A pokemon-app folder with package.json, index.html, src/ and vite.config.js.',
          mistakes: ['Running it inside another project: you get a project in a project.'],
        },
        {
          cmd: 'cd pokemon-app', track: 'both',
          does: 'Moves the terminal into the project folder.',
          why: 'Every other command reads package.json, so it must run inside this folder.',
          parts: [
            ['cd', 'Change directory.', 'No.'],
            ['pokemon-app', 'The folder to go into.', 'Use the name you gave the project.'],
          ],
          mistakes: ['"Could not read package.json" later on: you are in the wrong folder. pwd shows where you are.'],
        },
        {
          cmd: 'npm install', track: 'both',
          does: 'Reads package.json and downloads every package into node_modules. Writes package-lock.json.',
          why: 'Without Docker the app cannot start without it. With Docker the image runs it for you, but run it on your laptop too: your editor uses it, and Cypress (unit 3) runs on the laptop.',
          parts: [
            ['npm', 'Node\'s package manager.', 'No.'],
            ['install', 'Install what package.json lists.', 'npm i is the short form. npm ci is the strict form CI uses (unit 9).'],
          ],
          expect: '"added N packages". A node_modules folder appears. Never commit it (it is in .gitignore).',
        },
      ],
    },
    {
      title: 'Run the app',
      when: 'Unit 2 · Lecture 1, then every day',
      commands: [
        {
          cmd: 'npm run dev', track: 'laptop',
          does: 'Starts the Vite dev server: open http://localhost:5173. Saving a file updates the page by itself (hot reload).',
          why: 'The everyday way to run the app without Docker. It keeps the terminal busy: use a second terminal for other commands.',
          parts: [
            ['npm run', 'Runs a script from the "scripts" part of package.json.', 'No.'],
            ['dev', 'The script name. Ours is "vite --host".', 'Other script names run other scripts: build, preview, lint, cy:open.'],
          ],
          expect: 'Local: http://localhost:5173/ (and a Network address, because of --host). Stop it with Ctrl+C.',
          mistakes: ['"Port 5173 is in use": Vite picks 5174. Cypress expects 5173: stop the other one (maybe the Docker container).'],
        },
        {
          cmd: 'bash run_container.sh', track: 'docker',
          does: 'Runs the two Docker commands in run_container.sh: build the image, then start the container.',
          why: 'One short command instead of two long ones. It rebuilds every time, so new packages in package.json get installed.',
          parts: [
            ['bash', 'Runs a file of shell commands.', 'sh works too.'],
            ['run_container.sh', 'Our file: docker build … then docker run ….', 'Run it from the project folder, where the file is.'],
          ],
          expect: 'Build output, then Vite\'s "Local: http://localhost:5173/". Open that address on your laptop.',
          mistakes: ['Ctrl+C gives you the terminal back, but the container keeps running (we checked). Stop it with docker stop react-container.', '"The container name /react-container is already in use": the last one is still running. docker stop react-container, then run again.'],
        },
        {
          cmd: 'docker build -t react-img .', track: 'docker',
          does: 'Builds an image from the Dockerfile: Node 24, our files, npm install inside.',
          why: 'Line 1 of run_container.sh. The image is the recipe; the container is the running app.',
          parts: [
            ['docker build', 'Build an image.', 'No.'],
            ['-t react-img', 'Names (tags) the image react-img.', 'Yes, any lowercase name. Then use the same name at the end of docker run.'],
            ['.', 'The build folder: this folder, where the Dockerfile is.', 'Keep it. Run it from the project folder.'],
          ],
          expect: 'Steps FROM, WORKDIR, COPY, RUN npm install. Once Cypress is in package.json the build also downloads the Cypress app: the image grows to about 2.4 GB and the first build is slower.',
        },
        {
          cmd: 'docker run --rm -p 5173:5173 -v "$(pwd)":/app -v /app/node_modules --name react-container react-img', track: 'docker',
          does: 'Starts a container from the image, with your folder connected so edits show up at once.',
          why: 'Line 2 of run_container.sh (written over several lines there; the \\ at a line end means "the command goes on").',
          parts: [
            ['docker run', 'Start a new container.', 'No.'],
            ['--rm', 'Delete the container when it stops.', 'Leave it out and stopped containers pile up; the next run fails with "name already in use" until you docker rm it.'],
            ['-p 5173:5173', 'Laptop port : container port. Connects localhost:5173 on your laptop to Vite in the container.', 'The left number can change (3000:5173 → open localhost:3000), but Cypress\'s baseUrl says 5173. The right number must stay 5173: Vite listens there.'],
            ['-v "$(pwd)":/app', 'Mounts this folder ($(pwd) = where you are) into /app in the container.', 'Keep it. Without it your edits only reach the app after a rebuild. /app must match WORKDIR in the Dockerfile.'],
            ['-v /app/node_modules', 'Gives the container its own node_modules, separate from your laptop\'s.', 'Keep it. Without it your laptop\'s node_modules covers the image\'s: "vite: not found" or crashes from Mac/Windows packages.'],
            ['--name react-container', 'Names the container.', 'Yes, but then use the new name in docker stop and docker exec. Leave it out and Docker picks a random name.'],
            ['react-img', 'The image to start.', 'Must be the name from docker build -t.'],
          ],
          expect: 'Vite\'s "Local: http://localhost:5173/". The terminal stays busy while the app runs.',
          mistakes: ['Run it from a different folder: $(pwd) mounts the wrong folder and the app shows the wrong files or fails.', 'Port 5173 is taken (npm run dev still running): "port is already allocated".'],
        },
        {
          cmd: 'docker ps', track: 'docker',
          does: 'Lists the running containers.',
          why: 'Check whether react-container is still running (for example after Ctrl+C).',
          parts: [
            ['docker ps', 'Running containers: name, image, ports.', 'docker ps -a also shows stopped ones (with --rm there are none).'],
          ],
        },
        {
          cmd: 'docker stop react-container', track: 'docker',
          does: 'Stops the container. Because of --rm, Docker then deletes it.',
          why: 'The way to stop the app with Docker. Do it before you run bash run_container.sh again.',
          parts: [
            ['docker stop', 'Stop a running container (it gets a few seconds to shut down).', 'No.'],
            ['react-container', 'Which container: the --name from docker run.', 'Use the name you gave it.'],
          ],
          expect: 'It prints react-container after a few seconds.',
        },
      ],
    },
    {
      title: 'Requests: axios',
      when: 'Unit 2 · Lecture 2',
      commands: [
        {
          cmd: 'npm install axios', track: 'both',
          does: 'Downloads axios and adds it to "dependencies" in package.json.',
          why: 'The app imports it to talk to the PokeAPI. Run it on your laptop, in the project folder.',
          parts: [
            ['npm install', 'Install a package and save it in package.json.', 'npm i is the short form.'],
            ['axios', 'The package name.', 'Pin a version with axios@1.20.0. A typo installs nothing (or a different package!): check the spelling.'],
          ],
          expect: '"added 1 package" (or a few). With Docker: stop the container and run bash run_container.sh again, or use docker exec (next).',
          mistakes: ['With Docker, "Failed to resolve import axios": the container does not have it yet. Rebuild, or docker exec react-container npm install.'],
        },
        {
          cmd: 'docker exec react-container npm install', track: 'docker',
          does: 'Runs npm install inside the running container, so it gets the new package without a restart.',
          why: 'Faster than a rebuild. The next bash run_container.sh rebuilds anyway, so nothing is lost.',
          parts: [
            ['docker exec', 'Run a command inside a running container.', 'No.'],
            ['react-container', 'Which container.', 'The --name from docker run.'],
            ['npm install', 'The command to run in there.', 'Any command: docker exec react-container ls shows the files in /app.'],
          ],
          expect: '"added N packages"; the page works again.',
        },
      ],
    },
    {
      title: 'End-to-end tests: Cypress',
      when: 'Unit 3 · Lectures 1–2',
      note: 'Cypress runs on your laptop in both setups (it opens a browser). The app must be running first: npm run dev, or the Docker container.',
      commands: [
        {
          cmd: 'npm install cypress --save-dev', track: 'both',
          does: 'Installs Cypress as a dev dependency and downloads the Cypress app (a few hundred MB, once per laptop).',
          why: 'On your laptop, even with Docker. With Docker the next image build installs it too (bigger image, slower first build).',
          parts: [
            ['npm install', 'Install and save in package.json.', 'No.'],
            ['cypress', 'The package.', 'No.'],
            ['--save-dev', 'Save under "devDependencies": needed to develop and test, not to run the app.', 'Same as -D. Without it, Cypress lands in "dependencies": it works, but it is the wrong list.'],
          ],
          expect: '"devDependencies": { "cypress": … } in package.json.',
        },
        {
          cmd: 'npm run cy:open', track: 'both',
          does: 'Opens the Cypress app. Pick a spec and watch every step run in a browser.',
          why: 'The script is "cypress open --e2e" (--e2e skips the "which kind of testing?" screen). Use it while you write a test.',
          parts: [
            ['npm run', 'Run a package.json script.', 'No.'],
            ['cy:open', 'Our script: cypress open --e2e.', 'npx cypress open does the same without the script.'],
          ],
          mistakes: ['"cy.visit() failed trying to load http://localhost:5173/": the app is not running. Start it first.'],
        },
        {
          cmd: 'npm run cy:run', track: 'both',
          does: 'Runs every spec, headless (no window), and prints the results in the terminal.',
          why: 'The quick check before you commit. CI runs the same tests (unit 9).',
          parts: [
            ['npm run', 'Run a package.json script.', 'No.'],
            ['cy:run', 'Our script: cypress run.', 'npx cypress run does the same.'],
          ],
          expect: 'A table: each spec, passing and failing counts. A failure ends with a non-zero exit code.',
        },
        {
          cmd: 'npm run cy:run -- --spec cypress/e2e/home.cy.js', track: 'both',
          does: 'Runs one spec file instead of all of them.',
          why: 'Faster while you work on one feature.',
          parts: [
            ['npm run cy:run', 'Our cypress run script.', 'No.'],
            ['--', 'Everything after it goes to Cypress, not to npm.', 'Keep it: without it npm swallows --spec and every spec runs.'],
            ['--spec', 'Which spec files to run.', 'No.'],
            ['cypress/e2e/home.cy.js', 'The file (path from the project folder).', 'Any spec. A pattern works too: "cypress/e2e/*.cy.js" (keep the quotes).'],
          ],
        },
      ],
    },
    {
      title: 'Hooks, components',
      when: 'Units 4–5',
      note: 'No new commands. Every day: run the app, keep npm run cy:open open, and press Run in Cypress (or npm run cy:run) after each step.',
      commands: [],
    },
    {
      title: 'Styling libraries',
      when: 'Unit 6 · Lectures 1–2',
      commands: [
        {
          cmd: 'npm install tailwindcss @tailwindcss/vite', track: 'both',
          does: 'Installs Tailwind and its Vite plugin (two packages in one command).',
          why: 'Then add tailwindcss() to plugins in vite.config.js and @import "tailwindcss" to index.css. With Docker: rebuild.',
          parts: [
            ['npm install', 'Install and save.', 'No.'],
            ['tailwindcss', 'Tailwind itself.', 'No.'],
            ['@tailwindcss/vite', 'The plugin that makes Vite run Tailwind. The @… part is the package\'s organisation.', 'No: without it the classes do nothing.'],
          ],
        },
        {
          cmd: 'npm install react-bootstrap bootstrap', track: 'both',
          does: 'Installs Bootstrap (the CSS) and React Bootstrap (React components such as Button and Card).',
          why: 'Then import \'bootstrap/dist/css/bootstrap.min.css\' once, in main.jsx. With Docker: rebuild.',
          parts: [
            ['npm install', 'Install and save.', 'No.'],
            ['react-bootstrap', 'The React components.', 'No.'],
            ['bootstrap', 'The CSS the components use.', 'No: without it the components have no style.'],
          ],
        },
      ],
    },
    {
      title: 'React Router',
      when: 'Unit 7 · Lecture 1',
      commands: [
        {
          cmd: 'npm install react-router', track: 'both',
          does: 'Installs React Router: pages, links and the URL.',
          why: 'One package: react-router-dom was merged into react-router. With Docker: rebuild.',
          parts: [
            ['npm install', 'Install and save.', 'No.'],
            ['react-router', 'The package.', 'Older tutorials say react-router-dom: not needed now.'],
          ],
        },
      ],
    },
    {
      title: 'Check and deploy',
      when: 'Unit 9 · Lecture 1',
      note: 'These run on your laptop in both setups.',
      commands: [
        {
          cmd: 'npm run lint', track: 'both',
          does: 'Checks the code for mistakes with oxlint (unused variables, rules of hooks…).',
          why: 'CI runs it too. Fix what it prints before you push.',
          parts: [
            ['npm run', 'Run a package.json script.', 'No.'],
            ['lint', 'Our script: oxlint.', 'No.'],
          ],
        },
        {
          cmd: 'npm run build', track: 'both',
          does: 'Builds the production app into the dist/ folder: small, fast files, no dev server needed.',
          why: 'GitHub Pages serves dist/. The base in vite.config.js (/pokemon-app/) is baked in here.',
          parts: [
            ['npm run', 'Run a package.json script.', 'No.'],
            ['build', 'Our script: vite build.', 'No.'],
          ],
          expect: 'dist/index.html and dist/assets/…. dist/ is in .gitignore: build it again any time.',
        },
        {
          cmd: 'npm run preview', track: 'both',
          does: 'Serves the built dist/ folder at http://localhost:4173/pokemon-app/.',
          why: 'See the real built site (with its base path) before you deploy.',
          parts: [
            ['npm run', 'Run a package.json script.', 'No.'],
            ['preview', 'Our script: vite preview.', 'No. Run npm run build first: preview shows the last build.'],
          ],
          mistakes: ['A blank page at localhost:4173/: open /pokemon-app/ (the base).'],
        },
        {
          cmd: 'npm install --save-dev gh-pages', track: 'both',
          does: 'Installs gh-pages, the tool that pushes dist/ to a gh-pages branch.',
          why: 'A dev dependency: used to publish, not inside the app. No rebuild needed for Docker (it never runs there).',
          parts: [
            ['npm install', 'Install and save.', 'No.'],
            ['--save-dev', 'Save under devDependencies.', 'Same as -D.'],
            ['gh-pages', 'The package.', 'No.'],
          ],
        },
        {
          cmd: 'npm run deploy', track: 'both',
          does: 'Builds, then publishes dist/ to the gh-pages branch of your GitHub repo.',
          why: 'npm runs "predeploy" (npm run build) first, then "deploy" (gh-pages -d dist). Then on GitHub: Settings → Pages → branch gh-pages.',
          parts: [
            ['npm run', 'Run a package.json script.', 'No.'],
            ['deploy', 'Our script: gh-pages -d dist. -d dist = the folder to publish.', 'No. Set base in vite.config.js to your repo\'s name first.'],
          ],
          expect: '"Published". The site appears at https://<your-username>.github.io/<repo>/ a minute later.',
          mistakes: ['A blank page on GitHub Pages: base in vite.config.js does not match the repo name.', 'No GitHub remote yet: push the repo to GitHub first.'],
        },
      ],
    },
    {
      title: 'Continuous integration',
      when: 'Unit 9 · Lecture 2',
      commands: [
        {
          cmd: 'git switch -c rename-shiny', track: 'both',
          does: 'Makes a new branch and moves to it.',
          why: 'Work for a pull request happens on a branch, so main only gets changes that passed CI.',
          parts: [
            ['git switch', 'Move to a branch.', 'git checkout -b does the same (older form).'],
            ['-c', 'Create it first.', 'Leave it out to move to a branch that already exists.'],
            ['rename-shiny', 'The branch name.', 'Yes: short, lowercase, words joined with -.'],
          ],
        },
        {
          cmd: 'git add .', track: 'both',
          does: 'Stages every changed file in this folder for the next commit.',
          why: '.gitignore keeps node_modules and dist out.',
          parts: [
            ['git add', 'Stage files.', 'No.'],
            ['.', 'This folder and everything in it.', 'Name files instead to commit only those: git add src/App.jsx.'],
          ],
        },
        {
          cmd: 'git commit -m "Rename Make Shiny to Shine"', track: 'both',
          does: 'Saves the staged changes as one commit.',
          parts: [
            ['git commit', 'Make a commit.', 'No.'],
            ['-m "Rename Make Shiny to Shine"', 'The commit message (-m = message).', 'Yes: say what changed and why, in a few words.'],
          ],
        },
        {
          cmd: 'git push -u origin rename-shiny', track: 'both',
          does: 'Sends the branch to GitHub. Then open a pull request: CI runs on it.',
          parts: [
            ['git push', 'Send commits to GitHub.', 'No.'],
            ['-u', 'Remember this pairing, so next time plain git push works.', 'Only needed the first time for a branch.'],
            ['origin', 'Your GitHub repo (the remote\'s name).', 'No.'],
            ['rename-shiny', 'The branch to send.', 'Your branch\'s name.'],
          ],
        },
        {
          cmd: 'npm ci', track: 'both',
          does: 'A clean, exact install: deletes node_modules and installs exactly what package-lock.json says.',
          why: 'What the workflow runs. Use it on your laptop to reproduce a CI install.',
          parts: [
            ['npm', 'Node\'s package manager.', 'No.'],
            ['ci', '"Clean install". Never changes package.json or package-lock.json.', 'npm install is the everyday form; ci is the strict one.'],
          ],
          mistakes: ['It fails if package-lock.json is missing or does not match package.json: run npm install and commit package-lock.json.'],
        },
        {
          cmd: 'npx cypress run --config "baseUrl=http://localhost:4173/pokemon-app/,specPattern=cypress/e2e-prod/**/*.cy.js"', track: 'both',
          does: 'Runs the production specs against the built site (after npm run build and npm run preview).',
          why: 'The second Cypress step of the workflow, by hand: checks the build, with its base path, before it is deployed.',
          parts: [
            ['npx', 'Runs a command from an installed package, without a script.', 'No.'],
            ['cypress run', 'Run specs headless.', 'cypress open to watch them instead.'],
            ['--config', 'Overrides cypress.config.js for this run only. The settings follow in quotes, with a comma between them.', 'Yes, any setting. Keep the quotes: they stop the shell from treating the * as a file pattern.'],
            ['baseUrl=http://localhost:4173/pokemon-app/', 'The address to test: the preview server.', 'Must match where npm run preview serves (port 4173 + the base).'],
            ['specPattern=cypress/e2e-prod/**/*.cy.js', 'Which files are specs: every .cy.js file in cypress/e2e-prod (** = any folder inside).', 'Point it at another folder to run other specs.'],
          ],
        },
      ],
    },
  ],
}
