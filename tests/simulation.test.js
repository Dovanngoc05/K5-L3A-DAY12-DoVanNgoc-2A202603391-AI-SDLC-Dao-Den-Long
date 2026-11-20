import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { Simulation } from "../src/core/simulation.js";

// ─────────────────────────────────────────────────────────────
// PHẦN 1: Regression Tests (Cập nhật chuẩn hóa Contract v1.1)
// ─────────────────────────────────────────────────────────────

test("Player collects mote and increases score upon lantern deposit", () => {
  const sim = new Simulation({
    scenario: {
      player: { pos: [0, 0, 0], carried: 0, flames: 3 },
      random_motes: false,
      random_shades: false,
      motes: [[0, 0, 1.0]] // within pickup radius 1.0m
    }
  });

  sim.step();
  assert.equal(sim.player.carried, 1);
  assert.equal(sim.motes.length, 0);
  assert.equal(sim.score, 0); // Contract v1.1: score only on deposit (+10/mote)
});

test("Player deposits motes into lantern and lights it", () => {
  const sim = new Simulation({
    scenario: {
      player: { pos: [0, 0, 5], carried: 10, flames: 3 },
      random_motes: false,
      random_shades: false,
      lanterns: [{ id: "L1", pos: [0, 0, 5], deposited: 0 }]
    },
    inputs: {
      frames: [{ tick: 0, interact: true }]
    }
  });

  sim.step();
  const l1 = sim.lanterns.find((l) => l.id === "L1");
  assert.equal(l1.deposited, 10);
  assert.equal(l1.lit, true);
  assert.equal(sim.player.carried, 0);
  assert.equal(sim.score, 200); // 10*10 + 100
});

test("Player partial deposit into lantern", () => {
  const sim = new Simulation({
    scenario: {
      player: { pos: [0, 0, 5], carried: 4, flames: 3 },
      random_motes: false,
      random_shades: false,
      lanterns: [{ id: "L1", pos: [0, 0, 5], deposited: 0 }]
    },
    inputs: {
      frames: [{ tick: 0, interact: true }]
    }
  });

  sim.step();
  const l1 = sim.lanterns.find((l) => l.id === "L1");
  assert.equal(l1.deposited, 4);
  assert.equal(l1.lit, false);
  assert.equal(sim.player.carried, 0);
  assert.equal(sim.score, 40); // 4 * 10
});

test("Pulse stuns and pushes shades", () => {
  const sim = new Simulation({
    scenario: {
      player: { pos: [0, 0, 0], carried: 3, flames: 3 },
      random_motes: false,
      random_shades: false,
      shades: [{ id: "S1", pos: [2, 0, 0] }] // within pulse radius 5.0m
    },
    inputs: {
      frames: [{ tick: 0, pulse: true }]
    }
  });

  sim.step();
  const s1 = sim.shades.find((s) => s.id === "S1");
  assert.equal(s1.state, "stunned");
  assert.equal(sim.player.carried, 0); // 3 motes spent
  assert.equal(sim.score, 5); // +5 per stunned shade

  // Over 15 ticks, shade is pushed 4m along +X
  for (let i = 0; i < 15; i++) {
    sim.step();
  }
  assert.equal(s1.pos[0] >= 5.9, true); // initial 2m + 4m push = 6.0m
});

test("Shade damages player when colliding", () => {
  const sim = new Simulation({
    scenario: {
      player: { pos: [0, 0, 0], carried: 4, flames: 3 },
      random_motes: false,
      random_shades: false,
      shades: [{ id: "S1", pos: [0.5, 0, 0] }] // within hit radius 1.0m
    }
  });

  sim.step();
  assert.equal(sim.player.flames, 2);
  assert.equal(sim.player.carried, 2); // 4 * 0.5 = 2 dropped
  assert.equal(sim.player.invuln_ticks, 90);
});

test("Safe radius around lit lantern blocks shade", () => {
  const sim = new Simulation({
    scenario: {
      player: { pos: [0, 0, 0], carried: 0, flames: 3 },
      random_motes: false,
      random_shades: false,
      lanterns: [{ id: "L1", pos: [10, 0, 0], lit: true }],
      shades: [{ id: "S1", pos: [18, 0, 0] }] // safe_radius is 6.0m around (10,0,0)
    }
  });

  // Step 60 ticks (1 second). Shade moves towards player at (0,0,0)
  for (let i = 0; i < 60; i++) {
    sim.step();
  }
  const s1 = sim.shades.find((s) => s.id === "S1");
  const distToLantern = Math.hypot(s1.pos[0] - 10, s1.pos[2] - 0);
  assert.equal(distToLantern >= 6.0, true);
});

