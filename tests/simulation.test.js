import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { Simulation } from "../src/core/simulation.js";

test("Player collects mote and increases score", () => {
  const sim = new Simulation({
    scenario: {
      player: { pos: [0, 0, 0], carried: 0, flames: 3 },
      random_motes: false,
      random_shades: false,
      motes: [[0, 0, 1.0]] // within pickup radius 1.5m
    }
  });

  sim.step();
  assert.equal(sim.player.carried, 1);
  assert.equal(sim.score, 10);
  assert.equal(sim.motes.length, 0);
});

test("Player deposits motes into lantern and lights it", () => {
  const sim = new Simulation({
    scenario: {
      player: { pos: [0, 0, 5], carried: 3, flames: 3 },
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
  assert.equal(l1.deposited, 3);
  assert.equal(l1.lit, true);
  assert.equal(sim.player.carried, 0);
  assert.equal(sim.score, 100);
});

test("Pulse stuns and pushes shades", () => {
  const sim = new Simulation({
    scenario: {
      player: { pos: [0, 0, 0], carried: 0, flames: 3 },
      random_motes: false,
      random_shades: false,
      shades: [{ id: "S1", pos: [2, 0, 0] }] // within pulse radius 4.0m
    },
    inputs: {
      frames: [{ tick: 0, pulse: true }]
    }
  });

  sim.step();
  const s1 = sim.shades.find((s) => s.id === "S1");
  assert.equal(s1.state, "stunned");
  assert.equal(s1.pos[0] > 4.0, true); // pushed away
  assert.equal(sim.score, 20);
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
});

test("Safe radius around lit lantern blocks shade", () => {
  const sim = new Simulation({
    scenario: {
      player: { pos: [0, 0, 0], carried: 0, flames: 3 },
      random_motes: false,
      random_shades: false,
      lanterns: [{ id: "L1", pos: [5, 0, 0], lit: true }],
      shades: [{ id: "S1", pos: [10, 0, 0] }] // safe_radius is 3.0m around (5,0,0) -> [2, 8] on X
    }
  });

  // Step 60 ticks (1 second). Shade moves towards player at (0,0,0)
  for (let i = 0; i < 60; i++) {
    sim.step();
  }
  const s1 = sim.shades.find((s) => s.id === "S1");
  // Distance from s1 to lantern at (5, 0, 0) must remain >= safe_radius (3.0)
  const distToLantern = Math.hypot(s1.pos[0] - 5, s1.pos[2] - 0);
  assert.equal(distToLantern >= 3.0, true);
});

test("Island boundary: clamps player when fall_enabled is false", () => {
  const sim = new Simulation({
    scenario: {
      player: { pos: [29.5, 0, 0], carried: 2, flames: 3 },
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
  assert.equal(dist <= 30.001, true);
  assert.equal(sim.player.flames, 3); // not damaged
});

test("Island fall: player falls off when fall_enabled is true", () => {
  const sim = new Simulation({
    tuning: { fall_enabled: true, hit_drop_ratio: 0.5 },
    scenario: {
      player: { pos: [29.8, 0, 0], carried: 4, flames: 3 },
      random_motes: false,
      random_shades: false
    },
    inputs: {
      frames: [{ tick: 0, move: [1, 0] }]
    }
  });

  // Step until player falls off
  sim.step(); // pos.x = 29.9
  sim.step(); // pos.x = 30.0
  sim.step(); // pos.x = 30.1 -> falls, respawns at [0, 0, 0]
  assert.equal(sim.player.flames, 2);
  assert.equal(sim.player.carried, 2); // 4 * 0.5 = 2 dropped
  assert.equal(sim.player.pos[0], 0);
  assert.equal(sim.player.pos[2], 0); // respawned at center
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
  assert.equal(lines.length >= 7, true); // snapshot 0, 10, 20, 30, 40, 50, 60 + end
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

  // Clean up test files
  if (fs.existsSync(tmpOut)) fs.unlinkSync(tmpOut);
  if (fs.existsSync(badInputsPath)) fs.unlinkSync(badInputsPath);
});
