# Live demo runbook: APP gets FEATURE

**The story:** where the app is now (one line), and what's wrong with it.
- **Lecture 1 (TITLE):** concepts in one line. Live: the one hands-on step.
- **Lecture 2 (TITLE):** the build in one line. Payoff: what the class sees at the end.

## What's in the kit

| File | What it is |
|---|---|
| `prompts.md` | Every prompt, in order, plus good answers to Claude's questions and what to check at each pause |
| `start-APP/` | **The starting point:** the app as the class left it last lecture. No `.mcp.json`, no `.env` |
| `backup-APP/` | The app after Lecture 2, tested. The fallback if a live prompt stalls |
| `reset-to-start.sql` | After a dry run: the database back to today's starting point |

## Setup (once, before Lecture 1)

```bash
cp -r /path/to/site/demo-kit ~/KIT
cd ~/demos/APP
git status                       # clean? If not: commit first
claude mcp list                  # the MCP servers this lecture needs: Connected
# Snapshot for resetting after the dry run
rm -rf ~/demos/APP-snapshot && cp -a ~/demos/APP ~/demos/APP-snapshot
```

## Dry run (the night before), then reset

1. Run both lectures' live steps from the tables below. Note what Claude asks and how long each prompt takes.
2. Reset the folder: `rm -rf ~/demos/APP && cp -a ~/demos/APP-snapshot ~/demos/APP`
3. Reset the database / services: …

## Lecture 1 in class (TITLE)

| Slide (~min) | Where | Do | Say |
|---|---|---|---|
| 2 (~1) | … | … | "…" |

## Lecture 2 in class (TITLE)

| Slide (~min) | Where | Do | Say |
|---|---|---|---|
| 4 (~4) | … | … | "…" |

**Time check, Lecture 2:** the prompts are the risky part.

- **STEP not done by ~min NN:**
  1. Esc.
  2. The backup: …
  3. Say: "This is what Claude was building."

## Things to expect

- **Claude asks X:** answer Y, because Z.