test("Player jump kinematics: jumps and lands back on ground", () => {
  const sim = new Simulation({
    inputs: {
      frames: [{ tick: 0, jump: true }]
    }
  });

  // Step 1: jumps upwards
  sim.step();
  assert.equal(sim.player.pos[1] > 0, true);

  // Step for 1 second (60 ticks): lands back on ground
  for (let i = 0; i < 60; i++) {
    sim.step();
  }
  assert.equal(sim.player.pos[1], 0.0);
  assert.equal(sim.player.vel[1], 0.0);
  assert.equal(sim.player.grounded, true);
});

test("Island boundary: clamps player when fall_enabled is false", () => {
  const sim = new Simulation({
    tuning: { fall_enabled: false },
    scenario: {
      player: { pos: [39.5, 0, 0], carried: 2, flames: 3 },
      random_motes: false,
      random_shades: false
    },
    inputs: {
      frames: [{ tick: 0, move: [1, 0] }] // moving +X continuously
    }
  });

  // Step 60 ticks (1 second) at speed 6m/s
  for (let i = 0; i < 60; i++) {
    sim.step();
  }
  const dist = Math.hypot(sim.player.pos[0], sim.player.pos[2]);
  assert.equal(dist <= 40.001, true);
  assert.equal(sim.player.flames, 3); // not damaged
});

test("Island fall: player falls off when fall_enabled is true", () => {
  const sim = new Simulation({
    tuning: { fall_enabled: true },
    scenario: {
      player: { pos: [39.8, 0, 0], carried: 4, flames: 3 },
      random_motes: false,
      random_shades: false
    },
    inputs: {
      frames: [{ tick: 0, move: [1, 0] }]
    }
  });

  // Step until player walks off edge and falls past Y < -10
  // Speed 6m/s, dt=1/60 => walks off at tick 2. Under gravity g=-20m/s^2, falls past -10 in ~60 ticks
  for (let i = 0; i < 70; i++) {
    sim.step();
  }
  assert.equal(sim.player.falling, true);
  assert.equal(sim.player.flames, 2); // -1 flame
  assert.equal(sim.player.carried, 0); // drops all motes

  // Wait remaining fall_wait_ticks (60 ticks total) until respawn
  while (sim.player.falling) {
    sim.step();
  }
  assert.equal(sim.player.falling, false);
  assert.equal(sim.player.pos[0], 0.0);
  assert.equal(sim.player.pos[2], 0.0);
  assert.equal(sim.player.invuln_ticks > 0, true); // 90 ticks invuln
});

test("Deterministic simulation with same seed and inputs", () => {
  const options = {
    seed: 999,
    scenario: {
      player: { pos: [0, 0, 0], carried: 0, flames: 3 },
      motes: [[0, 0, 2], [3, 0, 4]],
      shades: [{ id: "S1", pos: [10, 0, 0] }]
    },
    inputs: {
      frames: [
        { tick: 0, move: [0, 1] },
        { tick: 30, move: [1, 0] }
      ]
    }
  };

  const sim1 = new Simulation(options);
  const sim2 = new Simulation(options);

  for (let i = 0; i < 60; i++) {
    sim1.step();
    sim2.step();
  }

  assert.deepEqual(sim1.getSnapshot(), sim2.getSnapshot());
});

test("Validation: rejects non-strictly increasing frame ticks", () => {
  assert.throws(() => {
    new Simulation({
      inputs: {
        frames: [
          { tick: 10, move: [1, 0] },
          { tick: 10, move: [0, 1] } // duplicate tick
        ]
      }
    });
  }, /strictly increasing/);
});

