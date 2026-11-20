# Phase 1 Verification Matrix

| Requirement | Test Method | Evidence File | Result |
|---|---|---|---|
| Deterministic 60Hz loop | Run headless twice with same seed | `docs/proof/phase1-determinism.log` | **Đạt** |
| Mote collection | Scenario with mote at (0,0,1) | `tests/simulation.test.js` | **Đạt** |
| Lantern lighting | Deposit 3 motes into L1 | `tests/simulation.test.js` | **Đạt** |
| Shade collision & flames | Shade chase player, loses 1 flame | `tests/simulation.test.js` | **Đạt** |
| Pulse stun shade | Pulse triggers within radius 4m | `tests/simulation.test.js` | **Đạt** |
| Determinism unit test | 60 ticks identical snapshots | `tests/simulation.test.js` | **Đạt** |
