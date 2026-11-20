import test from "node:test";
import assert from "node:assert/strict";
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
      lanterns: [{ "id": "L1", "pos": [0, 0, 5], "deposited": 0 }]
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