test("Headless CLI contract execution and exit codes", () => {
  const tmpOut = path.resolve("docs/proof/contract_test_out.jsonl");
  const nodeExe = process.execPath;
  const headlessScript = path.resolve("src/headless.js");

  // 1. Normal execution exits 0
  execFileSync(nodeExe, [
    headlessScript,
    "--seed", "42",
    "--night", "1",
    "--ticks", "60",
    "--out", tmpOut,
    "--snapshot-every", "10"
  ]);

  assert.equal(fs.existsSync(tmpOut), true);
  const lines = fs.readFileSync(tmpOut, "utf-8").trim().split("\n");
  assert.equal(lines.length >= 7, true);
  const first = JSON.parse(lines[0]);
  const last = JSON.parse(lines[lines.length - 1]);
  assert.equal(first.type, "snapshot");
  assert.equal(first.tick, 0);
  assert.equal(last.type, "end");

  // 2. Invalid inputs file exits code 2
  const badInputsPath = path.resolve("docs/proof/bad_inputs.json");
  fs.writeFileSync(badInputsPath, JSON.stringify({ frames: [{ tick: 5 }, { tick: 4 }] }));

  let caughtCode = null;
  try {
    execFileSync(nodeExe, [
      headlessScript,
      "--inputs", badInputsPath,
      "--ticks", "10"
    ], { stdio: "pipe" });
  } catch (err) {
    caughtCode = err.status;
  }
  assert.equal(caughtCode, 2);

  if (fs.existsSync(tmpOut)) fs.unlinkSync(tmpOut);
  if (fs.existsSync(badInputsPath)) fs.unlinkSync(badInputsPath);
});

// ─────────────────────────────────────────────────────────────
// PHẦN 2: Tính năng mới Phase 2 (TICKET-02: "Ba hòn đảo")
// ─────────────────────────────────────────────────────────────

test("Phase 2: Dash mechanic moves at 14m/s for 12 ticks with 90 ticks cooldown", () => {
  const sim = new Simulation({
    scenario: {
      player: { pos: [0, 0, 0], carried: 0, flames: 3 },
      random_motes: false,
      random_shades: false
    },
    inputs: {
      frames: [
        { tick: 0, move: [1, 0], dash: true }
      ]
    }
  });

  sim.step(); // tick 0 -> 1: dash triggered
  assert.equal(sim.player.dash_ticks_left, 11);
  assert.equal(sim.player.dash_cd_ticks, 90);

  // Run through remainder of dash duration (11 ticks)
  for (let i = 0; i < 11; i++) {
    sim.step();
  }
  // Total 12 ticks * (14 m/s * 1/60s) = 2.8m
  assert.equal(sim.player.dash_ticks_left, 0);
  assert.equal(Math.abs(sim.player.pos[0] - 2.8) < 0.05, true);
  assert.equal(sim.player.dash_cd_ticks > 0, true);
});

test("Phase 2: Charm gives 7.2 m/s speed and zero cooldown dash", () => {
  const sim = new Simulation({
    night: 2,
    scenario: {
      player: { pos: [0, 0, 0], carried: 0, flames: 3 },
      random_motes: false,
      random_shades: false,
      charms: [{ id: "C1", pos: [0, 0, 0.5], available: true }]
    },
    inputs: {
      frames: [
        { tick: 0, move: [0, 1] },
        { tick: 1, move: [0, 1], dash: true }
      ]
    }
  });

  // Step 0: player moves onto charm C1
  sim.step();
  assert.equal(sim.player.charm_ticks, 600);
  const charm = sim.charms.find((c) => c.id === "C1");
  assert.equal(charm.available, false);
  assert.equal(charm.respawn_ticks, 2700);

  // Step 1: dash with charm active
  sim.step();
  assert.equal(sim.player.dash_cd_ticks, 0); // Zero cooldown with charm!
});

test("Phase 2: Night 2 Jump pad launches player with ballistic trajectory to opposite island", () => {
  const sim = new Simulation({
    night: 2,
    scenario: {
      player: { pos: [20, 0, 18], carried: 0, flames: 3 },
      random_motes: false,
      random_shades: false
    }
  });

  // Step 1: player on jump pad at (20, 0, 18)
  sim.step();
  assert.equal(sim.player.grounded, false);
  assert.equal(sim.player.vel[1] > 10.0, true); // vy = 14 m/s
  assert.equal(sim.player.jump_pad_vel !== null, true);

  // Trajectory flight ~1.4s (84 ticks) to land on Island B
  for (let i = 0; i < 90; i++) {
    sim.step();
  }
  assert.equal(sim.player.grounded, true);
  assert.equal(sim.player.jump_pad_vel, null);
  // Landed in Island B area (around X ~ 50 to 70)
  assert.equal(sim.player.pos[0] > 45.0, true);
});

