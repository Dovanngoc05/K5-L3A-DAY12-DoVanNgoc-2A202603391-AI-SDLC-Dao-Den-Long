# AGENTS.md

## Project: Dao Den Long (AI SDLC Day 12)
- Author: Do Van Ngoc (2A202603391)

## Commands
- Test: `npm test`
- Headless simulation: `node src/headless.js --seed 42 --night 1 --ticks 600 --out out.jsonl`
- Start 3D view: `npm start`

## Architecture Rules
1. Core game logic in `src/core/simulation.js` must be pure and decoupled from rendering/UI.
2. Tick rate is fixed at 60 ticks per second (1/60s per tick).
3. Position conventions: Island ground at Y=0, player start at (0, 0, 0).
4. Determinism: Use PRNG with seed (`src/core/rng.js`), do not use unseeded Math.random().
5. Exit codes: 0 on normal finish, 2 on invalid input/scenario format, non-zero on runtime error.