test("Phase 2: Drifter (Gió Lạc) steals motes and drops them when pulsed", () => {
  const sim = new Simulation({
    night: 2,
    scenario: {
      player: { pos: [0, 0, 0], carried: 8, flames: 3 },
      random_motes: false,
      random_shades: false,
      drifters: [{ id: "D1", pos: [0.5, 0, 0], state: "chase", stolen: 0 }]
    },
    inputs: {
      frames: [
        { tick: 0 },
        { tick: 1, pulse: true } // pulse immediately after being stolen from
      ]
    }
  });

  // Tick 0: Drifter steals up to 3 motes
  sim.step();
  const d1 = sim.drifters.find((d) => d.id === "D1");
  assert.equal(d1.stolen, 3);
  assert.equal(d1.state, "flee");
  assert.equal(sim.player.carried, 5); // 8 - 3 = 5

  // Tick 1: Player pulses (costs 3 motes), hits fleeing drifter
  sim.step();
  assert.equal(sim.player.carried, 2); // 5 - 3 = 2
  assert.equal(d1.stolen, 0); // Drifter dropped stolen motes!
  assert.equal(sim.motes.length, 3); // 3 dropped motes spawned
});

test("Phase 2: Pause and Resume freezes simulation clock and entity updates", () => {
  const sim = new Simulation({
    inputs: {
      frames: [
        { tick: 2, pause: true },   // Press pause at tick 2
        { tick: 3, pause: false },  // Release pause button at tick 3
        { tick: 10, pause: true },  // Press pause again to resume at tick 10
        { tick: 11, pause: false }
      ]
    }
  });

  // Step 0 and 1: playing
  sim.step();
  sim.step();
  assert.equal(sim.is_paused, false);
  assert.equal(sim.sim_tick, 2);

  // Step 2: pause input received
  sim.step();
  assert.equal(sim.is_paused, true);
  assert.equal(sim.state, "paused");
  const simTickPaused = sim.sim_tick;
  const timeLeftPaused = sim.time_left_s;

  // Step 3 to 9: while paused, tick increases but sim_tick & timer stay constant
  for (let i = 3; i < 10; i++) {
    sim.step();
    assert.equal(sim.sim_tick, simTickPaused);
    assert.equal(sim.time_left_s, timeLeftPaused);
  }

  // Step 10: resume input received
  sim.step();
  assert.equal(sim.is_paused, false);
  assert.equal(sim.state, "playing");
  sim.step();
  assert.equal(sim.sim_tick > simTickPaused, true);
});

test("Phase 2 Performance Benchmark: 21,600 ticks completes in <= 30 seconds", () => {
  const sim = new Simulation({
    seed: 12345,
    night: 3
  });

  const startTime = Date.now();
  const benchmarkTicks = 21600; // 360 seconds at 60 Hz

  for (let t = 0; t < benchmarkTicks; t++) {
    sim.step();
    if (sim.state !== "playing") break;
  }

  const durationMs = Date.now() - startTime;
  console.log(`      ⏱  21,600 ticks simulated in ${durationMs}ms (${(durationMs / 1000).toFixed(2)}s)`);
  assert.equal(durationMs <= 30000, true);
});

test("Phase 2: Solid obstacle collision blocks movement and prevents pass-through", () => {
  const sim = new Simulation({
    obstacles_enabled: true,
    scenario: {
      player: { pos: [0, 0, 0], carried: 0, flames: 3 },
      random_motes: false,
      random_shades: false
    },
    inputs: {
      frames: [
        { tick: 0, move: [1, 0] } // moving +X directly into a rock
      ]
    }
  });

  // Solid rock at pos: [2.0, 0, 0] with radius 1.0m
  sim.obstacles = [{ id: "test_rock", pos: [2.0, 0.0, 0.0], radius: 1.0, height: 2.0 }];

  // Step 60 ticks (1s) at speed 6.0 m/s (would reach X = 6.0m if unobstructed)
  for (let i = 0; i < 60; i++) {
    sim.step();
  }

  // Player must be blocked at rock boundary (2.0 - 1.0 - 0.45 = 0.55m max)
  assert.equal(sim.player.pos[0] <= 0.6, true);
  assert.equal(sim.player.pos[0] >= 0.5, true);
});
